import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db.js';
import { fetchAndSaveFeed } from '../../../lib/rss.js';
import { cacheGet, cacheSet, cacheInvalidate, compressedJsonResponse } from '../../../lib/cache.js';

const FEEDS_CACHE_KEY = 'feeds:list';
const FEEDS_TTL_MS = 60_000; // 60 seconds
const FEEDS_CACHE_CONTROL = 'public, max-age=30, stale-while-revalidate=60';

export const GET: APIRoute = async ({ request }) => {
    try {
        // 1. Check server cache
        const cached = cacheGet(FEEDS_CACHE_KEY, FEEDS_TTL_MS);
        if (cached) {
            return compressedJsonResponse(request, cached.data, cached.etag, FEEDS_CACHE_CONTROL);
        }

        // 2. Cache miss — query MongoDB with projection (only needed fields)
        const db = await connectDB();
        const feeds = await db.collection('feeds')
            .find({}, { projection: { url: 1, title: 1, description: 1, createdAt: 1, lastFetched: 1 } })
            .sort({ createdAt: -1 })
            .toArray();

        const jsonString = JSON.stringify(feeds);
        const entry = cacheSet(FEEDS_CACHE_KEY, jsonString);

        return compressedJsonResponse(request, entry.data, entry.etag, FEEDS_CACHE_CONTROL);
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        // Just to initialize the connection early
        await connectDB();
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return new Response(JSON.stringify({ error: 'Feed URL is required' }), { status: 400 });
        }

        // Attempt to fetch right away to validate and save
        const result = await fetchAndSaveFeed(url);
        if (!result.success) {
            return new Response(JSON.stringify({ error: 'Failed to fetch or parse the RSS feed' }), { status: 400 });
        }

        // Invalidate caches since data changed
        cacheInvalidate('feeds:');
        cacheInvalidate('articles:');

        return new Response(JSON.stringify({ success: true, message: 'Feed added and synchronized.' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};
