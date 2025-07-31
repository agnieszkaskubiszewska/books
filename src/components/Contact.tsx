import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="contact-section">
      <h2>Kontakt</h2>
      <p>Skontaktuj się z nami, jeśli masz pytania lub sugestie.</p>
      <p>Email: <a href="mailto:kontakt@ksiazki.pl">kontakt@ksiazki.pl</a></p>
      <p>Telefon: +48 123 456 789</p>
      <p>Adres: ul. Przykładowa 123, 00-000 Warszawa</p>
    </div>
  );
};

export default Contact; 