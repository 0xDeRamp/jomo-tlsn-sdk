import { useState, useRef, useEffect } from 'react'
import { Button, Collapse, Stack, Typography, CircularProgress } from '@mui/material';
import Iconify from './iconify';
import * as utils from './utils'

function JomoTlsnNotary({
  notaryServers: {
    notaryServerHost,
    notaryServerSsl,
    websockifyServer,
  },
  extensionId = "nmdnfckjjghlbjeodefnapacfnocpdgm",
  extensionName = "jomo-copilot",
  extensionConfigs: {
    redirectUrl,
    urlFilters,
  },
  applicationConfigs: {
    appServer,
    appName,
  },
  defaultNotaryFlowConfigs: {
    defaultNotaryFlow,
    buildAuthHeaders,
    queryPath,
    queryMethod,
    buildDataPathWithResponse,
    dataMethod,
    keysToNotarize,
  } = {
    defaultNotaryFlow: false,
    buildAuthHeaders: (_) => { },
    queryPath: "",
    queryMethod: "",
    buildDataPathWithResponse: (_) => { },
    dataMethod: "",
    keysToNotarize: [["example"]],
  },
  onNotarizationResult,
}) {
  const [needsExtension, setNeedsExtension] = useState(false)
  const [triggerExtensionInstall, setTriggerExtensionInstall] = useState(false)
  const firstMount = useRef(true)
  const extensionFound = useRef(false)

  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingFailed, setLoadingFailed] = useState(false)
  const [loadingText, setLoadingText] = useState("")

  async function checkExtension() {
    if (!extensionFound.current) {
      try {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        chrome.runtime.sendMessage(extensionId, {}, {}, () => { });
        setNeedsExtension(false)
        extensionFound.current = true
        console.log("extension found")
      } catch {
        setNeedsExtension(true)
        setTriggerExtensionInstall(true)
        console.log("extension not found")
        setTimeout(() => { checkExtension() }, 1000)
      }
    }
  }

  async function startNotarize() {
    setLoading(true)
    setLoadingText("Logging in...")

    console.log("default notary flow:", defaultNotaryFlow)

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
        notarizeWithAuth(appServer, buildAuthHeaders(response))
      },
    )
  }

  async function notarizeWithAuth(server, authHeaders) {
    const accountsResponse = JSON.parse(await utils.sendRequest(
      server, queryPath, queryMethod, {}, authHeaders,
      websockifyServer,
    ))

    setLoadingText("Notarizing ...")

    const dataPath = buildDataPathWithResponse(accountsResponse)
    if (dataPath === null) {
      setLoadingFailed(true)
      return
    }

    const notarizationProof = await utils.notarizeRequest(
      server, dataPath, dataMethod, {}, authHeaders,
      [],
      [],
      keysToNotarize,
      notaryServerHost,
      notaryServerSsl,
      websockifyServer,
    )

    onNotarizationResult(notarizationProof)
    setLoaded(true)
    setLoadingFailed(false)
    setLoading(false)
  }

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false
      checkExtension()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Stack gap={2} alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }}>
      {triggerExtensionInstall &&
        <Collapse in={needsExtension}>
          <Stack alignItems={"center"} mt={2}>
            <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
              <Button variant="contained" onClick={() => {
                window.open(`https://chrome.google.com/webstore/detail/${extensionName}/${extensionId}`, '_blank');
              }}>Install Jomo Copilot Extension</Button>
            </Stack>
          </Stack>
        </Collapse>
      }

      <Stack alignItems={"center"}>
        <Collapse in={!loading && !loadingFailed && !loaded} sx={{ width: 1, maxWidth: "450px" }}>
          <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
            <Button disabled={loading || needsExtension} variant="contained" onClick={() => { startNotarize() }}>Login {appName}</Button>
          </Stack>
        </Collapse>
        <Collapse in={loading} sx={{ width: 1, maxWidth: "450px", alignContent: "center" }}>
          <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
            <CircularProgress size={24} color="primary" />
            <Typography variant="body1" textAlign={"center"}>{loadingText}</Typography>
          </Stack>
        </Collapse>
        <Collapse in={loadingFailed}>
          <Typography variant="body1">Failed to fetch data</Typography>
        </Collapse>
        <Collapse in={loaded}>
          <Stack direction={"row"} alignItems={"center"} gap={1} justifyContent={"center"}>
            <Iconify height={36} width={36} color={"success.main"} icon="material-symbols:check" />
            <Typography variant="body1">Notarized successfully</Typography>
          </Stack>
        </Collapse>
      </Stack>
    </Stack >
  )
}

export default JomoTlsnNotary
