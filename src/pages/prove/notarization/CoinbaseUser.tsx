import { JomoTlsnNotary } from 'jomo-tlsn-sdk/dist';
import { Button, Stack, Typography, CircularProgress, TextField } from '@mui/material';
import Iconify from '../../../components/iconify';
import { useState } from 'react';


function CoinbaseUser() {
  const coinbaseServer = "accounts.coinbase.com"
  const extensionId = "nmdnfckjjghlbjeodefnapacfnocpdgm"
  const extensionName = "jomo-copilot"

  const [result, setResult] = useState({
    session_proof: "",
    substrings_proof: "",
    body_start: 0,
    proved_json: "",
  })

  const buildAuthHeaders = function (response) {
    const cookie = response.headers["Cookie"]

    const authedHeader = new Map([
      ["Cookie", cookie],
      ["Host", coinbaseServer],
    ])
    return authedHeader
  }

  const buildDataPathWithResponse = function (_) {
    const dataPath = `api/v1/user`
    return dataPath
  }

  const onNotarizationResult = async function (res) {
    setResult(res)
  }

  const onNotarizationError = async function (e) {
    console.log(e)
  }

  function childExtensionNotFound() {
    return (
      <Stack alignItems={"center"}>
        <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
          <Typography>Prove that you are a verified Coinbase user</Typography>
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
        <Typography>Prove that you are a verified Coinbase user</Typography>
        <Button variant="contained">Login Coinbase</Button>
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
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "550px" }} spacing={2}>
        <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
          <Iconify height={36} width={36} color={"success.main"} icon="material-symbols:check" />
          <Typography variant="body1">Notarized successfully</Typography>
        </Stack>
        <TextField  sx={{ width: "550px" }} multiline maxRows={10} label='Session Proof' contentEditable={false}
          value={result && result.session_proof}>
        </TextField>
        <TextField fullWidth multiline maxRows={10} label='Substrings Proof' contentEditable={false}
          value={result && result.substrings_proof}>
        </TextField>
        <TextField fullWidth multiline label='Redacted Response' contentEditable={false}
          value={result && JSON.stringify(JSON.parse(result.proved_json), null, 2)}>
        </TextField>
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
        redirectUrl: "https://accounts.coinbase.com/profile",
        urlFilters: ["https://accounts.coinbase.com/api/v1/user"],
      }}
      applicationConfigs={{
        appServer: coinbaseServer,
      }}
      onNotarizationResult={onNotarizationResult}
      defaultNotaryFlowConfigs={{
        defaultNotaryFlow: true,
        buildAuthHeaders: buildAuthHeaders,
        queryPath: "",
        queryMethod: "",
        buildDataPathWithResponse: buildDataPathWithResponse,
        dataMethod: "GET",
        keysToNotarize: [["country_code"], ["phone_numbers", "country"], ["phone_numbers", "number_id"], ["phone_numbers", "verified"], ["residential_address", "country_code"], ["unified_accounts_has_trading_privilege"], ["product_access"], ["unified_accounts_access_list"]],
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

export default CoinbaseUser
