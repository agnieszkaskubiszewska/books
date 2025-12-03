import React, { useEffect, useState } from 'react';

const Footer: React.FC = () => {
  const [language, setLanguage] = useState('pl');

 

  const year = new Date().getFullYear();
  return (
    <footer className="footer" style={{ borderTop: '1px solid #e5e7eb', marginTop: 24 }}>
      <div className="container" style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, color: '#64748b' }}>
          © {year} Book App
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" onClick={() => setLanguage('pl')}>Polski</button>
        </div>
      </div>
    </footer>   
  );
};

export default Footer;

