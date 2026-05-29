require("dotenv").config();

const connectDB = require("./db");
const { success, error, handleOptions } = require("./utils/response");
const { parseBody } = require("./utils/validation");
const { comparePassword, signToken } = require("./utils/auth");

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

    if (!username || !password) {
      return error(400, "Username and password are required");
    }

    const collection = await connectDB("users");
    const user = await collection.findOne({ username });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return error(401, "Invalid credentials");
    }

    const token = signToken({
      userId: String(user._id),
      username: user.username,
    });

    return success(200, { token, username: user.username });
  } catch (err) {
    if (err.statusCode) {
      return error(err.statusCode, err.message, err.field ? { field: err.field } : undefined);
    }

    console.error(err);
    return error(500, "Internal server error");
  }
};
