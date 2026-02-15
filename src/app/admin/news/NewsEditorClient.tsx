'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

interface Submission {
  id: string;
  raw_content: string;
  source_channel: string | null;
  status: string;
  created_at: string;
}

interface ProcessedArticle {
  title: string;
  content: string;
  category: string;
  curriculum_links: { section: string; title: string }[];
  source_biases: string | null;
}

const CATEGORIES = ['politics', 'economy', 'society', 'diaspora', 'analysis'];

export default function NewsEditorClient() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [rawContent, setRawContent] = useState('');
  const [sourceChannel, setSourceChannel] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessedArticle | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'pending' | 'published'>('submit');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [isLoading, user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadSubmissions();
    }
  }, [isAdmin]);

  const loadSubmissions = async () => {
    const { data } = await supabase
      .from('news_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setSubmissions((data as Submission[]) || []);
  };

  const handleSubmit = async () => {
    if (!rawContent.trim()) return;

    setProcessing(true);

    // Save to submissions table
    const { data: submission } = await supabase
      .from('news_submissions')
      .insert({
        raw_content: rawContent,
        source_channel: sourceChannel || null,
        status: 'processing',
      })
      .select()
      .single();

    // Call AI processing API
    try {
      const response = await fetch('/api/process-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rawContent,
          sourceChannel,
        }),
      });

      if (response.ok) {
        const processed = await response.json();
        setProcessedResult(processed);

        // Update submission status
        if (submission) {
          await supabase
            .from('news_submissions')
            .update({ status: 'processed' })
            .eq('id', submission.id);
        }
      } else {
        throw new Error('Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);

      // For now, create a simple processed version
      setProcessedResult({
        title: rawContent.split('\n')[0].slice(0, 100),
        content: rawContent,
        category: 'politics',
        curriculum_links: [],
        source_biases: sourceChannel ? `Source: ${sourceChannel}` : null,
      });
    }

    setProcessing(false);
  };

  const handlePublish = async () => {
    if (!processedResult) return;

    setPublishing(true);

    await supabase.from('news_articles').insert({
      title: processedResult.title,
      content: processedResult.content,
      category: processedResult.category,
      curriculum_links: processedResult.curriculum_links,
      source_biases: processedResult.source_biases,
      is_published: true,
      published_at: new Date().toISOString(),
      original_sources: [{ channel: sourceChannel, raw: rawContent }],
    });

    // Reset form
    setRawContent('');
    setSourceChannel('');
    setProcessedResult(null);
    setPublishing(false);

    alert('Article published!');
    loadSubmissions();
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">News Editor</h1>
            <p className="text-neutral-400">Submit and process news from Telegram</p>
          </div>
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
            ← Admin Panel
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-neutral-900 rounded-lg p-1 w-fit">
          {(['submit', 'pending', 'published'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-amber-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'submit' && (
          <div className="space-y-6">
            {/* Input Form */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Submit News</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Source Channel (optional)
                  </label>
                  <input
                    type="text"
                    value={sourceChannel}
                    onChange={(e) => setSourceChannel(e.target.value)}
                    placeholder="e.g., @IranIntl, @ManotoNews"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Raw Content
                  </label>
                  <textarea
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    placeholder="Paste news content from Telegram here..."
                    rows={10}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={processing || !rawContent.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing with AI...' : 'Process Content'}
                </button>
              </div>
            </div>

            {/* Processed Result */}
            {processedResult && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Processed Article</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={processedResult.title}
                      onChange={(e) => setProcessedResult({ ...processedResult, title: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Category
                    </label>
                    <select
                      value={processedResult.category}
                      onChange={(e) => setProcessedResult({ ...processedResult, category: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Content
                    </label>
                    <textarea
                      value={processedResult.content}
                      onChange={(e) => setProcessedResult({ ...processedResult, content: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Source Bias Notes
                    </label>
                    <input
                      type="text"
                      value={processedResult.source_biases || ''}
                      onChange={(e) => setProcessedResult({ ...processedResult, source_biases: e.target.value })}
                      placeholder="Note any potential biases..."
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {publishing ? 'Publishing...' : 'Publish Article'}
                    </button>
                    <button
                      onClick={() => setProcessedResult(null)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Pending Submissions</h2>
            {submissions.filter(s => s.status !== 'processed').length === 0 ? (
              <p className="text-neutral-400">No pending submissions</p>
            ) : (
              <div className="space-y-4">
                {submissions.filter(s => s.status !== 'processed').map(sub => (
                  <div key={sub.id} className="p-4 bg-neutral-800 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        sub.status === 'processing'
                          ? 'bg-yellow-900/50 text-yellow-300'
                          : 'bg-neutral-700 text-neutral-300'
                      }`}>
                        {sub.status}
                      </span>
                      {sub.source_channel && (
                        <span className="text-xs text-neutral-500">{sub.source_channel}</span>
                      )}
                      <span className="text-xs text-neutral-500">
                        {new Date(sub.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-neutral-300 text-sm line-clamp-3">{sub.raw_content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'published' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recently Published</h2>
            <p className="text-neutral-400">
              View published articles on the{' '}
              <Link href="/news" className="text-amber-500 hover:text-amber-400">
                News page
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
