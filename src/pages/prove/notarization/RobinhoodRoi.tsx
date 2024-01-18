import { useState } from 'react'
import { Stack, ToggleButtonGroup, Typography, ToggleButton, Avatar } from '@mui/material';
import * as apis from '../../../utils/apirequests.js'
import robinhoodImg from '../../../images/robinhood.png'
import { JomoTlsnNotary } from 'jomo-tlsn-sdk/dist';


function RobinhoodRoi() {
  const robinhoodServer = "api.robinhood.com"

  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [verifiedData, setVerifiedData] = useState(null)
  const [verifiedTimestamp, setVerifiedTimestamp] = useState(null)
  const [timespan, setTimespan] = useState('week');
  const [uniqueId, setUniqueId] = useState(null);

  const timespanToStr = {
    "0": "Weekly",
    "1": "Monthly",
    "2": "Yearly",
  }

  const handleTimespanChange = (_, newTimespan) => {
    setTimespan(newTimespan);
  };

  const buildAuthHeaders = function (response) {
    setLoading(true)
    const bearer = response.headers.Authorization.split(" ")[1]

    const authedHeader = new Map([
      ["Authorization", "Bearer " + bearer],
      ["Host", robinhoodServer],
    ])
    return authedHeader
  }

  const buildDataPathWithResponse = function (response) {
    const account = response["results"][0]["account_number"] || null
    if (!account) {
      return null
    }

    const timespanParams = {
      "week": "interval=day&span=week",
      "month": "interval=week&span=month",
      "year": "interval=3month&span=year",
    }
    const dataPath = `portfolios/historicals/${account}/?account=${account}&${timespanParams[timespan]}`
    return dataPath
  }

  const onNotarizationResult = async function (notarizationProof) {
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
    }
    setLoading(false)
  }

  return (
    <>
      <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
        <ToggleButtonGroup
          color="primary"
          size="small"
          aria-label="Time Span"
          value={timespan}
          exclusive
          onChange={handleTimespanChange}
          disabled={loading || loaded}
        >
          <ToggleButton value="week">Weekly</ToggleButton>
          <ToggleButton value="month">Monthly</ToggleButton>
          <ToggleButton value="year">Yearly</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <JomoTlsnNotary
        notaryServers={{
          notaryServerHost: "127.0.0.1:7047",
          notaryServerSsl: false,
          websockifyServer: "ws://127.0.0.1:61289",
        }}
        extensionConfigs={{
          redirectUrl: "https://robinhood.com",
          urlFilters: ["https://api.robinhood.com/accounts/"]
        }}
        applicationConfigs={{
          appServer: robinhoodServer,
          appName: "Robinhood",
        }}
        onNotarizationResult={onNotarizationResult}
        defaultNotaryFlowConfigs={{
          defaultNotaryFlow: true,
          buildAuthHeaders: buildAuthHeaders,
          queryPath: "accounts/?default_to_all_accounts=true",
          queryMethod: "GET",
          buildDataPathWithResponse: buildDataPathWithResponse,
          dataMethod: "GET",
          keysToNotarize: [["total_return"], ["span"]],
        }}
      />

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
    </>
  )
}

export default RobinhoodRoi
