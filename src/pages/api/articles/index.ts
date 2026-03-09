import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db.js';

export const GET: APIRoute = async ({ request }) => {
    try {
        const db = await connectDB();
        const url = new URL(request.url);
        const search = url.searchParams.get('q') || '';
        const sortBy = url.searchParams.get('sortBy') || 'pubDate';
        const sortOrder = url.searchParams.get('sortOrder') || 'desc';
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);

        const query: any = {};
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ];
        }

        const sortObj: any = {};
        const validSortFields = ['pubDate', 'title', 'feedId', 'createdAt'];
        const field = validSortFields.includes(sortBy) ? sortBy : 'pubDate';
        sortObj[field] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const aggregationPipeline: any[] = [
            { $match: query },
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'feeds',
                    localField: 'feedId',
                    foreignField: '_id',
                    as: 'feedInfo'
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
            {
                $project: {
                    feedInfo: 0
                }
            }
        ];

        const [articles, total] = await Promise.all([
            db.collection('articles').aggregate(aggregationPipeline).toArray(),
            db.collection('articles').countDocuments(query)
        ]);

        return new Response(JSON.stringify({
            articles,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
};
