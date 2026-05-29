export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8888"
    : "https://labs-1-4-assignment-cryme666.netlify.app");
