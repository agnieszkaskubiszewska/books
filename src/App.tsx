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
import { Book, Section, Genre } from './types';
import { supabase } from './supabase';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);

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

  // Pobierz książki z bazy danych Supabase
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id,title,author,description,year,genre,rating,image,created_at');

        if (error) {
          console.error('Error fetching books:', error);
          showNotification(`Błąd pobierania książek: ${error.message}`, 'error');
          return;
        }

        const mapped: Book[] = (data || []).map((row: any) => ({
          id: String(row.id),
          title: row.title,
          author: row.author,
          description: row.description ?? '',
          year: typeof row.year === 'number' ? row.year : (row.created_at ? new Date(row.created_at).getFullYear() : new Date().getFullYear()),
          genre: (row.genre as Genre) ?? ('other' as Genre),
          rating: row.rating ?? undefined,
          image: row.image ?? undefined,
        }));

        setBooks(mapped);
      } catch (err: any) {
        console.error('Unexpected error fetching books:', err);
        showNotification('Wystąpił nieoczekiwany błąd podczas pobierania książek', 'error');
      }
    };

    fetchBooks();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addBook = async (book: Omit<Book, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([{ 
          title: book.title, 
          author: book.author, 
          description: book.description,
          year: book.year,
          genre: book.genre,
          rating: book.rating ?? null,
          image: book.image ?? null,
        }])
        .select()
        .single();

      if (error) {
        showNotification(`Błąd dodawania książki: ${error.message}`, 'error');
        return;
      }

      const inserted: Book = {
        id: String(data.id),
        title: data.title,
        author: data.author,
        description: data.description ?? '',
        year: data.created_at ? new Date(data.created_at).getFullYear() : new Date().getFullYear(),
        genre: 'other',
      };

      setBooks(prev => [...prev, inserted]);
      showNotification(`Książka "${inserted.title}" została dodana!`);
    } catch (err: any) {
      console.error('Add book error:', err);
      showNotification('Wystąpił błąd podczas dodawania książki', 'error');
    }
  };

  const deleteBook = async (id: string) => {
    const bookToDelete = books.find(book => book.id === id);
    if (!bookToDelete) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć książkę "${bookToDelete.title}"?`)) return;

    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) {
        showNotification(`Błąd usuwania: ${error.message}`, 'error');
        return;
      }
      setBooks(prev => prev.filter(book => book.id !== id));
      showNotification('Książka została usunięta!');
    } catch (err: any) {
      console.error('Delete book error:', err);
      showNotification('Wystąpił błąd podczas usuwania książki', 'error');
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
          <Route path="/" element={<Welcome isLoggedIn={isLoggedIn} />} />
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