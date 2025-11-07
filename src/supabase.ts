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
  threadId?: string;
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      sender_id: params.senderId,
      recipient_id: params.recipientId,
      body: params.body,
      thread_id: params.threadId ?? null,
    }])
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  // Jeśli tworzymy nowy wątek (brak threadId), ustaw thread_id = id
  if (!params.threadId && data && (data as any).thread_id == null) {
    const { data: updated, error: updErr } = await supabase
      .from('messages')
      .update({ thread_id: (data as any).id })
      .eq('id', (data as any).id)
      .select()
      .maybeSingle();
    if (updErr) throw new Error(updErr.message);
    return updated as any as DbMessage;
  }
  return data as any as DbMessage;
}

export async function markMessageRead(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId);
  if (error) throw new Error(error.message);
}