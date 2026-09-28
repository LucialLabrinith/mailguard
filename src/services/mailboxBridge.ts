import { EmailItem, EmailCategory, SecurityStatus } from '../types';

export interface EmailQueryOptions {
  category?: EmailCategory | 'all';
  status?: SecurityStatus | 'all';
  search?: string;
  source?: string;
  limit?: number;
  forceRefresh?: boolean;
}

interface CacheEntry {
  data: EmailItem[];
  timestamp: number;
  etag?: string;
}

export interface IngestPayload {
  fromName?: string;
  fromEmail: string;
  toEmail?: string;
  subject: string;
  bodyText: string;
  rawHeaders?: string;
  sourceApp?: 'gmail' | 'docs' | 'm365' | 'outlook' | 'yahoo' | 'corporate';
}

/**
 * Mailbox Bridge: High-performance caching, request deduplication,
 * and batch ingestion bridge between the frontend and backend.
 */
class MailboxBridge {
  private cache = new Map<string, CacheEntry>();
  private inFlightRequests = new Map<string, Promise<EmailItem[]>>();
  private ingestQueue: { payload: IngestPayload; resolve: (item: EmailItem) => void; reject: (err: any) => void }[] = [];
  private ingestBatchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly defaultTTL = 45000; // 45 seconds cache TTL
  private globalEtag: string | null = null;

  /**
   * Generates a stable key for cache entries based on query options
   */
  private generateCacheKey(opts: EmailQueryOptions): string {
    return `${opts.source || 'all'}:${opts.category || 'all'}:${opts.status || 'all'}:${(opts.search || '').trim().toLowerCase()}:${opts.limit || 0}`;
  }

  /**
   * Retrieves emails using an intelligent caching layer with ETag support
   * and in-flight request deduplication to prevent redundant network fetches.
   */
  public async getEmails(options: EmailQueryOptions = {}): Promise<EmailItem[]> {
    const key = this.generateCacheKey(options);
    const now = Date.now();
    const cached = this.cache.get(key);

    // Cache hit: Valid within TTL and no forceRefresh
    if (!options.forceRefresh && cached && (now - cached.timestamp < this.defaultTTL)) {
      return cached.data;
    }

    // Request Deduplication: Reuse pending network promise for identical query
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        const queryParams = new URLSearchParams();
        if (options.category && options.category !== 'all') queryParams.set('category', options.category);
        if (options.status && options.status !== 'all') queryParams.set('status', options.status);
        if (options.search) queryParams.set('search', options.search);
        if (options.source && options.source !== 'all') queryParams.set('source', options.source);
        if (options.limit) queryParams.set('limit', String(options.limit));

        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };

        if (cached?.etag) {
          headers['If-None-Match'] = cached.etag;
        }

        const url = `/api/emails${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await fetch(url, { headers });

        // HTTP 304 Not Modified: Cache is still fresh, avoid reprocessing
        if (res.status === 304 && cached) {
          cached.timestamp = now;
          return cached.data;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch emails: ${res.status} ${res.statusText}`);
        }

        const etag = res.headers.get('ETag') || undefined;
        if (etag) this.globalEtag = etag;

        const data = await res.json();
        const emails: EmailItem[] = Array.isArray(data.emails) ? data.emails : [];

        // Save to cache
        this.cache.set(key, {
          data: emails,
          timestamp: now,
          etag,
        });

        return emails;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Queue a single email ingestion with micro-batching.
   * Collates rapid successive additions into a single backend batch call.
   */
  public async queueIngestEmail(payload: IngestPayload): Promise<EmailItem> {
    return new Promise<EmailItem>((resolve, reject) => {
      this.ingestQueue.push({ payload, resolve, reject });

      if (!this.ingestBatchTimeout) {
        this.ingestBatchTimeout = setTimeout(() => {
          this.flushIngestQueue();
        }, 50); // 50ms batching window
      }
    });
  }

  /**
   * Flushes the queued email ingestion payloads into a single batch HTTP request.
   */
  private async flushIngestQueue(): Promise<void> {
    this.ingestBatchTimeout = null;
    const batch = [...this.ingestQueue];
    this.ingestQueue = [];

    if (batch.length === 0) return;

    try {
      const itemsToIngest = batch.map(b => b.payload);
      const ingested = await this.batchIngestEmails(itemsToIngest);

      // Invalidate query caches since data changed
      this.invalidateCache();

      batch.forEach((entry, idx) => {
        const result = ingested[idx] || ingested[0];
        if (result) {
          entry.resolve(result);
        } else {
          entry.reject(new Error('Ingestion did not return expected item'));
        }
      });
    } catch (err) {
      batch.forEach(entry => entry.reject(err));
    }
  }

  /**
   * Direct Batch Ingestion API:
   * Sends multiple emails in a single request to `/api/emails/batch-ingest`
   * avoiding multiple roundtrips and significantly boosting ingestion performance.
   */
  public async batchIngestEmails(payloads: IngestPayload[]): Promise<EmailItem[]> {
    if (!payloads.length) return [];

    const res = await fetch('/api/emails/batch-ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: payloads }),
    });

    if (!res.ok) {
      // Fallback: If batch endpoint is unavailable or fails, ingest sequentially or fallback
      const singleRes = await fetch('/api/emails/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[0]),
      });
      if (singleRes.ok) {
        const item = await singleRes.json();
        this.invalidateCache();
        return [item];
      }
      throw new Error(`Batch ingestion failed: ${res.statusText}`);
    }

    const data = await res.json();
    const result: EmailItem[] = Array.isArray(data.emails) ? data.emails : (data.email ? [data.email] : []);

    // Invalidate caches to ensure fresh data in views
    this.invalidateCache();
    return result;
  }

  /**
   * Invalidates all or specific cache entries when mutations occur
   */
  public invalidateCache(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Updates an email optimistically in the local cache
   */
  public updateCachedEmail(updatedEmail: EmailItem): void {
    for (const [key, entry] of this.cache.entries()) {
      const index = entry.data.findIndex(e => e.id === updatedEmail.id);
      if (index !== -1) {
        const updatedData = [...entry.data];
        updatedData[index] = updatedEmail;
        this.cache.set(key, { ...entry, data: updatedData });
      }
    }
  }
}

export const mailboxBridge = new MailboxBridge();
