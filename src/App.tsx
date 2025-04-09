import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { Sword, Ship, Scroll, MessageSquare, Users, LogOut } from 'lucide-react';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import Forum from './components/forum/Forum';
import PostDetails from './components/forum/PostDetails';
import Chat from './components/chat/Chat';

function App() {
  const { user, setUser, signOut } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
        <nav className="bg-blue-950 border-b border-gold-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Ship className="h-8 w-8 text-yellow-500" />
                <span className="ml-2 text-2xl font-bold text-yellow-500">Sojusz Imperium</span>
              </div>
              {user && (
                <div className="flex items-center space-x-4">
                  <NavLink icon={<Sword />} to="/forum/war">Wojna</NavLink>
                  <NavLink icon={<Ship />} to="/forum/trade">Handel</NavLink>
                  <NavLink icon={<Scroll />} to="/forum/diplomacy">Dyplomacja</NavLink>
                  <NavLink icon={<Users />} to="/forum/general">Ogólne</NavLink>
                  <NavLink icon={<MessageSquare />} to="/chat">Czat</NavLink>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-yellow-300 hover:text-yellow-500 hover:bg-blue-800 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="ml-2">Wyloguj</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/forum/:category" element={user ? <Forum /> : <Navigate to="/login" />} />
            <Route path="/forum/:category/:postId" element={user ? <PostDetails /> : <Navigate to="/login" />} />
            <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to="/forum/general" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

interface NavLinkProps {
  icon: React.ReactNode;
  to: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, to, children }) => (
  <Link
    to={to}
    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-yellow-300 hover:text-yellow-500 hover:bg-blue-800 transition-colors"
  >
    {icon}
    <span className="ml-2">{children}</span>
  </Link>
);

export default App;