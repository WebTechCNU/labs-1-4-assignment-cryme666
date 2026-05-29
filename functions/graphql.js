require("dotenv").config();

const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const { ApolloServer, gql } = require("apollo-server-express");
const { GraphQLError } = require("graphql");
const { ObjectId } = require("mongodb");
const connectDB = require("./db");
const {
  isValidObjectId,
  parsePagination,
  parseSort,
  validateProjectBody,
  validateTaskBody,
} = require("./utils/validation");

const PROJECT_SORT_FIELDS = ["name", "createdAt", "updatedAt"];
const TASK_SORT_FIELDS = [
  "title",
  "status",
  "priority",
  "dueDate",
  "createdAt",
  "updatedAt",
];

const typeDefs = gql`
  type Project {
    _id: ID!
    name: String!
    description: String
    createdAt: String
    updatedAt: String
    taskCount: Int
  }

  type Task {
    _id: ID!
    projectId: ID!
    title: String!
    description: String
    status: String!
    priority: String!
    dueDate: String
    createdAt: String
    updatedAt: String
    project: Project
  }

  type ProjectsResult {
    items: [Project!]!
    total: Int!
    skip: Int!
    take: Int!
  }

  type TasksResult {
    items: [Task!]!
    total: Int!
    skip: Int!
    take: Int!
  }

  type DeleteProjectResult {
    deletedProject: Int!
    deletedTasks: Int!
  }

  type Query {
    projects(
      search: String
      skip: Int
      take: Int
      sortField: String
      sortOrder: String
    ): ProjectsResult!
    project(id: ID!): Project
    tasks(
      projectId: ID
      status: String
      priority: String
      search: String
      skip: Int
      take: Int
      sortField: String
      sortOrder: String
    ): TasksResult!
    task(id: ID!): Task
  }

  type Mutation {
    createProject(name: String!, description: String): Project!
    updateProject(id: ID!, name: String, description: String): Project!
    deleteProject(id: ID!): DeleteProjectResult!
    createTask(
      projectId: ID!
      title: String!
      description: String
      status: String
      priority: String
      dueDate: String
    ): Task!
    updateTask(
      id: ID!
      projectId: ID
      title: String
      description: String
      status: String
      priority: String
      dueDate: String
    ): Task!
    deleteTask(id: ID!): Boolean!
  }
`;

function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapProject(doc, taskCount) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    name: doc.name,
    description: doc.description ?? "",
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
    taskCount: taskCount ?? undefined,
  };
}

function mapTask(doc, projectDoc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    projectId: String(doc.projectId),
    title: doc.title,
    description: doc.description ?? "",
    status: doc.status,
    priority: doc.priority,
    dueDate: toIso(doc.dueDate),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
    project: projectDoc ? mapProject(projectDoc) : null,
  };
}

function assertValidId(id) {
  if (!isValidObjectId(id)) {
    throw new GraphQLError("Invalid ID format");
  }
}

function wrapError(err) {
  if (err instanceof GraphQLError) {
    throw err;
  }
  if (err.statusCode) {
    throw new GraphQLError(err.message);
  }
  console.error(err);
  throw new GraphQLError("Internal server error");
}

const resolvers = {
  Query: {
    projects: async (_, args) => {
      try {
        const collection = await connectDB("projects");
        const { search, sortField, sortOrder, skip, take } = args;
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

        return {
          items: items.map((doc) => mapProject(doc)),
          total,
          skip: pagination.skip,
          take: pagination.take,
        };
      } catch (err) {
        wrapError(err);
      }
    },

    project: async (_, { id }) => {
      try {
        assertValidId(id);
        const collection = await connectDB("projects");
        const tasksCollection = await connectDB("tasks");
        const project = await collection.findOne({ _id: new ObjectId(id) });
        if (!project) {
          throw new GraphQLError("Project not found");
        }
        const taskCount = await tasksCollection.countDocuments({
          projectId: new ObjectId(id),
        });
        return mapProject(project, taskCount);
      } catch (err) {
        wrapError(err);
      }
    },

    tasks: async (_, args) => {
      try {
        const collection = await connectDB("tasks");
        const {
          projectId,
          status,
          priority,
          search,
          sortField,
          sortOrder,
          skip,
          take,
        } = args;

        const query = {};

        if (projectId) {
          assertValidId(projectId);
          query.projectId = new ObjectId(projectId);
        }
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (search) query.title = new RegExp(search, "i");

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

        return {
          items: items.map((doc) => mapTask(doc)),
          total,
          skip: pagination.skip,
          take: pagination.take,
        };
      } catch (err) {
        wrapError(err);
      }
    },

    task: async (_, { id }) => {
      try {
        assertValidId(id);
        const collection = await connectDB("tasks");
        const projectsCollection = await connectDB("projects");
        const task = await collection.findOne({ _id: new ObjectId(id) });
        if (!task) {
          throw new GraphQLError("Task not found");
        }
        const project = await projectsCollection.findOne({ _id: task.projectId });
        return mapTask(task, project);
      } catch (err) {
        wrapError(err);
      }
    },
  },

  Mutation: {
    createProject: async (_, { name, description }) => {
      try {
        const collection = await connectDB("projects");
        const data = validateProjectBody({ name, description });
        const now = new Date();
        const project = { ...data, createdAt: now, updatedAt: now };
        const result = await collection.insertOne(project);
        const created = await collection.findOne({ _id: result.insertedId });
        return mapProject(created);
      } catch (err) {
        wrapError(err);
      }
    },

    updateProject: async (_, { id, name, description }) => {
      try {
        assertValidId(id);
        const collection = await connectDB("projects");
        const data = validateProjectBody({ name, description }, true);
        if (Object.keys(data).length === 0) {
          throw new GraphQLError("No valid fields to update");
        }
        data.updatedAt = new Date();
        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: data },
          { returnDocument: "after" }
        );
        if (!result) {
          throw new GraphQLError("Project not found");
        }
        return mapProject(result);
      } catch (err) {
        wrapError(err);
      }
    },

    deleteProject: async (_, { id }) => {
      try {
        assertValidId(id);
        const collection = await connectDB("projects");
        const tasksCollection = await connectDB("tasks");
        const objectId = new ObjectId(id);
        const project = await collection.findOne({ _id: objectId });
        if (!project) {
          throw new GraphQLError("Project not found");
        }
        const deleteTasksResult = await tasksCollection.deleteMany({
          projectId: objectId,
        });
        await collection.deleteOne({ _id: objectId });
        return {
          deletedProject: 1,
          deletedTasks: deleteTasksResult.deletedCount,
        };
      } catch (err) {
        wrapError(err);
      }
    },

    createTask: async (_, args) => {
      try {
        const collection = await connectDB("tasks");
        const projectsCollection = await connectDB("projects");
        const data = validateTaskBody(args);
        const project = await projectsCollection.findOne({ _id: data.projectId });
        if (!project) {
          throw new GraphQLError("Project not found");
        }
        const now = new Date();
        const task = { ...data, createdAt: now, updatedAt: now };
        const result = await collection.insertOne(task);
        const created = await collection.findOne({ _id: result.insertedId });
        return mapTask(created, project);
      } catch (err) {
        wrapError(err);
      }
    },

    updateTask: async (_, { id, ...fields }) => {
      try {
        assertValidId(id);
        const collection = await connectDB("tasks");
        const projectsCollection = await connectDB("projects");
        const data = validateTaskBody(fields, true);
        if (Object.keys(data).length === 0) {
          throw new GraphQLError("No valid fields to update");
        }
        if (data.projectId) {
          const project = await projectsCollection.findOne({ _id: data.projectId });
          if (!project) {
            throw new GraphQLError("Project not found");
          }
        }
        data.updatedAt = new Date();
        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: data },
          { returnDocument: "after" }
        );
        if (!result) {
          throw new GraphQLError("Task not found");
        }
        const project = await projectsCollection.findOne({ _id: result.projectId });
        return mapTask(result, project);
      } catch (err) {
        wrapError(err);
      }
    },

    deleteTask: async (_, { id }) => {
      try {
        assertValidId(id);
        const collection = await connectDB("tasks");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          throw new GraphQLError("Task not found");
        }
        return true;
      } catch (err) {
        wrapError(err);
      }
    },
  },
};

const app = express();
app.use(cors());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req }),
});

let handler;
const ready = (async () => {
  await server.start();
  server.applyMiddleware({ app, path: "/graphql", cors: false });
  handler = serverless(app);
})();

exports.handler = async (event, context) => {
  await ready;
  return handler(event, context);
};
