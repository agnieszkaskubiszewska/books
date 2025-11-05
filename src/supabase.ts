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
  reply_to_id: string | null;
  read: boolean;
  created_at: string;
};

export async function fetchMessagesForUser() {
  // Używamy funkcji SQL która zwraca wiadomości z emailami użytkowników
  const { data, error } = await supabase.rpc('get_messages_with_users');
  if (error) throw new Error(error.message);
  return (data || []) as DbMessage[];
}

export async function sendMessage(params: {
  senderId: string;
  recipientId: string;
  body: string;
  replyToId?: string;
}) {
  // Wstawiamy wiadomość bez sender_name i recipient_name
  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      sender_id: params.senderId,
      recipient_id: params.recipientId,
      body: params.body,
      reply_to_id: params.replyToId ?? null,
    }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  
  // Pobieramy wiadomość z emailami użytkowników przez funkcję SQL
  const { data: messageWithUsers, error: fetchError } = await supabase.rpc('get_message_with_users', {
    message_id: data.id
  });
  if (fetchError) throw new Error(fetchError.message);
  
  if (!messageWithUsers || messageWithUsers.length === 0) {
    throw new Error('Message not found after insert');
  }
  
  return messageWithUsers[0] as DbMessage;
}

export async function markMessageRead(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId);
  if (error) throw new Error(error.message);
}