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

    // Calculate ms until the next clock time divisible by 5 minutes
    // e.g. if it's 14:07:23, wait until 14:10:00
    const msUntilNext5 = () => {
      const now = Date.now();
      const fiveMin = 5 * 60 * 1000;
      const next = Math.ceil(now / fiveMin) * fiveMin;
      return next - now;
    };

    const loop = async () => {
      console.log('[news-cron] Starting background news refresh (every 5 min, clock-aligned)');
      // First refresh immediately on startup
      await doRefresh();
      while (true) {
        // Sleep until next :00, :05, :10, :15, :20, :25, :30, :35, :40, :45, :50, :55
        const waitMs = msUntilNext5();
        const nextTime = new Date(Date.now() + waitMs);
        console.log(`[news-cron] Next refresh at ${nextTime.toISOString().slice(11, 16)} UTC (in ${Math.round(waitMs / 1000)}s)`);
        await new Promise(r => setTimeout(r, waitMs));
        try {
          await doRefresh();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[news-cron] Loop error (will retry): ${msg}`);
        }
      }
    };

    setTimeout(loop, STARTUP_DELAY_MS);
  }
}
