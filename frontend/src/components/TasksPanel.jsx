import { useCallback, useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../api/graphqlClient.js";
import { useDebounce } from "../hooks/useDebounce.js";
import Badge from "./Badge.jsx";
import Pagination from "./Pagination.jsx";

const PAGE_SIZE = 5;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export default function TasksPanel({
  selectedProjectId,
  allProjects,
  onToast,
  onTasksUpdated,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [editingId, setEditingId] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (selectedProjectId) {
      setFilterProject(selectedProjectId);
      setProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch.trim(),
        sortField,
        sortOrder: "desc",
        skip,
        take: PAGE_SIZE,
      };
      if (filterProject) params.projectId = filterProject;
      if (filterStatus) params.status = filterStatus;

      const data = await getTasks(params);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortField, skip, filterProject, filterStatus, onToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    setSkip(0);
  }, [debouncedSearch, sortField, filterProject, filterStatus]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setProjectId(selectedProjectId || filterProject || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      projectId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null,
    };

    try {
      if (editingId) {
        await updateTask(editingId, payload);
        onToast("Task updated");
      } else {
        await createTask(payload);
        onToast("Task created");
      }
      resetForm();
      setSkip(0);
      await loadTasks();
      onTasksUpdated();
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  async function handleEdit(id) {
    try {
      const task = await getTask(id);
      setEditingId(id);
      setProjectId(task.projectId);
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this task?")) return;

    try {
      await deleteTask(id);
      onToast("Task deleted");
      await loadTasks();
      onTasksUpdated();
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/60">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Tasks</h2>

      <form onSubmit={handleSubmit} className="mb-4 grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Project
          <select
            className={inputClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">Select project</option>
            {allProjects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Title
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Task title"
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
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Status
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Priority
            <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Due Date
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingId ? "Save Task" : "Add Task"}
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
          Filter by project
          <select
            className={inputClass}
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">All projects</option>
            {allProjects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Filter by status
          <select
            className={inputClass}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Search
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Sort
          <select className={inputClass} value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
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
            No tasks found for the current filters.
          </p>
        )}
        {!loading &&
          items.map((task) => (
            <article key={task._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{task.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {task.description || "No description"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Due: {formatDate(task.dueDate)}</span>
                <Badge value={task.status} />
                <Badge value={task.priority} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(task._id)}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(task._id)}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
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
