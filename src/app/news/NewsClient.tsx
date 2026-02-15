'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  curriculum_links: { section: string; title: string }[];
  source_biases: string | null;
  published_at: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'politics', label: 'Politics' },
  { id: 'economy', label: 'Economy' },
  { id: 'society', label: 'Society' },
  { id: 'diaspora', label: 'Diaspora' },
  { id: 'analysis', label: 'Analysis' },
];

export default function NewsClient() {
  const supabase = createClient();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    loadArticles();
  }, [category]);

  const loadArticles = async () => {
    setLoading(true);

    let query = supabase
      .from('news_articles')
      .select('id, title, content, category, curriculum_links, source_biases, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(50);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    setArticles((data as NewsArticle[]) || []);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">News</h1>
            <Link href="/" className="text-neutral-400 hover:text-white text-sm">
              ← Curriculum
            </Link>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400">No news articles yet.</p>
            <p className="text-neutral-500 text-sm mt-2">Check back later for updates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 cursor-pointer hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-400 capitalize">
                        {article.category}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(article.published_at)}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">{article.title}</h2>
                    <p className="text-neutral-400 text-sm line-clamp-2">
                      {article.content.slice(0, 200)}...
                    </p>

                    {article.curriculum_links && article.curriculum_links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.curriculum_links.slice(0, 3).map((link, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded text-xs"
                          >
                            {link.section}: {link.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-400 capitalize">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {formatDate(selectedArticle.published_at)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1 hover:bg-neutral-800 rounded transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">{selectedArticle.title}</h1>

                {selectedArticle.source_biases && (
                  <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800/50 rounded text-sm text-amber-200">
                    <span className="font-medium">Source Note:</span> {selectedArticle.source_biases}
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  {selectedArticle.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-neutral-300 mb-4">{paragraph}</p>
                  ))}
                </div>

                {selectedArticle.curriculum_links && selectedArticle.curriculum_links.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-400 mb-3">
                      Related Curriculum
                    </h3>
                    <div className="space-y-2">
                      {selectedArticle.curriculum_links.map((link, i) => (
                        <Link
                          key={i}
                          href={`/lecture/${link.section}`}
                          className="block p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"
                        >
                          <span className="text-amber-400 text-sm">{link.section}</span>
                          <span className="text-white ml-2">{link.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
