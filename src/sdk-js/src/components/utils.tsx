import * as Comlink from "comlink";

export async function notarizeRequest(
  server, path, method, data, headers,
  requestStringsToNotarize,
  responseStringsToNotarize,
  keysToNotarize,
  notaryServerHost,
  notaryServerSsl,
  websockifyServer,
) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./wasm_worker.js", { type: "module" });
    var subworkers: Worker[] = []

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
            "proved_json": e.data.provedJson,
          })
        }
      } else if (e.data.type === "notarize_process_details") {
        console.log("Notarization details:", e.data.message)
      }
    }

    const notarizer = Comlink.wrap(worker);
    // @ts-ignore
    notarizer.notarize(
      server, path, method, JSON.stringify(data), headers,
      requestStringsToNotarize,
      responseStringsToNotarize,
      keysToNotarize,
      notaryServerHost,
      notaryServerSsl,
      websockifyServer,
    );
  })
}

export async function sendRequest(server, path, method, data, headers, websockifyServer) {
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
      websockifyServer,
    );
  })
}