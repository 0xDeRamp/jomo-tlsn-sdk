import { useEffect, useState, useRef } from 'react'
import { Button, Collapse, Stack, TextField, Typography } from '@mui/material';
import * as utils from './utils'


function Venmo({ onNotarizationComplete, extensionFound }) {
  const [credentialEnabled, setCredentialEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingFailed, setLoadingFailed] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const [notarizeDetails, setNotarizeDetails] = useState("")

  const notarizeDetailedText = useRef("")

  async function notarizeVenmoLastPayment() {
    setCredentialEnabled(false)
    setLoading(true)
    setLoadingText("Logging in...")

    // @ts-ignore
    chrome.runtime.sendMessage(
      "nmdnfckjjghlbjeodefnapacfnocpdgm",
      {
        type: "prepareSession",
        redirectUrl: "https://account.venmo.com/",
        urlFilters: ["https://account.venmo.com/api/stories*"]
      },
      {},
      (response) => {
        const cookieHeader = response.headers.Cookie
        notarizeWithAuthentication(cookieHeader)
      },
    )
  }


  async function notarizeWithAuthentication(cookieHeader) {
    const server = "account.venmo.com"

    const headersWithBearer = new Map([
      ["Cookie", cookieHeader],
      ["Host", server],
      ["Accept", "application/json, text/javascript, */*; q=0.01"],
    ])

    setLoadingText("Fetching and notarizing data from Venmo ...")

    const dataPath = `api/stories?feedType=betweenYou&otherUserId=2126505450668032650&externalId=2770628205608960739`
    const dataMethod = "GET"
    const keysToNotarize = [["stories", "amount"]]
    const notarizationProof = await utils.notarizeRequest(
      server, dataPath, dataMethod, {}, headersWithBearer,
      [],
      [],
      keysToNotarize,
      notarizeDetailedText,
      setNotarizeDetails,
    )

    console.log(notarizationProof)
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
              <Button disabled={loading || !extensionFound} variant="contained" onClick={() => { notarizeVenmoLastPayment() }}>Login Venmo</Button>
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

export default Venmo
