import React, { useEffect, useState } from 'react';
import { Book } from '../types';
import { getOwnerName } from '../supabase';
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();
  const [ownerName, setOwnerName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);
  
  useEffect(() => {
    if (!book?.ownerId) {
      setOwnerName('');
      return;
    }
    let cancelled = false;
    getOwnerName(book.ownerId as string)
      .then(name => { if (!cancelled) setOwnerName(name); })
      .catch(() => { if (!cancelled) setOwnerName(''); });
    return () => { cancelled = true; };
  }, [book?.ownerId]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="book-view-title" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="book-view-title">{book.title}</h3>
          <button type="button" className="modal-close" aria-label={t('bookView.close')} onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {book.image && (
            <div className="book-image-container" style={{ textAlign: 'center' }}>
              <img src={book.image} alt={book.title} className="book-image" />
            </div>
          )}
          <p><strong>{t('bookView.author')}:</strong> {book.author}</p>
          <p><strong>{t('bookView.year')}:</strong> {book.year}</p> 
          <p><strong>{t('bookView.genre')}:</strong> {book.genre}</p>
          <p><strong>{t('bookView.owner')}:</strong> {ownerName}</p>
          {book.rentRegion && (
        <p><strong>{t('bookView.region')}:</strong> {book.rentRegion}</p>
          )}
          {book.rating && <p><strong>{t('bookView.rating')}:</strong> {book.rating}/5</p>}
          {book.description && <p style={{ marginTop: 8 }}>{book.description}</p>}
        </div>
        <div className="modal-footer">
          <div className="modal-actions">
            {isAdmin && (
              <button type="button" className="modal-btn delete-book-btn" onClick={() => onDelete(book.id)}>{t('bookView.delete')}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookView;
