import { useState, useRef, useEffect } from 'react'
import { styled, alpha } from '@mui/material/styles';
import { Stack, Typography, Button, Collapse } from '@mui/material';
import Paper from '@mui/material/Paper';
import Iconify from '../../components/iconify';
import RobinhoodRoi from "./notarization/RobinhoodRoi";

const Item = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    padding: theme.spacing(2.5),
    backgroundColor: alpha(theme.palette.grey[100], 1),
    borderRadius: 10,
    maxWidth: 450,
    width: "100%",
}));

function ProveNotarization({ flowDetails, validateVerificationProof, redirectBack }) {
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
                <Item>
                    <Stack direction={"row"} gap={2} alignItems={"center"}>
                        {needsExtension &&
                            <Stack minHeight={36} minWidth={36} borderRadius={5} border={"1px solid"} alignItems={"center"} justifyContent={"center"}>
                                <Iconify height={20} width={20} icon="ri:number-0" />
                            </Stack>
                        }
                        {!needsExtension &&
                            <Stack minHeight={36} minWidth={36} borderRadius={5} alignItems={"center"} justifyContent={"center"}>
                                <Iconify height={36} width={36} icon="material-symbols:check" />
                            </Stack>
                        }
                        {needsExtension &&
                            <Typography variant="body1" textAlign="left">
                                Install Jomo Copilot browser extension
                            </Typography>
                        }
                        {!needsExtension &&
                            <Typography variant="body1" textAlign="left">
                                Extension Installed
                            </Typography>
                        }
                    </Stack>
                    <Collapse in={needsExtension}>
                        <Stack alignItems={"center"} paddingLeft={2} mt={2}>
                            <Stack alignItems={"center"} sx={{ width: 1, maxWidth: "450px" }} spacing={2}>
                                <Button variant="contained" onClick={() => {
                                    window.open("https://chrome.google.com/webstore/detail/jomo-copilot/nmdnfckjjghlbjeodefnapacfnocpdgm", '_blank');
                                }}>Go to Chrome Web Store</Button>
                            </Stack>
                        </Stack>
                    </Collapse>
                </Item>
            }
            <Item>
                {flowDetails.flow_info.notarization_flow === "robinhood_roi" &&
                    <RobinhoodRoi
                        onNotarizationComplete={onNotarizationComplete}
                        extensionFound={!needsExtension}
                    />
                }
            </Item>

        </Stack >
    )
}

export default ProveNotarization
