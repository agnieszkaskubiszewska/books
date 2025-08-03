import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about-section">
      <h2>O nas</h2>
      <p>Jesteśmy zespołem programistów, którzy tworzą aplikację do zarządzania książkami.</p>
      <p>Nasza aplikacja pozwala na:</p>
      <ul>
<li>Dodawanie nowych książek do kolekcji</li>
        <li>Przeglądanie listy książek</li>
        <li>Ocenianie książek</li>
        <li>Dodawanie opisów i zdjęć</li>
        <li>Usuwanie książek z kolekcji</li>
      </ul>
    </div>
  );
};

export default About; 