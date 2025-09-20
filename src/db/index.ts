import mongoose from "mongoose";

const uri = process.env.MONGODB_URI!;

export const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed", err);
    process.exit(1); // exit if DB can’t connect
  }
};
