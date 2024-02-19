mod requests;
use crate::requests::{ClientType, NotarizationSessionRequest, NotarizationSessionResponse};

use bytes::{BufMut, BytesMut};
use std::collections::HashSet;
use std::convert::TryInto;
use std::{ops::Range, sync::Arc};
use tls_client::ClientConnection;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use wasm_bindgen_futures::JsFuture;
use ws_stream_wasm::WsMeta;

use futures::channel::oneshot;
use futures_util::io::AsyncWriteExt;
use tokio_util::compat::FuturesAsyncReadCompatExt;

use hyper::{body::to_bytes, Body, Request, StatusCode};

use tlsn_prover::tls::{Prover, ProverConfig};

pub use tls_client::backend::RustCryptoBackend;
use tls_client::RootCertStore;
use tls_client_async::bind_client;

use rayon::prelude::*;
pub use wasm_bindgen_rayon::{init_thread_pool, wbg_rayon_start_worker};

use js_sys::JSON;

extern crate web_sys;

// A macro to provide `log!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen(module = "post_updates")]
extern "C" {
    fn post_update(a: &str);
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = self)]
    fn fetch(request: &web_sys::Request) -> js_sys::Promise;
}

fn find_ranges(json: &str, target_keys_list: js_sys::Array) -> Vec<[usize; 2]> {
    // Create a HashSet to store all the ranges
    let mut all_ranges = HashSet::new();

    for key_array in target_keys_list {
        let target_keys_js = js_sys::Array::from(&key_array).to_vec();
        // Step 1 & 2: Convert Vec<JsValue> to Vec<String>
        let target_keys_string: Vec<String> = target_keys_js
            .into_iter()
            .filter_map(|value| {
                if let Some(string) = value.dyn_into::<js_sys::JsString>().ok() {
                    Some(string.as_string())
                } else {
                    None
                }
            })
            .filter_map(|opt| opt) // Removes Option::None values
            .collect();

        // Step 3: Convert Vec<String> to Vec<&String>
        let target_keys: Vec<&String> = target_keys_string.iter().collect();

        let mut ranges = Vec::new();
        let mut stack: Vec<String> = Vec::new();
        let mut in_string = false;
        let mut start_idx: Option<usize> = None;
        let mut skip_char = false;
        let mut is_key = false;
        let mut brace_count = 0;
        let mut bracket_count = 0;
        let mut capture_all = false;

        for (i, c) in json.chars().enumerate() {
            if skip_char {
                skip_char = false;
                continue;
            }

            match c {
                '{' => {
                    if !in_string {
                        stack.push("{".to_string());
                        if stack
                            .iter()
                            .filter(|&&ref s| s != "{" && s != "[")
                            .eq(target_keys.iter().cloned())
                        {
                            capture_all = true;
                            start_idx = Some(i);
                        }
                        brace_count += 1;
                        ranges.push([i, i + 1]);
                    } else if capture_all {
                        ranges.push([i, i + 1]);
                    }
                }
                '}' if !in_string => {
                    brace_count -= 1;
                    if capture_all && brace_count == 1 {
                        capture_all = false;
                    }
                    ranges.push([i, i + 1]);
                    // Pop the stack until we find the matching '{'
                    while let Some(top) = stack.pop() {
                        if &top == "{" {
                            break;
                        }
                    }
                    // If the top of the stack is a key (and not another '{' or '['), pop that key as well
                    if let Some(top) = stack.last() {
                        if top != "{" && top != "[" {
                            stack.pop();
                        }
                    }
                }
                '[' => {
                    if !in_string {
                        stack.push("[".to_string());
                        if stack
                            .iter()
                            .filter(|&&ref s| s != "{" && s != "[")
                            .eq(target_keys.iter().cloned())
                        {
                            capture_all = true;
                            start_idx = Some(i);
                        }
                        bracket_count += 1;
                        ranges.push([i, i + 1]);
                    } else if capture_all {
                        ranges.push([i, i + 1]);
                    }
                }
                ']' if !in_string => {
                    bracket_count -= 1;
                    if capture_all && bracket_count == 0 {
                        capture_all = false;
                    }
                    ranges.push([i, i + 1]);
                    // Pop the stack until we find the matching '['
                    while let Some(top) = stack.pop() {
                        if &top == "[" {
                            break;
                        }
                    }
                    // If the top of the stack is a key (and not another '[' or '{'), pop that key as well
                    if let Some(top) = stack.last() {
                        if top != "[" && top != "{" {
                            stack.pop();
                        }
                    }
                }
                ':' => {
                    if !in_string {
                        ranges.push([i, i + 1]);
                        is_key = false;
                        // Capture the space after the colon
                        if json[i + 1..]
                            .chars()
                            .next()
                            .unwrap_or_default()
                            .is_whitespace()
                        {
                            let space_length = json[i + 1..]
                                .chars()
                                .take_while(|&ch| ch.is_whitespace())
                                .count();
                            ranges.push([i + 1, i + 1 + space_length]);
                        }
                    }
                }
                '"' => {
                    if capture_all {
                        if in_string {
                            ranges.push([start_idx.unwrap(), i + 1]);
                        } else {
                            start_idx = Some(i);
                        }
                        in_string = !in_string;
                    } else {
                        if in_string {
                            // End of string
                            if let Some(start) = start_idx {
                                if stack
                                    .iter()
                                    .filter(|&&ref s| s != "{" && s != "[")
                                    .eq(target_keys.iter().cloned())
                                    || is_key
                                {
                                    ranges.push([start, i + 1]);
                                }
                                start_idx = None;
                            }
                        } else {
                            // Start of string
                            start_idx = Some(i);
                            if let Some(next_double_quote) = json[i + 1..].find('"') {
                                let next_double_quote = next_double_quote + i + 1;
                                let content = &json[i + 1..next_double_quote];
                                // println!("Found string {}", content);
                                if json[next_double_quote + 1..]
                                    .chars()
                                    .next()
                                    .unwrap_or_default()
                                    .is_whitespace()
                                {
                                    let next_relevant_char = json[next_double_quote + 1..]
                                        .chars()
                                        .skip_while(|&ch| ch.is_whitespace())
                                        .next()
                                        .unwrap_or_default();
                                    is_key = next_relevant_char == ':';
                                } else {
                                    is_key = json[next_double_quote + 1..]
                                        .chars()
                                        .next()
                                        .unwrap_or_default()
                                        == ':';
                                }
                                if is_key {
                                    stack.push(content.to_string());
                                }
                                // skip_char = true;
                            } else {
                                // If there is no closing double quote, end the loop to prevent invalid behavior
                                break;
                            }
                        }
                        in_string = !in_string;
                    }
                }
                ',' => {
                    if capture_all {
                        // Capture the comma and the space after it if present
                        if let Some(next_char) = json.chars().nth(i + 1) {
                            if next_char.is_whitespace() {
                                ranges.push([i, i + 2]);
                                skip_char = true;
                            } else {
                                ranges.push([i, i + 1]);
                            }
                        }
                    } else if !in_string {
                        ranges.push([i, i + 1]);
                        // If the top of the stack is a key (and not another '[' or '{'), pop that key as well
                        if let Some(top) = stack.last() {
                            if top != "[" && top != "{" {
                                stack.pop();
                            }
                        }
                    }
                }

                // For non-string values
                ch if !in_string && (ch.is_numeric() || ch == '-' || ch == '.') => {
                    if capture_all {
                        if start_idx.is_none() {
                            start_idx = Some(i);
                        }
                        // If it's the end of a non-string value, push it to ranges
                        if let Some(next_char) = json[i + 1..].chars().next() {
                            if next_char == ','
                                || next_char == '}'
                                || next_char == ']'
                                || next_char.is_whitespace()
                            {
                                if let Some(start) = start_idx {
                                    ranges.push([start, i + 1]);
                                    start_idx = None;
                                }
                            }
                        }
                    } else {
                        if start_idx.is_none()
                            && stack
                                .iter()
                                .filter(|&&ref s| s != "{" && s != "[")
                                .eq(target_keys.iter().cloned())
                        {
                            start_idx = Some(i);
                        }
                        // If it's the end of a non-string value and it matches the target keys, push it to ranges
                        if let Some(next_char) = json[i + 1..].chars().next() {
                            if next_char == ','
                                || next_char == '}'
                                || next_char == ']'
                                || next_char.is_whitespace()
                            {
                                if let Some(start) = start_idx {
                                    ranges.push([start, i + 1]);
                                    start_idx = None;
                                }
                            }
                        }
                    }
                }
                _ => {
                    if !in_string {
                        if capture_all {
                            if start_idx.is_none() {
                                start_idx = Some(i);
                            }
                            // If it's the end of a non-string value, push it to ranges
                            if let Some(next_char) = json[i + 1..].chars().next() {
                                if next_char == ','
                                    || next_char == '}'
                                    || next_char == ']'
                                    || next_char.is_whitespace()
                                {
                                    if let Some(start) = start_idx {
                                        ranges.push([start, i + 1]);
                                        start_idx = None;
                                    }
                                }
                            }
                        } else {
                            if start_idx.is_none() {
                                start_idx = Some(i);
                            }
                            // If it's the end of a non-string value, push it to ranges
                            if let Some(next_char) = json[i + 1..].chars().next() {
                                if next_char == ','
                                    || next_char == '}'
                                    || next_char == ']'
                                    || next_char.is_whitespace()
                                {
                                    if let Some(start) = start_idx {
                                        if stack
                                            .iter()
                                            .filter(|&&ref s| s != "{" && s != "[")
                                            .eq(target_keys.iter().cloned())
                                        {
                                            ranges.push([start, i + 1]);
                                        }
                                        start_idx = None;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if let Some(start) = start_idx {
            ranges.push([start, json.len()]);
        }

        for range in &ranges {
            all_ranges.insert(*range);
        }
    }

    // Convert the HashSet back to a Vec
    let mut ranges: Vec<_> = all_ranges.into_iter().collect();

    // Merge consecutive ranges
    ranges.sort_by(|a, b| a[0].cmp(&b[0]));
    let mut merged_ranges: Vec<[usize; 2]> = Vec::new();
    for range in ranges {
        if let Some(last_range) = merged_ranges.last_mut() {
            if last_range[1] >= range[0] {
                last_range[1] = range[1].max(last_range[1]);
            } else {
                merged_ranges.push(range);
            }
        } else {
            merged_ranges.push(range);
        }
    }

    merged_ranges
}

fn find_ranges_include(seq: &[u8], sub_seq: &[&[u8]]) -> Vec<Range<usize>> {
    let mut public_ranges = Vec::new();
    for s in sub_seq {
        for (idx, w) in seq.windows(s.len()).enumerate() {
            if w == *s {
                public_ranges.push(idx..(idx + w.len()));
            }
        }
    }
    public_ranges
}

fn default_root_store() -> RootCertStore {
    let mut root_store = tls_client::RootCertStore::empty();
    root_store.add_server_trust_anchors(webpki_roots::TLS_SERVER_ROOTS.0.iter().map(|ta| {
        tls_client::OwnedTrustAnchor::from_subject_spki_name_constraints(
            ta.subject,
            ta.spki,
            ta.name_constraints,
        )
    }));
    root_store
}

async fn fetch_as_json_string(url: &str, opts: &web_sys::RequestInit) -> Result<String, JsValue> {
    let request = web_sys::Request::new_with_str_and_init(url, opts)?;
    let promise = fetch(&request);
    let future = JsFuture::from(promise);
    let resp_value = future.await?;
    let resp: web_sys::Response = resp_value.dyn_into().unwrap();
    let json = JsFuture::from(resp.json()?).await?;
    let stringified = JSON::stringify(&json).unwrap();
    Ok(stringified.as_string().unwrap())
}

#[wasm_bindgen]
pub async fn requestViaWebsocket(
    server: &str,
    path: &str,
    method: &str,
    data: &str,
    headers: js_sys::Map,
    client_websocket_url: &str,
) -> String {
    let (_, client_socket) = WsMeta::connect(client_websocket_url, None)
        .await
        .expect_throw("assume the client ws connection succeeds");

    let config = tls_client::ClientConfig::builder()
        .with_safe_defaults()
        .with_root_certificates(default_root_store())
        .with_no_client_auth();

    let client = ClientConnection::new(
        Arc::new(config),
        Box::new(RustCryptoBackend::new()),
        server.try_into().unwrap(),
    )
    .unwrap();

    let (tls_connection, conn_fut) = bind_client(client_socket.into_io(), client);

    let (conn_sender, _) = oneshot::channel();
    let handled_conn_fut = async {
        match conn_fut.await {
            Ok(conn_res) => {
                // Send the prover
                let _ = conn_sender.send(conn_res);
            }
            Err(err) => {
                panic!("An error occurred in prover_fut: {:?}", err);
            }
        }
    };
    spawn_local(handled_conn_fut);

    // Attach the hyper HTTP client to the TLS connection
    let (mut request_sender, connection) = hyper::client::conn::handshake(tls_connection.compat())
        .await
        .unwrap();

    let (connection_sender, connection_receiver) = oneshot::channel();
    let connection_fut = connection.without_shutdown();
    let handled_connection_fut = async {
        match connection_fut.await {
            Ok(connection_result) => {
                // Send the connection
                let _ = connection_sender.send(connection_result);
            }
            Err(err) => {
                panic!("An error occurred in connection_task: {:?}", err);
            }
        }
    };
    spawn_local(handled_connection_fut);

    let json: serde_json::Value = serde_json::from_str(data).expect("json wrong");
    let mut buf = BytesMut::new().writer();
    serde_json::to_writer(&mut buf, &json)
        .expect("serialization of `serde_json::Value` into `BytesMut` cannot fail");

    // Build the HTTP request to fetch the DMs
    let mut request_builder = Request::builder()
        .method(method)
        .uri(format!("https://{server}/{path}"))
        .header("Connection", "close");

    log!(
        "requesting: {}, method: {}",
        format!("https://{server}/{path}"),
        method
    );

    for key in headers.keys() {
        let key = key.unwrap().as_string().unwrap();
        let val = headers
            .get(&JsValue::from_str(key.as_str()))
            .as_string()
            .unwrap();
        request_builder = request_builder.header(key, val);
    }

    let request = request_builder
        .body(match method {
            "POST" => Body::from(buf.into_inner().freeze()),
            _ => Body::empty(),
        })
        .unwrap();

    let response = request_sender.send_request(request).await.unwrap();
    if response.status() != StatusCode::OK {
        return format!("Error Status: {}", response.status().to_string());
    }

    // Pretty printing :)
    let payload = to_bytes(response.into_body()).await.unwrap().to_vec();

    // Close the connection to the server
    let mut client_socket = connection_receiver.await.unwrap().io.into_inner();
    client_socket.close().await.unwrap();

    return String::from_utf8_lossy(&payload).to_string();
}

#[wasm_bindgen]
pub async fn notarizeRequest(
    server: &str,
    path: &str,
    method: &str,
    data: &str,
    headers: js_sys::Map,
    request_strings_to_notarize: js_sys::Array,
    response_strings_to_notarize: js_sys::Array,
    keys_to_notarize: js_sys::Array,
    notary_host: &str,
    notary_ssl: bool,
    client_websocket_url: &str,
) -> String {
    /*
     * Connect Notary with websocket
     */
    let mut opts = web_sys::RequestInit::new();
    opts.method("POST");
    // opts.method("GET");
    opts.mode(web_sys::RequestMode::Cors);

    // set headers
    let init_headers = web_sys::Headers::new().unwrap();

    // init_headers.append("Host", "127.0.0.1").unwrap();
    init_headers
        .append("Content-Type", "application/json")
        .unwrap();
    opts.headers(&init_headers);

    // set body
    let payload = serde_json::to_string(&NotarizationSessionRequest {
        client_type: ClientType::Websocket,
        max_transcript_size: Some(1 << 14),
    })
    .unwrap();
    opts.body(Some(&JsValue::from_str(&payload)));

    // url
    let url = format!(
        "{}://{}/session",
        if notary_ssl { "https" } else { "http" },
        notary_host
    );
    let rust_string = fetch_as_json_string(&url, &opts).await.unwrap();
    let notarization_response =
        serde_json::from_str::<NotarizationSessionResponse>(&rust_string).unwrap();

    let notary_wss_url = format!(
        "{}://{}/notarize?sessionId={}",
        if notary_ssl { "wss" } else { "ws" },
        notary_host,
        notarization_response.session_id
    );

    post_update("Setting up 3 party TLS connection");

    let (_notary_ws_meta, notary_ws_stream) = WsMeta::connect(notary_wss_url, None)
        .await
        .expect_throw("assume the notary ws connection succeeds");
    let notary_ws_stream_into = notary_ws_stream.into_io();

    // Basic default prover config
    let config = ProverConfig::builder()
        .id(notarization_response.session_id)
        .server_dns(server)
        .max_transcript_size(1 << 14)
        .build()
        .unwrap();

    let prover = Prover::new(config)
        .setup(notary_ws_stream_into)
        .await
        .unwrap();

    /*
       Connect Application Server with websocket proxy
    */
    let (_client_ws_meta, client_ws_stream) = WsMeta::connect(client_websocket_url, None)
        .await
        .expect_throw("assume the client ws connection succeeds");
    let client_ws_stream_into = client_ws_stream.into_io();

    // Bind the Prover to the server connection.
    // The returned `mpc_tls_connection` is an MPC TLS connection to the Server: all data written
    // to/read from it will be encrypted/decrypted using MPC with the Notary.
    let (mpc_tls_connection, prover_fut) = prover.connect(client_ws_stream_into).await.unwrap();

    let prover_ctrl = prover_fut.control();

    let (prover_sender, prover_receiver) = oneshot::channel();
    let handled_prover_fut = async {
        match prover_fut.await {
            Ok(prover_result) => {
                // Send the prover
                let _ = prover_sender.send(prover_result);
            }
            Err(err) => {
                panic!("An error occurred in prover_fut: {:?}", err);
            }
        }
    };
    spawn_local(handled_prover_fut);

    // Attach the hyper HTTP client to the TLS connection
    let (mut request_sender, connection) =
        hyper::client::conn::handshake(mpc_tls_connection.compat())
            .await
            .unwrap();

    // Spawn the HTTP task to be run concurrently
    let (connection_sender, connection_receiver) = oneshot::channel();
    let connection_fut = connection.without_shutdown();
    let handled_connection_fut = async {
        match connection_fut.await {
            Ok(connection_result) => {
                // Send the connection
                let _ = connection_sender.send(connection_result);
            }
            Err(err) => {
                panic!("An error occurred in connection_task: {:?}", err);
            }
        }
    };
    spawn_local(handled_connection_fut);

    let json: serde_json::Value = serde_json::from_str(data).expect("json wrong");
    let mut buf = BytesMut::new().writer();
    serde_json::to_writer(&mut buf, &json)
        .expect("serialization of `serde_json::Value` into `BytesMut` cannot fail");

    // Build the HTTP request to fetch the DMs
    let mut request_builder = Request::builder()
        .method(method)
        .uri(format!("https://{server}/{path}"))
        .header("Connection", "close");

    for key in headers.keys() {
        let key = key.unwrap().as_string().unwrap();
        let val = headers
            .get(&JsValue::from_str(key.as_str()))
            .as_string()
            .unwrap();
        request_builder = request_builder.header(key, val);
    }

    let request = request_builder
        .body(match method {
            "POST" => Body::from(buf.into_inner().freeze()),
            _ => Body::empty(),
        })
        .unwrap();

    post_update(format!("Start notarizing request to https://{server}/{path}").as_str());

    prover_ctrl.defer_decryption().await.unwrap();

    let response = request_sender.send_request(request).await.unwrap();

    post_update(format!("Received response from {server}").as_str());

    if response.status() != StatusCode::OK {
        return format!("Error Status: {}", response.status().to_string());
    }

    post_update("Request OK");

    // Pretty printing :)
    let payload = to_bytes(response.into_body()).await.unwrap().to_vec();
    // let parsed =
    //     serde_json::from_str::<serde_json::Value>(&String::from_utf8_lossy(&payload)).unwrap();

    // Close the connection to the server
    let mut client_socket = connection_receiver.await.unwrap().io.into_inner();
    client_socket.close().await.unwrap();

    // The Prover task should be done now, so we can grab it.
    // let mut prover = prover_task.await.unwrap().unwrap();
    let prover = prover_receiver.await.unwrap();
    let mut prover = prover.start_notarize();
    post_update("Notarization of encrypted TLS transcripts done");

    post_update(format!("Generating commitments of part of the request header to prove the response was from {server} and the correct API endpoint").as_str());
    // Identify the ranges in the transcript that contain secrets
    let mut public_ranges_sent = find_ranges_include(
        prover.sent_transcript().data(),
        &[format!("{method} https://{server}/{path}").as_bytes()],
    );

    post_update("Generating commitments of other parts of the request header");
    // Request header, based on input strings
    for request_string_js in request_strings_to_notarize {
        let request_string = request_string_js.as_string().unwrap();
        let request_string_bytes = request_string.as_bytes();
        let request_header_ranges =
            find_ranges_include(prover.sent_transcript().data(), &[&request_string_bytes]);
        for range in request_header_ranges.iter() {
            public_ranges_sent.push(range.clone());
        }
    }

    post_update("Generating commitments of selected parts of the response");

    // Commit to selected portions of received transcript based on given keys
    let mut response_range_count = 0;
    let mut public_ranges_recv: Vec<Range<usize>> = vec![];
    // Response header, based on input strings
    for response_string_js in response_strings_to_notarize {
        let response_string = response_string_js.as_string().unwrap();
        let response_string_bytes = response_string.as_bytes();
        let response_header_ranges =
            find_ranges_include(prover.recv_transcript().data(), &[&response_string_bytes]);
        for range in response_header_ranges.iter() {
            public_ranges_recv.push(range.clone());
            response_range_count += 1;
        }
    }

    post_update(format!("specific strings done, {response_range_count}").as_str());

    // Response body, based on key sequences
    let body_range = find_ranges_include(prover.recv_transcript().data(), &[&payload]);
    let public_ranges = find_ranges(&String::from_utf8_lossy(&payload), keys_to_notarize);
    for range in public_ranges.iter() {
        public_ranges_recv.push(Range {
            start: range[0] + body_range[0].start,
            end: range[1] + body_range[0].start,
        });
    }
    let pub_len = public_ranges_recv.len();
    let pub_send_len = public_ranges_sent.len();
    post_update(format!("range search done, {pub_len}, {pub_send_len}").as_str());

    let commitment_builder = prover.commitment_builder();
    // Commit to each range of the public outbound data which we want to disclose
    let sent_commitments: Vec<_> = public_ranges_sent
        .iter()
        .map(|r| commitment_builder.commit_sent(r).unwrap())
        .collect();
    // Commit to each range of the public inbound data which we want to disclose
    let recv_commitments: Vec<_> = public_ranges_recv
        .iter()
        .map(|r| commitment_builder.commit_recv(r).unwrap())
        .collect();

    post_update("commitment builder done");

    // Finalize, returning the notarized session
    let notarized_session: tlsn_core::NotarizedSession = prover.finalize().await.unwrap();

    post_update("Notarization complete!");

    // Create a proof for all committed data in this session
    let mut proof_builder = notarized_session.data().build_substrings_proof();

    // Reveal all the public ranges
    for commitment_id in sent_commitments {
        proof_builder.reveal_by_id(commitment_id).unwrap();
    }
    for commitment_id in recv_commitments {
        proof_builder.reveal_by_id(commitment_id).unwrap();
    }

    let substrings_proof = proof_builder.build().unwrap();
    let session_proof = notarized_session.session_proof();

    return [
        serde_json::to_string_pretty(&session_proof).unwrap(),
        serde_json::to_string_pretty(&substrings_proof).unwrap(),
        response_range_count.to_string(),
    ]
    .join("|||||");
}
