import { useState, useRef, useEffect } from 'react'
import { Stack, Button, Collapse } from '@mui/material';
import RobinhoodRoi from "./notarization/RobinhoodRoi";
import RevolutLastPayment from './notarization/RevolutLastPayment';
import Venmo from './notarization/Venmo';


function ProveNotarization({ notaryFlow }) {
    const [needsExtension, setNeedsExtension] = useState(false)
    const [triggerExtensionInstall, setTriggerExtensionInstall] = useState(false)
    const firstMount = useRef(true)
    const extensionFound = useRef(false)

    async function onNotarizationComplete(notarizationResult) {
    }

    async function checkExtension() {
        if (!extensionFound.current) {
            try {
                // @ts-ignore
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
            {notaryFlow.flow_id === "robinhood_roi" &&
                <RobinhoodRoi
                    onNotarizationComplete={onNotarizationComplete}
                    extensionFound={!needsExtension}
                />
            }
            {notaryFlow.flow_id === "revolut_last_payment" &&
                <RevolutLastPayment
                    onNotarizationComplete={onNotarizationComplete}
                    extensionFound={!needsExtension}
                />
            }
            {notaryFlow.flow_id === "venmo" &&
                <Venmo
                    onNotarizationComplete={onNotarizationComplete}
                    extensionFound={!needsExtension}
                />
            }

        </Stack >
    )
}

export default ProveNotarization
