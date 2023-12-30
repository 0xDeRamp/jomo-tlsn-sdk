import { useEffect, useState } from 'react';
// @mui
import { alpha } from '@mui/material/styles';
import {
  Step,
  Paper,
  Button,
  Stepper,
  StepLabel,
  StepContent,
} from '@mui/material';

export default function VerticalLinearStepper({ steps, parentActiveStep, renderStepLabel, renderStepContent, showReset, renderResetContent, sx }) {
  const [activeStep, setActiveStep] = useState(0);

  const handleReset = () => {
    setActiveStep(0);
  };

  useEffect(() => {
    if (parentActiveStep !== null) {
      setActiveStep(parentActiveStep)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentActiveStep])

  return (
    <>
      <Stepper activeStep={activeStep} orientation="vertical" sx={sx}>
        {steps.map((step, _) => (
          <Step key={step}>
            <StepLabel >
              {renderStepLabel(step)}
            </StepLabel>
            <StepContent>
              {renderStepContent(step, setActiveStep)}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {showReset && activeStep === steps.length && (
        <Paper
          sx={{
            p: 3,
            mt: 3,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
          }}
        >
          {renderResetContent()}
          <Button onClick={handleReset}>Reset</Button>
        </Paper>
      )}
    </>
  );
}
