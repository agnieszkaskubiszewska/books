-- Speeds up Requests page filters that scan system messages.
-- Used by:
-- - recipient/sender queries for "!system: Requested rent period%"
-- - thread-scoped archival checks for owner decisions

create index if not exists idx_messages_req_period_recipient_created
  on public.messages (recipient_id, created_at desc)
  where body like '!system: Requested rent period%';

create index if not exists idx_messages_req_period_sender_created
  on public.messages (sender_id, created_at desc)
  where body like '!system: Requested rent period%';

create index if not exists idx_messages_thread_owner_decisions_created
  on public.messages (thread_id, created_at desc)
  where (
    body in (
      'Owner zgodził się na wypożyczenie książki w wybranym przez Ciebie terminie',
      'Owner nie wyraził zgody na wypożyczenie książki w wybranym przez Ciebie terminie',
      '!system: Owner agreed to rent this book.',
      '!system: Owner refused to rent this book.',
      '!system: Owner confirmed the book was returned by the borrower.'
    )
    or body like '!system: Owner refused%'
    or body like '!system: Owner confirmed%'
  );
