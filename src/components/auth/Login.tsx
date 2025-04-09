import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const signIn = useAuthStore((state) => state.signIn);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-ancient-pattern bg-cover bg-center">
      <div className="bg-blue-900/90 p-8 rounded-lg shadow-xl w-full max-w-md backdrop-blur-sm border border-gold-500">
        <div className="flex items-center justify-center mb-8">
          <Shield className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-center text-yellow-500 mb-8">Login to Sojusz Imperium</h2>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-yellow-300">
          Not a member?{' '}
          <Link to="/register" className="font-medium text-yellow-500 hover:text-yellow-400">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}