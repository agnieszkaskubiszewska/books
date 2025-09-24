import React from 'react';

const About: React.FC = () => {
  return (
    <section className="section">
      <div className="container hero about-hero">
        <div style={{ paddingTop: 4 }}>
          <h1 className="h1" style={{ marginTop: 0 }}>About Book'ake</h1>
          <ul style={{ marginTop: 24, listStyle: 'none', paddingLeft: 0, marginLeft: 0 }}>
            <li>Add new books to your collection</li>
            <li>Browse your book list</li>
            <li>Rate books</li>
            <li>Add descriptions and photos</li>
            <li>Remove books from your collection</li>
          </ul>
        </div>
        <div className="hero-side" style={{ paddingTop: 0 }}>
          <p className="lead" style={{ marginTop: -8, fontSize: '2.2rem' }}>We are a team of developers creating a modern, inspiring place for book lovers.</p>
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