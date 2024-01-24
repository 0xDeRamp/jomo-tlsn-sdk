import { JomoTlsnNotary } from 'jomo-tlsn-sdk/dist';


function RevolutLastPayment() {
  const revolutServer = "app.revolut.com"

  const buildAuthHeaders = function (response) {
    const cookie = response.headers["Cookie"]
    const deviceId = response.headers["x-device-id"]
    const userAgent = response.headers["User-Agent"]

    const authedHeader = new Map([
      ["Cookie", cookie],
      ["X-Device-Id", deviceId],
      ["User-Agent", userAgent],
      ["Host", revolutServer],
    ])
    return authedHeader
  }

  const buildDataPathWithResponse = function (response) {
    const account = response["pockets"][0]["id"] || null
    if (!account) {
      return null
    }
    const dataPath = `api/retail/user/current/transactions/last?count=1&internalPocketId=${account}`
    return dataPath
  }

  const onNotarizationResult = async function (res) {
    console.log(res)
  }

  return (
    <JomoTlsnNotary
      notaryServers={{
        notaryServerHost: "127.0.0.1:7047",
        notaryServerSsl: false,
        websockifyServer: "ws://127.0.0.1:61289",
      }}
      extensionId="c4c27de5-8322-4044-a30f-af2ec4f7b6fb"
      extensionName="deramp-mobile"
      extensionConfigs={{
        redirectUrl: "https://app.revolut.com/home",
        urlFilters: ["https://app.revolut.com/api/retail/user/current/wallet"],
      }}
      applicationConfigs={{
        appServer: revolutServer,
        appName: "Revolut",
      }}
      onNotarizationResult={onNotarizationResult}
      defaultNotaryFlowConfigs={{
        defaultNotaryFlow: true,
        buildAuthHeaders: buildAuthHeaders,
        queryPath: "api/retail/user/current/wallet",
        queryMethod: "GET",
        buildDataPathWithResponse: buildDataPathWithResponse,
        dataMethod: "GET",
        keysToNotarize: [["account"], ["amount"], ["category"], ["comment"], ["completeDate"], ["id"], ["state"], ["recipient", "id"], ["recipient", "code"], ["currency"]],
      }}
    />
  )
}

export default RevolutLastPayment
