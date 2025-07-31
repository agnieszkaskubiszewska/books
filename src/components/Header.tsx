import React, { useState } from 'react';

type Section = 'main' | 'books' | 'about' | 'contact';

interface HeaderProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const Header: React.FC<HeaderProps> = ({ currentSection, onSectionChange, showNotification }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    showNotification('Menu zostało otwarte!');
  };

  const handleSectionClick = (section: Section) => {
    onSectionChange(section);
    setIsMenuOpen(false);
    
    switch (section) {
      case 'main':
        showNotification('Przejdź do formularza dodawania książki!');
        break;
      case 'books':
        showNotification('Sekcja książek została otwarta!');
        break;
      case 'about':
        showNotification('Sekcja "O nas" została otwarta!');
        break;
      case 'contact':
        showNotification('Sekcja kontakt została otwarta!');
        break;
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="menu">
          <button 
            className={`menu-btn ${isMenuOpen ? 'active' : ''}`}
            onClick={handleMenuClick}
          >
            Menu
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