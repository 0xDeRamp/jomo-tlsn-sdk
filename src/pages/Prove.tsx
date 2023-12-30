import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stack, Divider, Typography, CircularProgress, Button, Tooltip } from '@mui/material';
// @ts-ignore
import { useUserContext } from '../context/UserContext.tsx';
import * as apis from '../utils/apirequests.js'
import { CustomAvatarGroup, CustomAvatar } from '../components/custom-avatar';
import logoImg from '../images/logo_simple.png';
import ProveNotarization from './prove/ProveNotarization';
import Iconify from '../components/iconify';

function Prove() {
    const userUuid = useRef<string | null>(null)
    const sessionInfo = useRef({
        token: null,
        expiresAt: 0,
    })
    const { user, session, setPage } = useUserContext()
    const [clientInfo, setClientInfo] = useState({})
    const [flowInfo, setFlowInfo] = useState({})
    const [flowDetails, setFlowDetails] = useState(null)
    const [redirectIn, setRedirectIn] = useState(null)
    const firstMount = useRef(true)
    const initialized = useRef(false)
    const redirectAt = useRef(null)
    const countDownInterval = useRef(null)
    const flowId = useRef(null)
    const publicAccountId = useRef(null)
    const [loading, setLoading] = useState(true);
    const [isFlowCompleted, setIsFlowCompleted] = useState(false);


    async function authedBackendRequest(url = '', data = {}) {
        if (!sessionInfo.current.token) {
            return null
        }
        data['user_uuid'] = userUuid.current
        data['token'] = sessionInfo.current.token
        return apis.backendRequest(url, data)
    }

    const initializeFlow = async () => {
        setLoading(true);
        const rawQueryParameters = new URLSearchParams(window.location.search)
        const queryParameters = new URLSearchParams();
        rawQueryParameters.forEach((value, name, _) => {
            queryParameters.append(name.toLowerCase(), value.toLowerCase());
        })

        flowId.current = queryParameters.get("flowid")
        publicAccountId.current = queryParameters.get("publicaccountid")
        const flowDetailsResponse = await apis.backendRequest('verify/flows', { "flow_id": parseInt(flowId.current) })
        var verificationResultResponse = null
        try {
            if (flowId.current && publicAccountId.current) {
                verificationResultResponse = await apis.backendRequest('verify/verification_results', { "flow_id": parseInt(flowId.current), "public_account_id": publicAccountId.current })
            }
        } catch (error) {
            console.log("errors when retrieving verificationResultResponse")
        }

        // TODO: we should find better ways to refresh attestation info for more real time needs
        if (flowId.current === "103") {
            await apis.backendRequest('generate_nft_holder_attestations', { "attestation_name": "ice_holdings" })
        }

        setClientInfo(flowDetailsResponse.client_info)
        setFlowInfo(flowDetailsResponse.flow_info)
        setFlowDetails(flowDetailsResponse)
        setLoading(false);
        if (verificationResultResponse === null) {
            setIsFlowCompleted(false);
        } else {
            setIsFlowCompleted(true);
        }
        return flowDetailsResponse.flow_info.name
    }

    const validateVerificationProof = async (vc_attestation, proof, publicResults, publicAccountIdDefault = null) => {
        const verifyResult = await authedBackendRequest("verify/proof", {
            flow_id: flowId.current,
            attestation: vc_attestation,
            proof: proof,
            public_results: publicResults,
            public_account_id: publicAccountIdDefault || publicAccountId.current,
        })

        if (publicAccountIdDefault) {
            const verificationVisibilityResult = await apis.backendRequest("verify/change_verification_visibility", {
                public_account_id: publicAccountIdDefault || publicAccountId.current,
                flow_id: flowId.current,
            })

            return [verifyResult.result, verificationVisibilityResult.verification_shareable_id]
        } else {
            return [verifyResult.result, null]
        }
    }

    const redirectBack = async () => {
        if (flowInfo && !flowInfo["redirect_url"]) {
            window.close()
        } else if (!redirectAt.current) {
            redirectAt.current = Date.now() + 5000
            setRedirectIn(5000)
            countDownInterval.current = setInterval(() => {
                if (Date.now() < redirectAt.current) {
                    setRedirectIn(redirectAt.current - Date.now())
                } else {
                    clearInterval(countDownInterval.current)
                    setRedirectIn(0)
                }
            }, 1)
        }
    }

    const handleClick = () => {
        setIsFlowCompleted(false);
    };

    const handleLearnMore = async () => {
        window.open("https://docs.jomo.id/welcome-to-jomo/faqs", '_blank');
    }

    const handleLearnMoreWallets = async () => {
        window.open("https://docs.jomo.id/welcome-to-jomo/faqs#proving-onchain-activities-aggregated-across-multiple-crypto-wallets", '_blank');
    }

    // Whenever local user state finds a new userUuid, get a valid token for the user
    useEffect(() => {
        if (user) {
            userUuid.current = user.userUuid
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    // Whenever page loads, load locally stored data
    useEffect(() => {
        if (redirectIn === 0 && flowInfo["redirect_url"] && flowInfo["redirect_url"] !== "") {
            window.location.replace(flowInfo["redirect_url"])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [redirectIn, flowInfo])

    // Whenever global session updates, update the local ref
    useEffect(() => {
        sessionInfo.current = session
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session])

    // Whenever page loads, load locally stored data
    useEffect(() => {
        setPage("Prove")

        if (!initialized.current) {
            if (firstMount.current) {
                firstMount.current = false
                initializeFlow().then((client_name) => {
                    if (client_name) {
                        initialized.current = true
                    }
                })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <Stack sx={{ width: 1, padding: "20px 40px" }} direction={"column"} alignItems={"center"} divider={(<Divider flexItem orientation='vertical' />)}>
                {loading &&
                    <Stack>
                        <CircularProgress size={64} color="primary" />
                    </Stack>
                }
                {!loading && !isFlowCompleted &&
                    <>
                        <Stack gap={1} direction={"row"} alignItems={"center"} justifyContent={"left"} sx={{ mt: 2, mb: 2, width: 1, maxWidth: "450px" }}>
                            <CustomAvatarGroup size={"small"} spacing={"medium"}>
                                <CustomAvatar
                                    alt="Jomo"
                                    src={logoImg}
                                />
                                {clientInfo["logo_url"] &&
                                    <CustomAvatar
                                        alt={clientInfo["name"]}
                                        src={clientInfo["logo_url"]}
                                    />
                                }
                                {
                                    flowInfo["no_client"] &&
                                    flowInfo["notarization_target_logo_url"] &&
                                    flowDetails && flowDetails.vc_info.vc_category === "TLS_NOTARY" &&
                                    <CustomAvatar
                                        alt={flowInfo["notarization_target_name"]}
                                        src={flowInfo["notarization_target_logo_url"]}
                                    />
                                }
                            </CustomAvatarGroup>
                            <Typography variant="h6" textAlign="left">
                                {clientInfo["name"]}
                                {
                                    flowInfo["no_client"] &&
                                    flowDetails && flowDetails.vc_info.vc_category === "TLS_NOTARY" &&
                                    flowInfo["notarization_target_name"]
                                }
                            </Typography>
                        </Stack>

                        <Typography variant="h5" textAlign="left" sx={{ mb: 1, width: 1, maxWidth: "450px" }}>
                            {flowInfo["name"]}
                        </Typography>
                        <Typography variant="body1" textAlign="left" sx={{ mb: 1, width: 1, maxWidth: "450px" }}>
                            {flowInfo["description"]}
                        </Typography>

                        {flowDetails && flowDetails.vc_info.vc_category === "TLS_NOTARY" &&
                            <Stack direction={'row'} justifyContent={"space-between"} alignItems={'center'} sx={{ mt: 0.5, mb: 2 }} maxWidth={"450px"}>
                                <Stack direction={"row"} alignItems={'center'} gap={0.2}>
                                    <Iconify height={20} width={20} icon="material-symbols:lock" sx={{ color: 'green', mr: '4px' }} />
                                    <Typography variant="subtitle2" textAlign="left">
                                        Your credentials are never shared to anyone, including Jomo.
                                    </Typography>
                                </Stack>
                                <Tooltip title="How does it work?" placement='top'>
                                    <Iconify height={20} width={20} icon="ph:question" sx={{ ml: '4px', cursor: "pointer" }} onClick={handleLearnMore} />
                                </Tooltip>
                            </Stack>
                        }
                        {flowDetails && (flowDetails.vc_info.vc_category === "ATTESTATION_SUM" || flowDetails.vc_info.vc_category === "SINGLE_ATTESTATION") &&
                            <Stack direction={'row'} justifyContent={"space-between"} alignItems={'center'} sx={{ mt: 0.5, mb: 2 }} maxWidth={"450px"}>
                                <Stack direction={"row"} alignItems={'center'} gap={0.2}>
                                    <Iconify height={20} width={20} icon="material-symbols:lock" sx={{ color: 'green', mr: '4px' }} />
                                    <Typography variant="subtitle2" textAlign="left">
                                        The association between your wallets are never shared to anyone, including Jomo.
                                    </Typography>
                                </Stack>
                                <Tooltip title="How does it work?" placement='top'>
                                    <Iconify height={20} width={20} icon="ph:question" sx={{ ml: '4px', cursor: "pointer" }} onClick={handleLearnMoreWallets} />
                                </Tooltip>
                            </Stack>
                        }
                    </>
                }

                {
                    isFlowCompleted &&
                    <>
                        <Typography maxWidth={"500px"} textAlign={"center"} sx={{ mb: 2 }}>
                            It looks like you have already completed this proof to {clientInfo["name"]}.
                        </Typography>
                        <Stack direction={"row"} gap={2}>
                            <Button variant="contained" onClick={() => { window.location = flowInfo["redirect_url"] }}>
                                Back to {clientInfo["name"]}
                            </Button>
                            <Button variant="outlined" onClick={handleClick}>
                                Prove Again
                            </Button>
                        </Stack>
                    </>
                }

                {!isFlowCompleted && flowDetails && flowDetails.vc_info.vc_category === "TLS_NOTARY" &&
                    < ProveNotarization
                        flowDetails={flowDetails}
                        validateVerificationProof={validateVerificationProof}
                        redirectBack={redirectBack}
                    />
                }
                {redirectIn !== null && flowInfo["redirect_url"] && flowInfo["redirect_url"] !== "" &&
                    <Typography width={"275px"} textAlign={"left"} sx={{ mt: 1 }}>
                        Back to <Link to={flowInfo["redirect_url"]}>{clientInfo["name"]}</Link> in {(redirectIn / 1000).toFixed(3)} seconds
                    </Typography>
                }
                {redirectIn !== null && flowInfo && !flowInfo["redirect_url"] &&
                    <Typography sx={{ mt: 1 }}>You can now close this window</Typography>
                }
            </Stack >
        </>
    )
}

export default Prove
