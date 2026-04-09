import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Book, Genre } from '../types';
import { Facehash } from 'facehash';
import { AVATAR_PALETTES } from '../avatarPalettes';

interface UserPanelProps {
  currentUserId: string | null;
  isLoggedIn: boolean;
  onSendDirectMessage: (recipientId: string, text: string) => Promise<void>;
}

const UserPanel: React.FC<UserPanelProps> = ({ currentUserId, isLoggedIn, onSendDirectMessage }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    owner_rating: number | null;
    borrower_rating: number | null;
    avatar_palette: number | null;
  } | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (async () => {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, bio, owner_rating, borrower_rating, avatar_palette')
        .eq('id', userId)
        .single();
      if (userError || !userData) {
        setLoading(false);
        return;
      }
      setProfileUser(userData);

      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author, description, year, genre, rating, image, rent, rent_region, owner_id')
        .eq('owner_id', userId);
      if (booksData) {
        setUserBooks(booksData.map((row: any) => ({
          id: String(row.id),
          title: row.title,
          author: row.author,
          description: row.description ?? '',
          year: row.year ?? new Date().getFullYear(),
          genre: (row.genre as Genre) ?? 'other',
          rating: row.rating ?? undefined,
          image: row.image ?? undefined,
          rent: !!row.rent,
          rentRegion: row.rent_region ?? undefined,
          ownerId: row.owner_id ?? undefined,
        })));
      }
      setLoading(false);
    })();
  }, [userId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userId) return;
    setSending(true);
    try {
      await onSendDirectMessage(userId, messageText.trim());
      navigate('/messages');
    } catch {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container"><p>Ładowanie...</p></div>
      </section>
    );
  }

  if (!profileUser) {
    return (
      <section className="section">
        <div className="container"><p>Nie znaleziono użytkownika.</p></div>
      </section>
    );
  }

  const fullName = [profileUser.first_name, profileUser.last_name].filter(Boolean).join(' ') || 'Użytkownik';
  const isOwnProfile = currentUserId === userId;

  const ratingOverall = (() => {
    const vals = [profileUser.owner_rating, profileUser.borrower_rating].filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  })();

  return (
    <section className="section">
      <div className="container messages-hero">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, width: '100%' }}>
          <div className="card user-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <Facehash
                name={fullName}
                size={72}
                colors={AVATAR_PALETTES[profileUser.avatar_palette ?? 0] ?? AVATAR_PALETTES[0]}
                showInitial={false}
                intensity3d="subtle"
                interactive={false}
                enableBlink
                style={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
              />
              <h1 style={{ margin: 0 }}>{fullName}</h1>
            </div>
            {profileUser.bio && (
              <p style={{ marginTop: 8, color: '#475569' }}>{profileUser.bio}</p>
            )}
            {ratingOverall !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div className="rating-table" style={{ justifyContent: 'flex-start' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className={`book-emoji ${i <= Math.round(ratingOverall!) ? 'active' : ''}`} aria-hidden="true" style={{ fontSize: 22 }}>⭐</span>
                  ))}
                </div>
                <span style={{ fontWeight: 500 }}>{ratingOverall.toFixed(2)}</span>
              </div>
            )}
            {isLoggedIn && !isOwnProfile && (
              <div style={{ marginTop: 16 }}>
                {!showMessageForm ? (
                  <button className="btn" onClick={() => setShowMessageForm(true)}>
                    Wyślij wiadomość
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Napisz wiadomość do ${fullName}...`}
                      rows={3}
                      style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn--ghost"
                        onClick={() => { setShowMessageForm(false); setMessageText(''); }}
                      >
                        Anuluj
                      </button>
                      <button
                        className="btn"
                        disabled={!messageText.trim() || sending}
                        onClick={handleSendMessage}
                      >
                        {sending ? 'Wysyłanie...' : 'Wyślij'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Książki oferowane przez {fullName} ({userBooks.length})</h2>
            {userBooks.length === 0 ? (
              <p style={{ marginTop: 8 }}>Ten użytkownik nie oferuje jeszcze żadnych książek.</p>
            ) : (
              <div className="books-mosaic" style={{ marginTop: 16 }}>
                {userBooks.map(book => (
                  <div key={book.id} className="book-item">
                    {book.image && (
                      <div className="book-image-container">
                        <img src={book.image} alt={book.title} className="book-image" />
                      </div>
                    )}
                    <h3>{book.title}</h3>
                    <p><strong>Autor:</strong> {book.author}</p>
                    <p><strong>Rok:</strong> {book.year}</p>
                    {book.rating && (
                      <p><strong>Ocena:</strong> {'⭐'.repeat(book.rating)} ({book.rating}/5)</p>
                    )}
                    {!book.rent && (
                      <p style={{ color: '#b91c1c', fontWeight: 700 }}>Aktualnie wypożyczona</p>
                    )}
                    {book.rentRegion && (
                      <p><strong>Region:</strong> {book.rentRegion}</p>
                    )}
                    {book.description && (
                      <p><strong>Opis:</strong> {book.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserPanel;
