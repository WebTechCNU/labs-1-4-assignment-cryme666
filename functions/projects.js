require("dotenv").config();

const { ObjectId } = require("mongodb");
const connectDB = require("./db");
const { success, error, handleOptions } = require("./utils/response");
const { requireAuthFromEvent } = require("./utils/auth");
const {
  isValidObjectId,
  parsePagination,
  parseSort,
  parseBody,
  validateProjectBody,
  extractIdFromPath,
} = require("./utils/validation");

const PROJECT_SORT_FIELDS = ["name", "createdAt", "updatedAt"];

async function listProjects(event) {
  const collection = await connectDB("projects");
  const queryParams = event.queryStringParameters || {};
  const { search, sortField, sortOrder, skip, take } = queryParams;
  const query = search ? { name: new RegExp(search, "i") } : {};
  const sort = parseSort({ sortField, sortOrder }, PROJECT_SORT_FIELDS);
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

async function createProject(event) {
  const collection = await connectDB("projects");
  const body = parseBody(event);
  const data = validateProjectBody(body);
  const now = new Date();

  const project = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(project);
  const created = await collection.findOne({ _id: result.insertedId });

  return success(201, created);
}

async function getProject(id) {
  const collection = await connectDB("projects");
  const tasksCollection = await connectDB("tasks");
  const project = await collection.findOne({ _id: new ObjectId(id) });

  if (!project) {
    return error(404, "Project not found");
  }

  const taskCount = await tasksCollection.countDocuments({
    projectId: new ObjectId(id),
  });

  return success(200, { ...project, taskCount });
}

async function updateProject(id, event) {
  const collection = await connectDB("projects");
  const body = parseBody(event);
  const data = validateProjectBody(body, true);

  if (Object.keys(data).length === 0) {
    return error(400, "No valid fields to update");
  }

  data.updatedAt = new Date();

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );

  if (!result) {
    return error(404, "Project not found");
  }

  return success(200, result);
}

async function deleteProject(id) {
  const collection = await connectDB("projects");
  const tasksCollection = await connectDB("tasks");
  const objectId = new ObjectId(id);

  const project = await collection.findOne({ _id: objectId });
  if (!project) {
    return error(404, "Project not found");
  }

  const deleteTasksResult = await tasksCollection.deleteMany({
    projectId: objectId,
  });
  await collection.deleteOne({ _id: objectId });

  return success(200, {
    deletedProject: 1,
    deletedTasks: deleteTasksResult.deletedCount,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }

  try {
    const id = extractIdFromPath(event);
    const method = event.httpMethod;
    const writeMethods = ["POST", "PUT", "DELETE"];

    if (writeMethods.includes(method)) {
      requireAuthFromEvent(event);
    }

    if (method === "GET" && !id) {
      return await listProjects(event);
    }

    if (method === "POST" && !id) {
      return await createProject(event);
    }

    if (id) {
      if (!isValidObjectId(id)) {
        return error(400, "Invalid ID format");
      }

      if (method === "GET") {
        return await getProject(id);
      }

      if (method === "PUT") {
        return await updateProject(id, event);
      }

      if (method === "DELETE") {
        return await deleteProject(id);
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
