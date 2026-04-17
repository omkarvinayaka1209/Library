import { useEffect } from 'react';

function LegacyFrame({ title, src }) {
  useEffect(() => {
    window.VEMU_SERVER_API_BASE = 'http://localhost:4000';
    window.VEMU_SMS_API_BASE = 'http://localhost:4000';
    localStorage.setItem('vemu_sms_api_base', 'http://localhost:4000');
  }, []);

  return (
    <iframe
      title={title}
      src={src}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
    />
  );
}

export default LegacyFrame;