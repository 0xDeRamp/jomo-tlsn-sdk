import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type ColorSchema = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

declare module '@mui/material/styles/createPalette' {
  interface TypeBackground {
    neutral: string;
  }
  interface SimplePaletteColorOptions {
    lighter: string;
    darker: string;
  }
  interface PaletteColor {
    lighter: string;
    darker: string;
  }
}

// SETUP COLORS

const GREY = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24',
};

const PRIMARY = {
  light: '#7774F5',
  lighter: "#D2D1FD",
  main: '#201CE0',
  dark: '#100EA1',
  darker: '#06056B',
  contrastText: '#FFFFFF',
};

const SECONDARY = {
  lighter: '#F9FAFB',
  light: '#DFE3E8',
  main: '#919EAB',
  dark: '#454F5B',
  darker: '#161C24',
  contrastText: '#FFFFFF',
};

const INFO = {
  lighter: '#CBFBFD',
  light: '#64DDF8',
  main: '#02A1EA',
  dark: '#015DA8',
  darker: '#002F70',
  contrastText: '#FFFFFF',
};

const SUCCESS = {
  lighter: '#F0FDD3',
  light: '#C2F57C',
  main: '#7EE028',
  dark: '#47A114',
  darker: '#216B07',
  contrastText: '#FFFFFF',
};

const WARNING = {
  lighter: '#FFF4CC',
  light: '#FFD466',
  main: '#FFA500',
  dark: '#B76900',
  darker: '#7A3D00',
  contrastText: GREY[800],
};

const ERROR = {
  lighter: '#FEE4D1',
  light: '#FA9875',
  main: '#EF311C',
  dark: '#AC0E17',
  darker: '#72051D',
  contrastText: '#FFFFFF',
};

const COMMON = {
  common: { black: '#000000', white: '#FFFFFF' },
  primary: PRIMARY,
  secondary: SECONDARY,
  info: INFO,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  grey: GREY,
  divider: alpha(GREY[500], 0.24),
  action: {
    hover: alpha(GREY[500], 0.08),
    selected: alpha(GREY[500], 0.16),
    disabled: alpha(GREY[500], 0.8),
    disabledBackground: alpha(GREY[500], 0.24),
    focus: alpha(GREY[500], 0.24),
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
};

export default function palette(themeMode: 'light' | 'dark') {
  const light = {
    ...COMMON,
    mode: 'light',
    text: {
      primary: GREY[800],
      secondary: GREY[600],
      stockup: SUCCESS.dark,
      stockdown: ERROR.main,
      disabled: GREY[500],
    },
    background: { paper: '#FFFFFF', default: '#FFFFFF', neutral: GREY[200] },
    // background: { default: 'rgb(251, 249, 249)', paper: 'rgb(255, 253, 253)', neutral: GREY[200] },
    action: {
      ...COMMON.action,
      active: GREY[600],
    },
  } as const;

  const dark = {
    ...COMMON,
    mode: 'dark',
    text: {
      primary: '#FFFFFF',
      secondary: GREY[500],
      stockup: SUCCESS.main,
      stockdown: ERROR.main,
      disabled: GREY[600],
    },
    background: {
      paper: GREY[800],
      default: GREY[900],
      neutral: alpha(GREY[500], 0.16),
    },
    action: {
      ...COMMON.action,
      active: GREY[500],
    },
  } as const;

  return themeMode === 'light' ? light : dark;
}
