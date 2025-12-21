import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface WelcomeProps {
  isLoggedIn: boolean;
}

const Welcome: React.FC<WelcomeProps> = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  return (
    <>
      <section className="section">
        <div className="container hero">
          <h1 className="h1">{t('welcome.headingMainLine1')}<br/>{t('welcome.headingMainLine2')}</h1>
          <div className="hero-side">
            <p className="lead">{t('welcome.sublead')}</p>
            <div className="hero-cta">
              <Link className="btn" to="/books">{t('welcome.cta.browse')}</Link>
              {isLoggedIn && (
                <Link className="btn btn--ghost" to="/add-book">{t('welcome.cta.add')}</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          <div className="card">
            <h3>{t('welcome.features.localBorrow.title')}</h3>
            <p>{t('welcome.features.localBorrow.body')}</p>
          </div>
          <div className="card">
            <h3>{t('welcome.features.addBooks.title')}</h3>
            <p>{t('welcome.features.addBooks.body')}</p>
          </div>
          <div className="card">
            <h3>{t('welcome.features.shareOpinions.title')}</h3>
            <p>{t('welcome.features.shareOpinions.body')}</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Welcome; 