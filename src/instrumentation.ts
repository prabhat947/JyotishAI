// DNS override for Supabase — ISP (Jio/Reliance) DNS blocks supabase.co
// This forces Node.js to resolve the Supabase host to the correct Cloudflare IP
// Only active in development; on production (Dokploy), DNS works normally

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'production') {
    const SUPABASE_HOST = 'mzzqsjdcqhfpjhtlrejg.supabase.co';
    const SUPABASE_IP = '104.18.38.10';

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dns = require('dns');
      const originalLookup = dns.lookup;

      dns.lookup = function patchedLookup(
        hostname: string,
        optionsOrCb: unknown,
        maybeCb?: unknown
      ) {
        if (hostname === SUPABASE_HOST) {
          // Handle both dns.lookup(host, cb) and dns.lookup(host, opts, cb)
          const callback = typeof maybeCb === 'function' ? maybeCb : optionsOrCb;
          if (typeof callback === 'function') {
            process.nextTick(() => (callback as Function)(null, SUPABASE_IP, 4));
            return;
          }
        }
        // Forward to original with correct arg count
        if (typeof maybeCb === 'function') {
          return originalLookup.call(dns, hostname, optionsOrCb, maybeCb);
        }
        return originalLookup.call(dns, hostname, optionsOrCb);
      };

      console.log(`[DNS Fix] Patched dns.lookup: ${SUPABASE_HOST} → ${SUPABASE_IP}`);
    } catch (e) {
      console.warn('[DNS Fix] Failed to patch dns.lookup:', e);
    }
  }
}
