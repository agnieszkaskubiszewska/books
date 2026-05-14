import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import SystemMemo from './SystemMemo';
import { submitUserRating } from '../supabase';
import { useTranslation } from 'react-i18next';
import { Facehash } from 'facehash';

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

  // No compose flow here anymore; Messages is only for chatting in existing threads.

  useEffect(() => {
    setReplyText('');
  }, [openMessageId]);
  const { t } = useTranslation();
  return (
    <section className="section">
      <div className="container hero messages-hero">
        <h1 className="h1">{t('messages.title')}</h1>
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
{t('messages.aboutBook')} <strong>{m.bookTitle}</strong>
{m.isOwner && m.senderName && <span style={{ fontWeight: 400 }}> · {t('messages.from')} {m.senderName}</span>}
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
                {(() => {
                  const isSystemMsg = typeof m.body === 'string' && m.body.startsWith('!system:');
                  const isBorrowRequest = isSystemMsg && m.body.toLowerCase().includes('requested rent period');
                  const displayName = isSystemMsg && !isBorrowRequest ? t('systemMemo.systemLabel') : m.senderName;
                  const avatarLabel = (isSystemMsg && !isBorrowRequest) ? 'SYS' : m.senderName.split(' ').filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
                  return (
                    <>
                      {isSystemMsg && !isBorrowRequest ? (
                        <div className="message-avatar">SYS</div>
                      ) : (
                        <Facehash
                          name={m.senderName}
                          size={36}
                          colors={["#2d3545", "#2DBA68", "#4a7a6a", "#5c7a9e", "#6B7694"]}
                          showInitial={false}
                          intensity3d="subtle"
                          interactive={false}
                          enableBlink={false}
                          style={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
                        />
                      )}
                      <div className="message-content">
                        <div className="message-header">
                          <div className="message-sender">{displayName}</div>
                          <div className="message-time">{m.time}</div>
                        </div>
                {/* Główna wiadomość: ukryj prefiks !system: i pokaż jako notatkę systemową */}
                {typeof m.body === 'string' && m.body.startsWith('!system:') ? (
                  (() => {
                    let content = (m.body as string).replace(/^!system:\s*/, '');
                    const forBorrower = content.startsWith('[for_borrower]');
                    if (forBorrower) {
                      content = content.replace(/^\[for_borrower\]\s*/, '');
                      if ((m as any).isOwner) {
                        return null;
                      }
                    }
                    return <SystemMemo content={content} />;
                  })()
                ) : (
                  <div className="message-body">{m.body}</div>
                )}
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
                            <strong style={{ color: authorColor }}>{r.isMine ? t('messages.you') : r.senderName}</strong>
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
                    placeholder={(m as any).otherUserName ? `${t('messages.replyPlaceholder')} — ${t('messages.replyWillBeSentTo')} ${(m as any).otherUserName}` : t('messages.replyPlaceholder') || ''}
                        style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
                        rows={3}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <button className="btn btn--ghost" onClick={(e) => { e.stopPropagation(); setOpenMessageId(null); setReplyText(''); }}>{t('messages.cancel')}</button>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); onSendReply(m.id, replyText); setReplyText(''); }}>{t('messages.send')}</button>
                      </div>
                    </div>
                  )}
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          ))}
          
        </div>
      </div>
    </section>
  );
};

export default Messages;

// Inline rating prompt component using existing rating-table styles
function RatingPrompt({ threadId, otherUserId, otherUserName, isOwner }: { threadId: string; otherUserId: string; otherUserName: string; isOwner: boolean }) {
  const { t } = useTranslation();
  const [selected, setSelected] = React.useState<number>(0);
  const ratedKey = `rating_done_${threadId}_${otherUserId}`;
  const [done, setDone] = React.useState<boolean>(!!localStorage.getItem(ratedKey));
  const [thanks, setThanks] = React.useState<string | null>(null);

  const handleRate = async (value: number) => {
    if (done) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (!currentUserId) { alert(t('messages.mustBeLoggedIn')); return; }
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
      setThanks(t('messages.thankYouForRating'));
    } catch (e: any) {
      setThanks(e?.message ?? t('messages.ratingFailed'));
    }
  };

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('messages.rateUser', { name: otherUserName })}</div>
      {done ? (
        <div style={{ fontSize: 14, color: '#065f46' }}>{thanks || t('messages.thankYouForRating')}</div>
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
            {t('messages.rateOnce')}
          </div>
        </>
      )}
    </div>
  );
}