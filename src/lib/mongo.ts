import { MongoClient, type Db } from 'mongodb';
import { env } from '../config/env';
import { logger } from '../config/logger';

declare global {
    var __mongoClient: MongoClient | undefined;
    var __mongoDb: Db | undefined;
}

let connectPromise: Promise<MongoClient> | undefined;
let mongoClient: MongoClient | undefined = global.__mongoClient;

async function getMongoClient(): Promise<MongoClient> {
    if (mongoClient) return mongoClient;

    if (!connectPromise) {
        logger.info({ dbName: env.MONGODB_DB_NAME }, 'Connecting to MongoDB');
        connectPromise = new MongoClient(env.MONGODB_URL).connect().then(
            (client) => {
                mongoClient = client;
                logger.info(
                    { dbName: env.MONGODB_DB_NAME },
                    'MongoDB connected',
                );
                return client;
            },
        );
    }

    const client = await connectPromise;

    if (process.env.NODE_ENV !== 'production') {
        global.__mongoClient = client;
    }

    return client;
}

export async function getMongoDb(): Promise<Db> {
    if (global.__mongoDb) return global.__mongoDb;

    const client = await getMongoClient();
    const db = client.db(env.MONGODB_DB_NAME);
    logger.debug({ dbName: env.MONGODB_DB_NAME }, 'MongoDB database selected');

    if (process.env.NODE_ENV !== 'production') {
        global.__mongoDb = db;
    }

    return db;
}

export async function ensureMongoConnection() {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    logger.info({ dbName: env.MONGODB_DB_NAME }, 'MongoDB connection ready');
}

export async function disconnectMongo() {
    const client =
        mongoClient ??
        global.__mongoClient ??
        (connectPromise ? await connectPromise : undefined);
    if (!client) return;

    await client.close();
    mongoClient = undefined;
    logger.debug({ dbName: env.MONGODB_DB_NAME }, 'MongoDB client closed');
    connectPromise = undefined;
    global.__mongoClient = undefined;
    global.__mongoDb = undefined;
}
