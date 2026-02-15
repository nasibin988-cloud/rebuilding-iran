'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  content: string;
  upvotes: number;
  created_at: string;
  parent_id: string | null;
  user: {
    username: string;
    display_name: string | null;
  };
  replies?: Comment[];
  userVote?: number;
}

interface Props {
  lectureSlug: string;
}

export default function Discussion({ lectureSlug }: Props) {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadComments();
  }, [lectureSlug]);

  const loadComments = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('discussions')
      .select(`
        id, content, upvotes, created_at, parent_id,
        user:profiles!user_id(username, display_name)
      `)
      .eq('lecture_slug', lectureSlug)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (data) {
      // Organize into threads
      const topLevel: Comment[] = [];
      const replies: Record<string, Comment[]> = {};

      for (const d of data as unknown as Comment[]) {
        if (d.parent_id) {
          if (!replies[d.parent_id]) replies[d.parent_id] = [];
          replies[d.parent_id].push(d);
        } else {
          topLevel.push(d);
        }
      }

      // Attach replies to parents
      for (const comment of topLevel) {
        comment.replies = replies[comment.id] || [];
      }

      setComments(topLevel);
    }

    setLoading(false);
  };

  const handleSubmit = async (parentId?: string) => {
    if (!user || !profile) return;

    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from('discussions')
      .insert({
        lecture_slug: lectureSlug,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select(`
        id, content, upvotes, created_at, parent_id,
        user:profiles!user_id(username, display_name)
      `)
      .single();

    if (!error && data) {
      if (parentId) {
        setComments(prev =>
          prev.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), data as unknown as Comment] };
            }
            return c;
          })
        );
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setComments(prev => [data as unknown as Comment, ...prev]);
        setNewComment('');
      }
    }

    setSubmitting(false);
  };

  const handleVote = async (commentId: string, vote: number) => {
    if (!user) return;

    // Optimistic update
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return { ...c, upvotes: c.upvotes + vote, userVote: vote };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => {
              if (r.id === commentId) {
                return { ...r, upvotes: r.upvotes + vote, userVote: vote };
              }
              return r;
            }),
          };
        }
        return c;
      })
    );

    await supabase
      .from('discussion_votes')
      .upsert({ discussion_id: commentId, user_id: user.id, vote });
  };

  const handleReport = async (commentId: string) => {
    if (!user) return;

    const reason = prompt('Please describe why you are reporting this comment:');
    if (!reason) return;

    await supabase.from('reports').insert({
      reporter_id: user.id,
      discussion_id: commentId,
      reason,
    });

    alert('Report submitted. Thank you for helping keep the community safe.');
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-neutral-800 pl-4' : ''}`}>
      <div className="flex items-start gap-3 py-3">
        <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
          {(comment.user?.display_name || comment.user?.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-white">
              {comment.user?.display_name || comment.user?.username}
            </span>
            <span className="text-neutral-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-neutral-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleVote(comment.id, 1)}
                className={`p-1 rounded hover:bg-neutral-800 transition-colors ${
                  comment.userVote === 1 ? 'text-green-400' : 'text-neutral-500'
                }`}
                disabled={!user}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              </button>
              <span className={`text-sm ${comment.upvotes > 0 ? 'text-green-400' : comment.upvotes < 0 ? 'text-red-400' : 'text-neutral-500'}`}>
                {comment.upvotes}
              </span>
              <button
                onClick={() => handleVote(comment.id, -1)}
                className={`p-1 rounded hover:bg-neutral-800 transition-colors ${
                  comment.userVote === -1 ? 'text-red-400' : 'text-neutral-500'
                }`}
                disabled={!user}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </button>
            </div>
            {!isReply && user && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                Reply
              </button>
            )}
            {user && (
              <button
                onClick={() => handleReport(comment.id)}
                className="text-sm text-neutral-500 hover:text-red-400 transition-colors"
              >
                Report
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(comment.id)}
                  disabled={submitting || !replyContent.trim()}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="border-t border-neutral-800 mt-8 pt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-lg font-semibold text-white mb-4"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
        Discussion ({comments.length})
      </button>

      {expanded && (
        <>
          {/* New comment form */}
          {user ? (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this lecture..."
                rows={3}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-neutral-900 border border-neutral-800 rounded-lg text-center">
              <p className="text-neutral-400 mb-2">Sign in to join the discussion</p>
              <a href="/login" className="text-amber-500 hover:text-amber-400">
                Sign in →
              </a>
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            <div className="divide-y divide-neutral-800">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
