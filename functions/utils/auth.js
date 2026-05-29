const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { GraphQLError } = require("graphql");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function extractToken(event) {
  const header = event.headers?.authorization || event.headers?.Authorization;
  return header?.split(" ")[1] || null;
}

function extractTokenFromRequest(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization;
  return header?.split(" ")[1] || null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function requireAuthFromEvent(event) {
  const token = extractToken(event);
  if (!token) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }

  try {
    return verifyToken(token);
  } catch {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
}

function assertAuthenticated(context) {
  if (!context.user) {
    throw new GraphQLError("Unauthorized", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

module.exports = {
  signToken,
  verifyToken,
  extractToken,
  extractTokenFromRequest,
  hashPassword,
  comparePassword,
  requireAuthFromEvent,
  assertAuthenticated,
};
