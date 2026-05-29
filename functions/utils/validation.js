const { ObjectId } = require("mongodb");

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

function parsePagination(query = {}) {
  const skip = Number.isInteger(parseInt(query.skip, 10))
    ? parseInt(query.skip, 10)
    : 0;
  const take = Number.isInteger(parseInt(query.take, 10))
    ? parseInt(query.take, 10)
    : 20;

  return {
    skip: Math.max(skip, 0),
    take: Math.min(Math.max(take, 1), 100),
  };
}

function parseSort(query = {}, allowedFields = []) {
  const sortField = allowedFields.includes(query.sortField)
    ? query.sortField
    : null;
  const sortOrder = query.sortOrder === "desc" ? -1 : 1;

  return sortField ? { [sortField]: sortOrder } : {};
}

function parseBody(event) {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch {
    const err = new Error("Invalid JSON");
    err.statusCode = 400;
    throw err;
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    const err = new Error(`${field} is required`);
    err.statusCode = 400;
    err.field = field;
    throw err;
  }
  return value.trim();
}

function validateProjectBody(body, isUpdate = false) {
  const data = {};

  if (!isUpdate || body.name !== undefined) {
    data.name = requireString(body.name, "name");
  }

  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string" ? body.description.trim() : "";
  } else if (!isUpdate) {
    data.description = "";
  }

  return data;
}

const TASK_STATUSES = ["todo", "in-progress", "done"];
const TASK_PRIORITIES = ["low", "medium", "high"];

function validateTaskBody(body, isUpdate = false) {
  const data = {};

  if (!isUpdate || body.title !== undefined) {
    data.title = requireString(body.title, "title");
  }

  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string" ? body.description.trim() : "";
  } else if (!isUpdate) {
    data.description = "";
  }

  if (!isUpdate || body.projectId !== undefined) {
    if (!body.projectId || !isValidObjectId(body.projectId)) {
      const err = new Error("Valid projectId is required");
      err.statusCode = 400;
      err.field = "projectId";
      throw err;
    }
    data.projectId = new ObjectId(body.projectId);
  }

  if (body.status !== undefined) {
    if (!TASK_STATUSES.includes(body.status)) {
      const err = new Error("Invalid status value");
      err.statusCode = 400;
      err.field = "status";
      throw err;
    }
    data.status = body.status;
  } else if (!isUpdate) {
    data.status = "todo";
  }

  if (body.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(body.priority)) {
      const err = new Error("Invalid priority value");
      err.statusCode = 400;
      err.field = "priority";
      throw err;
    }
    data.priority = body.priority;
  } else if (!isUpdate) {
    data.priority = "medium";
  }

  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === "") {
      data.dueDate = null;
    } else {
      const dueDate = new Date(body.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        const err = new Error("Invalid dueDate value");
        err.statusCode = 400;
        err.field = "dueDate";
        throw err;
      }
      data.dueDate = dueDate;
    }
  } else if (!isUpdate) {
    data.dueDate = null;
  }

  return data;
}

function extractIdFromPath(event) {
  const path = event.path || "";
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  if (!lastSegment || lastSegment === "projects" || lastSegment === "tasks") {
    return null;
  }

  return lastSegment;
}

module.exports = {
  isValidObjectId,
  parsePagination,
  parseSort,
  parseBody,
  validateProjectBody,
  validateTaskBody,
  extractIdFromPath,
  TASK_STATUSES,
  TASK_PRIORITIES,
};
