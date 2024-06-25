import { JomoTlsnNotary } from 'jomo-tlsn-sdk/dist';
import { Button, Stack, Typography, CircularProgress } from '@mui/material';
import Iconify from '../../../components/iconify';


function RevolutLastPayment() {
  const revolutServer = "app.revolut.com"
  const extensionId = "nmdnfckjjghlbjeodefnapacfnocpdgm"
  const extensionName = "jomo-copilot"

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
    console.log(JSON.parse(res.proved_json))
  }

  const onNotarizationError = async function (e) {
    console.log(e)
  }

  function childExtensionNotFound() {
    return (
      <Stack alignItems={"center"}>
        <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
          <Button variant="contained" onClick={() => {
            window.open(`https://chrome.google.com/webstore/detail/${extensionName}/${extensionId}`, '_blank');
          }}>Install Jomo Copilot Extension</Button>
        </Stack>
      </Stack>
    )
  }

  function childExtensionInstalled() {
    return (<></>)
  }

  function childExtensionFound() {
    return (
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
        <Button variant="contained">Login Revolut</Button>
      </Stack>
    )
  }

  function childVerificationInProgress() {
    return (
      <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
        <CircularProgress size={24} color="primary" />
        <Typography variant="body1" textAlign={"center"}>Notarizing...</Typography>
      </Stack>
    )
  }

  function childVerificationComplete() {
    return (
      <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
        <Iconify height={36} width={36} color={"success.main"} icon="material-symbols:check" />
        <Typography variant="body1">Notarized successfully</Typography>
      </Stack>
    )
  }

  function childVerificationFail() {
    return (
      <Typography variant="body1">Failed to fetch data</Typography>
    )
  }

  return (
    <JomoTlsnNotary
      notaryServers={{
        notaryServerHost: "127.0.0.1:7047",
        notaryServerSsl: false,
        websockifyServer: "ws://127.0.0.1:61289",
      }}
      // extensionId="c4c27de5-8322-4044-a30f-af2ec4f7b6fb"
      // extensionName="deramp-mobile"
      extensionConfigs={{
        redirectUrl: "https://app.revolut.com/home",
        urlFilters: ["https://app.revolut.com/api/retail/user/current/wallet"],
      }}
      applicationConfigs={{
        appServer: revolutServer,
        // appName: "Revolut",
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
      childExtensionNotFound={childExtensionNotFound()}
      childExtensionInstalled={childExtensionInstalled()}
      childExtensionFound={childExtensionFound()}
      childVerificationInProgress={childVerificationInProgress()}
      childVerificationComplete={childVerificationComplete()}
      childVerificationFail={childVerificationFail()}
      onNotarizationError={onNotarizationError}
    />
  )
}

export default RevolutLastPayment
