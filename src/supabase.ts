import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

//logowanie
export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data
  }
//rejestracja
  export const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data
  }

  export const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message)
    }
  }
  
  export const getCurrentUser = () => {
    return supabase.auth.getUser()
  }
  
  export const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    if (error) {
      throw new Error(error.message)
    }
  }

// Messages helpers
export type DbMessage = {
  id: string;
  sender_id: string;
  sender_email: string | null;
  recipient_id: string;
  recipient_email: string | null;
  body: string;
  thread_id: string | null;
  read: boolean;
  created_at: string;
};

export async function fetchMessagesForUser() {
  // Tymczasowo selekcja bez RPC; jeśli masz RPC, dostosuj do thread_id
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as any as DbMessage[];
}

export async function sendMessage(params: {
  senderId: string;
  recipientId: string;
  body: string;
  threadId: string;
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      sender_id: params.senderId,
      recipient_id: params.recipientId,
      body: params.body,
      thread_id: params.threadId,
    }])
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as any as DbMessage;
}

export async function markMessageRead(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId);
  if (error) throw new Error(error.message);
}

export async function getOrCreateThread(params: {
  bookId: string;
  currentUserId: string;
  recipientId: string;
}) {
  const { bookId, currentUserId, recipientId } = params;

  const { data: book, error: bookErr } = await supabase
    .from('books')
    .select('owner_id')
    .eq('id', bookId)
    .single();
  if (bookErr) throw new Error(bookErr.message);

  const ownerId = (book as any).owner_id as string;
  const otherUserId = currentUserId === ownerId ? recipientId : currentUserId;

  const { data: existing, error: selErr } = await supabase
    .from('threads')
    .select('id')
    .eq('book_id', bookId)
    .eq('owner_id', ownerId)
    .eq('other_user_id', otherUserId)
    .maybeSingle();
  if (selErr && selErr.code !== 'PGRST116') throw new Error(selErr.message);
  if (existing?.id) return existing.id as string;

  const { data: created, error: insErr } = await supabase
    .from('threads')
    .insert([{ book_id: bookId, owner_id: ownerId, other_user_id: otherUserId }])
    .select('id')
    .maybeSingle();
  if (insErr) throw new Error(insErr.message);
  return created!.id as string;
}