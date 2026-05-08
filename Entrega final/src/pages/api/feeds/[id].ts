import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db.js';
import { ObjectId } from 'mongodb';
import { cacheInvalidate } from '../../../lib/cache.js';

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const db = await connectDB();
        const id = params.id;
        if (!id) {
            return new Response(JSON.stringify({ error: 'Feed ID is required' }), { status: 400 });
        }

        const objectId = new ObjectId(id);

        await db.collection('articles').deleteMany({ feedId: objectId });
        await db.collection('feeds').deleteOne({ _id: objectId });

        // Invalidate caches since data changed
        cacheInvalidate('feeds:');
        cacheInvalidate('articles:');

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};
