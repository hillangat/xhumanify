import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import HistoryView from "./HistoryView.tsx";
import "./index.scss";
import './HistoryView.scss';
import { Amplify } from "aws-amplify";
import outputs from "./amplify_outputs.json";

import '@aws-amplify/ui-react/styles.css';
// import 'primereact/resources/themes/saga-blue/theme.css';
// import 'primereact/resources/themes/md-dark-indigo/theme.css';
import 'primereact/resources/themes/md-dark-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import { parseAmplifyConfig } from "aws-amplify/utils";

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
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/history" element={<HistoryView />} />
        </Routes>
      </BrowserRouter>
    </Authenticator>
  </React.StrictMode>
);
