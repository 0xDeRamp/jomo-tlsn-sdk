import { Button, Stack, Typography, CircularProgress, TextField, Box, Collapse } from '@mui/material';
import Iconify from '../../../components/iconify';
import { useState, useRef, useEffect } from 'react';
import { OpenLayerExtensionInstalled, interceptAuthedRequest, notarizeWithAuth } from '../../../sdk-js/src';


function CoinbaseUserNewSdk() {
  const coinbaseServer = "accounts.coinbase.com"
  const extensionId = "nmdnfckjjghlbjeodefnapacfnocpdgm"
  const extensionName = "jomo-copilot"
  const redirectUrl = "https://accounts.coinbase.com/profile"
  const urlFilters = ["https://accounts.coinbase.com/api/v1/user"]
  const dataPath = `api/v1/user`
  const dataMethod = "GET"
  const keysToNotarize = [["country_code"], ["phone_numbers", "country"], ["phone_numbers", "number_id"], ["phone_numbers", "verified"], ["residential_address", "country_code"], ["unified_accounts_has_trading_privilege"], ["product_access"], ["unified_accounts_access_list"]]
  const notaryServerHost = "127.0.0.1:7047"
  const notaryServerSsl = false
  const websockifyServer = "ws://127.0.0.1:61289"

  const [needsExtension, setNeedsExtension] = useState(false)
  const [triggerExtensionInstall, setTriggerExtensionInstall] = useState(false)
  const firstMount = useRef(true)
  const extensionFound = useRef(false)

  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingFailed, setLoadingFailed] = useState(false)

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
        <TextField sx={{ width: "550px" }} multiline maxRows={10} label='Session Proof' contentEditable={false}
          value={result && result.session_proof}>
        </TextField>
        <TextField fullWidth multiline maxRows={10} label='Substrings Proof' contentEditable={false}
          value={result && result.substrings_proof}>
        </TextField>
        <TextField fullWidth multiline label='Redacted Response' contentEditable={false}
          value={result && result.proved_json && JSON.stringify(JSON.parse(result.proved_json), null, 2)}>
        </TextField>
      </Stack>
    )
  }

  function childVerificationFail() {
    return (
      <Typography variant="body1">Failed to fetch data</Typography>
    )
  }

  async function checkExtension() {
    if (!extensionFound.current) {
      var hasExtension = OpenLayerExtensionInstalled(extensionId)

      if (hasExtension) {
        setNeedsExtension(false)
        extensionFound.current = true
        console.log("extension found")
      } else {
        setNeedsExtension(true)
        setTriggerExtensionInstall(true)
        console.log("extension not found")
        setTimeout(() => { checkExtension() }, 1000)
      }
    }
  }

  async function startNotarize() {
    setLoading(true)

    const authResponse = await interceptAuthedRequest(extensionId, redirectUrl, urlFilters)
    const authHeaders = buildAuthHeaders(authResponse)

    const [notarizeResult, error] = await notarizeWithAuth(
      coinbaseServer,
      authHeaders,
      dataPath,
      dataMethod,
      keysToNotarize,
      notaryServerHost,
      notaryServerSsl,
      websockifyServer,
    )
    if (notarizeResult) {
      onNotarizationResult(notarizeResult)
      setLoaded(true)
      setLoadingFailed(false)
      setLoading(false)
      return notarizeResult
    } else {
      onNotarizationError(error)
      setLoaded(false)
      setLoadingFailed(true)
      setLoading(false)
      return null
    }
  }

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false
      checkExtension()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }}>
      {triggerExtensionInstall &&
        <>
          <Collapse in={needsExtension}>
            {childExtensionNotFound()}
          </Collapse>
          <Collapse in={!needsExtension}>
            {childExtensionInstalled()}
          </Collapse>
        </>
      }

      <Collapse in={!needsExtension}>
        <Stack alignItems={"center"}>
          <Collapse in={!loading && !loadingFailed && !loaded} sx={{ width: 1, maxWidth: "450px" }} onClick={startNotarize}>
            {childExtensionFound()}
          </Collapse>
          <Collapse in={loading} sx={{ width: 1, maxWidth: "450px", alignContent: "center" }}>
            {childVerificationInProgress()}
          </Collapse>
          <Collapse in={loadingFailed}>
            {childVerificationFail()}
          </Collapse>
          <Collapse in={loaded}>
            {childVerificationComplete()}
          </Collapse>
        </Stack>
      </Collapse>
    </Box >
  )
}

export default CoinbaseUserNewSdk
