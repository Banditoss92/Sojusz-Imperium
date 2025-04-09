import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
  };
}

interface Profile {
  id: string;
  username: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchUserProfile();
    const subscription = subscribeToMessages();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No authenticated user found');
        setProfileLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        setError('Please complete your profile to use chat');
        setProfileLoading(false);
        return;
      }

      setUserProfile(profile);
      setError('');
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          author:profiles(username)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred while loading messages');
    }
  }

  function subscribeToMessages() {
    return supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, () => {
        // Simply refresh messages when a new one arrives
        fetchMessages();
      })
      .subscribe();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!newMessage.trim()) return;

    if (!userProfile) {
      setError('You must have a valid profile to send messages');
      return;
    }

    setIsLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          content: newMessage.trim(),
          author_id: userProfile.id
        });

      if (insertError) throw insertError;
      setNewMessage('');
      // Refresh messages after sending
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <div className="bg-blue-900/50 rounded-lg p-6 backdrop-blur-sm border border-gold-500">
        <div className="text-yellow-500 text-center">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-blue-900/50 rounded-lg p-6 backdrop-blur-sm border border-gold-500">
        <div className="text-red-500 text-center mb-4">
          {error || 'Profile not found. Please ensure you have completed your profile setup.'}
        </div>
        <div className="text-yellow-500 text-center">
          <a href="/profile" className="underline hover:text-yellow-400">
            Click here to set up your profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/50 rounded-lg p-6 backdrop-blur-sm border border-gold-500 h-[calc(100vh-12rem)]">
      <div className="flex flex-col h-full">
        <h1 className="text-3xl font-bold text-yellow-500 mb-6">Alliance Chat</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-blue-900/70 p-4 rounded-lg border border-gold-500">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-yellow-500">{message.author.username}</span>
                <span className="text-sm text-yellow-300">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-yellow-100">{message.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-blue-800 border border-gold-500 rounded-md p-2 text-yellow-100"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-md hover:bg-yellow-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 mr-2" />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}