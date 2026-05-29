import { API_BASE_URL } from "./config.js";
import { getToken } from "./auth.js";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else if (response.status !== 204) {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      data && data.error ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getProjects(params) {
  return request(`/projects${buildQuery(params)}`);
}

export function createProject(data) {
  return request("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getProject(id) {
  return request(`/projects/${id}`);
}

export function updateProject(id, data) {
  return request(`/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProject(id) {
  return request(`/projects/${id}`, { method: "DELETE" });
}

export function getTasks(params) {
  return request(`/tasks${buildQuery(params)}`);
}

export function createTask(data) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getTask(id) {
  return request(`/tasks/${id}`);
}

export function updateTask(id, data) {
  return request(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: "DELETE" });
}
