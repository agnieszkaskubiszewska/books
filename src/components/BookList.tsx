import React from 'react';
import { Book, Genre } from '../types';

interface BookListProps {
  books: Book[];
  onDeleteBook: (id: string) => void;
  isLoggedIn: boolean;
}

const BookList: React.FC<BookListProps> = ({ books, onDeleteBook, isLoggedIn }) => {
  const getGenreName = (genre: Genre): string => {
    const genres: Record<Genre, string> = {
      'fantasy': 'Fantasy',
      'thriller': 'Thriller',
      'romance': 'Romans',
      'sci-fi': 'Science Fiction',
      'mystery': 'Kryminał',
      'biography': 'Biografia',
      'history': 'Historyczna',
      'other': 'Inne'
    };
    return genres[genre] || genre;
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  if (books.length === 0) {
    return (
      <div className="book-list">
        <h2>Książki</h2>
        <p>Nie ma jeszcze żadnych książek. Dodaj pierwszą książkę!</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      <h2>Books</h2>
<p>Available books.</p>
      <div className="books-grid">
        {books.map(book => (
          <div key={book.id} className="book-item">
            {book.image && (
              <div className="book-image-container">
                <img src={book.image} alt={book.title} className="book-image" />
              </div>
            )}
            <h3>{book.title}</h3>
            <p><strong>Autor:</strong> {book.author}</p>
            <p><strong>Rok wydania:</strong> {book.year}</p>
            <p><strong>Gatunek:</strong> {getGenreName(book.genre)}</p>
            {book.rating && (
              <p><strong>Ocena:</strong> {renderStars(book.rating)} ({book.rating}/5)</p>
            )}
            {book.description && (
              <p><strong>Opis:</strong> {book.description}</p>
            )}
            {isLoggedIn && (
              <button 
                className="delete-book-btn"
                onClick={() => onDeleteBook(book.id)}
              >
                Usuń
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookList; 