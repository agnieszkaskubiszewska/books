import React from 'react';
import { Link } from 'react-router-dom';

interface WelcomeProps {
  isLoggedIn: boolean;
}

const Welcome: React.FC<WelcomeProps> = ({ isLoggedIn }) => {
  return (
    <>
      <section className="section">
        <div className="container hero">
<h1 className="h1">Jeszcze bliżej książek.<br/>Dziel się książkami z innymi.</h1>
          <div className="hero-side">
<p className="lead">Odkrywaj i zarządzaj swoimi ulubionymi książkami. Twórz społeczność czytelników.</p>
            <div className="hero-cta">
              <Link className="btn" to="/books">Przeglądaj książki</Link>
              {isLoggedIn && (
                <Link className="btn btn--ghost" to="/add-book">Dodaj książkę</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          <div className="card">
<h3>Pożycz książki lokalnie</h3>
<p>Sprawdź książki dostępne w swoim rejonie.</p>
          </div>
          <div className="card">
<h3>Dodaj książki które chcesz udostępnić innym</h3>
<p>Ksiazki ktore dodasz do platformy beda mogły cieszych innych czytelników.</p>
          </div>
          <div className="card">
<h3>Dziel się swoimi opiniami</h3>
<p>Oceń książki i zobacz co myślą inni czytelnicy.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Welcome; 