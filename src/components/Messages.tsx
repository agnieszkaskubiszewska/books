import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import Calendar from './Calendar';
import SystemMemo from './SystemMemo';
import { submitUserRating } from '../supabase';
import FinishedRent from './FinishedRent';

type MessageItem = {
  id: string;
  senderName: string;
  time: string;
  body: string;
  bookTitle?: string;
  ownerName?: string;
  bookId?: string;
  isOwner?: boolean;
  isAgreed?: boolean;
  canAgree?: boolean;
  disableDisagree?: boolean;
  closed?: boolean;
  threadId?: string;
  otherUserId?: string;
  otherUserName?: string;
  read: boolean;
  replies?: { id: string; text: string; time: string; senderName: string; isMine?: boolean; read?: boolean; toMe?: boolean }[];
};

interface MessagesProps {
  messages: MessageItem[];
  onMarkRead: (id: string) => void;
  onSendReply: (id: string, text: string) => void;
  onStartThread: (recipientId: string, text: string, bookId?: string | null, rentFrom?: string | null, rentTo?: string | null) => void;
  onAgreeRent: (threadId?: string | null) => void;
  onDisagreeRent: (threadId?: string | null) => void;
  onCloseDiscussion: (threadId?: string | null) => void;
  onRefreshActiveRents?: () => Promise<void>;
  onRefreshMessages?: () => Promise<void>;
  onRefreshBooks?: () => Promise<void>;
}

const Messages: React.FC<MessagesProps> = ({ messages, onMarkRead, onSendReply, onStartThread, onAgreeRent, onDisagreeRent, onCloseDiscussion, onRefreshActiveRents, onRefreshMessages, onRefreshBooks }) => {
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [bookTitle, setBookTitle] = useState<string | null>(null);
  const [rentFrom, setRentFrom] = useState<Dayjs | null>(dayjs());
  const [rentTo, setRentTo] = useState<Dayjs | null>(null);

useEffect(() => {
  const id = searchParams.get('book');
  if (!id) { setBookTitle(null); return; }
  (async () => {
    const { data, error } = await supabase
      .from('books')
      .select('title')
      .eq('id', id)
      .single();
    setBookTitle(!error ? data?.title ?? null : null);
  })();
}, [searchParams]);


  useEffect(() => {
    const to = searchParams.get('to');
    if (to) {
      setOpenMessageId('__new__');
    }
  }, [searchParams]);

  useEffect(() => {
    setReplyText('');
  }, [openMessageId]);
  return (
    <section className="section">
      <div className="container hero messages-hero">
        <h1 className="h1">Messages</h1>
      </div>
<div className="container">
        <div className="messages-list">
          {messages.map(m => (
            <div
              key={m.id}
              className="message-item"
              onClick={() => {
              setOpenMessageId(m.id);
              if (!m.read) onMarkRead(m.id);
              m.replies?.forEach(r => { if (r.toMe && !r.read) onMarkRead(r.id); });
            }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {m.bookTitle && (
                <div
                  className="message-thread-header"
                  style={{
                    alignSelf: 'flex-start',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: 9999,
                    padding: '2px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
chat with owner {m.ownerName} about book: {m.bookTitle}
                </div>
              )}
              {m.isOwner && m.bookId && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8 }}>
                  <div>
                    <button
                      className="btn"
                      onClick={(e) => { e.stopPropagation(); onAgreeRent((m as any).threadId); }}
                      disabled={!m.canAgree}
                      style={{
                        fontSize: 12,
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #34d399',
                        background: '#d1fae5',
                        color: '#065f46',
                        opacity: m.canAgree ? 1 : 0.6,
                        cursor: m.canAgree ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Agree on rent
                    </button>
                  </div>
                  {!m.disableDisagree && (
                    <div>
                      <button
                        className="btn"
                        onClick={(e) => { e.stopPropagation(); onDisagreeRent((m as any).threadId); }}
                        style={{
                          fontSize: 12,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #fca5a5',
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}
                      >
                        Disagree
                      </button>
                    </div>
                  )}
                  {!m.closed && (
                    <div>
                      <button
                        className="btn"
                        onClick={(e) => { e.stopPropagation(); onCloseDiscussion((m as any).threadId); }}
                        style={{
                          fontSize: 12,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                          color: '#334155'
                        }}
                      >
                        Close discussion
                      </button>
                    </div>
                  )}
                </div>
              )}
              {(m as any).isAgreed && !m.closed && (m as any).otherUserId && (
                <RatingPrompt
                  threadId={(m as any).threadId!}
                  otherUserId={(m as any).otherUserId!}
                  otherUserName={(m as any).otherUserName || 'użytkownika'}
                  isOwner={!!m.isOwner}
                />
              )}

              

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="message-avatar">
                  {m.senderName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(part => part.charAt(0).toUpperCase())
                    .join('')}
                </div>
                <div className="message-content">
                <div className="message-header">
                  <div className="message-sender">{m.senderName}</div>
                  <div className="message-time">{m.time}</div>
                </div>
                <div className="message-body">{m.body}</div>
                {m.replies && m.replies.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.replies.map(r => {
                      const isSystem = typeof r.text === 'string' && r.text.startsWith('!system:');
                      if (isSystem) {
                        let content = r.text.replace(/^!system:\s*/, '');
                        const forBorrower = content.startsWith('[for_borrower]');
                        if (forBorrower && (m as any).isOwner) {
                          return null;
                        }
                        if (forBorrower) {
                          content = content.replace(/^\[for_borrower\]\s*/, '');
                        }
                        return <SystemMemo key={r.id} content={content} />;
                      }
                      const bubbleBase = {
                        borderRadius: 12,
                        padding: 10,
                        border: '1px solid #e5f3ea',
                        background: 'rgba(45,186,104,0.06)',
                        alignSelf: 'flex-start' as const,
                        color: '#334155'
                      };
                      const bubbleMine = {
                        background: 'linear-gradient(135deg, #2DBA68 0%, #228B22 100%)',
                        border: '1px solid #2DBA68',
                        color: '#fff',
                        alignSelf: 'flex-end' as const
                      };
                      const style = r.isMine ? { ...bubbleBase, ...bubbleMine } : bubbleBase;
                      const authorColor = r.isMine ? '#ffffff' : '#1b2430';
                      const timeColor = r.isMine ? 'rgba(255,255,255,0.85)' : '#7a8a99';
                      return (
                        <div key={r.id} style={style}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong style={{ color: authorColor }}>{r.isMine ? 'You' : r.senderName}</strong>
                            <span style={{ color: timeColor, fontWeight: 600 }}>{r.time}</span>
                          </div>
                          <div style={{ color: r.isMine ? '#ffffff' : '#334155' }}>{r.text}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                  {openMessageId === m.id && !m.closed && (
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
                        rows={3}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button className="btn btn--ghost" onClick={(e) => { e.stopPropagation(); setOpenMessageId(null); setReplyText(''); }}>Cancel</button>
                        <button className="btn" onClick={(e) => { e.stopPropagation(); onSendReply(m.id, replyText); setReplyText(''); }}>Send</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {m.isOwner && m.bookId && (m as any).hasActiveRent && (
                <FinishedRent
                  bookId={m.bookId!}
                  onDone={async () => {
                    if (onRefreshActiveRents) {
                      await onRefreshActiveRents();
                    }
                    if (onRefreshMessages) {
                      await onRefreshMessages();
                    }
                    if (onRefreshBooks) {
                      await onRefreshBooks();
                    }
                  }}
                />
              )}
            </div>
          ))}
          {/* Start nowej rozmowy gdy jest query param to */}
          {searchParams.get('to') && (
            <div className="message-item">
              <div className="message-avatar">To</div>
              <div className="message-content">
                <div className="message-header">
                  <div className="message-sender">New message</div>
                  {bookTitle && (
<div className="message-about-book"> You want to rent book: <strong>{bookTitle}</strong></div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 220 }}>
                    <Calendar
                      label="Rent from"
                      value={rentFrom}
                      onChange={(v) => setRentFrom(v)}
                      required
                      error={!rentFrom}
                      helperText={!rentFrom ? 'Dodaj datę rozpoczęcia' : undefined}
                    />
                  </div>
                  <div style={{ minWidth: 220 }}>
                    <Calendar
                      label="Rent to"
                      value={rentTo}
                      onChange={(v) => setRentTo(v)}
                      required
                      error={!rentTo}
                      helperText={!rentTo ? 'Dodaj termin zwrotu książki' : undefined}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a message to the owner..."
                    style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
                    rows={3}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button
  className="btn btn--ghost"
  onClick={() => {
    setReplyText('');
    setRentFrom(dayjs());
    setRentTo(null);
    const next = new URLSearchParams(searchParams);
    next.delete('to');
    next.delete('book');
    setSearchParams(next, { replace: true });
  }}
>
  Cancel
</button>
<button
  className="btn"
  onClick={() => {
    const to = searchParams.get('to');
    const bookId = searchParams.get('book');
    if (!to || !replyText.trim()) return;
    onStartThread(
      to,
      replyText,
      bookId,
      rentFrom ? rentFrom.toISOString() : null,
      rentTo ? rentTo.toISOString() : null
    );
    setReplyText('');
    setRentFrom(dayjs());
    setRentTo(null);
    const next = new URLSearchParams(searchParams);
    next.delete('to'); next.delete('book');
    setSearchParams(next, { replace: true });
  }}
>
  Send
</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Messages;

// Inline rating prompt component using existing rating-table styles
function RatingPrompt({ threadId, otherUserId, otherUserName, isOwner }: { threadId: string; otherUserId: string; otherUserName: string; isOwner: boolean }) {
  const [selected, setSelected] = React.useState<number>(0);
  const ratedKey = `rating_done_${threadId}_${otherUserId}`;
  const [done, setDone] = React.useState<boolean>(!!localStorage.getItem(ratedKey));
  const [thanks, setThanks] = React.useState<string | null>(null);

  const handleRate = async (value: number) => {
    if (done) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (!currentUserId) { alert('Musisz być zalogowany'); return; }
      // Oceniany ma odwrotną rolę
      const rateeRole = isOwner ? 'borrower' : 'owner';
      await submitUserRating({
        rateeId: otherUserId,
        raterId: currentUserId,
        role: rateeRole as any,
        rating: value,
        threadId
      });
      setSelected(value);
      localStorage.setItem(ratedKey, '1');
      setDone(true);
      setThanks('Dziękujemy za ocenę!');
    } catch (e: any) {
      setThanks(e?.message ?? 'Nie udało się zapisać oceny');
    }
  };

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Oceń {otherUserName}</div>
      {done ? (
        <div style={{ fontSize: 14, color: '#065f46' }}>{thanks || 'Dziękujemy za ocenę!'}</div>
      ) : (
        <>
          <div className="rating-table" style={{ justifyContent: 'flex-start' }}>
            {[1,2,3,4,5].map(i => (
              <label key={i} className="rating-option" title={`${i} / 5`} onClick={() => handleRate(i)}>
                <input type="radio" name={`rate-${threadId}`} value={i} readOnly />
                <span className={`book-emoji ${i <= (selected ?? 0) ? 'active' : ''}`} aria-hidden="true">⭐</span>
              </label>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Możesz ocenić tylko raz po akceptacji wypożyczenia.
          </div>
        </>
      )}
    </div>
  );
}