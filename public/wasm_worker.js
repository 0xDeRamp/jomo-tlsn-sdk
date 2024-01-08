import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";

class Notarizer {
  async startSubworker(data) {
    const wasmPkg = await import('./pkg/wasm_lib.js');
    await wasmPkg.default(data.module, data.memory);
    const bc = new BroadcastChannel("worker_initiation");
    bc.postMessage({ type: 'wasm_bindgen_worker_ready', idx: data.idx });
    bc.close();
    wasmPkg.wbg_rayon_start_worker(data.receiver);
  }

  async notarize(server, path, method, data, headers,
    requestStringsToNotarize,
    responseStringsToNotarize,
    keysToNotarize,
    notaryServer, notarySsl, websockifyServer,
  ) {
    console.log('start notarize');
    console.log("!@# navigator.hardwareConcurrency=", navigator.hardwareConcurrency)
    // const wasmPkg = await import('./pkg-parallel/wasm_lib.js');
    const wasmPkg = await import('./pkg/wasm_lib.js');
    await wasmPkg.default();
    await wasmPkg.initThreadPool(navigator.hardwareConcurrency);

    const resProver = await wasmPkg.notarizeRequest(
      server, path, method, data, headers,
      requestStringsToNotarize,
      responseStringsToNotarize,
      keysToNotarize,
      notaryServer,
      notarySsl,
      websockifyServer,
    );
    if (resProver.startsWith("Error Status:")) {
      console.log(resProver)
      postMessage({
        type: "notarize_result",
        error: resProver,
      })
    } else {
      const [sessionProof, substringsProof, bodyStart] = resProver.split("|||||")
      postMessage({
        type: "notarize_result",
        sessionProof: sessionProof,
        substringsProof: substringsProof,
        bodyStart: bodyStart,
      })
    }
  }

  async sendRequest(server, path, method, data, headers, websockifyServer) {
    const wasmPkg = await import('./pkg/wasm_lib.js');
    await wasmPkg.default();

    const response = await wasmPkg.requestViaWebsocket(
      server, path, method, data, headers,
      websockifyServer,
    );

    if (response.startsWith("Error Status:")) {
      console.log(response)
      postMessage({
        type: "notarize_result",
        error: response,
      })
    } else {
      postMessage({
        type: "websocket_request_result",
        response: response,
      })
    }
  }
}

Comlink.expose(new Notarizer());