const { MongoClient, Int32 } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const dbName = 'investitrack_nosql';

(async () => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try { await client.connect(); }
  catch (e) { console.error('Cannot connect to MongoDB. Is the MongoDB service running?\n' + e.message); process.exit(1); }
  const db = client.db(dbName);
  await db.dropDatabase();

  await db.createCollection('investor_notes', {
    validator: { $jsonSchema: {
      bsonType: 'object',
      required: ['investor_id', 'title', 'created_at'],
      properties: {
        investor_id: { bsonType: 'int' }, title: { bsonType: 'string' },
        body: { bsonType: 'string' },
        tags: { bsonType: 'array', items: { bsonType: 'string' } },
        symbol: { bsonType: 'string' }, created_at: { bsonType: 'date' },
      },
    } },
  });
  await db.createCollection('trade_audit');

  const notes = db.collection('investor_notes');
  const audit = db.collection('trade_audit');
  await notes.createIndex({ investor_id: 1, created_at: -1 });
  await notes.createIndex({ tags: 1 });
  await notes.createIndex({ title: 'text', body: 'text' });
  await audit.createIndex({ portfolio_id: 1, at: -1 });

  await notes.insertMany([
    { investor_id: new Int32(1), title: 'Infosys results', body: 'Strong Q2 guidance, add on dips.',
      tags: ['IT', 'earnings'], symbol: 'INFY', created_at: new Date() },
    { investor_id: new Int32(2), title: 'Retirement plan', body: 'Shift 20% to debt funds by 2030.',
      tags: ['retirement', 'debt'], created_at: new Date() },
  ]);
  await audit.insertOne({ portfolio_id: 1, symbol: 'INFY', type: 'BUY', qty: 10, price: 1650, status: 'OK', at: new Date() });

  const show = (label, data) => { console.log('\n> ' + label); console.dir(data, { depth: null }); };
  show('show collections', (await db.listCollections().toArray()).map((c) => c.name));
  show('db.investor_notes.find()', await notes.find().toArray());
  show('db.trade_audit.find()', await audit.find().toArray());
  show('db.investor_notes.find({ tags: "earnings" })', await notes.find({ tags: 'earnings' }).toArray());
  show('db.investor_notes.find({ $text: { $search: "debt" } })', await notes.find({ $text: { $search: 'debt' } }).toArray());
  show('db.trade_audit.aggregate($group by status)', await audit.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray());
  try { await notes.insertOne({ title: 'Invalid note', created_at: new Date() }); }
  catch (e) { show('Validator rejects a note without investor_id', e.message); }

  console.log('\nMongoDB setup complete: ' + dbName);
  await client.close();
})();