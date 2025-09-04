import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BookList from './components/BookList';
import AddBookForm from './components/AddBookForm';
import About from './components/About';
import Contact from './components/Contact';
import Notification from './components/Notification';
import Welcome from './components/Welcome';
import LoginPage from './components/LoginPage';
import { Book, Section } from './types';

const App: React.FC = () => {
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

  const handleLogin = (email: string, password: string) => {
    const mockUser = {
      name: email.split('@')[0],
      email: email
    };
    
    setUser(mockUser);
    setIsLoggedIn(true);
    setCurrentSection('welcome');
    showNotification(`Witaj ${mockUser.name}! Zostałeś zalogowany.`);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    showNotification('Zostałeś wylogowany.');
  };

  return (
    <Router>
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
            <Route path="/login" element={<LoginPage onLogin={handleLogin} onBack={() => window.history.back()} />} />
            <Route path="/add-book" element={isLoggedIn ? <AddBookForm onAddBook={addBook} /> : <Navigate to="/login" />} />
            <Route path="/books" element={isLoggedIn ? <BookList books={books} onDeleteBook={deleteBook} /> : <Navigate to="/login" />} />
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
    </Router>
  );
};

export default App; 