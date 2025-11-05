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
import Messages from './components/Messages';
import { Book, Section, Genre } from './types';
import { supabase } from './supabase';
import { fetchMessagesForUser, sendMessage as sbSendMessage, markMessageRead as sbMarkMessageRead, type DbMessage } from './supabase';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);

  const [currentSection, setCurrentSection] = useState<Section>('welcome');
  const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([]);
  const unreadCount = dbMessages.filter(m => !m.read && m.recipient_id === currentUserId).length;


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
          setIsAdmin((session.user.app_metadata as any)?.role === 'admin');
          setCurrentUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser({
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || ''
          });
          setIsLoggedIn(true);
          setIsAdmin((session.user.app_metadata as any)?.role === 'admin');
          setCurrentUserId(session.user.id);
        } else {
          setUser(null);
          setIsLoggedIn(false);
          setIsAdmin(false);
          setCurrentUserId(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id,title,author,description,year,genre,rating,image,created_at,rent,rent_mode,rent_region,owner_id');

        if (error) {
          console.error('Error fetching books:', error);
  showNotification(`Error fetching books: ${error.message}`, 'error');
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
          rent: !!row.rent,
          rentMode: row.rent_mode ?? undefined,
          rentRegion: row.rent_region ?? undefined,
          ownerId: row.owner_id ?? undefined,
        }));

        setBooks(mapped);
      } catch (err: any) {
        console.error('Unexpected error fetching books:', err);
        showNotification('Unexpected error fetching books', 'error');
      }
    };

    fetchBooks();
  }, []);

  // Fetch messages for current user after login
  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;
    (async () => {
      try {
        const data = await fetchMessagesForUser();
        setDbMessages(data);
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
    })();
  }, [isLoggedIn, currentUserId]);

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
          rent: book.rent ?? false,
          rent_mode: book.rentMode ?? null,
          rent_region: book.rentRegion ?? null,
          owner_id: (await supabase.auth.getUser()).data.user?.id ?? null,
        }])
        .select()
        .single();

      if (error) {
        showNotification(`Error adding book: ${error.message}`, 'error');
        return;
      }

      const inserted: Book = {
        id: String(data.id),
        title: data.title,
        author: data.author,
        description: data.description ?? '',
        year: data.created_at ? new Date(data.created_at).getFullYear() : new Date().getFullYear(),
        genre: (data.genre as Genre) ?? ('other' as Genre),
        rating: data.rating ?? undefined,
        image: data.image ?? undefined,
        rent: !!data.rent,
        rentMode: data.rent_mode ?? undefined,
        rentRegion: data.rent_region ?? undefined,
        ownerId: data.owner_id ?? undefined,
      };

      setBooks(prev => [...prev, inserted]);
      showNotification(`Book "${inserted.title}" was added!`);
    } catch (err: any) {
      console.error('Add book error:', err);
      showNotification('Error adding book', 'error');
    }
  };

  const deleteBook = async (id: string) => {
    const bookToDelete = books.find(book => book.id === id);
    if (!bookToDelete) return;
if (!window.confirm(`Are you sure you want to delete the book "${bookToDelete.title}"?`)) return;

    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) {
        showNotification(`Error deleting: ${error.message}`, 'error');
        return;
      }
      setBooks(prev => prev.filter(book => book.id !== id));
      showNotification('Book was deleted!');
    } catch (err: any) {
      console.error('Delete book error:', err);
      showNotification('Error deleting book', 'error');
    }
  };

  const rentBook = async (id: string) => {
    const bookToRent = books.find(book => book.id === id);
    if (!bookToRent) return;
    if (!window.confirm(`Are you sure you want to rent the book "${bookToRent.title}"?`)) return;

    try {
      const { error } = await supabase.from('books').update({ rent: true }).eq('id', id);
      if (error) {
        showNotification(`Error renting: ${error.message}`, 'error');
        return;
      }
      showNotification('Book was rented!');
    } catch (err: any) {
      console.error('Rent book error:', err);
      showNotification('Error renting book', 'error');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showNotification(`Error logging in: ${error.message}`, 'error');
        return;
      }

      if (data.user) {
        showNotification(`Welcome! You are logged in.`, 'success');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Error logging in', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
        showNotification('You are logged out.', 'success');
        navigate('/');
        return;
      }

      const { error } = await supabase.auth.signOut();

      if (error && error.message !== 'Auth session missing!') {
        showNotification(`Error logging out: ${error.message}`, 'error');
        return;
      }

      setUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUserId(null);
      showNotification('You are logged out.', 'success');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error logging out', 'error');
    }
  };

  const markMessageRead = async (id: string) => {
    try {
      await sbMarkMessageRead(id);
      setDbMessages(prev => prev.map(m => (m.id === id ? { ...m, read: true } : m)));
    } catch (e) {
      console.error(e);
    }
  };

  const sendReply = async (rootId: string, text: string) => {
    if (!text.trim() || !currentUserId) return;
    const root = dbMessages.find(m => m.id === rootId); if (!root) return;
    const recipientId = root.sender_id === currentUserId ? root.recipient_id : root.sender_id;
    const inserted = await sbSendMessage({
      senderId: currentUserId,
      recipientId,
      body: text,
      threadId: root.id    });
    setDbMessages(prev => [inserted, ...prev]);
    showNotification('Reply sent', 'success');
  };

  const startThread = async (recipientId: string, text: string) => {
    if (!text.trim() || !currentUserId) return;
    const inserted = await sbSendMessage({
      senderId: currentUserId,
      recipientId,
      body: text,
    });
    setDbMessages(prev => [inserted, ...prev]);
    showNotification('Message sent', 'success');
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
            <p>Loading...</p>
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
        unreadCount={unreadCount}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Welcome isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onBack={() => navigate('/')} />} />
          <Route path="/add-book" element={isLoggedIn ? <AddBookForm onAddBook={addBook} /> : <Navigate to="/login" />} />
          <Route path="/books" element={<BookList books={books} onDeleteBook={deleteBook} isLoggedIn={isLoggedIn} onRentBook={rentBook} isAdmin={isAdmin} />} />
          <Route path="/messages" element={isLoggedIn ? (
            <Messages
              messages={dbMessages
                .filter(m => m.thread_id === m.id)
                .map(m => ({
                  id: m.id,
                  senderName: (m as any).sender_email ? (m as any).sender_email.split('@')[0] : 'User',
                  time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  body: m.body,
                  read: m.read,
                  replies: dbMessages
                    .filter(r => r.thread_id === m.id && r.id !== m.id)
                    .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map(r => ({
                      id: r.id,
                      text: r.body,
                      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      senderName: (r as any).sender_email ? (r as any).sender_email.split('@')[0] : 'User',
                      isMine: r.sender_id === currentUserId,
                      read: r.read,
                      toMe: r.recipient_id === currentUserId
                    }))
                }))}
              onMarkRead={markMessageRead}
              onSendReply={sendReply}
              onStartThread={startThread}
            />
          ) : (<Navigate to="/login" />)} />
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