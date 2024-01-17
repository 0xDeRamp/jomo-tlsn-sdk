import { useState, useRef, useEffect } from 'react'
import { Button, Collapse, Stack, Typography, CircularProgress } from '@mui/material';
import Iconify from './iconify';
import * as utils from './utils'

function JomoTlsnNotary() {
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
        chrome.runtime.sendMessage("nmdnfckjjghlbjeodefnapacfnocpdgm", {}, {}, () => { });
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

  async function notarizeRevolutLastPayment() {
    setLoading(true)
    setLoadingText("Logging in...")
    const server = "app.revolut.com"

    // @ts-ignore
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage(
      "nmdnfckjjghlbjeodefnapacfnocpdgm",
      {
        type: "prepareSession",
        redirectUrl: "https://app.revolut.com/home",
        urlFilters: ["https://app.revolut.com/api/retail/user/current/wallet"]
      },
      {},
      (response) => {
        const cookie = response.headers["Cookie"]
        const deviceId = response.headers["x-device-id"]
        const userAgent = response.headers["User-Agent"]
        notarizeRevolutLastPaymentWithHeaders(server, cookie, deviceId, userAgent)
      },
    )
  }

  async function notarizeRevolutLastPaymentWithHeaders(server, cookie, deviceId, userAgent) {
    const headersWithBearer = new Map([
      ["Cookie", cookie],
      ["X-Device-Id", deviceId],
      ["User-Agent", userAgent],
      ["Host", server],
    ])

    const accountsPath = "api/retail/user/current/wallet"
    const accountsMethod = "GET"
    const accountsResponse = JSON.parse(await utils.sendRequest(server, accountsPath, accountsMethod, {}, headersWithBearer))
    const account = accountsResponse["pockets"][0]["id"] || null
    if (!account) {
      setLoadingFailed(true)
      return
    }

    setLoadingText("Notarizing ...")

    const dataPath = `api/retail/user/current/transactions/last?count=1&internalPocketId=${account}`
    const dataMethod = "GET"
    const keysToNotarize = [["account"], ["amount"], ["category"], ["comment"], ["completeDate"], ["id"], ["state"], ["recipient", "id"], ["recipient", "code"], ["currency"]]
    const notarizationProof = await utils.notarizeRequest(
      server, dataPath, dataMethod, {}, headersWithBearer,
      [],
      [],
      keysToNotarize,
    )

    console.log(notarizationProof)
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
          <Stack alignItems={"center"} paddingLeft={2} mt={2}>
            <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
              <Button variant="contained" onClick={() => {
                window.open("https://chrome.google.com/webstore/detail/jomo-copilot/nmdnfckjjghlbjeodefnapacfnocpdgm", '_blank');
              }}>Install Jomo Copilot Extension</Button>
            </Stack>
          </Stack>
        </Collapse>
      }

      <Stack alignItems={"center"}>
        <Collapse in={!loading && !loadingFailed && !loaded} sx={{ width: 1, maxWidth: "450px" }}>
          <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
            <Button disabled={loading || needsExtension} variant="contained" onClick={() => { notarizeRevolutLastPayment() }}>Login Revolut</Button>
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
