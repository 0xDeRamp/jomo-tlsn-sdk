import * as utils from './utils'
import axios from 'axios'

class OpenlayerClientSDK {
  extensionId: string;
  server: string;
  notaryServerHost: string;
  notaryServerSsl: boolean;
  proofVerificationServer: string;
 
  constructor(
    extensionId,
    server,
    notaryServerHost,
    notaryServerSsl,
    proofVerificationServer,
  ) {
    this.extensionId = extensionId;
    this.server = server;
    this.notaryServerHost = notaryServerHost;
    this.notaryServerSsl = notaryServerSsl;
    this.proofVerificationServer = proofVerificationServer;
  }

  isOpenLayerExtensionInstalled() {
    try {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(this.extensionId, {}, {}, () => { });
      return true
    } catch {
      return false
    }
  }
  
  async interceptAuthedRequest(redirectUrl, urlFilters) {
    return new Promise((resolve, _) => {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(
        this.extensionId,
        {
          type: "OpenLayerNotarySession",
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
  
  async requestWithAuth(authHeaders, queryPath, queryMethod, websockifyServer) {
    var response = ""
    response = JSON.parse(await utils.sendRequest(
      this.server, queryPath, queryMethod, {}, authHeaders,
      websockifyServer,
    ))
    return response
  }
  
  async notarizeWithAuth(authHeaders, dataPath, dataMethod, keysToNotarize, websockifyServer) {
    try {
      const notarizationProof = await utils.notarizeRequest(
        this.server, dataPath, dataMethod, {}, authHeaders,
        [],
        [],
        keysToNotarize,
        this.notaryServerHost,
        this.notaryServerSsl,
        websockifyServer,
      )
      return [notarizationProof, null]
    } catch (e) {
      return [null, e]
    }
  }

  async verifyNotarizationProof(proof) {
    const response = await axios.post(this.proofVerificationServer, proof)
    return response
  }
}

export { OpenlayerClientSDK }
