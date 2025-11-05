import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

type MessageItem = {
  id: string;
  senderName: string;
  time: string;
  body: string;
  read: boolean;
  replies?: { id: string; text: string; time: string; senderName: string; isMine?: boolean; read?: boolean; toMe?: boolean }[];
};

interface MessagesProps {
  messages: MessageItem[];
  onMarkRead: (id: string) => void;
  onSendReply: (id: string, text: string) => void;
  onStartThread: (recipientId: string, text: string) => void;
}

const Messages: React.FC<MessagesProps> = ({ messages, onMarkRead, onSendReply, onStartThread }) => {
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const to = searchParams.get('to');
    if (to) {
      // jeśli przychodzimy z /messages?to=<ownerId>, pokaż prosty formularz startu wątku do tego usera
      setOpenMessageId('__new__');
    }
  }, [searchParams]);

  // Czyszczenie replyText gdy użytkownik przełącza się między wątkami
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
            <div key={m.id} className="message-item" onClick={() => {
              setOpenMessageId(m.id);
              if (!m.read) onMarkRead(m.id);
              m.replies?.forEach(r => { if (r.toMe && !r.read) onMarkRead(r.id); });
            }}>
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
          ))}
          {/* Start nowej rozmowy gdy jest query param to */}
          {searchParams.get('to') && (
            <div className="message-item">
              <div className="message-avatar">To</div>
              <div className="message-content">
                <div className="message-header">
                  <div className="message-sender">New message</div>
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
                    <button className="btn btn--ghost" onClick={() => { setReplyText(''); const next = new URLSearchParams(searchParams); next.delete('to'); setSearchParams(next, { replace: true }); }}>Cancel</button>
                    <button className="btn" onClick={() => { onStartThread(searchParams.get('to') as string, replyText); setReplyText(''); const next = new URLSearchParams(searchParams); next.delete('to'); setSearchParams(next, { replace: true }); }}>Send</button>
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