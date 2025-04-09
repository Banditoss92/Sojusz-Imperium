import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PlusCircle, MessageSquare } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: {
    username: string;
  };
  comments_count: {
    count: number;
  };
}

export default function Forum() {
  const { category = 'general' } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [category]);

  async function fetchPosts() {
    const { data: categoryData } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('slug', category)
      .single();

    if (!categoryData) {
      console.error('Category not found');
      return;
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        author:profiles(username),
        comments_count:forum_comments(count)
      `)
      .eq('category_id', categoryData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    setPosts(data || []);
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create a post');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        setError('Please complete your profile before creating a post');
        navigate('/profile');
        return;
      }

      const { data: categoryData } = await supabase
        .from('forum_categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (!categoryData) {
        setError('Category not found');
        return;
      }

      const { error: insertError } = await supabase
        .from('forum_posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          category_id: categoryData.id,
          author_id: user.id
        });

      if (insertError) {
        setError('Error creating post');
        console.error('Error creating post:', insertError);
        return;
      }

      setNewPost({ title: '', content: '' });
      setIsCreating(false);
      fetchPosts();
    } catch (err) {
      setError('An error occurred');
      console.error('Error:', err);
    }
  }

  const categoryTitles: Record<string, string> = {
    war: 'Wojna',
    trade: 'Handel',
    diplomacy: 'Dyplomacja',
    general: 'Dyskusja Ogólna',
  };

  return (
    <div className="bg-blue-900/50 rounded-lg p-6 backdrop-blur-sm border border-gold-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-500">{categoryTitles[category]}</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-yellow-500 text-blue-900 rounded-md hover:bg-yellow-400 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nowy Post
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreatePost} className="mb-8 bg-blue-900/70 p-6 rounded-lg border border-gold-500">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-yellow-300 mb-2">
              Tytuł
            </label>
            <input
              type="text"
              id="title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full bg-blue-800 border border-gold-500 rounded-md p-2 text-yellow-100"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-yellow-300 mb-2">
              Treść
            </label>
            <textarea
              id="content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="w-full bg-blue-800 border border-gold-500 rounded-md p-2 text-yellow-100 h-32"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-yellow-300 hover:text-yellow-500"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-md hover:bg-yellow-400"
            >
              Utwórz Post
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => navigate(`/forum/${category}/${post.id}`)}
            className="bg-blue-900/70 p-6 rounded-lg border border-gold-500 cursor-pointer hover:bg-blue-800/70 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-yellow-500">{post.title}</h2>
              <div className="flex items-center text-yellow-300">
                <MessageSquare className="w-4 h-4 mr-1" />
                <span>{post.comments_count.count}</span>
              </div>
            </div>
            <p className="text-yellow-100 mb-4 line-clamp-2">{post.content}</p>
            <div className="flex justify-between items-center text-sm text-yellow-300">
              <span>Autor: {post.author.username}</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}