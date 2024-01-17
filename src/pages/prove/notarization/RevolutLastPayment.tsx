import { useEffect, useState, useRef } from 'react'
import { Button, Collapse, Stack, TextField, Typography } from '@mui/material';
import * as utils from './utils'
import * as apis from '../../../utils/apirequests.js'


function RevolutLastPayment({ onNotarizationComplete, extensionFound }) {

  const [credentialEnabled, setCredentialEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingFailed, setLoadingFailed] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const [notarizeDetails, setNotarizeDetails] = useState("")

  const notarizeDetailedText = useRef("")

  async function notarizeRevolutLastPayment() {
    setCredentialEnabled(false)
    setLoading(true)
    setLoadingText("Logging in...")
    const server = "app.revolut.com"

    // @ts-ignore
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

    setLoadingText("Fetching and notarizing data from Revolut ...")

    console.log(account)

    const dataPath = `api/retail/user/current/transactions/last?count=1&internalPocketId=${account}`
    const dataMethod = "GET"
    const keysToNotarize = [["account"], ["amount"], ["category"], ["comment"], ["completeDate"], ["id"], ["state"], ["recipient", "id"], ["recipient", "code"], ["currency"]]
    const notarizationProof = await utils.notarizeRequest(
      server, dataPath, dataMethod, {}, headersWithBearer,
      [],
      [],
      keysToNotarize,
      notarizeDetailedText,
      setNotarizeDetails,
    )

    console.log(notarizationProof)

    await apis.backendRequest("generate_notary_attestation", {
      attestation_name: "revolut_last_payment",
      session_proof: notarizationProof["session_proof"],
      substrings_proof: notarizationProof["substrings_proof"],
      body_start: notarizationProof["body_start"],
    })

    setLoaded(true)
    setLoadingFailed(false)
    setLoading(false)
  }

  useEffect(() => {
    const areas = document.getElementsByClassName("MuiInputBase-inputMultiline")
    if (notarizeDetails) {
      for (var i = 0; i < areas.length; i++) {
        const area = areas.item(i)
        area.scrollTop = area.scrollHeight
      }
    }
  }, [notarizeDetails]);

  return (
    <Stack gap={2}>
      {!loaded &&
        <Stack alignItems={"center"} paddingLeft={2}>
          <Collapse in={credentialEnabled} sx={{ width: 1, maxWidth: "450px" }}>
            <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
              <Button disabled={loading || !extensionFound} variant="contained" onClick={() => { notarizeRevolutLastPayment() }}>Login Revolut</Button>
            </Stack>
          </Collapse>
          <Collapse in={loading} sx={{ width: 1, maxWidth: "450px", alignContent: "center" }}>
            <Typography variant="body1" textAlign={"center"}>{loadingText}</Typography>
          </Collapse>
          <Collapse in={loadingFailed}>
            <Typography variant="body1">Failed to fetch data</Typography>
          </Collapse>
        </Stack>
      }
      {notarizeDetails &&
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={3}
          maxRows={10}
          margin="dense"
          variant="outlined"
          label="Notarization process details"
          value={notarizeDetails}
          contentEditable={false}
          onChange={(event) => { event.target.scrollTo(0, event.target.scrollHeight) }}
        />
      }
    </Stack>
  )
}

export default RevolutLastPayment
