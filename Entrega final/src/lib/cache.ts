import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Server-side in-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry {
    data: string;          // JSON string
    timestamp: number;
    etag: string;
}

const store = new Map<string, CacheEntry>();

/**
 * Retrieve a value from the cache if it exists and hasn't expired.
 */
export function cacheGet(key: string, ttlMs: number): CacheEntry | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
        store.delete(key);
        return null;
    }
    return entry;
}

/**
 * Store a value in the cache.
 */
export function cacheSet(key: string, jsonString: string): CacheEntry {
    const etag = generateETag(jsonString);
    const entry: CacheEntry = { data: jsonString, timestamp: Date.now(), etag };
    store.set(key, entry);
    return entry;
}

/**
 * Invalidate all cache entries whose keys start with the given prefix.
 */
export function cacheInvalidate(prefix: string): void {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }
}

// ---------------------------------------------------------------------------
// ETag generation
// ---------------------------------------------------------------------------

function generateETag(content: string): string {
    return `"${createHash('md5').update(content).digest('hex')}"`;
}

// ---------------------------------------------------------------------------
// Compressed response builder
// ---------------------------------------------------------------------------

/**
 * Build an optimised Response for JSON data.
 *
 * 1. Checks If-None-Match → returns 304 if ETag matches.
 * 2. Compresses with gzip when the client supports it.
 * 3. Sets Cache-Control, ETag and Vary headers.
 */
export function compressedJsonResponse(
    request: Request,
    jsonString: string,
    etag: string,
    cacheControlHeader: string,
    status = 200,
): Response {
    // --- 304 Not Modified ---------------------------------------------------
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch && ifNoneMatch === etag) {
        return new Response(null, {
            status: 304,
            headers: {
                'ETag': etag,
                'Cache-Control': cacheControlHeader,
            },
        });
    }

    // --- Determine if client accepts gzip -----------------------------------
    const acceptEncoding = request.headers.get('Accept-Encoding') || '';
    const supportsGzip = acceptEncoding.includes('gzip');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': cacheControlHeader,
        'ETag': etag,
        'Vary': 'Accept-Encoding',
    };

    if (supportsGzip) {
        const compressed = gzipSync(Buffer.from(jsonString, 'utf-8'));
        headers['Content-Encoding'] = 'gzip';
        return new Response(compressed, { status, headers });
    }

    // Fallback: uncompressed
    return new Response(jsonString, { status, headers });
}
