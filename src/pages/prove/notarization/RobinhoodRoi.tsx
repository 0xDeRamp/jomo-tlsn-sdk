import { useEffect, useState, useRef } from 'react'
import { Button, Collapse, Stack, TextField, ToggleButtonGroup, Typography, ToggleButton, Avatar } from '@mui/material';
// @ts-ignore
import { useUserContext } from '../../../context/UserContext.tsx';
import * as apis from '../../../utils/apirequests.js'
import * as utils from './utils'
import robinhoodImg from '../../../images/robinhood.png'


function RobinhoodRoi({ onNotarizationComplete, extensionFound }) {
  const userUuid = useRef<string | null>(null)
  const sessionInfo = useRef({
    token: null,
    expiresAt: 0,
  })
  const { user, session } = useUserContext()

  const [credentialEnabled, setCredentialEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingFailed, setLoadingFailed] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const [notarizeDetails, setNotarizeDetails] = useState("")
  const [verifiedData, setVerifiedData] = useState(null)
  const [verifiedTimestamp, setVerifiedTimestamp] = useState(null)
  const [timespan, setTimespan] = useState('week');
  const [uniqueId, setUniqueId] = useState(null);

  const notarizeDetailedText = useRef("")

  const timespanToStr = {
    "0": "Weekly",
    "1": "Monthly",
    "2": "Yearly",
  }

  const handleTimespanChange = (_, newTimespan) => {
    setTimespan(newTimespan);
  };

  async function notarizeRobinhoodReturn() {
    setCredentialEnabled(false)
    setLoading(true)
    setLoadingText("Logging in...")
    const server = "api.robinhood.com"

    // @ts-ignore
    chrome.runtime.sendMessage(
      "nmdnfckjjghlbjeodefnapacfnocpdgm",
      {
        type: "prepareSession",
        redirectUrl: "https://robinhood.com",
        urlFilters: ["https://api.robinhood.com/accounts/"]
      },
      {},
      (response) => {
        const bearer = response.headers.Authorization.split(" ")[1]
        notarizeRobinhoodWithToken(server, bearer)
      },
    )
  }


  async function notarizeRobinhoodWithToken(server, bearerToken) {
    const headersWithBearer = new Map([
      ["Authorization", "Bearer " + bearerToken],
      ["Host", server],
      // ["Accept", "*/*"],
      // ["Accept-Encoding", "gzip, deflate, br"],
      // ["Accept-Language", "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"],
      // ["Origin", "https://robinhood.com"],
      // ["Referer", "https://robinhood.com/"],
      // ["Sec-Ch-Ua", '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"'],
      // ["Sec-Ch-Ua-Mobile", "?0"],
      // ["Sec-Ch-Ua-Platform", '"macOS"'],
      // ["Sec-Fetch-Dest", "empty"],
      // ["Sec-Fetch-Mode", "cors"],
      // ["Sec-Fetch-Site", "same-site"],
      // ["User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"],
      // ["X-Robinhood-Api-Version", "1.431.4"],
      // ["X-Timezone-Id", "America/Los_Angeles"],
      // ["X-Hyper-Ex", "enabled"],
    ])

    const accountsPath = "accounts/?default_to_all_accounts=true"
    const accountsMethod = "GET"
    const accountsResponse = JSON.parse(await utils.sendRequest(server, accountsPath, accountsMethod, {}, headersWithBearer))
    const account = accountsResponse["results"][0]["account_number"] || null
    if (!account) {
      setLoadingFailed(true)
      return
    }

    setLoadingText("Fetching and notarizing data from Robinhood ...")

    const timespanParams = {
      "week": "interval=day&span=week",
      "month": "interval=week&span=month",
      "year": "interval=3month&span=year",
    }
    const dataPath = `portfolios/historicals/${account}/?account=${account}&${timespanParams[timespan]}`
    const dataMethod = "GET"
    const keysToNotarize = [["total_return"], ["span"]]
    const notarizationProof = await utils.notarizeRequest(
      server, dataPath, dataMethod, {}, headersWithBearer,
      [],
      [],
      keysToNotarize,
      notarizeDetailedText,
      setNotarizeDetails,
    )

    let res = await apis.backendRequest("generate_notary_attestation", {
      attestation_name: "us_brokerage_portfolio_movement",
      brokerage: "Robinhood",
      time_span: timespan,
      session_proof: notarizationProof["session_proof"],
      substrings_proof: notarizationProof["substrings_proof"],
      body_start: notarizationProof["body_start"],
    })
    if (res.validated) {
      setVerifiedData(res.raw_elements)
      setVerifiedTimestamp(res.attestation.sig.message.time)
      setUniqueId(res.unique_id)
      setLoaded(true)
      onNotarizationComplete(res)
    } else {
      setLoadingFailed(true)
    }
    setLoading(false)
  }

  // Whenever local user state finds a new userUuid, get a valid token for the user
  useEffect(() => {
    if (user) {
      userUuid.current = user.userUuid
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Whenever global session updates, update the local ref
  useEffect(() => {
    sessionInfo.current = session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

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
              <ToggleButtonGroup
                color="primary"
                size="small"
                aria-label="Time Span"
                value={timespan}
                exclusive
                onChange={handleTimespanChange}
                disabled={loading || !extensionFound}
              >
                <ToggleButton value="week">Weekly</ToggleButton>
                <ToggleButton value="month">Monthly</ToggleButton>
                <ToggleButton value="year">Yearly</ToggleButton>
              </ToggleButtonGroup>
              <Button disabled={loading || !extensionFound} variant="contained" onClick={() => { notarizeRobinhoodReturn() }}>Login Robinhood and Prove</Button>
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
      {loaded &&
        <Stack gap={1} alignItems={"left"} paddingX={5} width={1}>
          <Stack direction="row" spacing={1} alignItems='center'>
            <Avatar alt="Robinhood" src={robinhoodImg} sx={{ width: 24, height: 24 }} />
            <Typography gutterBottom variant="h6" component="div">
              Robinhood
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems='center' justifyContent={"space-between"}>
            <Typography variant="subtitle2">
              Randomized Unique Id
            </Typography>
            <Typography variant="body2">{uniqueId}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems='center' justifyContent={"space-between"}>
            <Typography variant="subtitle2">
              Time Span
            </Typography>
            <Typography variant="body2">{timespanToStr[verifiedData[1]]}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems='center' justifyContent={"space-between"}>
            <Typography variant="subtitle2">
              Investment Return
            </Typography>
            <Typography variant="body2" color={(verifiedData[2] === "0" && verifiedData[3] !== "0") ? "text.stockdown" : "text.stockup"}>
              {(verifiedData[2] === "0" && verifiedData[3] !== "0") ? "Down" : "Up"} {parseFloat(verifiedData[2] === "0" ? verifiedData[3] : verifiedData[2]) / 100.0}%
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems='center' justifyContent={"space-between"}>
            <Typography variant="subtitle2">
              Notarized
            </Typography>
            <Typography variant="body2">{new Date(verifiedTimestamp * 1000).toDateString()}</Typography>
          </Stack>
        </Stack>
      }
    </Stack>
  )
}

export default RobinhoodRoi
