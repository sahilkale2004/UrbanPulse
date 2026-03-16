import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { IssueProvider } from './context/IssueContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IssueProvider>
      <App />
    </IssueProvider>
  </StrictMode>,
)
