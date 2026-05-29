import { API_BASE_URL } from "./config.js";

const TOKEN_KEY = "auth_token";
const USERNAME_KEY = "auth_username";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function setStoredUsername(username) {
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

async function authRequest(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export async function login(username, password) {
  const data = await authRequest("/login", { username, password });
  setToken(data.token);
  setStoredUsername(data.username);
  return data;
}

export async function register(username, password) {
  const data = await authRequest("/register", { username, password });
  setToken(data.token);
  setStoredUsername(data.username);
  return data;
}

export function logout() {
  clearToken();
}

export function decodeUsernameFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || null;
  } catch {
    return getStoredUsername();
  }
}
