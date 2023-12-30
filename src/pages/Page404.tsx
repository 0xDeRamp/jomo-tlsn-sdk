import { useEffect } from 'react'
import { m } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
// @mui
import { Button, Typography, Stack } from '@mui/material';
// components
import { MotionContainer, varBounce } from '../components/animate';

// @ts-ignore
import { useUserContext } from '../context/UserContext.tsx';

export default function Page404() {
  const { setPage } = useUserContext()

  // Whenever page loads, load locally stored data
  useEffect(() => {
    setPage("404")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <MotionContainer margin={"20px"}>
        <Stack justifyContent={"center"} alignItems={"center"} width={1} gap={2}>
          <m.div variants={varBounce().in} >
            <Typography variant="h3" paragraph maxWidth={"500px"} textAlign={"center"}>
              Sorry, page not found!
            </Typography>
          </m.div>

          <m.div variants={varBounce().in}>
            <Typography sx={{ color: 'text.secondary' }} maxWidth={"500px"} textAlign={"center"}>
              Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL? Be
              sure to check your spelling.
            </Typography>
          </m.div>

          <Button component={RouterLink} to="/" size="large" variant="outlined">
            Go to Homepage
          </Button>
        </Stack>
      </MotionContainer>
    </>
  );
}
