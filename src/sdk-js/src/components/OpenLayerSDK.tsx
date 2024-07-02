import * as utils from './utils'

function OpenLayerExtensionInstalled(extensionId) {
  try {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage(extensionId, {}, {}, () => { });
    return true
  } catch {
    return false
  }
}

async function interceptAuthedRequest(extensionId, redirectUrl, urlFilters) {
  return new Promise((resolve, _) => {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage(
      extensionId,
      {
        type: "prepareSession",
        redirectUrl: redirectUrl,
        urlFilters: urlFilters,
      },
      {},
      (response) => {
        resolve(response)
      },
    )
  })
}

async function requestWithAuth(server, authHeaders, queryPath, queryMethod, websockifyServer) {
  var response = ""
  response = JSON.parse(await utils.sendRequest(
    server, queryPath, queryMethod, {}, authHeaders,
    websockifyServer,
  ))
  return response
}

async function notarizeWithAuth(server, authHeaders, dataPath, dataMethod, keysToNotarize, notaryServerHost, notaryServerSsl, websockifyServer) {
  try {
    const notarizationProof = await utils.notarizeRequest(
      server, dataPath, dataMethod, {}, authHeaders,
      [],
      [],
      keysToNotarize,
      notaryServerHost,
      notaryServerSsl,
      websockifyServer,
    )
    return [notarizationProof, null]
  } catch (e) {
    return [null, e]
  }
}

export { OpenLayerExtensionInstalled, interceptAuthedRequest, requestWithAuth, notarizeWithAuth }
