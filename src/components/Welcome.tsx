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
          <h1 className="h1">Read good books.<br/>We will tell you what to read next.</h1>
          <div className="hero-side">
            <p className="lead">Discover and manage your favorite books. Keep your library organized and inspiring.</p>
            <div className="hero-cta">
              <Link className="btn" to="/books">Browse books</Link>
              {isLoggedIn && (
                <Link className="btn btn--ghost" to="/add-book">Add a book</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          <div className="card">
            <h3>Simply useful</h3>
            <p>Quickly add, browse and evaluate books. Focus on reading, not tooling.</p>
          </div>
          <div className="card">
            <h3>Inherently organized</h3>
            <p>Tags, ratings and clear structure help you keep the collection tidy.</p>
          </div>
          <div className="card">
<h3>Book your book.</h3>
<p>Check your friends bookshelf and find something new to read.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Welcome; 