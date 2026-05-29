import { useState } from "react";
import {
  decodeUsernameFromToken,
  isAuthenticated,
  login,
  logout,
  register,
} from "../api/auth.js";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export default function AuthPanel({ onAuthChange, onToast }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(
    auth ? decodeUsernameFromToken() : null
  );

  const handleSuccess = (data) => {
    setAuth(true);
    setCurrentUser(data.username);
    setUsername("");
    setPassword("");
    onAuthChange?.(true, data.username);
    onToast?.(`Welcome, ${data.username}!`, "success");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data =
        mode === "login"
          ? await login(username, password)
          : await register(username, password);
      handleSuccess(data);
    } catch (err) {
      onToast?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setAuth(false);
    setCurrentUser(null);
    onAuthChange?.(false, null);
    onToast?.("Logged out", "success");
  };

  if (auth) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-blue-100">
          Logged in as <strong className="text-white">{currentUser}</strong>
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/30"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
            mode === "login"
              ? "bg-white text-blue-700"
              : "text-blue-100 hover:bg-white/10"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
            mode === "register"
              ? "bg-white text-blue-700"
              : "text-blue-100 hover:bg-white/10"
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs text-blue-100">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            required
            minLength={mode === "register" ? 3 : 1}
            autoComplete="username"
          />
        </div>
        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs text-blue-100">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
            minLength={mode === "register" ? 6 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
        >
          {loading ? "..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
    </div>
  );
}
