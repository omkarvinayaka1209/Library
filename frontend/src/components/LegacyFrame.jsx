import { useEffect } from 'react';

function LegacyFrame({ title, src }) {
  useEffect(() => {
    window.VEMU_SERVER_API_BASE = 'https://library-e5q2.onrender.com';
    window.VEMU_SMS_API_BASE = 'https://library-e5q2.onrender.com';
    localStorage.setItem('vemu_sms_api_base', 'https://library-e5q2.onrender.com');
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
