import { useEffect, useRef, useState } from 'react'
import { Stack, Divider, CircularProgress } from '@mui/material';
// @ts-ignore
import { useUserContext } from '../context/UserContext.tsx';
import * as apis from '../utils/apirequests.js'
import ProveNotarization from './prove/ProveNotarization';

function Prove() {
    const { setPage } = useUserContext()
    const [notaryFlow, setNotaryFlow] = useState(null)
    const firstMount = useRef(true)
    const initialized = useRef(false)
    const notaryConfig = useRef(null)
    const [loading, setLoading] = useState(true);

    const initializeFlow = async () => {
        setLoading(true);
        const rawQueryParameters = new URLSearchParams(window.location.search)
        const queryParameters = new URLSearchParams();
        rawQueryParameters.forEach((value, name, _) => {
            queryParameters.append(name.toLowerCase(), value.toLowerCase());
        })

        notaryConfig.current = queryParameters.get("notary_config")
        // const notaryFlowResponse = await apis.backendRequest('notary/flows', { "notary_config": notaryConfig.current })
        const notaryFlowResponse = {
            target_name: "Revolut",
            flow_id: "revolut_last_payment",
        }
        setNotaryFlow(notaryFlowResponse)

        return notaryFlowResponse?.target_name
    }

    // Whenever page loads, load locally stored data
    useEffect(() => {
        setPage("Prove")

        if (!initialized.current) {
            if (firstMount.current) {
                firstMount.current = false
                initializeFlow().then((target_name) => {
                    if (target_name) {
                        initialized.current = true
                        setLoading(false);
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
                {!loading &&

                    < ProveNotarization
                        notaryFlow={notaryFlow}
                    />
                }
            </Stack>
        </>
    )
}

export default Prove
