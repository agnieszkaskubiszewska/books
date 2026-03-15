import React from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import Calendar from './Calendar';
import { useTranslation } from 'react-i18next';
import { supabase, getOrCreateThread as sbGetOrCreateThread, sendMessage as sbSendMessage, createRent as sbCreateRent } from '../supabase';
import SingleBookReq from './SingleBookReq';
import FinishedRent from './FinishedRent';
const DayPilotSchedulerLazy = (React.lazy(async () => {
  try {
    const mod: any = await import('@daypilot/daypilot-lite-react');
    const Cmp = mod.DayPilotScheduler ?? mod?.default?.DayPilotScheduler;
    // Return a component; props will be typed as any via outer cast
    return { default: (Cmp ?? (() => null)) as React.ComponentType<any> };
  } catch {
    return { default: (() => null) as React.ComponentType<any> };
  }
}) as unknown) as React.ComponentType<any>;

type RequestItem = {
  id: string;
  threadId: string;
  bookId: string;
  bookTitle: string;
  requesterId: string;
  requesterName: string;
  periodFrom?: string | null;
  periodTo?: string | null;
  createdAt: string;
};

function parseRequestedPeriod(body: string): { from?: string | null; to?: string | null } {
  // formats possible:
  // "!system: Requested rent period from YYYY-MM-DD to YYYY-MM-DD."
  // "!system: Requested rent period from YYYY-MM-DD."
  // "!system: Requested rent period to YYYY-MM-DD."
  const text = body || '';
  const reFromTo = /Requested rent period(?:\s+from\s+(\d{4}-\d{2}-\d{2}))?(?:\s+to\s+(\d{4}-\d{2}-\d{2}))?/i;
  const m = text.match(reFromTo);
  return {
    from: m?.[1] ?? null,
    to: m?.[2] ?? null,
  };
}

interface RequestsProps {
  onRefreshBooks?: () => Promise<void>;
}

const Requests: React.FC<RequestsProps> = ({ onRefreshBooks }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = React.useState<'toMe' | 'mine' | 'archived'>('toMe');
  const [rentFrom, setRentFrom] = React.useState<Dayjs | null>(null);
  const [rentTo, setRentTo] = React.useState<Dayjs | null>(null);
  const [rentFromMin, setRentFromMin] = React.useState<Dayjs | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [requests, setRequests] = React.useState<Record<string, { title: string; items: RequestItem[] }>>({});
  const [activeRentByBook, setActiveRentByBook] = React.useState<Record<string, boolean>>({});
  const [acceptedByBook, setAcceptedByBook] = React.useState<Record<string, { threadId: string; requesterId: string; requesterName: string }>>({});
  const [disabledThreads, setDisabledThreads] = React.useState<Record<string, boolean>>({});
  const [archivedThreads, setArchivedThreads] = React.useState<Record<string, boolean>>({});

  // Borrower flow: compute min date based on active rent
  React.useEffect(() => {
    const bookId = searchParams.get('book');
    if (!bookId) {
      setRentFromMin(null);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('rents')
          .select('rent_to')
          .eq('book_id', bookId)
          .eq('finished', false)
          .order('rent_from', { ascending: false })
          .limit(1)
          .maybeSingle();
        const base = !error && data?.rent_to ? dayjs(data.rent_to).add(3, 'day') : dayjs();
        setRentFromMin(base);
        if (!rentFrom || rentFrom.isBefore(base, 'day')) setRentFrom(base);
        if (rentTo && rentTo.isBefore(base, 'day')) setRentTo(base);
      } catch {
        const base = dayjs();
        setRentFromMin(base);
        if (!rentFrom || rentFrom.isBefore(base, 'day')) setRentFrom(base);
        if (rentTo && rentTo.isBefore(base, 'day')) setRentTo(base);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Owner calendar state
  const [calResources, setCalResources] = React.useState<Array<{ name: string; id: string }>>([]);
  const [calEvents, setCalEvents] = React.useState<Array<{ id: string; start: string; end: string; resource: string; text: string }>>([]);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const [highlightBookId, setHighlightBookId] = React.useState<string | null>(null);
  // Borrower: my requests
  const [myRequests, setMyRequests] = React.useState<RequestItem[]>([]);
  const [myArchivedThreads, setMyArchivedThreads] = React.useState<Record<string, boolean>>({});

  // Borrower view: fetch my own requests (messages I sent with requested period)
  React.useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const currentUserId = auth.user?.id;
        if (!currentUserId) { setMyRequests([]); return; }
        const { data: msgs, error: msgErr } = await supabase
          .from('messages')
          .select('id, sender_id, recipient_id, body, thread_id, created_at')
          .ilike('body', '!system: Requested rent period%')
          .eq('sender_id', currentUserId)
          .order('created_at', { ascending: false });
        if (msgErr) { setMyRequests([]); return; }
        const list = msgs || [];
        if (list.length === 0) { setMyRequests([]); return; }
        const threadIds = Array.from(new Set(list.map(m => m.thread_id).filter(Boolean))) as string[];
        const { data: threads, error: thErr } = await supabase
          .from('threads')
          .select('id, book_id, owner_id')
          .in('id', threadIds);
        if (thErr) { setMyRequests([]); return; }
        const bookIds = Array.from(new Set((threads || []).map((t: any) => String(t.book_id)).filter(Boolean)));
        const ownerIds = Array.from(new Set((threads || []).map((t: any) => String(t.owner_id)).filter(Boolean)));
        const [{ data: booksRows }, { data: ownersRows }] = await Promise.all([
          (bookIds.length ? supabase.from('books').select('id, title').in('id', bookIds) : Promise.resolve({ data: [] as any })),
          (ownerIds.length ? supabase.from('users').select('id, first_name, last_name, email').in('id', ownerIds) : Promise.resolve({ data: [] as any })),
        ]) as any;
        const threadToBook = new Map<string, string>((threads || []).map((t: any) => [String(t.id), String(t.book_id)]));
        const bookIdToTitle = new Map<string, string>((booksRows || []).map((b: any) => [String(b.id), String(b.title ?? '')]));
        const ownerIdToName = new Map<string, string>((ownersRows || []).map((u: any) => {
          const first = (u.first_name || '').trim();
          const last = (u.last_name || '').trim();
          const full = [first, last].filter(Boolean).join(' ');
          const fallback = (u.email || '').split('@')[0] || '';
          return [String(u.id), full || fallback];
        }));
        const mine: RequestItem[] = list.map((m: any) => {
          const threadId = String(m.thread_id);
          const bookId = threadToBook.get(threadId);
          const title = (bookId && bookIdToTitle.get(bookId)) || '';
          const pr = parseRequestedPeriod(String(m.body || ''));
          return {
            id: String(m.id),
            threadId,
            bookId: bookId || '',
            bookTitle: title,
            requesterId: String(m.sender_id),
            requesterName: ownerIdToName.get(String(m.recipient_id)) || 'Owner',
            periodFrom: pr.from ?? null,
            periodTo: pr.to ?? null,
            createdAt: String(m.created_at),
          };
        }).filter(it => !!it.bookId);
        setMyRequests(mine);
        // wykryj archiwalne wątki (odrzucone lub zakończone) po stronie borrower
        const tIds = Array.from(new Set(mine.map(m => m.threadId)));
        if (tIds.length > 0) {
          const { data: sysMsgs } = await supabase
            .from('messages')
            .select('thread_id, body')
            .in('thread_id', tIds);
          const map: Record<string, boolean> = {};
          (sysMsgs || []).forEach((m: any) => {
            const body = String(m.body || '');
            if (
              body.startsWith('Owner nie wyraził zgody') || // PL odmowa
              body.startsWith('!system: Owner refused') ||  // EN fallback
              body.startsWith('!system: Owner confirmed')   // EN zakończenie/zwrot fallback
            ) {
              map[String(m.thread_id)] = true;
            }
          });
          setMyArchivedThreads(map);
        } else {
          setMyArchivedThreads({});
        }
      } catch {
        setMyRequests([]);
        setMyArchivedThreads({});
      }
    })();
  }, [searchParams]);

  async function handleAgree(it: RequestItem) {
    try {
      setSubmitting(true);
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (!currentUserId) { setError('Not authenticated'); return; }
      // prevent agree if active rent exists
      const { data: activeRows } = await supabase
        .from('rents')
        .select('id')
        .eq('book_id', it.bookId)
        .eq('finished', false)
        .limit(1);
      if ((activeRows || []).length > 0) {
        setActiveRentByBook(prev => ({ ...prev, [it.bookId]: true }));
        setError('Book already rented.');
        return;
      }
      // verify ownership
      const { data: bookRow, error: bErr } = await supabase
        .from('books')
        .select('owner_id')
        .eq('id', it.bookId)
        .single();
      if (bErr) throw bErr;
      if ((bookRow as any)?.owner_id !== currentUserId) {
        setError('Only owner can agree.');
        return;
      }
      // create rent
      await sbCreateRent({
        bookId: it.bookId,
        bookOwner: currentUserId,
        borrower: it.requesterId,
        rentFrom: it.periodFrom ?? null,
        rentTo: it.periodTo ?? null
      });
      setActiveRentByBook(prev => ({ ...prev, [it.bookId]: true }));
      setAcceptedByBook(prev => ({ ...prev, [it.bookId]: { threadId: it.threadId, requesterId: it.requesterId, requesterName: it.requesterName } }));
      // notify borrower (user-facing message)
      const systemBody = 'Owner zgodził się na wypożyczenie książki w wybranym przez Ciebie terminie';
      await sbSendMessage({
        senderId: currentUserId,
        recipientId: it.requesterId,
        body: systemBody,
        threadId: it.threadId
      });
      // odśwież listę książek (BookList) w aplikacji
      if (onRefreshBooks) {
        await onRefreshBooks();
      }
      await refreshOwnerCalendar(); // reflect in calendar
      // keep request in list; for accepted borrower show finish controls
    } catch (e: any) {
      setError(e?.message ?? 'Failed to agree');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisagree(it: RequestItem) {
    try {
      setSubmitting(true);
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (!currentUserId) { setError('Not authenticated'); return; }
      const systemBody = 'Owner nie wyraził zgody na wypożyczenie książki w wybranym przez Ciebie terminie';
      await sbSendMessage({
        senderId: currentUserId,
        recipientId: it.requesterId,
        body: systemBody,
        threadId: it.threadId
      });
      // oznacz wątek jako zarchiwizowany (przeniesie się do zakładki "Zarchiwizowane")
      setArchivedThreads(prev => {
        const next = { ...prev, [it.threadId]: true };
        try {
          const ids = Object.entries(next).filter(([, v]) => !!v).map(([k]) => k);
          localStorage.setItem('req_archived_threads', JSON.stringify(ids));
        } catch {}
        return next;
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refuse');
    } finally {
      setSubmitting(false);
    }
  }

  // Po zakończeniu wypożyczenia odśwież stan przycisków dla danej książki
  async function refreshAfterFinish(bookId: string, threadId: string) {
    try {
      const { data } = await supabase
        .from('rents')
        .select('id')
        .eq('book_id', bookId)
        .eq('finished', false)
        .limit(1);
      const stillActive = (data || []).length > 0;
      setActiveRentByBook(prev => ({ ...prev, [bookId]: stillActive }));
      // usuń oznaczenie zaakceptowanego borrowera – przyciski wrócą
      setAcceptedByBook(prev => {
        const next = { ...prev };
        delete next[bookId];
        return next;
      });
      // zablokuj przyciski dla właśnie zakończonego wątku (żeby nie mylić ownera)
      setDisabledThreads(prev => {
        const next = { ...prev, [threadId]: true };
        try {
          const ids = Object.entries(next).filter(([, v]) => !!v).map(([k]) => k);
          localStorage.setItem('req_disabled_threads', JSON.stringify(ids));
        } catch {}
        return next;
      });
      // oznacz jako zarchiwizowany
      setArchivedThreads(prev => {
        const next = { ...prev, [threadId]: true };
        try {
          const ids = Object.entries(next).filter(([, v]) => !!v).map(([k]) => k);
          localStorage.setItem('req_archived_threads', JSON.stringify(ids));
        } catch {}
        return next;
      });
    } catch {
      // w razie błędu po prostu spróbuj odblokować – UI i tak odświeży się przy kolejnym wejściu
      setActiveRentByBook(prev => ({ ...prev, [bookId]: false }));
      setAcceptedByBook(prev => {
        const next = { ...prev };
        delete next[bookId];
        return next;
      });
      setDisabledThreads(prev => {
        const next = { ...prev, [threadId]: true };
        try {
          const ids = Object.entries(next).filter(([, v]) => !!v).map(([k]) => k);
          localStorage.setItem('req_disabled_threads', JSON.stringify(ids));
        } catch {}
        return next;
      });
      setArchivedThreads(prev => {
        const next = { ...prev, [threadId]: true };
        try {
          const ids = Object.entries(next).filter(([, v]) => !!v).map(([k]) => k);
          localStorage.setItem('req_archived_threads', JSON.stringify(ids));
        } catch {}
        return next;
      });
    }
  }

  // Owner view: fetch requests directed to me
  React.useEffect(() => {
    (async () => {
      try {
        const composing = !!searchParams.get('to') && !!searchParams.get('book');
        if (composing) {
          setRequests({});
          setActiveRentByBook({});
          setAcceptedByBook({});
          setDisabledThreads({});
          setArchivedThreads({});
          return;
        }
        const { data: auth } = await supabase.auth.getUser();
        const currentUserId = auth.user?.id;
        if (!currentUserId) { setRequests({}); return; }
        // 1) Find system messages with requested period sent TO me
        const { data: msgs, error: msgErr } = await supabase
          .from('messages')
          .select('id, sender_id, recipient_id, body, thread_id, created_at')
          .ilike('body', '!system: Requested rent period%')
          .eq('recipient_id', currentUserId)
          .order('created_at', { ascending: false });
        if (msgErr) { setRequests({}); return; }
        const list = msgs || [];
        if (list.length === 0) { setRequests({}); return; }
        const threadIds = Array.from(new Set(list.map(m => m.thread_id).filter(Boolean))) as string[];
        // 2) Resolve threads -> book_id
        const { data: threads, error: thErr } = await supabase
          .from('threads')
          .select('id, book_id, owner_id, other_user_id, is_closed')
          .in('id', threadIds);
        if (thErr) { setRequests({}); return; }
        const threadToBook = new Map<string, string>((threads || []).map((t: any) => [String(t.id), String(t.book_id)]));
        const bookIds = Array.from(new Set((threads || []).map((t: any) => String(t.book_id)).filter(Boolean)));
        // 3) Resolve books -> title
        const { data: booksRows, error: bErr } = await supabase
          .from('books')
          .select('id, title')
          .in('id', bookIds);
        if (bErr) { setRequests({}); return; }
        const bookIdToTitle = new Map<string, string>((booksRows || []).map((b: any) => [String(b.id), String(b.title ?? '')]));
        // 4) Resolve requester names
        const senderIds = Array.from(new Set(list.map(m => m.sender_id).filter(Boolean))) as string[];
        let usersRows: any[] = [];
        if (senderIds.length > 0) {
          const { data: uRows, error: uErr } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', senderIds);
          if (!uErr) usersRows = uRows || [];
        }
        const userIdToName = new Map<string, string>(usersRows.map((u: any) => {
          const first = (u.first_name || '').trim();
          const last = (u.last_name || '').trim();
          const full = [first, last].filter(Boolean).join(' ');
          const fallback = (u.email || '').split('@')[0] || '';
          return [String(u.id), full || fallback];
        }));
        // 5) Build grouped map book_id -> { title, items[] }
        const grouped: Record<string, { title: string; items: RequestItem[] }> = {};
        for (const m of list) {
          const threadId = String(m.thread_id);
          const bookId = threadToBook.get(threadId);
          if (!bookId) continue;
          const title = bookIdToTitle.get(bookId) || '';
          const period = parseRequestedPeriod(String(m.body || ''));
          const requesterId = String(m.sender_id);
          const requesterName = userIdToName.get(requesterId) || 'User';
          const item: RequestItem = {
            id: String(m.id),
            threadId,
            bookId,
            bookTitle: title,
            requesterId,
            requesterName,
            periodFrom: period.from ?? null,
            periodTo: period.to ?? null,
            createdAt: String(m.created_at),
          };
          if (!grouped[bookId]) grouped[bookId] = { title, items: [] };
          grouped[bookId].items.push(item);
        }
        setRequests(grouped);
        // also mark books that already have active rent to disable agrees and resolve accepted borrower for display
        if (bookIds.length > 0) {
          const { data: act } = await supabase
            .from('rents')
            .select('book_id, borrower, finished')
            .in('book_id', bookIds)
            .eq('finished', false);
          const map: Record<string, boolean> = {};
          const accepted: Record<string, { threadId: string; requesterId: string; requesterName: string }> = {};
          (act || []).forEach((r: any) => { map[String(r.book_id)] = true; });
          // match borrower to request item for threadId
          for (const r of (act || [])) {
            const bId = String(r.book_id);
            const borrowerId = String(r.borrower);
            const group = grouped[bId];
            if (group) {
              const match = group.items.find(it => it.requesterId === borrowerId);
              if (match) {
                accepted[bId] = { threadId: match.threadId, requesterId: match.requesterId, requesterName: match.requesterName };
              }
            }
          }
          setActiveRentByBook(map);
          setAcceptedByBook(accepted);
          // restore disabled threads (persisted locally) but only for currently visible threadIds
          try {
            const raw = localStorage.getItem('req_disabled_threads');
            const saved = raw ? (JSON.parse(raw) as string[]) : [];
            const visible = new Set<string>(
              Object.values(grouped).flatMap(g => g.items.map(it => it.threadId))
            );
            const restored: Record<string, boolean> = {};
            (saved || []).forEach((tid: string) => { if (visible.has(tid)) restored[tid] = true; });
            setDisabledThreads(restored);
          } catch {
            setDisabledThreads({});
          }
          // restore archived threads similarly (only for visible)
          try {
            const rawA = localStorage.getItem('req_archived_threads');
            const savedA = rawA ? (JSON.parse(rawA) as string[]) : [];
            const visible = new Set<string>(
              Object.values(grouped).flatMap(g => g.items.map(it => it.threadId))
            );
            const restoredA: Record<string, boolean> = {};
            (savedA || []).forEach((tid: string) => { if (visible.has(tid)) restoredA[tid] = true; });
            setArchivedThreads(restoredA);
          } catch {
            setArchivedThreads({});
          }
        } else {
          setActiveRentByBook({});
          setAcceptedByBook({});
          setDisabledThreads({});
          setArchivedThreads({});
        }
      } catch {
        setRequests({});
      }
    })();
  }, [searchParams]);

  // Build/refresh owner calendar (active rents per owned book)
  const refreshOwnerCalendar = React.useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (!currentUserId) { setCalResources([]); setCalEvents([]); return; }
      const { data: rentsRows } = await supabase
        .from('rents')
        .select('book_id, borrower, rent_from, rent_to, finished')
        .eq('book_owner', currentUserId)
        .eq('finished', false);
      const rents = rentsRows || [];
      const bookIds = Array.from(new Set(rents.map((r: any) => String(r.book_id))));
      const borrowerIds = Array.from(new Set(rents.map((r: any) => String(r.borrower))));
      const [{ data: booksRows }, { data: usersRows }] = await Promise.all([
        (bookIds.length ? supabase.from('books').select('id, title').in('id', bookIds) : Promise.resolve({ data: [] as any })),
        (borrowerIds.length ? supabase.from('users').select('id, first_name, last_name, email').in('id', borrowerIds) : Promise.resolve({ data: [] as any })),
      ]) as any;
      const bookIdToTitle = new Map<string, string>((booksRows || []).map((b: any) => [String(b.id), String(b.title ?? '')]));
      const userIdToName = new Map<string, string>((usersRows || []).map((u: any) => {
        const first = (u.first_name || '').trim();
        const last = (u.last_name || '').trim();
        const full = [first, last].filter(Boolean).join(' ');
        const fallback = (u.email || '').split('@')[0] || '';
        return [String(u.id), full || fallback];
      }));
      const resources = bookIds.map(id => ({ id, name: bookIdToTitle.get(id) || id }));
      const now = new Date();
      const events = rents.map((r: any, idx: number) => {
        const start = r.rent_from || new Date().toISOString();
        const end = r.rent_to || new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        const borrower = userIdToName.get(String(r.borrower)) || 'User';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const isActive = startDate <= now && now < endDate;
        const cssClass = isActive ? 'dp-event--active' : 'dp-event--upcoming';
        return { id: `${String(r.book_id)}_${idx}`, start, end, resource: String(r.book_id), text: borrower, cssClass } as any;
      });
      setCalResources(resources);
      setCalEvents(events);
    } catch {
      setCalResources([]);
      setCalEvents([]);
    }
  }, []);

  React.useEffect(() => {
    const composing = !!searchParams.get('to') && !!searchParams.get('book');
    if (!composing) {
      refreshOwnerCalendar();
    }
  }, [requests, searchParams]);

  // Responsive: switch to list on mobile
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  const handleSubmitRequest = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const to = searchParams.get('to');
      const bookId = searchParams.get('book');
      if (!to || !bookId) { setError('Missing params'); return; }
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (!currentUserId) { setError('Not authenticated'); return; }
      const threadId = await sbGetOrCreateThread({ bookId, currentUserId, recipientId: to });
      const fromStr = rentFrom ? rentFrom.format('YYYY-MM-DD') : null;
      const toStr = rentTo ? rentTo.format('YYYY-MM-DD') : null;
      const periodText = fromStr && toStr
        ? `from ${fromStr} to ${toStr}`
        : (fromStr ? `from ${fromStr}` : (toStr ? `to ${toStr}` : ''));
      if (!periodText) { setError('Please select period'); return; }
      const systemBody = `!system: Requested rent period ${periodText}.`;
      await sbSendMessage({
        senderId: currentUserId,
        recipientId: to,
        body: systemBody,
        threadId
      });
      // reset and remove params
      setRentFrom(rentFromMin ?? null);
      setRentTo(null);
      const next = new URLSearchParams(searchParams);
      next.delete('to'); next.delete('book');
      setSearchParams(next, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const bookParam = searchParams.get('book');
  const hasCompose = !!searchParams.get('to') && !!bookParam;

  return (
    <section className="section">
      <div className="container hero messages-hero">
        <h1 className="h1">{t('requests.title') || 'Requests'}</h1>
      </div>
      <div className="container">
        <div className="requests-page">
          {/* View toggle (only when not composing) */}
          {!hasCompose && (
            <div className="filter-group compact" style={{ alignSelf: 'flex-end' }}>
              <div className="toggle-group" role="tablist" aria-label="Requests view">
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${viewMode === 'toMe' ? 'active' : ''}`}
                  aria-pressed={viewMode === 'toMe'}
                  onClick={() => setViewMode('toMe')}
                >
                  {t('requests.toMe') || 'Requests to me'}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${viewMode === 'mine' ? 'active' : ''}`}
                  aria-pressed={viewMode === 'mine'}
                  onClick={() => setViewMode('mine')}
                >
                  {t('requests.mine') || 'My requests'}
                </button>
                <button
                  type="button"
                  className={`toggle-pill toggle-pill--sm ${viewMode === 'archived' ? 'active' : ''}`}
                  aria-pressed={viewMode === 'archived'}
                  onClick={() => setViewMode('archived')}
                >
                  {t('requests.archivedTab') || 'Archived'}
                </button>
              </div>
            </div>
          )}
          {/* Owner calendar (only in owner view) */}
          {!hasCompose && viewMode === 'toMe' && (
          <div className="card" style={{ marginBottom: 16 }}>
            {!isMobile ? (
              <React.Suspense fallback={<div style={{ padding: 8, color: '#64748b' }}>{t('requests.loadingCalendar') || 'Loading calendar…'}</div>}>
                <DayPilotSchedulerLazy
                  startDate={new Date().toISOString().slice(0, 10)}
                  days={31}
                  scale="Day"
                  timeHeaders={[{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }]}
                  resources={calResources}
                  events={calEvents}
                  rowHeaderWidth={260}
                  rowHeaderWidthAutoFit={true}
                  locale={(typeof (t as any).i18n?.language === 'string' && (t as any).i18n.language.startsWith('pl')) ? 'pl-pl' : 'en-us'}
                  onEventClick={(args: any) => {
                    const bookId = String(args?.e?.data?.resource || '');
                    if (bookId) {
                      setViewMode('toMe');
                      setHighlightBookId(bookId);
                      window.setTimeout(() => setHighlightBookId(null), 2000);
                    }
                  }}
                />
              </React.Suspense>
            ) : (
              <div className="calendar-list">
                {calEvents.length === 0 ? (
                  <p style={{ color: '#64748b' }}>{t('requests.noRequests') || 'No requests yet.'}</p>
                ) : (
                  <ul className="calendar-list__items">
                    {calEvents.map((ev: any) => {
                      const resName = calResources.find(r => r.id === ev.resource)?.name || ev.resource;
                      return (
                        <li key={ev.id} className={`calendar-list__item ${ev.cssClass || ''}`} onClick={() => {
                          setViewMode('toMe');
                          setHighlightBookId(String(ev.resource));
                          window.setTimeout(() => setHighlightBookId(null), 2000);
                        }}>
                          <div className="calendar-list__title">{resName}</div>
                          <div className="calendar-list__meta">
                            {new Date(ev.start).toLocaleDateString()} – {new Date(ev.end).toLocaleDateString()}
                          </div>
                          <div className="calendar-list__borrower">{ev.text}</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        {/* Borrower compose form when opened with ?to=&book= */}
        {hasCompose && (
          <div className="card request-compose">
            {error && <div className="request-error">{error}</div>}
            <div className="request-compose__dates">
              <div className="request-date">
                <Calendar
                  label={t('messages.rentFrom') || 'Rent from'}
                  value={rentFrom}
                  onChange={(v) => setRentFrom(v)}
                  required
                  error={!rentFrom}
                  helperText={!rentFrom ? t('books.proposedPeriod') : undefined}
                  minDate={rentFromMin ?? dayjs()}
                />
              </div>
              <div className="request-date">
                <Calendar
                  label={t('messages.rentTo') || 'Rent to'}
                  value={rentTo}
                  onChange={(v) => setRentTo(v)}
                  required
                  error={!rentTo}
                  helperText={!rentTo ? t('messages.writeToOwner') : undefined}
                  minDate={rentFrom ?? rentFromMin ?? dayjs()}
                />
              </div>
            </div>
            <div className="request-actions">
              <button
                className="btn btn--ghost"
                disabled={submitting}
                onClick={() => {
                  setRentFrom(rentFromMin ?? null);
                  setRentTo(null);
                  const next = new URLSearchParams(searchParams);
                  next.delete('to'); next.delete('book');
                  setSearchParams(next, { replace: true });
                }}
              >
                {t('messages.cancel')}
              </button>
              <button className="btn" disabled={submitting} onClick={handleSubmitRequest}>
                {t('messages.send')}
              </button>
            </div>
          </div>
        )}

        {/* Owner requests as compact grid (max 4 per row) */}
        {!hasCompose && viewMode === 'toMe' && (() => {
          const allItems: RequestItem[] = Object.values(requests).flatMap(g => g.items);
          const flatItems = allItems.filter(it => !archivedThreads[it.threadId]);
          if (flatItems.length === 0) return <p>{t('requests.noRequests') || 'No requests yet.'}</p>;
          return (
            <div className="requests-grid">
              {flatItems.map((it) => (
                <div
                  key={it.id}
                  className={`request-card card ${highlightBookId === it.bookId ? 'request-card--highlight' : ''}`}
                  data-book-id={it.bookId}
                >
                  <div className="request-header">
                    <div className="request-avatar">
                      {(it.requesterName || 'U')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(part => part.charAt(0).toUpperCase())
                        .join('')}
                    </div>
                    <div className="request-title">
                      <div className="requester-name">{it.requesterName || 'User'}</div>
                      <div className="request-meta">
                        {new Date(it.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="request-body">
                    <SingleBookReq
                      bookTitle={it.bookTitle}
                      requesterName={it.requesterName}
                      periodFrom={it.periodFrom ?? null}
                      periodTo={it.periodTo ?? null}
                      createdAt={new Date(it.createdAt).toLocaleString()}
                    />
                  </div>
                  {acceptedByBook[it.bookId]?.threadId === it.threadId ? (
                    <>
                      <div className="request-chip request-chip--success">
                        {t('requests.currentBorrower') || 'Current borrower'}
                      </div>
                      <FinishedRent
                        bookId={it.bookId}
                        threadId={it.threadId}
                        onDone={async () => {
                          await refreshAfterFinish(it.bookId, it.threadId);
                          if (onRefreshBooks) await onRefreshBooks();
                        }}
                      />
                    </>
                  ) : disabledThreads[it.threadId] ? (
                    <div className="request-chip request-chip--archived">
                      {t('requests.archived') || 'Archived request'}
                    </div>
                  ) : (
                    <div className="request-actions">
                      <button
                        className="btn"
                        disabled={submitting || !!activeRentByBook[it.bookId] || !!disabledThreads[it.threadId]}
                        title={
                          activeRentByBook[it.bookId]
                            ? (t('requests.bookAlreadyRented') || 'Book already rented')
                            : (disabledThreads[it.threadId] ? (t('requests.requestCompleted') || 'This request already completed') : undefined)
                        }
                        onClick={() => handleAgree(it)}
                      >
                        {t('messages.agree')}
                      </button>
                      <button className="btn btn--ghost" disabled={submitting} onClick={() => handleDisagree(it)}>
                        {t('messages.disagree')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
        {/* My requests (borrower) as compact grid */}
        {!hasCompose && viewMode === 'mine' && (() => {
          const flatItems = myRequests.filter(it => !myArchivedThreads[it.threadId]);
          if (flatItems.length === 0) return <p>{t('requests.noRequests') || 'No requests yet.'}</p>;
          return (
            <div className="requests-grid">
              {flatItems.map((it) => (
                <div key={it.id} className="request-card card">
                  <div className="request-header">
                    <div className="request-avatar">
                      {(it.requesterName || 'O')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(part => part.charAt(0).toUpperCase())
                        .join('')}
                    </div>
                    <div className="request-title">
                      <div className="requester-name">{it.requesterName || 'Owner'}</div>
                      <div className="request-meta">{new Date(it.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="request-body">
                    <SingleBookReq
                      bookTitle={it.bookTitle}
                      requesterName={it.requesterName}
                      periodFrom={it.periodFrom ?? null}
                      periodTo={it.periodTo ?? null}
                      createdAt={new Date(it.createdAt).toLocaleString()}
                      isMine
                    />
                  </div>
                  <div className="request-actions" />
                </div>
              ))}
            </div>
          );
        })()}
        {/* Archived grid (refused or returned) */}
        {!hasCompose && viewMode === 'archived' && (() => {
          const ownerArchived = Object.values(requests).flatMap(g => g.items).filter(it => archivedThreads[it.threadId] || disabledThreads[it.threadId]);
          const mineArchived = myRequests.filter(it => myArchivedThreads[it.threadId]);
          const flatItems = [...ownerArchived, ...mineArchived];
          if (flatItems.length === 0) return <p>{t('requests.noRequests') || 'No requests yet.'}</p>;
          return (
            <div className="requests-grid">
              {flatItems.map((it) => (
                <div key={`${it.id}-arch`} className="request-card card">
                  <div className="request-header">
                    <div className="request-avatar">
                      {(it.requesterName || 'U')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(part => part.charAt(0).toUpperCase())
                        .join('')}
                    </div>
                    <div className="request-title">
                      <div className="requester-name">{it.requesterName || 'User'}</div>
                      <div className="request-meta">
                        {new Date(it.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="request-body">
                    <SingleBookReq
                      bookTitle={it.bookTitle}
                      requesterName={it.requesterName}
                      periodFrom={it.periodFrom ?? null}
                      periodTo={it.periodTo ?? null}
                      createdAt={new Date(it.createdAt).toLocaleString()}
                    />
                  </div>
                  <div className="request-chip request-chip--archived">
                    {t('requests.archived') || 'Archived request'}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        </div>
      </div>
    </section>
  );
};

export default Requests;
