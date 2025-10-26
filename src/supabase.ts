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
  sender_name: string | null;
  recipient_id: string;
  recipient_name: string | null;
  body: string;
  parent_id: string | null;
  read: boolean;
  created_at: string;
};

export async function fetchMessagesForUser() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as DbMessage[];
}

export async function sendMessage(params: {
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  body: string;
  parentId?: string;
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      sender_id: params.senderId,
      sender_name: params.senderName ?? null,
      recipient_id: params.recipientId,
      recipient_name: params.recipientName ?? null,
      body: params.body,
      parent_id: params.parentId ?? null,
    }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbMessage;
}

export async function markMessageRead(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId);
  if (error) throw new Error(error.message);
}