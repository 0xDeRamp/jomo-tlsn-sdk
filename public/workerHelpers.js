function waitForMsgType(type, idx) {
  return new Promise(resolve => {
    const bc = new BroadcastChannel("worker_initiation");
    bc.onmessage = function onMsg({ data }) {
      if (data == null || data.type !== type || data.idx !== idx) return;
      bc.close();
      resolve(data);
    }
  });
}

// Note: this is never used, but necessary to prevent a bug in Firefox
// (https://bugzilla.mozilla.org/show_bug.cgi?id=1702191) where it collects
// Web Workers that have a shared WebAssembly memory with the main thread,
// but are not explicitly rooted via a `Worker` instance.
//
// By storing them in a variable, we can keep `Worker` objects around and
// prevent them from getting GC-d.
let _workers;

export async function startWorkers(module, memory, builder) {
  console.log("start worker")
  const workerInit = {
    type: 'wasm_bindgen_worker_init',
    module,
    memory,
    receiver: builder.receiver()
  };

  _workers = await Promise.all(
    Array.from({ length: builder.numThreads() }, async (_, idx) => {
      // Self-spawn into a new Worker.
      //
      // TODO: while `new URL('...', import.meta.url) becomes a semi-standard
      // way to get asset URLs relative to the module across various bundlers
      // and browser, ideally we should switch to `import.meta.resolve`
      // once it becomes a standard.
      //
      // Note: we could use `../../..` as the URL here to inline workerHelpers.js
      // into the parent entry instead of creating another split point -
      // this would be preferable from optimization perspective -
      // however, Webpack then eliminates all message handler code
      // because wasm-pack produces "sideEffects":false in package.json
      // unconditionally.
      //
      // The only way to work around that is to have side effect code
      // in an entry point such as Worker file itself.
      const worker = new Worker(new URL('./workerHelpers.js', import.meta.url), {
        type: 'module'
      });
      postMessage({
        ...workerInit,
        idx: idx,
      });
      await waitForMsgType('wasm_bindgen_worker_ready', idx);
      return worker;
    })
  );
  console.log("workers: ", _workers)
  builder.build();
}
