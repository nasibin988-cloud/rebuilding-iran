export async function register() {
  // Only run on the Node.js server runtime (not Edge, not client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const STARTUP_DELAY_MS = 15_000; // wait for server to be ready

    const doRefresh = async () => {
      try {
        const port = process.env.PORT || 3000;
        // Always use localhost for internal self-calls (avoids routing through reverse proxy)
        const baseUrl = `http://localhost:${port}`;
        const res = await fetch(`${baseUrl}/api/news/refresh`);
        if (!res.ok) {
          console.error(`[news-cron] Refresh failed: HTTP ${res.status}`);
        } else {
          const data = await res.json();
          console.log(`[news-cron] Refreshed: ${data.new_articles ?? 0} RSS new, ${data.telegram_new ?? 0} telegram new`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[news-cron] Refresh error: ${msg}`);
      }
    };

    // Wait for refresh to finish, then wait 5 min, then refresh again (no overlap)
    // Wrapped in try/catch so the loop NEVER dies, even on unexpected errors
    const loop = async () => {
      console.log('[news-cron] Starting background news refresh (every 5 min)');
      while (true) {
        try {
          await doRefresh();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[news-cron] Loop error (will retry): ${msg}`);
        }
        await new Promise(r => setTimeout(r, INTERVAL_MS));
      }
    };

    setTimeout(loop, STARTUP_DELAY_MS);
  }
}
