import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = import.meta.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Global cache for mongodb connection to prevent HMR issues
let cachedClient = (global as any).mongoClient;
let cachedDb = (global as any).mongoDb;
let isConnecting = false;
let connectPromise: Promise<Db> | null = null;

export async function connectDB(): Promise<Db> {
    if (cachedClient && cachedDb) {
        return cachedDb;
    }

    if (isConnecting && connectPromise) {
        return connectPromise;
    }

    isConnecting = true;

    connectPromise = (async () => {
        try {
            console.log('Connecting to Native MongoDB...');
            const client = new MongoClient(MONGODB_URI as string, {
                serverSelectionTimeoutMS: 5000 // fail fast if db is down
            });
            await client.connect();

            // Extract DB name from URI or fallback
            // We'll let the driver decide the default DB based on the URI, or default to rss_reader
            const db = client.db();

            // Setup indexes
            await db.collection('feeds').createIndex({ url: 1 }, { unique: true });
            await db.collection('articles').createIndex({ link: 1 }, { unique: true });
            await db.collection('articles').createIndex({ feedId: 1 });
            await db.collection('articles').createIndex({ pubDate: -1 });

            cachedClient = (global as any).mongoClient = client;
            cachedDb = (global as any).mongoDb = db;

            console.log('MongoDB native connected successfully');
            isConnecting = false;
            return db;
        } catch (error) {
            isConnecting = false;
            connectPromise = null;
            console.error('Error connecting to MongoDB native:', error);
            throw error;
        }
    })();

    return connectPromise;
}
