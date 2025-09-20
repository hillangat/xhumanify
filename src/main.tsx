import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import App from "./App.tsx";
import "./index.scss";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import '@aws-amplify/ui-react/styles.css';
// import 'primereact/resources/themes/saga-blue/theme.css';
// import 'primereact/resources/themes/md-dark-indigo/theme.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import { parseAmplifyConfig } from "aws-amplify/utils";
import { BrowserRouter } from "react-router-dom";

const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure(
  {
    ...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      REST: outputs.custom.API,
    },
  },
  {
    API: {
      REST: {
        retryStrategy: {
          strategy: 'no-retry'
        },
      }
    }
  }
);


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Authenticator>
  </React.StrictMode>
);
