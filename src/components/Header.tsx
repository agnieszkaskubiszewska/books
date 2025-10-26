import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Section } from '../types';

interface HeaderProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  user: { name: string; email: string } | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  unreadCount?: number;
}

const Header: React.FC<HeaderProps> = ({ currentSection, onSectionChange, user, isLoggedIn, onLogout, unreadCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMessagesMenuOpen, setIsMessagesMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleUserMenuClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleMessagesMenuClick = () => {
    navigate('/messages');
    setIsMessagesMenuOpen(false);
    setIsUserMenuOpen(false);
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
          {isLoggedIn && (
            <div className="user-bell">
              <button className="user-bell-btn" onClick={handleMessagesMenuClick} aria-label="Messages">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 24a2.4 2.4 0 0 0 2.4-2.4h-4.8A2.4 2.4 0 0 0 12 24zm6-6v-5.4c0-3-1.6-5.5-4.5-6.1V5a1.5 1.5 0 0 0-3 0v1.5C7.6 7.1 6 9.6 6 12.6V18l-2.4 2.4V21h16.8v-.6L18 18z" />
                </svg>
              </button>
              {unreadCount > 0 && (
                <span className="user-bell-badge">{unreadCount}</span>
              )}
            </div>
          )}
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
        <button className="user-menu-item" onClick={handleMessagesMenuClick}>
                  Messages
                </button>
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