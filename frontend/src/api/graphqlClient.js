import { graphqlRequest } from "./graphql.js";
import {
  CREATE_PROJECT,
  CREATE_TASK,
  DELETE_PROJECT,
  DELETE_TASK,
  GET_PROJECT,
  GET_PROJECTS,
  GET_TASK,
  GET_TASKS,
  UPDATE_PROJECT,
  UPDATE_TASK,
} from "./queries.js";

export async function getProjects(params = {}) {
  const data = await graphqlRequest(GET_PROJECTS, params);
  return data.projects;
}

export async function getProject(id) {
  const data = await graphqlRequest(GET_PROJECT, { id });
  return data.project;
}

export async function createProject(input) {
  const data = await graphqlRequest(CREATE_PROJECT, input);
  return data.createProject;
}

export async function updateProject(id, input) {
  const data = await graphqlRequest(UPDATE_PROJECT, { id, ...input });
  return data.updateProject;
}

export async function deleteProject(id) {
  const data = await graphqlRequest(DELETE_PROJECT, { id });
  return data.deleteProject;
}

export async function getTasks(params = {}) {
  const data = await graphqlRequest(GET_TASKS, params);
  return data.tasks;
}

export async function getTask(id) {
  const data = await graphqlRequest(GET_TASK, { id });
  return data.task;
}

export async function createTask(input) {
  const data = await graphqlRequest(CREATE_TASK, input);
  return data.createTask;
}

export async function updateTask(id, input) {
  const data = await graphqlRequest(UPDATE_TASK, { id, ...input });
  return data.updateTask;
}

export async function deleteTask(id) {
  const data = await graphqlRequest(DELETE_TASK, { id });
  return data.deleteTask;
}
