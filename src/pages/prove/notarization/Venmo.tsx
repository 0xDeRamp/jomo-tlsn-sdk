// import { JomoTlsnNotary } from 'jomo-tlsn-sdk/dist';


function Venmo() {
  // const venmoServer = "account.venmo.com"

  // const buildAuthHeaders = function (response) {
  //   const cookieHeader = response.headers.Cookie

  //   const authedHeader = new Map([
  //     ["Cookie", cookieHeader],
  //     ["Host", venmoServer],
  //     ["Accept", "application/json, text/javascript, */*; q=0.01"],
  //   ])
  //   return authedHeader
  // }

  // const buildDataPathWithResponse = function (_) {
  //   const dataPath = `api/stories?feedType=betweenYou&otherUserId=2126505450668032650&externalId=2770628205608960739`
  //   return dataPath
  // }

  // const onNotarizationResult = async function (res) {
  //   console.log(res)
  // }

  return (<></>
    // <JomoTlsnNotary
    //   notaryServers={{
    //     notaryServerHost: "127.0.0.1:7047",
    //     notaryServerSsl: false,
    //     websockifyServer: "ws://127.0.0.1:61289",
    //   }}
    //   extensionConfigs={{
    //     redirectUrl: "https://account.venmo.com/",
    //     urlFilters: ["https://account.venmo.com/api/stories*"]
    //   }}
    //   applicationConfigs={{
    //     appServer: venmoServer,
    //     appName: "Venmo",
    //   }}
    //   onNotarizationResult={onNotarizationResult}
    //   defaultNotaryFlowConfigs={{
    //     defaultNotaryFlow: true,
    //     buildAuthHeaders: buildAuthHeaders,
    //     queryPath: "",
    //     queryMethod: "",
    //     buildDataPathWithResponse: buildDataPathWithResponse,
    //     dataMethod: "GET",
    //     keysToNotarize: [["stories", "amount"]],
    //   }}
    // />
  )
}

export default Venmo
