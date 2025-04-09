import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { UserCircle } from 'lucide-react';

export default function Profile() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<{ id: string; username: string; created_at?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setProfile(profile);
        setUsername(profile.username);
      } else {
        // Handle case where profile doesn't exist yet
        setProfile(null);
        setUsername('');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .not('id', 'eq', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        throw new Error('Username is already taken');
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          created_at: profile?.created_at || new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      navigate('/forum/general');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-ancient-pattern bg-cover bg-center">
      <div className="bg-blue-900/90 p-8 rounded-lg shadow-xl w-full max-w-md backdrop-blur-sm border border-gold-500">
        <div className="flex items-center justify-center mb-8">
          <UserCircle className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-center text-yellow-500 mb-8">
          {profile ? 'Update Profile' : 'Complete Your Profile'}
        </h2>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-yellow-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md bg-blue-800 border border-gold-500 text-yellow-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
          </button>
        </form>
      </div>
    </div>
  );
}