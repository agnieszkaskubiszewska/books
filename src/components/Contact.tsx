import React from 'react';
import { useTranslation } from 'react-i18next';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="contact-section">
      <h2>{t('contact.title')}</h2>
      <p>{t('contact.lead')}</p>
      <p>{t('contact.email')}: <a href="mailto:bookake@gmail.com">bookake@gmail.com</a></p>
    </div>
  );
};

export default Contact; 