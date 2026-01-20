import React, { useMemo, useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { supabase} from '../supabase';
import { Book, Genre } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BookView from './bookView';
import { useTranslation } from 'react-i18next';
function scrollElementToViewportCenter(el: HTMLElement, options: ScrollToOptions = { behavior: 'smooth' }) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const elementCenterInDoc = window.scrollY + rect.top + rect.height / 2;
  const targetScrollTop = Math.max(elementCenterInDoc - vh / 2, 0);
  window.scrollTo({ top: targetScrollTop, ...options });
}

interface BookListProps {
  books: Book[];
  onDeleteBook: (id: string) => void;
  isLoggedIn: boolean;
  onRent: (id: string) => void;
  isAdmin?: boolean;
  requestedRentDates?: Record<string, { from: string | null; to: string | null }>;
}


const BookList: React.FC<BookListProps> = ({ books, onDeleteBook, isLoggedIn, onRent, isAdmin, requestedRentDates }) => {
  const { t } = useTranslation();
  const getGenreName = (genre: Genre): string => {
    // tłumaczenie nazw gatunków przez i18n
    const key = `genres.${genre}`;
    const translated = t(key);
    return translated === key ? genre : translated;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookInfo, setBookInfo] = useState<{ title: string; author: string; } | null>(null);

  useEffect(() => {
    const id = searchParams.get('book');
    if (!id) { setBookInfo(null); return; }
    (async () => {
      const { data, error } = await supabase
        .from('books')
        .select('title,author,image')
        .eq('id', id)
        .single();
      setBookInfo(!error && data ? { title: data.title, author: data.author } : null);
    })();
  }, [searchParams]);

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  const initialRent = (() => {
    const r = searchParams.get('rent');
    return r === 'rentable' || r === 'not_rentable' ? (r as 'rentable' | 'not_rentable') : 'all';
  })();
  
  const initialSort = (() => {
    const s = searchParams.get('sort');
    return (['best','worst','most','least'] as const).includes(s as any) ? (s as 'best' | 'worst' | 'most' | 'least') : 'none';
  })();

const [rentFilter, setRentFilter] = useState<'all' | 'rentable' | 'not_rentable'>(initialRent);
  const [ratingSort, setRatingSort] = useState<'none' | 'best' | 'worst' | 'most' | 'least'>(initialSort);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const modalAnchorRef = useRef<HTMLDivElement | null>(null);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const [rentCountMap, setRentCountMap] = useState<Record<string, number>>({});

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
    if (ratingSort === 'most') {
      return [...list].sort((a, b) => (rentCountMap[b.id] ?? 0) - (rentCountMap[a.id] ?? 0));
    }
    if (ratingSort === 'least') {
      return [...list].sort((a, b) => (rentCountMap[a.id] ?? 0) - (rentCountMap[b.id] ?? 0));
    }
    return list;
  }, [filteredBooks, ratingSort, rentCountMap]);

  useEffect(() => {
    // no-op: przewijamy przed otwarciem modalu w handlerze kliknięcia
  }, [selectedBook]);
    
  useEffect(() => {
    (async () => {
      try {
        const ownerIds = Array.from(
          new Set(
            (books || [])
              .map(b => b.ownerId)
              .filter((id): id is string => !!id)
          )
        );
        if (ownerIds.length === 0) {
          setOwnerNames({});
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', ownerIds);
        if (error) {
          console.error('Error fetching owners:', error);
          setOwnerNames({});
          return;
        }
        const map: Record<string, string> = {};
        (data || []).forEach((u: any) => {
          const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
          map[String(u.id)] = full;
        });
        setOwnerNames(map);
      } catch (e) {
        console.error('Unexpected error fetching owners:', e);
        setOwnerNames({});
      }
    })();
  }, [books]);

  // Wczytaj statystyki wypożyczeń dla dostępnych książek i zbuduj mapę id -> rent_count
  useEffect(() => {
    (async () => {
      try {
        const bookIds = (books || []).map(b => b.id);
        if (bookIds.length === 0) { setRentCountMap({}); return; }
        const { data, error } = await supabase
          .from('books_with_rent_stats')
          .select('id, rent_count')
          .in('id', bookIds);
        if (error) { console.error('Error fetching rent stats:', error); setRentCountMap({}); return; }
        const map: Record<string, number> = {};
        (data || []).forEach((row: any) => { map[String(row.id)] = Number(row.rent_count ?? 0); });
        setRentCountMap(map);
      } catch (e) {
        console.error('Unexpected error fetching rent stats:', e);
        setRentCountMap({});
      }
    })();
  }, [books]);


  if (books.length === 0) {
    return (
      <div className="book-list">
    <h2>{t('books.title')}</h2>
        <p>{t('books.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      <h2>{t('books.title')}</h2>
      <div ref={modalAnchorRef} />
      <div className="filters-toolbar">
        <div className="filters-actions">
        {isLoggedIn && (
          <button
            type="button"
            className={`icon-btn ${isFilterOpen ? 'active' : ''}`}
            aria-label={t('books.filterAria')}
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen(v => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 5h16l-6.5 7v5l-3 2v-7L4 5z" fill="currentColor"/>
            </svg>
          </button>
          )}
          <button
            type="button"
            className={`icon-btn ${isSortOpen ? 'active' : ''}`}
            aria-label={t('books.sortAria')}
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
            {t('books.reset')}
          </button>
        </div>

        {isFilterOpen && (
          <div className="filters-panel">
            <div className="filter-group compact">
              <span className="filter-label">{t('books.filters')}:</span>
              <div className="toggle-group" role="tablist" aria-label="Filter availability">
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${rentFilter === 'all' ? 'active' : ''}`}
                  aria-pressed={rentFilter === 'all'}
                  onClick={() => setRentFilter('all')}
                >
                  {t('books.all')}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${rentFilter === 'rentable' ? 'active' : ''}`}
                  aria-pressed={rentFilter === 'rentable'}
                  onClick={() => setRentFilter('rentable')}
                >
                  {t('books.rentable')}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${rentFilter === 'not_rentable' ? 'active' : ''}`}
                  aria-pressed={rentFilter === 'not_rentable'}
                  onClick={() => setRentFilter('not_rentable')}
                >
                  {t('books.not_rentable')}
                </button>
              </div>
            </div>
          </div>
        )}

        {isSortOpen && (
          <div className="filters-panel">
            <div className="filter-group compact">
      <span className="filter-label">{t('books.sort')}:</span>
            <div className="toggle-group" role="tablist" aria-label="Sort by rating">
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'none' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'none'}
                  onClick={() => setRatingSort('none')}
                >
                  {t('books.default')}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'best' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'best'}
                  onClick={() => setRatingSort('best')}
                >
                  {t('books.best')}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'worst' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'worst'}
                  onClick={() => setRatingSort('worst')}
                >
                  {t('books.worst')}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'most' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'most'}
                  onClick={() => setRatingSort('most')}
                >
                  {t('books.most')}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${ratingSort === 'least' ? 'active' : ''}`}
                  aria-pressed={ratingSort === 'least'}
                  onClick={() => setRatingSort('least')}
                >
                  {t('books.least')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="books-mosaic">
        {visibleBooks.length === 0 ? (
          <p>{t('books.noResults')}</p>
        ) : (
          visibleBooks.map(book => (
            <div key={book.id} className="book-item" onClick={() => {
              setSelectedBook(null);
              if (modalAnchorRef.current) {
                scrollElementToViewportCenter(modalAnchorRef.current);
              }
              setTimeout(() => setSelectedBook(book), 120);
            }}>
              {book.image && (
                <div className="book-image-container">
                  <img src={book.image} alt={book.title} className="book-image" />
                </div>
              )}
              <h3>{book.title}</h3>
              <p><strong>{t('books.labels.author')}:</strong> {book.author}</p>
              <p><strong>{t('books.labels.year')}:</strong> {book.year}</p>
              <p><strong>{t('books.labels.genre')}:</strong> {getGenreName(book.genre)}</p>
              <p><strong>{t('books.owner')}:</strong> {book.ownerId ? ownerNames[book.ownerId] : ''}</p>
              {book.rentRegion && (
                <p><strong>{t('books.labels.rentRegion')}:</strong> {book.rentRegion}</p>
              )}
              {!book.rent && (
                <p style={{ color: '#b91c1c', fontWeight: 700 }}>
                  {t('books.currentlyRented')}
                </p>
              )}
              {!book.rent && requestedRentDates && (
                <p style={{ color: '#334155', fontWeight: 600 }}>
                  {t('books.proposedPeriod')}: {requestedRentDates[book.id]?.from ? dayjs(requestedRentDates[book.id]?.from!).format('DD.MM.YYYY') : ''} - {requestedRentDates[book.id]?.to ? dayjs(requestedRentDates[book.id]?.to!).format('DD.MM.YYYY') : ''}
                </p>
              )}

              {book.rating && (
                <p><strong>{t('books.labels.rating')}:</strong> {renderStars(book.rating)} ({book.rating}/5)</p>
              )}
              {book.description && (
                <p><strong>{t('books.labels.description')}:</strong> {book.description}</p>
              )}
              {isLoggedIn && (
                <>
                  {book.rent && (
                    <button
                      className="rent-a book"
                      onClick={(e) => {
                        e.stopPropagation();
                    if (book.ownerId) {
                      navigate(`/messages?to=${book.ownerId}&book=${book.id}`);
                        } else {
                          navigate('/messages');
                        }
                      }}
                    >
                      {t('books.rent')}
                    </button>
                  )}
                  {isAdmin && (
                    <button className="delete-book-btn" onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}>
                      {t('books.delete')}
                    </button>
                  )}
                </>
              )}
  {isLoggedIn && (!book.rent && (
    <button
      className="rent-a book"
      onClick={(e) => {
        e.stopPropagation();
        if (book.ownerId) {
          navigate(`/messages?to=${book.ownerId}&book=${book.id}`);
        } else {
          navigate('/messages');
        }
      }}
    >
      {t('books.queue')}
    </button>
  ))}
            </div>
          ))
        )}
      </div>
      {selectedBook && ( <BookView
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onRent={onRent}
        onDelete={onDeleteBook}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
      />)}
      </div>
  );
};

export default BookList; 