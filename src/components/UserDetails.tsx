import React from 'react';
import { supabase } from '../supabase';

function UserDetails({ user }: { user: any }) {
  const [dbUser, setDbUser] = React.useState<{ first_name?: string; last_name?: string; email?: string } | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentRents, setCurrentRents] = React.useState<Array<{ id: string; title: string; rent_from: string | null; rent_to: string | null; role: 'owner' | 'borrower' }>>([]);
  const [rentHistory, setRentHistory] = React.useState<Array<{ id: string; title: string; rent_from: string | null; rent_to: string | null; role: 'owner' | 'borrower' }>>([]);
  const [ratingOwner, setRatingOwner] = React.useState<number | null>(null);
  const [ratingBorrower, setRatingBorrower] = React.useState<number | null>(null);
  const ratingOverall = React.useMemo(() => {
    const vals = [ratingOwner, ratingBorrower].filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  }, [ratingOwner, ratingBorrower]);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: auth } = await supabase.auth.getUser();
        const authUserId = auth.user?.id;
        if (!authUserId) { setLoading(false); return; }
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', authUserId)
          .single();
        if (error) { setError(error.message); setLoading(false); return; }
        setDbUser(data || null);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch current rents and history for logged-in user
  React.useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const authUserId = auth.user?.id;
        if (!authUserId) { setCurrentRents([]); setRentHistory([]); return; }
        // Current (finished = false)
        const { data: openRows, error: openErr } = await supabase
          .from('rents')
          .select('id, book_id, book:book_id (title), rent_from, rent_to, finished, book_owner, borrower')
          .eq('finished', false)
          .or(`book_owner.eq.${authUserId},borrower.eq.${authUserId}`);
        if (openErr) { console.error('Error fetching current rents:', openErr); setCurrentRents([]); } else {
          setCurrentRents((openRows || []).map((r: any) => ({
            id: String(r.id),
            title: r.book?.title || 'Book',
            rent_from: r.rent_from ?? null,
            rent_to: r.rent_to ?? null,
            role: r.book_owner === authUserId ? 'owner' : 'borrower'
          })));
        }
        // History (finished = true)
        const { data: histRows, error: histErr } = await supabase
          .from('rents')
          .select('id, book_id, book:book_id (title), rent_from, rent_to, finished, book_owner, borrower')
          .eq('finished', true)
          .or(`book_owner.eq.${authUserId},borrower.eq.${authUserId}`)
          .order('rent_from', { ascending: false });
        if (histErr) { console.error('Error fetching rent history:', histErr); setRentHistory([]); } else {
          setRentHistory((histRows || []).map((r: any) => ({
            id: String(r.id),
            title: r.book?.title || 'Book',
            rent_from: r.rent_from ?? null,
            rent_to: r.rent_to ?? null,
            role: r.book_owner === authUserId ? 'owner' : 'borrower'
          })));
        }
        // Initial ratings (compute from user_ratings)
        const { data: ratingsRows, error: ratingsErr } = await supabase
          .from('user_ratings')
          .select('role, rating')
          .eq('ratee_id', authUserId);
        if (!ratingsErr && ratingsRows) {
          const ownerVals = ratingsRows.filter((r: any) => r.role === 'owner').map((r: any) => Number(r.rating || 0));
          const borrowerVals = ratingsRows.filter((r: any) => r.role === 'borrower').map((r: any) => Number(r.rating || 0));
          setRatingOwner(ownerVals.length ? ownerVals.reduce((a, b) => a + b, 0) / ownerVals.length : null);
          setRatingBorrower(borrowerVals.length ? borrowerVals.reduce((a, b) => a + b, 0) / borrowerVals.length : null);
        }
        // Realtime updates for ratings
        const channel = supabase
          .channel(`user_ratings_${authUserId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_ratings', filter: `ratee_id=eq.${authUserId}` }, async () => {
            const { data: rr } = await supabase
              .from('user_ratings')
              .select('role, rating')
              .eq('ratee_id', authUserId);
            const ownerVals2 = (rr || []).filter((r: any) => r.role === 'owner').map((r: any) => Number(r.rating || 0));
            const borrowerVals2 = (rr || []).filter((r: any) => r.role === 'borrower').map((r: any) => Number(r.rating || 0));
            setRatingOwner(ownerVals2.length ? ownerVals2.reduce((a, b) => a + b, 0) / ownerVals2.length : null);
            setRatingBorrower(borrowerVals2.length ? borrowerVals2.reduce((a, b) => a + b, 0) / borrowerVals2.length : null);
          })
          .subscribe();
        return () => { try { supabase.removeChannel(channel); } catch {} };
      } catch (e) {
        console.error('Unexpected error fetching rents:', e);
        setCurrentRents([]); setRentHistory([]);
      }
    })();
  }, []);

  const emailLocal = (user?.email || '').split('@')[0] || '';
  const nameParts = (user?.name || '').trim().split(/\s+/).filter(Boolean);
  const inferredFirst = nameParts[0] || emailLocal;
  const inferredLast = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const first = (dbUser?.first_name || user?.firstName || '').trim() || inferredFirst;
  const last = (dbUser?.last_name || user?.lastName || '').trim() || inferredLast;
  const email = dbUser?.email || user?.email || '';

  return (
    <section className="section">
      <div className="container messages-hero">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, width: '100%' }}>
        <div className="card user-details">
      <h1>Szczegóły użytkownika</h1>
      {loading ? (
        <p>Ładowanie...</p>
      ) : error ? (
        <p style={{ color: '#b91c1c' }}>{error}</p>
      ) : (
        <>
          <p><strong>Imię:</strong> {first}</p>
          <p><strong>Nazwisko:</strong> {last}</p>
          <p><strong>Email:</strong> {email}</p>
        </>
      )}
        </div>
        <div className="card user-rating">
<h1>Ocena użytkownika</h1>
{ratingOverall === null ? (
  <p>no rating yet</p>
) : (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
    <div className="rating-table" style={{ justifyContent: 'flex-start' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`book-emoji ${i <= Math.round(ratingOverall) ? 'active' : ''}`} aria-hidden="true" style={{ fontSize: 22 }}>
          ⭐
        </span>
      ))}
    </div>
    <div style={{ fontWeight: 500 }}>{ratingOverall.toFixed(2)}</div>
  </div>
)}
</div>
          <div className="card current-share">
            <h1>Aktualnie udostępniam</h1>
            {currentRents.filter(r => r.role === 'owner').length === 0 ? (
              <p>Brak aktualnie udostępnionych książek</p>
            ) : (
              <ul style={{ marginTop: 8 }}>
                {currentRents.filter(r => r.role === 'owner').map(r => (
                  <li key={r.id} style={{ margin: '6px 0' }}>
                    <strong>{r.title}</strong>
                    {r.rent_from || r.rent_to ? (
                      <> ({r.rent_from ? new Date(r.rent_from).toLocaleDateString() : '—'} — {r.rent_to ? new Date(r.rent_to).toLocaleDateString() : '—'})</>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card current-borrow">
            <h1>Aktualnie pożyczam</h1>
            {currentRents.filter(r => r.role === 'borrower').length === 0 ? (
              <p>Brak aktualnie pożyczanych książek</p>
            ) : (
              <ul style={{ marginTop: 8 }}>
                {currentRents.filter(r => r.role === 'borrower').map(r => (
                  <li key={r.id} style={{ margin: '6px 0' }}>
                    <strong>{r.title}</strong>
                    {r.rent_from || r.rent_to ? (
                      <> ({r.rent_from ? new Date(r.rent_from).toLocaleDateString() : '—'} — {r.rent_to ? new Date(r.rent_to).toLocaleDateString() : '—'})</>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
</div>
</section>
  );
}

export default UserDetails;