import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db.js';
import { fetchAndSaveFeed } from '../../../lib/rss.js';

export const POST: APIRoute = async () => {
    try {
        const db = await connectDB();
        const feeds = await db.collection('feeds').find().toArray();

        let successCount = 0;
        let failCount = 0;

        for (const feed of feeds) {
            const result = await fetchAndSaveFeed(feed.url);
            if (result.success) successCount++;
            else failCount++;
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Sync complete. ${successCount} successful, ${failCount} failed.`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};
