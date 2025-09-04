import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import BookList from './components/BookList';
import AddBookForm from './components/AddBookForm';
import About from './components/About';
import Contact from './components/Contact';
import Notification from './components/Notification';
import Welcome from './components/Welcome';
import LoginPage from './components/LoginPage';
import { Book, Section } from './types';
import { supabase } from './supabase';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([
    {
      id: '1',
      title: 'Przykładowa książka 1',
      author: 'Jan Kowalski',
      year: 2023,
      genre: 'fantasy',
      rating: 4,
      description: 'Przykładowy opis książki'
    },
    {
      id: '2',
      title: 'Przykładowa książka 2',
      author: 'Anna Nowak',
      year: 2022,
      genre: 'thriller',
      rating: 5,
      description: 'Kolejny przykładowy opis'
    }
  ]);

  const [currentSection, setCurrentSection] = useState<Section>('welcome');
  const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sprawdź stan autentykacji przy starcie aplikacji
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || ''
          });
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Nasłuchuj zmian stanu autentykacji
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || ''
          });
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addBook = (book: Omit<Book, 'id'>) => {
    const newBook: Book = {
      ...book,
      id: Date.now().toString()
    };
    setBooks(prev => [...prev, newBook]);
    showNotification(`Książka "${book.title}" została dodana!`);
  };

  const deleteBook = (id: string) => {
    const bookToDelete = books.find(book => book.id === id);
    if (bookToDelete && window.confirm(`Czy na pewno chcesz usunąć książkę "${bookToDelete.title}"?`)) {
      setBooks(prev => prev.filter(book => book.id !== id));
      showNotification('Książka została usunięta!');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showNotification(`Błąd logowania: ${error.message}`, 'error');
        return;
      }

      if (data.user) {
        showNotification(`Witaj! Zostałeś zalogowany.`, 'success');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Wystąpił błąd podczas logowania', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        showNotification(`Błąd wylogowania: ${error.message}`, 'error');
        return;
      }

      showNotification('Zostałeś wylogowany.', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Wystąpił błąd podczas wylogowania', 'error');
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        user={user}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onBack={() => navigate('/')} />} />
          <Route path="/add-book" element={isLoggedIn ? <AddBookForm onAddBook={addBook} /> : <Navigate to="/login" />} />
          <Route path="/books" element={<BookList books={books} onDeleteBook={deleteBook} isLoggedIn={isLoggedIn} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App; 