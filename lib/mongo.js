import { MongoClient } from 'mongodb';

const g = globalThis;
const client = g._mongoClient ?? new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
if (process.env.NODE_ENV !== 'production') g._mongoClient = client;

export async function mongoDb() {
  await client.connect();
  return client.db(process.env.MONGODB_DB || 'investitrack_nosql');
}
