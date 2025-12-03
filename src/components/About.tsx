import React from 'react';

const About: React.FC = () => {
  return (
    <section className="section">
      <div className="container hero about-hero">
        <div style={{ paddingTop: 4 }}>
          <h1 className="h1" style={{ marginTop: 0 }}>O Book'ake</h1>
          <ul style={{ marginTop: 24, listStyle: 'none', paddingLeft: 0, marginLeft: 0 }}>
<li>Dodawaj nowe książki do swojej kolekcji</li>
            <li>Przeglądaj swoją listę książek</li>
            <li>Oceń książki</li>
            <li>Dodaj opisy i zdjęcia</li>
        <li>Wypożyczaj książki od znajomych</li>
          </ul>
        </div>
        <div className="hero-side" style={{ paddingTop: 0 }}>
<p className="lead" style={{ marginTop: -8, fontSize: '2.2rem' }}>W trosce o czytelnictwo towrzymy miejsce gdzie znajdziesz swoja następną ulubioną książkę.</p>
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