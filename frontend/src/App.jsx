import { useCallback, useEffect, useState } from "react";
import { decodeUsernameFromToken, isAuthenticated } from "./api/auth.js";
import { getProjects } from "./api/graphqlClient.js";
import AuthPanel from "./components/AuthPanel.jsx";
import ProjectsPanel from "./components/ProjectsPanel.jsx";
import TasksPanel from "./components/TasksPanel.jsx";
import Toast from "./components/Toast.jsx";

function isAuthError(message) {
  return /unauthorized|forbidden|please log in/i.test(message || "");
}

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [auth, setAuth] = useState(isAuthenticated());
  const [username, setUsername] = useState(
    isAuthenticated() ? decodeUsernameFromToken() : null
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  }, []);

  const handleApiError = useCallback(
    (err) => {
      if (isAuthError(err.message)) {
        showToast("Please log in first", "error");
      } else {
        showToast(err.message, "error");
      }
    },
    [showToast]
  );

  const loadAllProjects = useCallback(async () => {
    try {
      const data = await getProjects({ take: 100, sortField: "name", sortOrder: "asc" });
      setAllProjects(data.items);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  useEffect(() => {
    loadAllProjects();
  }, [loadAllProjects, refreshKey]);

  const handleAuthChange = useCallback((loggedIn, nextUsername) => {
    setAuth(loggedIn);
    setUsername(nextUsername);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleToast = useCallback(
    (message, type = "success") => {
      if (type === "error" && isAuthError(message)) {
        showToast("Please log in first", "error");
      } else {
        showToast(message, type);
      }
    },
    [showToast]
  );

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Task Manager</h1>
            <p className="mt-1 text-blue-100">
              GraphQL API with JWT authentication
            </p>
            {auth && username && (
              <p className="mt-1 text-sm text-blue-200">Session: {username}</p>
            )}
          </div>
          <AuthPanel onAuthChange={handleAuthChange} onToast={showToast} />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[360px_1fr]">
        <ProjectsPanel
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onToast={handleToast}
          onProjectsUpdated={() => setRefreshKey((k) => k + 1)}
        />
        <TasksPanel
          selectedProjectId={selectedProjectId}
          allProjects={allProjects}
          onToast={handleToast}
          onTasksUpdated={() => setRefreshKey((k) => k + 1)}
        />
      </main>

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
