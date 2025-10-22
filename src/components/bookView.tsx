import React, { useEffect } from 'react';
import { Book } from '../types';

interface BookViewProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onRent: (id: string) => void;
  onDelete: (id: string) => void;
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

const BookView: React.FC<BookViewProps> = ({ book, isOpen, onClose, onRent, onDelete, isLoggedIn, isAdmin }) => {
  if (!isOpen || !book) return null;

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);
  
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="book-view-title" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="book-view-title">{book.title}</h3>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {book.image && (
            <div className="book-image-container" style={{ textAlign: 'center' }}>
              <img src={book.image} alt={book.title} className="book-image" />
            </div>
          )}
          <p><strong>Autor:</strong> {book.author}</p>
          <p><strong>Rok wydania:</strong> {book.year}</p>
          <p><strong>Gatunek:</strong> {book.genre}</p>
          {book.rating && <p><strong>Ocena:</strong> {book.rating}/5</p>}
          {book.description && <p style={{ marginTop: 8 }}>{book.description}</p>}
        </div>
        <div className="modal-footer">
          <div className="modal-actions">
            {isLoggedIn && book.rent && (
              <button type="button" className="modal-btn rent-a" onClick={() => onRent(book.id)}>Rent</button>
            )}
            {isAdmin && (
              <button type="button" className="modal-btn delete-book-btn" onClick={() => onDelete(book.id)}>Delete</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookView;
