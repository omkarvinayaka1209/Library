import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './assets/css/style.css';

// Make backend URL always available to legacy pages
window.VEMU_SERVER_API_BASE = 'https://library-e5q2.onrender.com';
window.VEMU_SMS_API_BASE = 'https://library-e5q2.onrender.com';
localStorage.setItem('vemu_sms_api_base', 'https://library-e5q2.onrender.com');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
