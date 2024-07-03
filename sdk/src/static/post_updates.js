export function post_update(message) {
  postMessage({
    type: "notarize_process_details",
    message: message,
  })
}