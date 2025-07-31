import React, { useState } from 'react';
import Header from './components/Header';
import BookList from './components/BookList';
import AddBookForm from './components/AddBookForm';
import About from './components/About';
import Contact from './components/Contact';
import Notification from './components/Notification';
import { Book } from './types';

type Section = 'main' | 'books' | 'about' | 'contact';

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

  const [currentSection, setCurrentSection] = useState<Section>('main');
  const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

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

  const renderSection = () => {
    switch (currentSection) {
      case 'books':
        return <BookList books={books} onDeleteBook={deleteBook} />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      default:
        return <AddBookForm onAddBook={addBook} />;
    }
  };

  return (
    <div className="app">
      <Header 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        showNotification={showNotification}
      />
      <main className="main-content">
        {renderSection()}
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

export default App; 