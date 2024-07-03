import { useState, useRef, useEffect } from 'react'
import { Collapse, Stack, Box } from '@mui/material';
import * as utils from './utils'

function JomoTlsnNotary({
  notaryServers: {
    notaryServerHost,
    notaryServerSsl,
    websockifyServer,
  },
  extensionId = "nmdnfckjjghlbjeodefnapacfnocpdgm",
  extensionConfigs: {
    redirectUrl,
    urlFilters,
  },
  applicationConfigs: {
    appServer,
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
  onNotarizationError,
  childExtensionNotFound,
  childExtensionInstalled,
  childExtensionFound,
  childVerificationInProgress,
  childVerificationComplete,
  childVerificationFail = (<></>),
}) {
  const [needsExtension, setNeedsExtension] = useState(false)
  const [triggerExtensionInstall, setTriggerExtensionInstall] = useState(false)
  const firstMount = useRef(true)
  const extensionFound = useRef(false)
  const browser = useRef("")

  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingFailed, setLoadingFailed] = useState(false)

  function getBrowser() {
    if (typeof window != "undefined") {
      if (window.navigator.userAgent.match("Chrome")) {
        return "chrome"
      }
      if (window.navigator.userAgent.match("Firefox")) {
        return "firefox"
      }
    }
    return "na";
  }

  function chromeHasExtension() {
    try {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(extensionId, {}, {}, () => { });
      return true
    } catch {
      return false
    }
  }

  function firefoxHasExtension() {
    if (window.hasOwnProperty('derampInject')) {
      return true
    } else {
      return false
    }
  }

  async function checkExtension() {
    if (!extensionFound.current) {
      if (browser.current === "") {
        browser.current = getBrowser()
      }

      var hasExtension = false
      if (browser.current === "chrome") {
        hasExtension = chromeHasExtension()
      } else if (browser.current === "firefox") {
        hasExtension = firefoxHasExtension()
      }

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

    console.log("default notary flow:", defaultNotaryFlow)

    if (browser.current === "chrome") {
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
    } else if (browser.current === "firefox") {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      const response = await window.derampInject({
        type: "prepareSession",
        redirectUrl: redirectUrl,
        urlFilters: urlFilters,
      })
      notarizeWithAuth(appServer, buildAuthHeaders(response))
    }
  }

  async function notarizeWithAuth(server, authHeaders) {
    var accountsResponse = ""
    if (queryPath !== "") {
      accountsResponse = JSON.parse(await utils.sendRequest(
        server, queryPath, queryMethod, {}, authHeaders,
        websockifyServer,
      ))
    }

    const dataPath = buildDataPathWithResponse(accountsResponse)
    if (dataPath === null) {
      setLoadingFailed(true)
      return
    }

    try {
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
    } catch (e) {
      onNotarizationError(e)
      setLoaded(false)
      setLoadingFailed(true)
      setLoading(false)
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
            {childExtensionNotFound}
          </Collapse>
          <Collapse in={!needsExtension}>
            {childExtensionInstalled}
          </Collapse>
        </>
      }

      <Collapse in={!needsExtension}>
        <Stack alignItems={"center"}>
          <Collapse in={!loading && !loadingFailed && !loaded} sx={{ width: 1, maxWidth: "450px" }} onClick={startNotarize}>
            {childExtensionFound}
          </Collapse>
          <Collapse in={loading} sx={{ width: 1, maxWidth: "450px", alignContent: "center" }}>
            {childVerificationInProgress}
          </Collapse>
          <Collapse in={loadingFailed}>
            {childVerificationFail}
          </Collapse>
          <Collapse in={loaded}>
            {childVerificationComplete}
          </Collapse>
        </Stack>
      </Collapse>
    </Box >
  )
}

export default JomoTlsnNotary
