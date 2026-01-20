import React, { useState, useEffect, useMemo } from 'react';
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
import Footer from './components/Footer';
import UserDetails from './components/UserDetails';
import { Book, Section, Genre } from './types';
import { supabase } from './supabase';
import { fetchMessagesForUser,getOrCreateThread as sbGetOrCreateThread, sendMessage as sbSendMessage, markMessageRead as sbMarkMessageRead, createRent as sbCreateRent, closeThread as sbCloseThread, type DbMessage } from './supabase';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);

  const [currentSection, setCurrentSection] = useState<Section>('welcome');
  const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string, firstName: string, lastName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([]);
  const [threadTitles, setThreadTitles] = useState<Record<string, string>>({});
  const [threadOwners, setThreadOwners] = useState<Record<string, string>>({});
  const [threadOwnerIds, setThreadOwnerIds] = useState<Record<string, string>>({});
  const [threadBookIds, setThreadBookIds] = useState<Record<string, string>>({});
  const [threadClosed, setThreadClosed] = useState<Record<string, boolean>>({});
  const [threadDecision, setThreadDecision] = useState<Record<string, 'agree' | 'disagree'>>({});
  const [requestedRentDates, setRequestedRentDates] = useState<Record<string, { from: string | null; to: string | null }>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [activeRentDatesByBook, setActiveRentDatesByBook] = useState<Record<string, { from: string | null; to: string | null }>>({});
  const unreadCount = dbMessages
  .filter((m): m is DbMessage => !!m)
  .filter(m => !m.read && m.recipient_id === currentUserId).length;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const meta: any = (session.user as any).user_metadata || {};
          const firstName = typeof meta.first_name === 'string' ? meta.first_name : '';
          const lastName = typeof meta.last_name === 'string' ? meta.last_name : '';
          setUser({
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            firstName,
            lastName,
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
          const meta: any = (session.user as any).user_metadata || {};
          const firstName = typeof meta.first_name === 'string' ? meta.first_name : '';
          const lastName = typeof meta.last_name === 'string' ? meta.last_name : '';
          setUser({
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            firstName,
            lastName,
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

  // Funkcja do odświeżania listy książek
  const refreshBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id,title,author,description,year,genre,rating,image,created_at,rent,rent_region,owner_id');

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
          rentRegion: row.rent_region ?? undefined,
          ownerId: row.owner_id ?? undefined,
        }));

        setBooks(mapped);
      } catch (err: any) {
        console.error('Unexpected error fetching books:', err);
        showNotification('Unexpected error fetching books', 'error');
      }
    };

  // Pobieranie listy wszystkich książek z bazy danych przy starcie aplikacji
  useEffect(() => {
    refreshBooks();
  }, []);

  // Funkcja do odświeżania wiadomości
  const refreshMessages = async () => {
    if (!isLoggedIn || !currentUserId) return;
      try {
        const data = await fetchMessagesForUser();
        setDbMessages(data);
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
  };

  // Pobieranie wiadomości dla zalogowanego użytkownika po zalogowaniu
  useEffect(() => {
    refreshMessages();
  }, [isLoggedIn, currentUserId]);

  // Resolve book titles for threads visible in dbMessages
  useEffect(() => {
    (async () => {
      try {
        const threadIds = Array.from(
          new Set(
            (dbMessages || [])
              .map(m => m.thread_id)
              .filter((id): id is string => !!id)
          )
        );
        if (threadIds.length === 0) {
          setThreadTitles({});
          return;
        }
        const { data: threads, error: thErr } = await supabase
          .from('threads')
          .select('id, book_id, owner_id, is_closed')
          .in('id', threadIds);
        if (thErr) {
          console.error('Error fetching threads:', thErr);
          return;
        }
        const bookIds = Array.from(new Set((threads || []).map((t: any) => t.book_id).filter(Boolean)));
        const ownerIds = Array.from(new Set((threads || []).map((t: any) => t.owner_id).filter(Boolean)));
        if (bookIds.length === 0) {
          setThreadTitles({});
          setThreadOwners({});
          return;
        }
        const { data: booksRows, error: bErr } = await supabase
          .from('books')
          .select('id, title')
          .in('id', bookIds);
        if (bErr) {
          console.error('Error fetching books for threads:', bErr);
          return;
        }
        let usersRows: any[] = [];
        if (ownerIds.length > 0) {
          const { data: uRows, error: uErr } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', ownerIds);
          if (uErr) {
            console.error('Error fetching owners for threads:', uErr);
          } else {
            usersRows = uRows || [];
          }
        }
        const bookIdToTitle = new Map<string, string>(
          (booksRows || []).map((b: any) => [String(b.id), String(b.title ?? '')])
        );
        const userIdToName = new Map<string, string>(
          (usersRows || []).map((u: any) => {
            const first = (u.first_name || '').trim();
            const last = (u.last_name || '').trim();
            const full = [first, last].filter(Boolean).join(' ');
            const fallback = (u.email || '').split('@')[0] || '';
            return [String(u.id), full || fallback];
          })
        );
        const mapThreadToTitle: Record<string, string> = {};
        const mapThreadToOwner: Record<string, string> = {};
        const mapThreadToOwnerId: Record<string, string> = {};
        const mapThreadToBookId: Record<string, string> = {};
        const mapThreadToClosed: Record<string, boolean> = {};
        (threads || []).forEach((t: any) => {
          const title = bookIdToTitle.get(String(t.book_id));
          if (title) mapThreadToTitle[String(t.id)] = title;
          mapThreadToBookId[String(t.id)] = String(t.book_id);
          const ownerName = userIdToName.get(String(t.owner_id));
          if (ownerName) mapThreadToOwner[String(t.id)] = ownerName;
          mapThreadToOwnerId[String(t.id)] = String(t.owner_id);
          mapThreadToClosed[String(t.id)] = !!t.is_closed;
        });
        setThreadTitles(mapThreadToTitle);
        setThreadOwners(mapThreadToOwner);
        setThreadOwnerIds(mapThreadToOwnerId);
        setThreadBookIds(mapThreadToBookId);
        setThreadClosed(mapThreadToClosed);
      } catch (err) {
        console.error('Error resolving thread titles:', err);
      }
    })();
  }, [dbMessages]);

  // Funkcja do odświeżania aktywnych rentów
  const refreshActiveRents = async () => {
    try {
      const { data, error } = await supabase
        .from('rents')
        .select('book_id, rent_from, rent_to, finished')
        .eq('finished', false);
      if (error) {
        console.error('Error fetching active rents:', error);
        return;
      }
      const byBook: Record<string, { from: string | null; to: string | null }> = {};
      (data || []).forEach((r: any) => {
        const bId = String(r.book_id);
        byBook[bId] = {
          from: r.rent_from ?? null,
          to: r.rent_to ?? null
        };
      });
      setActiveRentDatesByBook(byBook);
    } catch (err) {
      console.error('Unexpected error fetching rents:', err);
    }
  };

  // Fetch active rents (finished = false) and map by book_id -> { from, to }
  useEffect(() => {
    refreshActiveRents();
  }, [books, dbMessages]);

  // Resolve display names for participants (first + last name or email local-part)
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(
          new Set(
            (dbMessages || [])
              .flatMap(m => [m.sender_id, m.recipient_id])
              .filter((id): id is string => !!id)
          )
        );
        if (ids.length === 0) {
          setUserNames({});
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', ids);
        if (error) {
          console.error('Error fetching user names:', error);
          return;
        }
        const nameMap: Record<string, string> = {};
        (data || []).forEach((u: any) => {
          const first = (u.first_name || '').trim();
          const last = (u.last_name || '').trim();
          const full = [first, last].filter(Boolean).join(' ').trim();
          const fallback = (u.email || '').split('@')[0] || 'User';
          nameMap[String(u.id)] = full || fallback || 'User';
        });
        setUserNames(nameMap);
      } catch (err) {
        console.error('Unexpected error resolving user names:', err);
      }
    })();
  }, [dbMessages]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const requestedRentDatesMergedByBook = useMemo(() => {
    // scal: najpierw aktywne z DB, potem dorzuć lokalne propozycje powiązane z wątkami (jeśli brak w DB)
    const merged: Record<string, { from: string | null; to: string | null }> = { ...activeRentDatesByBook };
    for (const [threadId, period] of Object.entries(requestedRentDates)) {
      const bId = threadBookIds[threadId];
      if (bId && !merged[bId]) merged[bId] = { from: period.from ?? null, to: period.to ?? null };
    }
    return merged;
  }, [activeRentDatesByBook, requestedRentDates, threadBookIds]);

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
    const threadId = root.thread_id ?? root.id;
    const inserted = await sbSendMessage({ senderId: currentUserId, recipientId, body: text, threadId });
    if (inserted) setDbMessages(prev => [inserted, ...prev]);
    else setDbMessages(await fetchMessagesForUser());
    showNotification('Reply sent', 'success');
  };


  const startThread = async (recipientId: string, text: string, bookId?: string | null, rentFrom?: string | null, rentTo?: string | null) => {
    if (!text.trim() || !currentUserId) return;
    if (!bookId) { showNotification('Brak bookId dla nowej rozmowy.', 'error'); return; }
    try {
      const threadId = await sbGetOrCreateThread({ bookId, currentUserId, recipientId });
      const inserted = await sbSendMessage({
        senderId: currentUserId,
        recipientId,
        body: text,
        threadId
      });
      // zapamiętaj proponowany okres wypożyczenia dla tego wątku
      setRequestedRentDates(prev => ({ ...prev, [threadId]: { from: rentFrom ?? null, to: rentTo ?? null } }));
      // wyślij dodatkową systemową wiadomość z proponowanymi datami dla właściciela
      if ((rentFrom || rentTo)) {
        const hasExisting = dbMessages.some(m => ((m.thread_id ?? m.id) === threadId) && typeof m.body === 'string' && m.body.startsWith('!system: Requested rent period'));
        if (!hasExisting) {
          const fromStr = rentFrom ? rentFrom.split('T')[0] : null;
          const toStr = rentTo ? rentTo.split('T')[0] : null;
          const periodText = fromStr && toStr
            ? `from ${fromStr} to ${toStr}`
            : (fromStr ? `from ${fromStr}` : (toStr ? `to ${toStr}` : ''));
          if (periodText) {
            const systemBody = `!system: Requested rent period ${periodText}.`;
            const sysMsg = await sbSendMessage({
              senderId: currentUserId,
              recipientId,
              body: systemBody,
              threadId
            });
            if (sysMsg) {
              setDbMessages(prev => [sysMsg, inserted, ...prev]);
            }
          }
        }
      }
      if (inserted) setDbMessages(prev => [inserted, ...prev]);
      else setDbMessages(await fetchMessagesForUser());
      showNotification('Message sent', 'success');
    } catch (e: any) {
      console.error('startThread error:', e);
      showNotification(e?.message ?? 'Nie udało się rozpocząć rozmowy.', 'error');
      return;
    }
  };

  const agreeOnRent = async (threadId?: string | null) => {
    try {
      if (!threadId) return;
      const bookId = threadBookIds[threadId];
      if (!bookId) { showNotification('Brak powiązania z książką.', 'error'); return; }
      // wyznacz uczestników, właściciela i pożyczającego
      const ownerId = threadOwnerIds[threadId];
      if (!ownerId || ownerId !== currentUserId) {
        showNotification('Tylko właściciel książki może zaakceptować wypożyczenie.', 'error');
        return;
      }
      const threadMsgs = dbMessages.filter(m => (m.thread_id ?? m.id) === threadId);
      const participants = Array.from(new Set(threadMsgs.flatMap(m => [m.sender_id, m.recipient_id]).filter(Boolean))) as string[];
      const borrowerId = participants.find(id => id !== ownerId) || null;
      if (!borrowerId) { showNotification('Nie udało się ustalić osoby wypożyczającej.', 'error'); return; }
      const period = requestedRentDates[threadId] || { from: null, to: null };
      await sbCreateRent({
        bookId,
        bookOwner: ownerId,
        borrower: borrowerId,
        rentFrom: period.from,
        rentTo: period.to
      });
      // zapamiętaj aktywny okres także lokalnie (dla BookList po akceptacji)
      setActiveRentDatesByBook(prev => ({
        ...prev,
        [bookId]: { from: period.from ?? new Date().toISOString(), to: period.to ?? null }
      }));
      // Odśwież książki z bazy, żeby mieć aktualny stan (trigger zaktualizuje books.rent w DB)
      await refreshBooks();
      setThreadDecision(prev => ({ ...prev, [threadId]: 'agree' }));
      // Wyślij systemową wiadomość w tym samym wątku
      if (currentUserId) {
        const otherUser = participants.find(id => id !== currentUserId) || null;
        if (otherUser) {
          const systemBody = '!system: Owner agreed to rent this book.';
          const inserted = await sbSendMessage({ senderId: currentUserId, recipientId: otherUser, body: systemBody, threadId });
          if (inserted) setDbMessages(prev => [inserted, ...prev]);
        }
      }
      showNotification('You agreed on rent. Book is now not available.', 'success');
    } catch (e: any) {
      console.error('agreeOnRent error:', e);
      showNotification(e?.message ?? 'Failed to agree on rent', 'error');
    }
  };

  const disagreeOnRent = async (threadId?: string | null) => {
    try {
      if (!threadId) return;
      if (threadDecision[threadId] === 'agree') {
        showNotification('Rent already agreed. You can only close the discussion.', 'info');
        return;
      }
      if (currentUserId) {
        const threadMsgs = dbMessages.filter(m => (m.thread_id ?? m.id) === threadId);
        const participants = Array.from(new Set(threadMsgs.flatMap(m => [m.sender_id, m.recipient_id]).filter(Boolean))) as string[];
        const otherUser = participants.find(id => id !== currentUserId) || null;
        if (otherUser) {
          const systemBody = '!system: Owner refused to rent this book.';
          const inserted = await sbSendMessage({ senderId: currentUserId, recipientId: otherUser, body: systemBody, threadId });
          if (inserted) setDbMessages(prev => [inserted, ...prev]);
        }
      }
      setThreadDecision(prev => ({ ...prev, [threadId]: 'disagree' }));
      showNotification('You refused to rent. Discussion remains open.', 'success');
    } catch (e: any) {
      console.error('disagreeOnRent error:', e);
      showNotification(e?.message ?? 'Failed to refuse', 'error');
    }
  };

  const closeDiscussion = async (threadId?: string | null) => {
    try {
      if (!threadId) return;
      await sbCloseThread(threadId);
      setThreadClosed(prev => ({ ...prev, [threadId]: true }));
      if (currentUserId) {
        const threadMsgs = dbMessages.filter(m => (m.thread_id ?? m.id) === threadId);
        const participants = Array.from(new Set(threadMsgs.flatMap(m => [m.sender_id, m.recipient_id]).filter(Boolean))) as string[];
        const otherUser = participants.find(id => id !== currentUserId) || null;
        if (otherUser) {
          const systemBody = '!system: Owner closed the discussion.';
          const inserted = await sbSendMessage({ senderId: currentUserId, recipientId: otherUser, body: systemBody, threadId });
          if (inserted) setDbMessages(prev => [inserted, ...prev]);
        }
      }
      showNotification('Discussion closed.', 'success');
    } catch (e: any) {
      console.error('closeDiscussion error:', e);
      showNotification(e?.message ?? 'Failed to close discussion', 'error');
    }
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
    <Route path="/books" element={
      <BookList
        books={books}
        onDeleteBook={deleteBook}
        isLoggedIn={isLoggedIn}
        onRent={rentBook}
        isAdmin={isAdmin}
        requestedRentDates={requestedRentDatesMergedByBook}
      />
    } />
          <Route path="/user-details" element={isLoggedIn && user ? <UserDetails user={user} /> : <Navigate to="/login" />} />
          <Route path="/messages" element={isLoggedIn ? (
            <Messages
            messages={Array.from(
              (dbMessages || []).reduce((acc, m) => {
                const key = m.thread_id ?? m.id; 
                if (!acc.has(key)) acc.set(key, []);
                acc.get(key)!.push(m);
                return acc;
              }, new Map<string, DbMessage[]>())
            ).map(([key, msgs]) => {
              const sortedAsc = msgs.slice().sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              const head = sortedAsc[0];
              const threadKey = head.thread_id ?? head.id;
              const bookId = threadBookIds[threadKey];
              const decision = threadDecision[threadKey];
              const isOwner = threadOwnerIds[threadKey] === currentUserId;
              const closed = !!threadClosed[threadKey];
              const hasActiveRent = !!(bookId && activeRentDatesByBook[bookId]);
              const participants = Array.from(new Set(sortedAsc.flatMap(m => [m.sender_id, m.recipient_id]).filter(Boolean))) as string[];
              const otherUserId = participants.find(id => id !== currentUserId) || null;
              // Jeśli istnieje aktywny rent w bazie, to znaczy że owner już się zgodził - ukryj przyciski
              const disableAgree = !isOwner || decision != null || closed || hasActiveRent;
              const disableDisagree = !isOwner || decision != null || closed || hasActiveRent;
              return {
                id: head.id,
                senderName: userNames[head.sender_id] || 'User',
                time: new Date(head.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                body: head.body,
                read: head.read,
                bookTitle: threadTitles[threadKey],
                ownerName: threadOwners[threadKey],
                bookId,
                isOwner,
                threadId: threadKey,
                otherUserId: otherUserId || undefined,
                otherUserName: otherUserId ? (userNames[otherUserId] || 'User') : undefined,
                canAgree: !disableAgree,
                disableDisagree,
                closed,
                isAgreed: decision === 'agree' || hasActiveRent,
                hasActiveRent,
                replies: sortedAsc.slice(1).map(r => ({
                  id: r.id,
                  text: r.body,
                  time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  senderName: userNames[r.sender_id] || 'User',
                  isMine: r.sender_id === currentUserId,
                  read: r.read,
                  toMe: r.recipient_id === currentUserId
                })),
              };
            })}
              onMarkRead={markMessageRead}
              onSendReply={sendReply}
              onStartThread={startThread}
              onAgreeRent={(threadId?: string | null) => agreeOnRent(threadId)}
              onDisagreeRent={(threadId?: string | null) => disagreeOnRent(threadId)}
              onCloseDiscussion={(threadId?: string | null) => closeDiscussion(threadId)}
              onRefreshActiveRents={refreshActiveRents}
              onRefreshMessages={refreshMessages}
              onRefreshBooks={refreshBooks}
            />
          ) : (<Navigate to="/login" />)} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
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