import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db.js';
import { cacheGet, cacheSet, cacheInvalidate, compressedJsonResponse } from '../../../lib/cache.js';

const ARTICLES_CACHE_PREFIX = 'articles:';
const ARTICLES_TTL_MS = 30_000; // 30 seconds
const ARTICLES_CACHE_CONTROL = 'public, max-age=15, stale-while-revalidate=30';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const search = url.searchParams.get('q') || '';
        const sortBy = url.searchParams.get('sortBy') || 'pubDate';
        const sortOrder = url.searchParams.get('sortOrder') || 'desc';
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);

        // --- Cache key based on all query params ---
        const cacheKey = `${ARTICLES_CACHE_PREFIX}${search}|${sortBy}|${sortOrder}|${page}|${limit}`;

        // 1. Check server cache
        const cached = cacheGet(cacheKey, ARTICLES_TTL_MS);
        if (cached) {
            return compressedJsonResponse(request, cached.data, cached.etag, ARTICLES_CACHE_CONTROL);
        }

        // 2. Cache miss — build query and execute
        const db = await connectDB();
        const result = await queryArticles(db, search, sortBy, sortOrder, page, limit);

        const jsonString = JSON.stringify(result);
        const entry = cacheSet(cacheKey, jsonString);

        return compressedJsonResponse(request, entry.data, entry.etag, ARTICLES_CACHE_CONTROL);
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};

// ---------------------------------------------------------------------------
// Query logic with $text → $regex fallback
// ---------------------------------------------------------------------------

async function queryArticles(
    db: any,
    search: string,
    sortBy: string,
    sortOrder: string,
    page: number,
    limit: number,
) {
    const validSortFields = ['pubDate', 'title', 'feedId', 'createdAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'pubDate';
    const sortObj: Record<string, 1 | -1> = { [field]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    // --- Build match query ---
    let query: any = {};
    let usedTextSearch = false;

    if (search) {
        // Try $text first (uses text index, much faster)
        query = { $text: { $search: search } };
        usedTextSearch = true;
    }

    // --- Aggregation with $facet (single DB round-trip for data + count) ---
    const pipeline: any[] = [
        { $match: query },
        {
            $facet: {
                articles: [
                    { $sort: sortObj },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: 'feeds',
                            localField: 'feedId',
                            foreignField: '_id',
                            as: 'feedInfo',
                            pipeline: [{ $project: { _id: 1, title: 1, url: 1 } }]
                        }
                    },
                    {
                        $unwind: {
                            path: '$feedInfo',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {
                            feedId: {
                                _id: '$feedInfo._id',
                                title: '$feedInfo.title',
                                url: '$feedInfo.url'
                            }
                        }
                    },
                    { $project: { feedInfo: 0 } }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ];

    let result = await db.collection('articles').aggregate(pipeline).toArray();
    let articles = result[0]?.articles || [];
    let total = result[0]?.totalCount?.[0]?.count || 0;

    // --- Fallback: if $text returned nothing and there was a search term, try $regex ---
    if (usedTextSearch && articles.length === 0 && search) {
        const searchRegex = new RegExp(search, 'i');
        query = {
            $or: [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        };

        pipeline[0] = { $match: query };
        result = await db.collection('articles').aggregate(pipeline).toArray();
        articles = result[0]?.articles || [];
        total = result[0]?.totalCount?.[0]?.count || 0;
    }

    return {
        articles,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
