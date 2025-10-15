import React, { useMemo, useState, useEffect } from 'react';
import { Book, Genre } from '../types';
import { useSearchParams } from 'react-router-dom';

interface BookListProps {
  books: Book[];
  onDeleteBook: (id: string) => void;
  isLoggedIn: boolean;
  onRentBook: (id: string) => void;
  isAdmin?: boolean;
}

const BookList: React.FC<BookListProps> = ({ books, onDeleteBook, isLoggedIn, onRentBook, isAdmin }) => {
  const getGenreName = (genre: Genre): string => {
    const genres: Record<Genre, string> = {
      'fantasy': 'Fantasy',
      'thriller': 'Thriller',
      'romance': 'Romans',
      'sci-fi': 'Science Fiction',
      'mystery': 'Mystery',
      'biography': 'Biography',
      'history': 'History',
      'other': 'Inne'
    };
    return genres[genre] || genre;
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  const [searchParams, setSearchParams] = useSearchParams();

  const initialRent = (() => {
    const r = searchParams.get('rent');
    return r === 'rentable' || r === 'not_rentable' ? (r as 'rentable' | 'not_rentable') : 'all';
  })();
  
  const initialSort = (() => {
    const s = searchParams.get('sort');
    return s === 'best' || s === 'worst' ? (s as 'best' | 'worst') : 'none';
  })();

const [rentFilter, setRentFilter] = useState<'all' | 'rentable' | 'not_rentable'>(initialRent);
  const [ratingSort, setRatingSort] = useState<'none' | 'best' | 'worst'>(initialSort);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (rentFilter === 'rentable') return book.rent;
      if (rentFilter === 'not_rentable') return !book.rent;
      return true;
    });
  }, [books, rentFilter]);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
  
    if (rentFilter === 'all') next.delete('rent');
    else next.set('rent', rentFilter);
  
    if (ratingSort === 'none') next.delete('sort');
    else next.set('sort', ratingSort);
  
    setSearchParams(next, { replace: true });
  }, [rentFilter, ratingSort]);

  const visibleBooks = useMemo(() => {
    const list = filteredBooks;
    if (ratingSort === 'best') {
      return [...list].sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));
    }
    if (ratingSort === 'worst') {
      return [...list].sort((a, b) => (a.rating ?? Infinity) - (b.rating ?? Infinity));
    }
    return list;
  }, [filteredBooks, ratingSort]);
    

  if (books.length === 0) {
    return (
      <div className="book-list">
        <h2>Books</h2>
        <p>There are no books yet. Add the first book!</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      <h2>Books</h2>
      <div className="filters-toolbar">
        <div className="filters-actions">
          <button
            type="button"
            className={`icon-btn ${isFilterOpen ? 'active' : ''}`}
            aria-label="Filter books"
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen(v => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 5h16l-6.5 7v5l-3 2v-7L4 5z" fill="currentColor"/>
            </svg>
          </button>

          <button
            type="button"
            className={`icon-btn ${isSortOpen ? 'active' : ''}`}
            aria-label="Sort books"
            aria-expanded={isSortOpen}
            onClick={() => setIsSortOpen(v => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6 7h12v2H6V7zm3 5h9v2H9v-2zm4 5h5v2h-5v-2z" fill="currentColor"/>
            </svg>
          </button>

          <button
            type="button"
            className="btn btn--ghost filters-reset"
            onClick={() => { setRentFilter('all'); setRatingSort('none'); setIsFilterOpen(false); setIsSortOpen(false); }}
          >
            Reset filters
          </button>
        </div>

        {isFilterOpen && (
          <div className="filters-panel">
            <div className="filter-group compact">
              <span className="filter-label">Filter:</span>
              <div className="toggle-group" role="tablist" aria-label="Filter availability">
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${rentFilter === 'all' ? 'active' : ''}`}
                  aria-pressed={rentFilter === 'all'}
                  onClick={() => setRentFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${rentFilter === 'rentable' ? 'active' : ''}`}
                  aria-pressed={rentFilter === 'rentable'}
                  onClick={() => setRentFilter('rentable')}
                >
                  Available
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${rentFilter === 'not_rentable' ? 'active' : ''}`}
                  aria-pressed={rentFilter === 'not_rentable'}
                  onClick={() => setRentFilter('not_rentable')}
                >
                  Not available
                </button>
              </div>
            </div>
          </div>
        )}

        {isSortOpen && (
          <div className="filters-panel">
            <div className="filter-group compact">
      <span className="filter-label">Rated:</span>
            <div className="toggle-group" role="tablist" aria-label="Sort by rating">
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'none' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'none'}
                  onClick={() => setRatingSort('none')}
                >
                  None
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'best' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'best'}
                  onClick={() => setRatingSort('best')}
                >
                  Best
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'worst' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'worst'}
                  onClick={() => setRatingSort('worst')}
                >
                  Worst
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="books-grid">
        {visibleBooks.length === 0 ? (
          <p>No books found for the selected filters.</p>
        ) : (
          visibleBooks.map(book => (
            <div key={book.id} className="book-item">
              {book.image && (
                <div className="book-image-container">
                  <img src={book.image} alt={book.title} className="book-image" />
                </div>
              )}
              <h3>{book.title}</h3>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Year of publication:</strong> {book.year}</p>
              <p><strong>Genre:</strong> {getGenreName(book.genre)}</p>
              {book.rating && (
                <p><strong>Rating:</strong> {renderStars(book.rating)} ({book.rating}/5)</p>
              )}
              {book.description && (
                <p><strong>Description:</strong> {book.description}</p>
              )}
              {isLoggedIn && (
                <>
                  {book.rent && (
                    <button className="rent-a book" onClick={() => onRentBook(book.id)}>
                      Rent book
                    </button>
                  )}
                  {isAdmin && (
                    <button className="delete-book-btn" onClick={() => onDeleteBook(book.id)}>
                    Delete book
                    </button>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookList; 