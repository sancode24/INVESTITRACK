// Run: mongosh < db/mongo_setup.js
use investitrack_nosql
db.dropDatabase()

db.createCollection("investor_notes", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["investor_id", "title", "created_at"],
    properties: {
      investor_id: { bsonType: "int" },
      title:       { bsonType: "string" },
      body:        { bsonType: "string" },
      tags:        { bsonType: "array", items: { bsonType: "string" } },
      symbol:      { bsonType: "string" },
      created_at:  { bsonType: "date" }
    }
  }}
})
db.createCollection("trade_audit")

db.investor_notes.createIndex({ investor_id: 1, created_at: -1 })
db.investor_notes.createIndex({ tags: 1 })
db.investor_notes.createIndex({ title: "text", body: "text" })
db.trade_audit.createIndex({ portfolio_id: 1, at: -1 })

db.investor_notes.insertMany([
  { investor_id: NumberInt(1), title: "Infosys results", body: "Strong Q2 guidance, add on dips.",
    tags: ["IT", "earnings"], symbol: "INFY", created_at: new Date() },
  { investor_id: NumberInt(2), title: "Retirement plan", body: "Shift 20% to debt funds by 2030.",
    tags: ["retirement", "debt"], created_at: new Date() }
])
db.trade_audit.insertOne({ portfolio_id: 1, symbol: "INFY", type: "BUY", qty: 10,
  price: 1650, status: "OK", at: new Date() })

// ---- Sample queries ----
db.investor_notes.find().sort({ created_at: -1 })
db.investor_notes.find({ investor_id: 1 })
db.investor_notes.find({ tags: "earnings" })
db.investor_notes.find({ $text: { $search: "debt" } })
db.trade_audit.find({ status: "FAILED" }).sort({ at: -1 })
db.trade_audit.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
