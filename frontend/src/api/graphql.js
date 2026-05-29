import { API_BASE_URL } from "./config.js";
import { getToken } from "./auth.js";

const GRAPHQL_URL = `${API_BASE_URL}/graphql`;

export async function graphqlRequest(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}
