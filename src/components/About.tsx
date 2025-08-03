import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about-section">
      <h2>About Us</h2>
      <p>We are a team of developers creating a book management application.</p>
      <p>Our application allows you to:</p>
      <ul>
        <li>Add new books to your collection</li>
        <li>Browse your book list</li>
        <li>Rate books</li>
        <li>Add descriptions and photos</li>
        <li>Remove books from your collection</li>
      </ul>
    </div>
  );
};

export default About; 