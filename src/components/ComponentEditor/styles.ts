import { css, cx } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const action = css({
  textDecoration: 'none',
  fontWeight: 'bold',
});

export const container = css({
  display: 'flex',
  border: `1px dashed ${tokens.gray500}`,
  borderRadius: tokens.borderRadiusMedium,
  justifyContent: 'center',
  padding: tokens.spacingXl,
});

export const accordionButton = css({
  marginLeft: 'auto',
  pointerEvents: 'auto',
});

export const mockAccordionHeader = css({
  backgroundColor: 'transparent !important',
  position: 'absolute',
  pointerEvents: 'none',
  top: 0,
  right: 0,
  left: 0,
  bottom: 0,
  zIndex: 1,
});

export const mockChevron = css({
  visibility: 'hidden',
});

export const accordionItemWithButton = css({
  position: 'relative',
});

export const accordionItemStyles = css({
  padding: '0',
  margin: '0',
  borderBottom: `1px solid ${tokens.gray300}`,
  '&:first-child': {
    borderTop: `1px solid ${tokens.gray300}`,
  },
});

export const accordionHeaderStyle = css({
  display: 'flex',
  flexDirection: 'row-reverse',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: '0',
  margin: 0, // remove the default button margin in Safari.
  padding: tokens.spacingM,
  backgroundColor: 'transparent',
  fontFamily: tokens.fontStackPrimary,
  fontSize: tokens.fontSizeL,
  fontWeight: tokens.fontWeightDemiBold,
  lineHeight: tokens.lineHeightL,
  color: tokens.gray800,
  width: '100%',
  minWidth: '9px',
  cursor: 'pointer',
  transition: `background-color ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault},
    box-shadow ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
  '&:hover': {
    backgroundColor: tokens.gray100,
  },
  '&:focus': {
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.glowPrimary,
    outline: 'none',
  },
  '&:focus:not(:focus-visible)': {
    backgroundColor: 'transparent',
    borderRadius: 'unset',
    boxShadow: 'unset',
  },
  '&:focus-visible': {
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.glowPrimary,
  },
});
