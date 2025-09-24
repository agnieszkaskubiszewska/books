import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleUserMenuClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSectionClick = (section: Section) => {
    onSectionChange(section);
    setIsMenuOpen(false);
    
    switch (section) {
      case 'welcome':
        navigate('/');
        break;
      case 'main':
        navigate('/add-book');
        break;
      case 'books':
        navigate('/books');
        break;
      case 'about':
        navigate('/about');
        break;
      case 'contact':
        navigate('/contact');
        break;
      case 'login':
        navigate('/login');
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
              Home
            </button>
            {isLoggedIn && (
              <button 
                className="dropdown-item"
                onClick={() => handleSectionClick('main')}
              >
                Add a book
              </button>
            )}
            <button 
              className="dropdown-item"
              onClick={() => handleSectionClick('books')}
            >
              Books
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSectionClick('about')}
            >
              About
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleSectionClick('contact')}
            >
              Contact
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
                <button className="user-menu-item" onClick={() => {
                  onLogout();
                  setIsUserMenuOpen(false);
                }}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <button className="user-menu-item" onClick={() => {
                  navigate('/login');
                  setIsUserMenuOpen(false);
                }}>
                  Log in
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