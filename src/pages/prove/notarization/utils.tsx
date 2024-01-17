import * as Comlink from "comlink";

export async function notarizeRequest(
  server, path, method, data, headers,
  requestStringsToNotarize,
  responseStringsToNotarize,
  keysToNotarize,
  notarizeDetailedText,
  setNotarizeDetails,
) {
  // TODO: Get a new websocket proxy based on server
  const serverToWebsockifyPort = {
    "api.robinhood.com": 61289,
    "app.revolut.com": 61289,
    "account.venmo.com": 61289,
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker("./wasm_worker.js", { type: "module" });
    var subworkers = []

    worker.onmessage = async function (e) {
      if (e.data.type === "wasm_bindgen_worker_init") {
        const worker_s = new Worker("./wasm_worker.js", { type: "module" });
        subworkers.push(worker_s)
        const subworker = Comlink.wrap(worker_s);
        // @ts-ignore
        subworker.startSubworker(e.data);
      } else if (e.data.type === "notarize_result") {
        worker.terminate()
        subworkers.map((subw) => subw.terminate())
        if (e.data.error) {
          reject(e.data.error)
        } else {
          resolve({
            "session_proof": e.data.sessionProof,
            "substrings_proof": e.data.substringsProof,
            "body_start": parseInt(e.data.bodyStart),
          })
        }
      } else if (e.data.type === "notarize_process_details") {
        notarizeDetailedText.current = notarizeDetailedText.current + new Date(Date.now()).toLocaleTimeString() + ": " + e.data.message + "\n"
        setNotarizeDetails(notarizeDetailedText.current)
      }
    }

    const notarizer = Comlink.wrap(worker);
    // @ts-ignore
    notarizer.notarize(
      server, path, method, JSON.stringify(data), headers,
      requestStringsToNotarize,
      responseStringsToNotarize,
      keysToNotarize,
      "127.0.0.1:7047",
      false,
      `ws://127.0.0.1:${serverToWebsockifyPort[server]}`,
    );
  })
}

export async function sendRequest(server, path, method, data, headers) {
  // TODO: Get a new websocket proxy based on server
  const serverToWebsockifyPort = {
    "api.robinhood.com": 61289,
    "app.revolut.com": 61289,
    "account.venmo.com": 61289,
  }

  return new Promise<string>((resolve, reject) => {
    const worker = new Worker("./wasm_worker.js", { type: "module" });
    worker.onmessage = async function (e) {
      if (e.data.type === "websocket_request_result") {
        worker.terminate()
        if (e.data.error) {
          reject(e.data.error)
        } else {
          resolve(e.data.response)
        }
      }
    }

    const requestSender = Comlink.wrap(worker);
    // @ts-ignore
    requestSender.sendRequest(
      server, path, method, JSON.stringify(data), headers,
      `ws://127.0.0.1:${serverToWebsockifyPort[server]}`,
    );
  })
}