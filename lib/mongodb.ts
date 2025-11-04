import mongoose from "mongoose";

// Define the structure for the cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type to include our mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Retrieve MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Validate that the MongoDB URI is defined
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env",
  );
}

/**
 * Global cache to store the MongoDB connection.
 * In development, Next.js hot reloading can cause multiple connections
 * to be created. Using a global cache prevents this issue.
 */
let cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

// Store the cache in the global object for persistence across hot reloads
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes and returns a cached MongoDB connection using Mongoose.
 *
 * @returns {Promise<typeof mongoose>} The Mongoose instance with an active connection
 *
 * @example
 * ```typescript
 * import connectDB from '@/lib/mongodb';
 *
 * export async function GET() {
 *   await connectDB();
 *   // Your database operations here
 * }
 * ```
 */
async function connectDB(): Promise<typeof mongoose> {
  // If connection already exists, return it immediately
  if (cached.conn) {
    return cached.conn;
  }

  // If no promise exists, create a new connection promise
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
    };

    // Create connection promise and cache it
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    // Await the connection promise and cache the connection
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the promise on error to allow retry
    cached.promise = null;
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
}

export default connectDB;
