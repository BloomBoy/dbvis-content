import React from 'react';
import { render } from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { init, KnownSDK } from '@contentful/app-sdk';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';
import { CustomSDKProvider } from './hooks/useCustomSdk';

const root = document.getElementById('root');

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  render(<LocalhostWarning />, root);
} else {
  render(
    <CustomSDKProvider>
      <GlobalStyles />
      <App />
    </CustomSDKProvider>,
    root,
  );
}
