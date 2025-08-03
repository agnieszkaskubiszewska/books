import React, { useState } from 'react';

type Section = 'main' | 'books' | 'about' | 'contact';

interface HeaderProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
}

const Header: React.FC<HeaderProps> = ({ currentSection, onSectionChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSectionClick = (section: Section) => {
    onSectionChange(section);
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="menu">
          <button 
            className={`menu-btn ${isMenuOpen ? 'active' : ''}`}
            onClick={handleMenuClick}
          >
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
          <div className={`dropdown-menu ${isMenuOpen ? 'active' : ''}`}>
            <button 
              className="dropdown-item"
              onClick={() => handleSectionClick('main')}
            >
              Dodaj nową książkę
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSectionClick('books')}
            >
              Książki
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSectionClick('about')}
            >
              O nas
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSectionClick('contact')}
            >
              Kontakt
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 