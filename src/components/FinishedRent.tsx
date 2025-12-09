import React, { useState } from 'react';
import { supabase } from '../supabase';

type FinishedRentProps = {
  bookId: string;
  onDone?: () => void;
};

export default function FinishedRent({ bookId, onDone }: FinishedRentProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);

  const handleYes = async () => {
    if (choice) return;
    setChoice('yes');
    try {
      setSubmitting(true);
      setError(null);
      // 1) Zakończ aktywny rent
      const { error: rentErr } = await supabase
        .from('rents')
        .update({ finished: true })
        .eq('book_id', bookId)
        .eq('finished', false);
      if (rentErr) throw rentErr;
      // 2) Wyślij systemową wiadomość do wypożyczającego (borrower): potwierdzenie zwrotu
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (currentUserId) {
        const { data: thread, error: thErr } = await supabase
          .from('threads')
          .select('id, other_user_id')
          .eq('book_id', bookId)
          .eq('owner_id', currentUserId)
          .eq('is_closed', false)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!thErr && thread?.id && thread?.other_user_id) {
          const borrowerId = String((thread as any).other_user_id);
          const systemBody = '!system: Owner confirmed the book was returned by the borrower.';
          await supabase
            .from('messages')
            .insert([{ sender_id: currentUserId, recipient_id: borrowerId, body: systemBody, thread_id: thread.id }]);
        }
      }
      onDone?.();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to finish rent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNo = async () => {
    if (choice) return;
    setChoice('no');
    try {
      setSubmitting(true);
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id;
      if (!currentUserId) {
        setError('Not authenticated');
        return;
      }
      // Znajdź aktywny wątek dla tej książki z ownerem = currentUserId
      const { data: thread, error: thErr } = await supabase
        .from('threads')
        .select('id, other_user_id')
        .eq('book_id', bookId)
        .eq('owner_id', currentUserId)
        .eq('is_closed', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (thErr) throw thErr;
      if (!thread?.id || !thread?.other_user_id) {
        setError('Thread not found for this book.');
        return;
      }
      const borrowerId = String((thread as any).other_user_id);
      const systemBody = '!system: Please contact the owner to agree on a new return date.';
      const { error: msgErr } = await supabase
        .from('messages')
        .insert([{ sender_id: currentUserId, recipient_id: borrowerId, body: systemBody, thread_id: thread.id }]);
      if (msgErr) throw msgErr;
      // Dodatkowo: systemowa wiadomość do ownera (do siebie) jako potwierdzenie wysłania prośby
      const ownerNote = '!system: We asked the borrower to contact you to agree on the return date.';
      await supabase
        .from('messages')
        .insert([{ sender_id: currentUserId, recipient_id: currentUserId, body: ownerNote, thread_id: thread.id }]);
      onDone?.();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section finished-rent-section">
      <div className="container finished-rent-hero">
        <h4 className="h4">Czy oddano książkę?</h4>
        {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--primary" disabled={submitting || choice !== null} onClick={handleYes}>
            Tak, oddano książkę
          </button>
          <button className="btn btn--ghost" disabled={submitting || choice !== null} onClick={handleNo}>
            Nie, nie oddano
          </button>
        </div>
      </div>
    </section>
  );
}
