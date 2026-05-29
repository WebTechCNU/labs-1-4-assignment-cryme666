import { useCallback, useEffect, useState } from "react";
import { getProjects } from "./api/graphqlClient.js";
import ProjectsPanel from "./components/ProjectsPanel.jsx";
import TasksPanel from "./components/TasksPanel.jsx";
import Toast from "./components/Toast.jsx";

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  }, []);

  const loadAllProjects = useCallback(async () => {
    try {
      const data = await getProjects({ take: 100, sortField: "name", sortOrder: "asc" });
      setAllProjects(data.items);
    } catch (err) {
      showToast(err.message, "error");
    }
  }, [showToast]);

  useEffect(() => {
    loadAllProjects();
  }, [loadAllProjects, refreshKey]);

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Task Manager</h1>
        <p className="mt-1 text-blue-100">
          React + Tailwind frontend with GraphQL API
        </p>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[360px_1fr]">
        <ProjectsPanel
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onToast={showToast}
          onProjectsUpdated={() => setRefreshKey((k) => k + 1)}
        />
        <TasksPanel
          selectedProjectId={selectedProjectId}
          allProjects={allProjects}
          onToast={showToast}
          onTasksUpdated={() => setRefreshKey((k) => k + 1)}
        />
      </main>

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
