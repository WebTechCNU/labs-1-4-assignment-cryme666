require("dotenv").config();

const { ObjectId } = require("mongodb");
const connectDB = require("./db");
const { success, error, handleOptions } = require("./utils/response");
const {
  isValidObjectId,
  parsePagination,
  parseSort,
  parseBody,
  validateTaskBody,
  extractIdFromPath,
} = require("./utils/validation");

const TASK_SORT_FIELDS = ["title", "status", "priority", "dueDate", "createdAt", "updatedAt"];

async function listTasks(event) {
  const collection = await connectDB("tasks");
  const queryParams = event.queryStringParameters || {};
  const {
    projectId,
    status,
    priority,
    search,
    sortField,
    sortOrder,
    skip,
    take,
  } = queryParams;

  const query = {};

  if (projectId) {
    if (!isValidObjectId(projectId)) {
      return error(400, "Invalid projectId format");
    }
    query.projectId = new ObjectId(projectId);
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (search) {
    query.title = new RegExp(search, "i");
  }

  const sort = parseSort({ sortField, sortOrder }, TASK_SORT_FIELDS);
  const pagination = parsePagination({ skip, take });

  const [items, total] = await Promise.all([
    collection
      .find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.take)
      .toArray(),
    collection.countDocuments(query),
  ]);

  return success(200, {
    items,
    total,
    skip: pagination.skip,
    take: pagination.take,
  });
}

async function createTask(event) {
  const collection = await connectDB("tasks");
  const projectsCollection = await connectDB("projects");
  const body = parseBody(event);
  const data = validateTaskBody(body);

  const project = await projectsCollection.findOne({ _id: data.projectId });
  if (!project) {
    return error(404, "Project not found");
  }

  const now = new Date();
  const task = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(task);
  const created = await collection.findOne({ _id: result.insertedId });

  return success(201, created);
}

async function getTask(id) {
  const collection = await connectDB("tasks");
  const projectsCollection = await connectDB("projects");
  const task = await collection.findOne({ _id: new ObjectId(id) });

  if (!task) {
    return error(404, "Task not found");
  }

  const project = await projectsCollection.findOne(
    { _id: task.projectId },
    { projection: { name: 1 } }
  );

  return success(200, {
    ...task,
    project: project
      ? { id: project._id, name: project.name }
      : null,
  });
}

async function updateTask(id, event) {
  const collection = await connectDB("tasks");
  const projectsCollection = await connectDB("projects");
  const body = parseBody(event);
  const data = validateTaskBody(body, true);

  if (Object.keys(data).length === 0) {
    return error(400, "No valid fields to update");
  }

  if (data.projectId) {
    const project = await projectsCollection.findOne({ _id: data.projectId });
    if (!project) {
      return error(404, "Project not found");
    }
  }

  data.updatedAt = new Date();

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );

  if (!result) {
    return error(404, "Task not found");
  }

  return success(200, result);
}

async function deleteTask(id) {
  const collection = await connectDB("tasks");
  const result = await collection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return error(404, "Task not found");
  }

  return success(200, { deletedTask: 1 });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }

  try {
    const id = extractIdFromPath(event);
    const method = event.httpMethod;

    if (method === "GET" && !id) {
      return await listTasks(event);
    }

    if (method === "POST" && !id) {
      return await createTask(event);
    }

    if (id) {
      if (!isValidObjectId(id)) {
        return error(400, "Invalid ID format");
      }

      if (method === "GET") {
        return await getTask(id);
      }

      if (method === "PUT") {
        return await updateTask(id, event);
      }

      if (method === "DELETE") {
        return await deleteTask(id);
      }
    }

    return error(405, "Method not allowed");
  } catch (err) {
    if (err.statusCode) {
      return error(err.statusCode, err.message, err.field ? { field: err.field } : undefined);
    }

    console.error(err);
    return error(500, "Internal server error");
  }
};
