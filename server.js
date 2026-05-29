require("dotenv").config();

const express = require("express");
const cors = require("cors");
const projectsHandler = require("./functions/projects").handler;
const tasksHandler = require("./functions/tasks").handler;
const helloHandler = require("./functions/hello").handler;

const app = express();

app.use(cors());
app.use(express.json());

function toNetlifyEvent(req) {
  return {
    httpMethod: req.method,
    path: req.path,
    body:
      req.body && Object.keys(req.body).length > 0
        ? JSON.stringify(req.body)
        : null,
    queryStringParameters: Object.keys(req.query).length ? req.query : null,
  };
}

async function invoke(handler, req, res) {
  try {
    const result = await handler(toNetlifyEvent(req));
    Object.entries(result.headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(result.statusCode).send(result.body ?? "");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.all("/projects/:id?", (req, res) => invoke(projectsHandler, req, res));
app.all("/tasks/:id?", (req, res) => invoke(tasksHandler, req, res));
app.all("/hello", (req, res) => invoke(helloHandler, req, res));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Task Manager API listening on port ${PORT}`);
});
