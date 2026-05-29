import { useCallback, useEffect, useState } from "react";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "../api/client.js";
import { useDebounce } from "../hooks/useDebounce.js";
import Pagination from "./Pagination.jsx";

const PAGE_SIZE = 5;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export default function ProjectsPanel({
  selectedProjectId,
  onSelectProject,
  onToast,
  onProjectsUpdated,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects({
        search: debouncedSearch.trim(),
        sortField,
        sortOrder: "desc",
        skip,
        take: PAGE_SIZE,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortField, skip, onToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    setSkip(0);
  }, [debouncedSearch, sortField]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { name: name.trim(), description: description.trim() };

    try {
      if (editingId) {
        await updateProject(editingId, payload);
        onToast("Project updated");
      } else {
        await createProject(payload);
        onToast("Project created");
      }
      resetForm();
      setSkip(0);
      await loadProjects();
      onProjectsUpdated();
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  async function handleEdit(id) {
    try {
      const project = await getProject(id);
      setEditingId(id);
      setName(project.name);
      setDescription(project.description || "");
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this project and all related tasks?")) return;

    try {
      const result = await deleteProject(id);
      if (selectedProjectId === id) onSelectProject(null);
      onToast(`Deleted project and ${result.deletedTasks} related task(s)`);
      resetForm();
      setSkip(0);
      await loadProjects();
      onProjectsUpdated();
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/60">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Projects</h2>

      <form onSubmit={handleSubmit} className="mb-4 grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Name
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Project name"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Description
          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingId ? "Save Project" : "Add Project"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Search
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Sort
          <select
            className={inputClass}
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3">
        {loading && (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-slate-500">
            Loading...
          </p>
        )}
        {!loading && items.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-slate-500">
            No projects yet. Create your first project.
          </p>
        )}
        {!loading &&
          items.map((project) => {
            const isActive = selectedProjectId === project._id;
            return (
              <article
                key={project._id}
                className={`rounded-xl border p-4 ${isActive ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
              >
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {project.description || "No description"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Updated: {formatDate(project.updatedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(project._id);
                      onToast("Showing tasks for selected project");
                    }}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-300"
                  >
                    View Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(project._id)}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(project._id)}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
      </div>

      <Pagination
        skip={skip}
        take={PAGE_SIZE}
        total={total}
        onPrev={() => setSkip(Math.max(skip - PAGE_SIZE, 0))}
        onNext={() => setSkip(skip + PAGE_SIZE)}
      />
    </section>
  );
}
