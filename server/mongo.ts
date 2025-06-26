import { MongoClient, Db, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "facetrack";

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (!client || !db) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB:", uri, "DB:", dbName);
  }
  return db;
}

export async function disconnectFromDatabase() {
  if (client) {
    await client.close();
    client = undefined as any;
    db = undefined as any;
  }
}

// Force-create all required collections by inserting a dummy document into each

export async function ensureAllCollections() {
  try {
    console.log("[DEBUG] ensureAllCollections called");
    const db = await connectToDatabase();
    console.log("[DEBUG] ensureAllCollections: connected to DB");
    const requiredCollections = [
      "students",
      "student_attendance_logs",
      "student_absent_logs",
      "student_delay_logs",
      "faculties",
      "faculty_attendance_logs",
      "faculty_absent_logs",
      "faculty_delay_logs",
      "train_images",
      "admin_users"
    ];
    // Get existing collection names
    const existingCollectionsCursor = await db.listCollections().toArray();
    const existingCollectionNames = existingCollectionsCursor.map(col => col.name);
    console.log("[DEBUG] Existing collections:", existingCollectionNames);
    for (const name of requiredCollections) {
      if (!existingCollectionNames.includes(name)) {
        await db.createCollection(name);
        console.log(`[DEBUG] Created collection: ${name}`);
      } else {
        console.log(`[DEBUG] Collection already exists: ${name}`);
      }
    }
    console.log("[DEBUG] All required collections are ensured.");
  } catch (error) {
    console.error("[DEBUG] Error ensuring collections:", error);
  }
}
