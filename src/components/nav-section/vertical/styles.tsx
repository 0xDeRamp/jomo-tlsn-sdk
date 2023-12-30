// @mui
import { styled } from '@mui/material/styles';
import { ListItemIcon, ListSubheader, ListItemButton } from '@mui/material';
//
import { NavItemProps } from '../types';

// ----------------------------------------------------------------------

type StyledItemProps = Omit<NavItemProps, 'item'> & {
  caption?: boolean;
  disabled?: boolean;
};

export const StyledItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'caption',
})<StyledItemProps>(({ active, disabled, depth, caption, theme }) => {
  const isLight = theme.palette.mode === 'light';

  const subItem = depth !== 1;

  const activeStyle = {
    color: theme.palette.primary.main,
    backgroundColor: "transparent",
    ...(!isLight && {
      color: theme.palette.primary.light,
    }),
  };

  const activeSubStyle = {
    color: theme.palette.text.secondary,
    backgroundColor: 'transparent',
  };

  return {
    position: 'relative',
    textTransform: 'capitalize',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1.5),
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    borderRadius: theme.shape.borderRadius,
    height: 42,
    // Sub item
    ...(subItem && {
      height: 36,
      ...(depth > 2 && {
        paddingLeft: theme.spacing(depth),
      }),
      ...(caption && {
        height: 48,
      }),
    }),
    // Active item
    ...(active && {
      ...activeStyle,
      '&:hover': {
        ...activeStyle,
      },
    }),
    // Active sub item
    ...(subItem &&
      active && {
      ...activeSubStyle,
      '&:hover': {
        ...activeSubStyle,
      },
    }),
    // Disabled
    ...(disabled && {
      '&.Mui-disabled': {
        opacity: 0.64,
      },
    }),
  };
});

// ----------------------------------------------------------------------

export const StyledIcon = styled(ListItemIcon)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
});

// ----------------------------------------------------------------------

type StyledDotIconProps = {
  active?: boolean;
};

export const StyledDotIcon = styled('span', {
  shouldForwardProp: (prop) => prop !== 'active',
})<StyledDotIconProps>(({ active, theme }) => ({
  width: 4,
  height: 4,
  borderRadius: '50%',
  backgroundColor: theme.palette.text.disabled,
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shorter,
  }),
  ...(active && {
    transform: 'scale(2)',
    backgroundColor: theme.palette.primary.main,
  }),
}));

// ----------------------------------------------------------------------

export const StyledSubheader = styled(ListSubheader)(({ theme }) => ({
  ...theme.typography.overline,
  fontSize: 15,
  fontWeight: 'bold',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
}));
