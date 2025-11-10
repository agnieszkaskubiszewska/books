import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useSearchParams } from 'react-router-dom';

type MessageItem = {
  id: string;
  senderName: string;
  time: string;
  body: string;
  bookTitle?: string;
  ownerName?: string;
  read: boolean;
  replies?: { id: string; text: string; time: string; senderName: string; isMine?: boolean; read?: boolean; toMe?: boolean }[];
};

interface MessagesProps {
  messages: MessageItem[];
  onMarkRead: (id: string) => void;
  onSendReply: (id: string, text: string) => void;
  onStartThread: (recipientId: string, text: string, bookId?: string | null) => void;
}

const Messages: React.FC<MessagesProps> = ({ messages, onMarkRead, onSendReply, onStartThread }) => {
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [bookTitle, setBookTitle] = useState<string | null>(null);

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
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="message-avatar">{m.senderName.charAt(0).toUpperCase()}</div>
                <div className="message-content">
                <div className="message-header">
                  <div className="message-sender">{m.senderName}</div>
                  <div className="message-time">{m.time}</div>
                </div>
                <div className="message-body">{m.body}</div>
                {m.replies && m.replies.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.replies.map(r => {
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
                  {openMessageId === m.id && (
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
    onStartThread(to, replyText, bookId);
    setReplyText('');
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