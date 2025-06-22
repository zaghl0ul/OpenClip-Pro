import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initializeTheme } from './config/themes'
import './index.css'

// Initialize theme on app start
initializeTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)