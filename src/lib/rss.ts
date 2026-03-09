import { ObjectId } from 'mongodb';
import Parser from 'rss-parser';
import { connectDB } from './db.js';

const parser = new Parser();

export async function fetchAndSaveFeed(feedUrl: string) {
    try {
        const db = await connectDB();
        const feedsCollection = db.collection('feeds');
        const articlesCollection = db.collection('articles');

        const parsedFeed = await parser.parseURL(feedUrl);

        // Upsert Feed
        const now = new Date();
        const updateResult = await feedsCollection.findOneAndUpdate(
            { url: feedUrl },
            {
                $set: {
                    title: parsedFeed.title,
                    description: parsedFeed.description,
                    lastFetched: now,
                },
                $setOnInsert: {
                    url: feedUrl,
                    createdAt: now
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        const feedId = updateResult?._id;
        if (!feedId) throw new Error("Could not upsert feed");

        // Save articles
        if (parsedFeed.items && feedId) {
            for (const item of parsedFeed.items) {
                if (!item.link) continue;

                const pubDate = item.isoDate ? new Date(item.isoDate) : (item.pubDate ? new Date(item.pubDate) : new Date());

                await articlesCollection.updateOne(
                    { link: item.link },
                    {
                        $set: {
                            feedId: feedId,
                            title: item.title || 'Untitled',
                            link: item.link,
                            pubDate: pubDate,
                            description: item.contentSnippet || item.content || item.summary || '',
                            categories: item.categories || [],
                            updatedAt: now
                        },
                        $setOnInsert: {
                            createdAt: now
                        }
                    },
                    { upsert: true }
                );
            }
        }
        return { success: true, feedTitle: parsedFeed.title };
    } catch (error) {
        console.error(`Error parsing feed ${feedUrl}:`, error);
        return { success: false, error: String(error) };
    }
}
