import { Button, Stack, Typography, CircularProgress, Box, Collapse, Divider } from '@mui/material';
import Iconify from '../../../components/iconify';
import { useState, useRef, useEffect } from 'react';
import { OpenlayerClientSDK } from 'openlayer-sdk/dist';


function LinkedInConnectionsNewSdk() {
  const linkedinServer = "www.linkedin.com"
  const extensionId = "bcakokeeafaehcajfkajcpbdkfnoahlh"
  const extensionName = "OpenLayer"
  const redirectUrl = "https://www.linkedin.com/in/"
  const urlFilters = ["https://www.linkedin.com/voyager/api/voyagerIdentityDashProfilePhotoFrames"]
  const dataPath = `voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionList-16&count=1&q=search&start=0`
  const dataMethod = "GET"
  const keysToNotarize = [["elements", "connectedMemberResolutionResult", "publicIdentifier"], ["elements", "connectedMemberResolutionResult", "headline"]]
  const notaryServerHost = "notary.jomo.id:7047"
  const notaryServerSsl = true
  const websockifyServer = "wss://notary.jomo.id:61294"
  // const notaryServerHost = "localhost:7047"
  // const notaryServerSsl = false
  // const websockifyServer = "ws://localhost:61294"
  const proofVerificationServer = "api/verify_proof"

  const openlayerSDK = new OpenlayerClientSDK(
    extensionId,
    linkedinServer,
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
    elements: [],
  })

  const buildAuthHeaders = function (response) {
    const cookie = response.headers["Cookie"]
    const csrf = response.headers["csrf-token"]

    const authedHeader = new Map([
      ["Cookie", cookie],
      ["Csrf-Token", csrf],
      ["Host", linkedinServer],
    ])
    return authedHeader
  }

  const onNotarizationResult = async function (res) {
    const jsonRes = JSON.parse(res.received)
    setResult(jsonRes)
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
        <Button variant="contained" disabled={needsExtension} onClick={startNotarize}>Login LinkedIn</Button>
      </Stack>
    )
  }

  function ProveInProgress() {
    return (
      <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
        <CircularProgress size={24} color="primary" />
        <Typography variant="body1" textAlign={"center"}>Proving LinkedIn account and connections...</Typography>
      </Stack>
    )
  }

  function ProveSuccess() {
    return (
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "550px" }} spacing={2}>
        <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
          <Iconify height={36} width={36} color={"success.main"} icon="material-symbols:check" />
          <Typography variant="body1">LinkedIn Connections</Typography>
        </Stack>
        {result.elements.map((element, i) => {     
           return (
            <Stack sx={{ width: 1, maxWidth: "550px" }} gap={0.5}>
              <Stack direction={"row"} sx={{ width: 1, maxWidth: "550px" }} justifyContent={'space-between'} gap={2}>
                <Typography variant='subtitle2'>ID</Typography>
                <Typography variant='body2' textAlign={"right"}>{element.connectedMemberResolutionResult.publicIdentifier || "-"}</Typography>
              </Stack>
              <Stack direction={"row"} sx={{ width: 1, maxWidth: "550px" }} justifyContent={'space-between'} gap={2}>
                <Typography variant='subtitle2'>Headline</Typography>
                <Typography variant='body2' textAlign={"right"}>{element.connectedMemberResolutionResult.headline || "-"}</Typography>
              </Stack>
              <Divider />
            </Stack>
           ) 
        })}

        
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

        <Typography variant='h4'>Prove Your LinkedIn Connections</Typography>

        <Typography variant='subtitle1' align='center'>Prove the first X connections you have on LinkedIn.</Typography>

        {triggerExtensionInstall &&
          <Collapse in={needsExtension}>
            {InstallExtension()}
          </Collapse>
        }

        <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "550px" }}>
          <Collapse in={!proving && !provingFailed && !proved} sx={{ width: 1, maxWidth: "450px" }}>
            {ProveButton()}
          </Collapse>
          <Collapse in={proving} sx={{ width: 1, maxWidth: "450px", alignContent: "center" }}>
            {ProveInProgress()}
          </Collapse>
          <Collapse in={provingFailed}>
            {ProveFailed()}
          </Collapse>
          <Collapse in={proved} sx={{ width: 1, maxWidth: "550px" }}>
            {ProveSuccess()}
          </Collapse>
        </Stack>
      </Stack>
    </Box >
  )
}

export default LinkedInConnectionsNewSdk
