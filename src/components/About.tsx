import React from 'react';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="section">
      <div className="container hero about-hero">
        <div style={{ paddingTop: 4 }}>
          <h1 className="h1" style={{ marginTop: 0 }}>{t('about.title')}</h1>
          <ul style={{ marginTop: 24, listStyle: 'none', paddingLeft: 0, marginLeft: 0 }}>
            <li>{t('about.bullets.add')}</li>
            <li>{t('about.bullets.browse')}</li>
            <li>{t('about.bullets.rate')}</li>
            <li>{t('about.bullets.describe')}</li>
            <li>{t('about.bullets.borrow')}</li>
          </ul>
        </div>
        <div className="hero-side" style={{ paddingTop: 0 }}>
          <p className="lead" style={{ marginTop: -8, fontSize: '2.2rem' }}>{t('about.lead')}</p>
          <div className="about-image" style={{ width: '100%' }}>
            <video
              src="/film1.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: '100%', borderRadius: 12 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 