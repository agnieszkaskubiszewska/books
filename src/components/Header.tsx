import React, { useState } from 'react';
import { Section } from '../types';

interface HeaderProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  user: { name: string; email: string } | null;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentSection, onSectionChange, user, isLoggedIn, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleUserMenuClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
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
              onClick={() => handleSectionClick('welcome')}
            >
              Strona główna
            </button>
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
        
        <div className="user-profile">
          <button 
            className={`user-avatar ${isUserMenuOpen ? 'active' : ''}`}
            onClick={handleUserMenuClick}
          >
            {isLoggedIn && user ? (
              <div className="user-avatar-text">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="user-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </button>
          
          <div className={`user-dropdown-menu ${isUserMenuOpen ? 'active' : ''}`}>
            {isLoggedIn && user ? (
              <>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <button className="user-menu-item" onClick={onLogout}>
                  Wyloguj się
                </button>
              </>
            ) : (
              <>
                <button className="user-menu-item" onClick={() => onSectionChange('login')}>
                  Zaloguj się
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 