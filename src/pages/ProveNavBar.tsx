import { cloneElement } from 'react'
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import { Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom'
import useScrollTrigger from '@mui/material/useScrollTrigger';
import logoImg from '../images/logo.png';
import Label from '../components/label/Label';

function ElevationScroll(props) {
    const { children } = props;
    // Note that you normally won't need to set the window ref as useScrollTrigger
    // will default to window.
    // This is only being set here because the demo is in an iframe.
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
        target: window,
    });

    return cloneElement(children, {
        elevation: trigger ? 4 : 0,
    });
}

// const menus = [
//     { text: 'Activities', href: '/activities' },
// ];

export default function ProveNavBar() {
    const theme = useTheme()

    return (
        <>
            <CssBaseline />
            <ElevationScroll>
                <AppBar sx={{
                    backgroundColor: alpha(theme.palette.background.default, 0.75),
                    borderBottom: "1px solid #eae6e7",
                    backdropFilter: "blur(6px)",
                    zIndex: 69,
                }}>
                    <Toolbar>
                        <Stack display="flex" direction="row" justifyContent="center" alignItems="center" sx={{
                            width: 1,
                            marginLeft: "80px",
                            marginRight: "72px",
                        }}>
                            <Stack direction="row" alignItems={"center"} gap={1}>
                                <Link to="../proofs/" style={{ textDecoration: 'none' }}>
                                    <img src={logoImg} alt={'logo'} height="32px" />
                                </Link>
                                <Label>alpha</Label>
                            </Stack>
                        </Stack>
                    </Toolbar>
                </AppBar >
            </ElevationScroll >
            <Toolbar />
        </>
    );
}