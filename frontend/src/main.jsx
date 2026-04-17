import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './assets/css/style.css';

// Make backend URL always available to legacy pages
window.VEMU_SERVER_API_BASE = 'http://localhost:4000';
window.VEMU_SMS_API_BASE = 'http://localhost:4000';
localStorage.setItem('vemu_sms_api_base', 'http://localhost:4000');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);