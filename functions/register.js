require("dotenv").config();

const connectDB = require("./db");
const { success, error, handleOptions } = require("./utils/response");
const { parseBody } = require("./utils/validation");
const { hashPassword, signToken } = require("./utils/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }

  if (event.httpMethod !== "POST") {
    return error(405, "Method not allowed");
  }

  try {
    const body = parseBody(event);
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (username.length < 3) {
      return error(400, "Username must be at least 3 characters");
    }

    if (password.length < 6) {
      return error(400, "Password must be at least 6 characters");
    }

    const collection = await connectDB("users");
    await collection.createIndex({ username: 1 }, { unique: true });

    const existing = await collection.findOne({ username });
    if (existing) {
      return error(409, "Username already exists");
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    const result = await collection.insertOne({
      username,
      passwordHash,
      createdAt: now,
    });

    const token = signToken({
      userId: String(result.insertedId),
      username,
    });

    return success(201, { token, username });
  } catch (err) {
    if (err.statusCode) {
      return error(err.statusCode, err.message, err.field ? { field: err.field } : undefined);
    }

    console.error(err);
    return error(500, "Internal server error");
  }
};
