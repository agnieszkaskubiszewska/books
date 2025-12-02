import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Section } from '../types';

interface HeaderProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  user: { name: string; email: string, firstName: string, lastName: string } | null;
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
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const initials = React.useMemo(() => {
    if (!user) return '';
    const f = (user.firstName || '').trim();
    const l = (user.lastName || '').trim();
    if (f || l) {
      return `${(f.charAt(0) || '')}${(l.charAt(0) || '')}`.toUpperCase();
    }
    const n = (user.name || '').trim();
    const emailLocal = (user.email || '').split('@')[0] || '';
    const base = n || emailLocal;
    const parts = base.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${(parts[0][0] || '')}${(parts[1][0] || '')}`.toUpperCase();
    }
    return (base.charAt(0) || '').toUpperCase();
  }, [user]);

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

  // Zamknij dropdowny po kliknięciu poza nimi
  useEffect(() => {
    const onOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [isMenuOpen, isUserMenuOpen]);

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
        <div className="menu" ref={menuRef}>
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
        
        <div className="user-profile" ref={userMenuRef}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="user-avatar-text">
                  {initials}
                </div>
                <span className="user-name">{user.firstName + ' ' + user.lastName || user.name}
                </span>
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
        <span className="user-name">{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.name}</span>
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