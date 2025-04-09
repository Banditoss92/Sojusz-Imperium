import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError) {
        throw new Error('Error checking username availability');
      }

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Sign up the user
      const { data, error: signUpError } = await signUp(email, password);
      
      if (signUpError || !data.user) {
        throw new Error(signUpError?.message || 'Registration failed');
      }

      // Create the profile with retry mechanism
      let profileCreated = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!profileCreated && retryCount < maxRetries) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              username,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (!profileError) {
          profileCreated = true;
        } else {
          console.error(`Profile creation attempt ${retryCount + 1} failed:`, profileError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          }
        }
      }

      if (!profileCreated) {
        // If profile creation failed after all retries, delete the auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        throw new Error('Failed to create profile after multiple attempts. Please try again.');
      }

      // Success - redirect to login
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-ancient-pattern bg-cover bg-center">
      <div className="bg-blue-900/90 p-8 rounded-lg shadow-xl w-full max-w-md backdrop-blur-sm border border-gold-500">
        <div className="flex items-center justify-center mb-8">
          <UserPlus className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-center text-yellow-500 mb-8">Join Sojusz Imperium</h2>
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
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-yellow-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md bg-blue-800 border border-gold-500 text-yellow-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-yellow-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-blue-800 border border-gold-500 text-yellow-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-yellow-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-yellow-500 hover:text-yellow-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}