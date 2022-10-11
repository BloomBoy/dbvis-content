import { css } from 'emotion';
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