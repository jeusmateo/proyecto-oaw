import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db.js';
import { fetchAndSaveFeed } from '../../../lib/rss.js';

export const GET: APIRoute = async () => {
    try {
        const db = await connectDB();
        const feeds = await db.collection('feeds').find().sort({ createdAt: -1 }).toArray();
        return new Response(JSON.stringify(feeds), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
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

        return new Response(JSON.stringify({ success: true, message: 'Feed added and synchronized.' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};
