import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Send } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: {
    username: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
  };
}

export default function PostDetails() {
  const { category, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  async function fetchPost() {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:profiles(username)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .select(`
          *,
          author:profiles(username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to comment');
      }

      const { error: insertError } = await supabase
        .from('forum_comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          author_id: user.id
        });

      if (insertError) throw insertError;

      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsLoading(false);
    }
  }

  if (!post) {
    return (
      <div className="bg-blue-900/50 rounded-lg p-6 backdrop-blur-sm border border-gold-500">
        <div className="text-yellow-500 text-center">Loading post...</div>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/50 rounded-lg p-6 backdrop-blur-sm border border-gold-500">
      <button
        onClick={() => navigate(`/forum/${category}`)}
        className="flex items-center text-yellow-300 hover:text-yellow-500 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to {category}
      </button>

      <div className="bg-blue-900/70 p-6 rounded-lg border border-gold-500 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-yellow-500">{post.title}</h1>
          <div className="text-sm text-yellow-300">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
        <p className="text-yellow-100 mb-4 whitespace-pre-wrap">{post.content}</p>
        <div className="text-sm text-yellow-300">
          Posted by {post.author.username}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-8">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-blue-900/50 p-4 rounded-lg border border-gold-500">
            <p className="text-yellow-100 mb-2">{comment.content}</p>
            <div className="flex justify-between items-center text-sm text-yellow-300">
              <span>{comment.author.username}</span>
              <span>{new Date(comment.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmitComment} className="flex gap-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-blue-800 border border-gold-500 rounded-md p-2 text-yellow-100"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !newComment.trim()}
          className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-md hover:bg-yellow-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5 mr-2" />
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}