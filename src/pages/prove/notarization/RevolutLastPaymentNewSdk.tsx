import { OpenlayerClientSDK } from 'openlayer-sdk/dist';
import { Button, Stack, Typography, CircularProgress, Box, Collapse } from '@mui/material';
import Iconify from '../../../components/iconify';
import { useState, useRef, useEffect } from 'react';


function RevolutLastPaymentNewSdk() {
  const revolutServer = "app.revolut.com"
  const extensionId = "kidmejgglkmmkomccdagfekjfmlgibjb"
  const extensionName = "OpenLayer"
  const redirectUrl = "https://app.revolut.com/home"
  const urlFilters = ["https://app.revolut.com/api/retail/user/current/wallet"]
  const queryPath = "api/retail/user/current/wallet"
  const queryMethod = "GET"
  const dataMethod = "GET"
  const keysToNotarize = [["account"], ["amount"], ["category"], ["comment"], ["completeDate"], ["id"], ["state"], ["recipient", "id"], ["recipient", "code"], ["currency"]]
  const notaryServerHost = "notary.jomo.id:7047"
  const notaryServerSsl = true
  const websockifyServer = "wss://notary.jomo.id:61292"
  const proofVerificationServer = "api/verify_proof"

  const openlayerSDK = new OpenlayerClientSDK(
    extensionId,
    revolutServer,
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
    amount: 0,
    account: "",
    category: "",
    comment: "",
    completeDate: "",
    id: "",
    state: "",
    recipientId: "",
    recipientCode: "",
    currency: "",
  })

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
    const jsonRes = JSON.parse(res.received)
    console.log(jsonRes)
    setResult({
      amount: jsonRes[0].amount,
      account: jsonRes[0].account,
      category: jsonRes[0].category,
      comment: jsonRes[0].comment,
      completeDate: jsonRes[0].completeDate,
      id: jsonRes[0].id,
      state: jsonRes[0].state,
      recipientId: jsonRes[0].recipient.id,
      recipientCode: jsonRes[0].recipient.code,
      currency: jsonRes[0].currency,
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
          }}>Install OpenLayer Extension</Button>
        </Stack>
      </Stack>
    )
  }

  function ProveButton() {
    return (
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }}>
        <Button variant="contained" disabled={needsExtension} onClick={startNotarize}>Login Revolut</Button>
      </Stack>
    )
  }

  function ProveInProgress() {
    return (
      <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
        <CircularProgress size={24} color="primary" />
        <Typography variant="body1" textAlign={"center"}>Proving Revolut last payment...</Typography>
      </Stack>
    )
  }

  function ProveSuccess() {
    return (
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "550px" }} spacing={1}>
        <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
          <Iconify height={36} width={36} color={"success.main"} icon="material-symbols:check" />
          <Typography variant="body1">Last Revolut Payment Fetched and Proved</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Receiver Id</Typography>
          <Typography variant='body2'>{result.recipientId || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Receiver Code</Typography>
          <Typography variant='body2'>{result.recipientCode || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Amount</Typography>
          <Typography variant='body2'>{result.amount || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Currency</Typography>
          <Typography variant='body2'>{result.currency || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>State</Typography>
          <Typography variant='body2'>{result.state || "-"}</Typography>
        </Stack>
        <Stack direction={"row"} width={1} justifyContent={'space-between'}>
          <Typography variant='subtitle2'>Comments</Typography>
          <Typography variant='body2'>{result.comment || "-"}</Typography>
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

    const accountResponse = await openlayerSDK.requestWithAuth(authHeaders, queryPath, queryMethod, websockifyServer)
    const [notarizeProof, error] = await openlayerSDK.notarizeWithAuth(
      authHeaders,
      buildDataPathWithResponse(accountResponse),
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
    <Box alignItems={"center"} sx={{ width: 1, maxWidth: "550px" }}>
      <Stack alignItems={"center"} gap={2}>

        <Typography variant='h4'>Last Revolut Payment</Typography>

        <Typography variant='subtitle1' align='center'>Login to Revolut and prove the last payment you made.</Typography>

        {triggerExtensionInstall &&
          <Collapse in={needsExtension}>
            {InstallExtension()}
          </Collapse>
        }

        <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px", alignContent: "center" }}>
          <Collapse in={!proving && !provingFailed && !proved} sx={{ width: 1, maxWidth: "550px" }}>
            {ProveButton()}
          </Collapse>
          <Collapse in={proving} sx={{ width: 1, maxWidth: "550px", alignContent: "center" }}>
            {ProveInProgress()}
          </Collapse>
          <Collapse in={provingFailed}>
            {ProveFailed()}
          </Collapse>
          <Collapse in={proved} sx={{ width: 1, maxWidth: "550px", alignContent: "center" }}>
            {ProveSuccess()}
          </Collapse>
        </Stack>
      </Stack>
    </Box >
  )
}

export default RevolutLastPaymentNewSdk
