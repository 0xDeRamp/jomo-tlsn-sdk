import { Button, Stack, Typography, CircularProgress, TextField, Box, Collapse } from '@mui/material';
import Iconify from '../../../components/iconify';
import { useState, useRef, useEffect } from 'react';
import { OpenlayerClientSDK } from 'openlayer-sdk/dist';


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
  const proofVerificationServer = "http://127.0.0.1:3001/api/verify_proof"

  const openlayerSDK = new OpenlayerClientSDK(
    extensionId,
    coinbaseServer,
    notaryServerHost,
    notaryServerSsl,
    proofVerificationServer,
  )

  const [needsExtension, setNeedsExtension] = useState(false)
  const [triggerExtensionInstall, setTriggerExtensionInstall] = useState(false)
  const firstMount = useRef(true)
  const extensionFound = useRef(false)

  const [proving, setProving] = useState(false)
  const [proved, setProved] = useState(false)
  const [provingFailed, setProvingFailed] = useState(false)

  const [result, setResult] = useState({
    phonenumber_id: "",
    phonenumber_country: "",
    phonenumber_verified: false,
    address_country: "",
    product_access: "",
    country: "",
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
    const jsonRes = JSON.parse(res.received)
    setResult({
      phonenumber_id: jsonRes.phone_numbers[0].number_id,
      phonenumber_country: jsonRes.phone_numbers[0].country,
      phonenumber_verified: jsonRes.phone_numbers[0].verified,
      address_country: jsonRes.residential_address.country_code,
      product_access: jsonRes.product_access.join(", "),
      country: jsonRes.country_code,
    })
  }

  const onNotarizationError = async function (e) {
    console.log(e)
  }

  function InstallExtension() {
    return (
      <Stack alignItems={"center"}>
        <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={1}>
          <Typography align='center'>Note: OpenLayer browser extension is needed for the proof</Typography>
          <Button variant="contained" onClick={() => {
            window.open(`https://chrome.google.com/webstore/detail/${extensionName}/${extensionId}`, '_blank');
          }}>Install Jomo Copilot Extension</Button>
        </Stack>
      </Stack>
    )
  }

  function ProveButton() {
    return (
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }}>
        <Button variant="contained" disabled={needsExtension} onClick={startNotarize}>Login Coinbase and Claim DROP</Button>
      </Stack>
    )
  }

  function ProveInProgress() {
    return (
      <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
        <CircularProgress size={24} color="primary" />
        <Typography variant="body1" textAlign={"center"}>Proving Coinbase account and residency...</Typography>
      </Stack>
    )
  }

  function ProveSuccess() {
    return (
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "550px" }} spacing={1}>
        <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
          <Iconify height={36} width={36} color={"success.main"} icon="material-symbols:check" />
          <Typography variant="body1">Coinbase account proved and DROP claimed</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Country</Typography>
          <Typography variant='body2'>{result.country || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Phone Country</Typography>
          <Typography variant='body2'>{result.phonenumber_country || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Residence Country</Typography>
          <Typography variant='body2'>{result.address_country || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Phone Randomized Id</Typography>
          <Typography variant='body2'>{result.phonenumber_id || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Phone Verified</Typography>
          <Typography variant='body2'>{(result.phonenumber_verified && "True") || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Product Access</Typography>
          <Typography variant='body2'>{result.product_access || "-"}</Typography>
        </Stack>
      </Stack>
    )
  }

  function ProveFailed() {
    return (
      <Typography variant="body1">Failed to prove</Typography>
    )
  }

  async function checkExtension() {
    if (!extensionFound.current) {
      var hasExtension = openlayerSDK.isOpenLayerExtensionInstalled()

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
    setProving(true)

    const authResponse = await openlayerSDK.interceptAuthedRequest(redirectUrl, urlFilters)
    const authHeaders = buildAuthHeaders(authResponse)

    const [notarizeProof, error] = await openlayerSDK.notarizeWithAuth(
      authHeaders,
      dataPath,
      dataMethod,
      keysToNotarize,
      websockifyServer,
    )
    if (notarizeProof) {
      const verificationRes = await openlayerSDK.verifyNotarizationProof({
        proof: notarizeProof,
      })
      if (verificationRes.status === 200) {
        setProved(true)
        setProvingFailed(false)
        setProving(false)
        onNotarizationResult(verificationRes.data)
        return verificationRes
      }
    }
    onNotarizationError(error)
    setProved(false)
    setProvingFailed(true)
    setProving(false)
    return null
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
      <Stack alignItems={"center"} gap={2}>

        <Typography variant='h4'>Claim Your DROP</Typography>

        <Typography variant='subtitle1'>Before claiming your DROP tokens, you need to prove your Coinbase account access and country of residence.</Typography>

        {triggerExtensionInstall &&
          <Collapse in={needsExtension}>
            {InstallExtension()}
          </Collapse>
        }

        <Stack alignItems={"center"}>
          <Collapse in={!proving && !provingFailed && !proved} sx={{ width: 1, maxWidth: "450px" }}>
            {ProveButton()}
          </Collapse>
          <Collapse in={proving} sx={{ width: 1, maxWidth: "450px", alignContent: "center" }}>
            {ProveInProgress()}
          </Collapse>
          <Collapse in={provingFailed}>
            {ProveFailed()}
          </Collapse>
          <Collapse in={proved}>
            {ProveSuccess()}
          </Collapse>
        </Stack>
      </Stack>
    </Box >
  )
}

export default CoinbaseUserNewSdk
