import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SimulationProvider } from './context/SimulationContext';
import { CitizenRescueProvider } from './context/CitizenRescueContext';
import { HospitalBedProvider } from './context/HospitalBedContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SimulationProvider>
        <CitizenRescueProvider>
          <HospitalBedProvider>
            <App />
          </HospitalBedProvider>
        </CitizenRescueProvider>
      </SimulationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
