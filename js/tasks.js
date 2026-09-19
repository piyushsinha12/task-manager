import { state, createTask, priorityRank } from "./state.js";
import { saveTasks } from "./storage.js";
import { isOverdue, isToday, getDaysDifference } from "./utils.js";

export const addTask = (data) => {
  const task = createTask(data);
  state.tasks.unshift(task);
  saveTasks();
  return task;
};

export const updateTask = (id, data) => {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return null;
  Object.assign(task, {
    ...data,
    title: String(data.title).trim(),
    description: String(data.description || "").trim(),
    tags: [...new Set((data.tags || []).map(String).map(t => t.trim()).filter(Boolean))],
    updatedAt: new Date().toISOString()
  });
  saveTasks();
  return task;
};

export const deleteTask = (id) => {
  const index = state.tasks.findIndex(t => t.id === id);
  if (index < 0) return null;
  const [deleted] = state.tasks.splice(index, 1);
  saveTasks();
  return { task: deleted, index };
};

export const setCompleted = (id, completed) => {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return null;
  task.completed = Boolean(completed);
  task.updatedAt = new Date().toISOString();
  saveTasks();
  return task;
};

export const reorderTasks = (fromId, toId) => {
  if (fromId === toId) return;
  const from = state.tasks.findIndex(t => t.id === fromId);
  const to = state.tasks.findIndex(t => t.id === toId);
  if (from < 0 || to < 0) return;
  const [item] = state.tasks.splice(from, 1);
  state.tasks.splice(to, 0, item);
  saveTasks();
};

export const getStats = () => {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const active = total - completed;
  const overdue = state.tasks.filter(isOverdue).length;
  return { total, active, completed, overdue, percent: total ? Math.round(completed / total * 100) : 0 };
};

export const matchesView = (task, view) => {
  if (view === "today") return !task.completed && isToday(task.dueDate);
  if (view === "upcoming") return !task.completed && getDaysDifference(task.dueDate) > 0;
  if (view === "overdue") return isOverdue(task);
  if (view === "completed") return task.completed;
  return true;
};

export const getVisibleTasks = () => {
  const q = state.searchQuery.trim().toLowerCase();
  let tasks = state.tasks.filter(task => {
    if (!matchesView(task, state.currentView)) return false;
    const searchable = [task.title, task.description, task.category, ...task.tags].join(" ").toLowerCase();
    if (q && !searchable.includes(q)) return false;
    if (state.statusFilter !== "all" && !matchesView(task, state.statusFilter)) return false;
    if (state.priorityFilter !== "all" && task.priority !== state.priorityFilter) return false;
    if (state.categoryFilter !== "all" && task.category !== state.categoryFilter) return false;
    return true;
  });

  const copy = [...tasks];
  return copy.sort((a, b) => {
    if (state.sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (state.sortBy === "due") return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    if (state.sortBy === "priority") return priorityRank[b.priority] - priorityRank[a.priority];
    if (state.sortBy === "alpha") return a.title.localeCompare(b.title);
    if (state.sortBy === "updated") return new Date(b.updatedAt) - new Date(a.updatedAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

export const bulkUpdate = (ids, action) => {
  state.tasks.forEach(task => {
    if (!ids.has(task.id)) return;
    if (action === "complete") task.completed = true;
    if (action === "active") task.completed = false;
    if (action === "priority") task.priority = task.priority === "high" ? "medium" : task.priority === "medium" ? "low" : "high";
    task.updatedAt = new Date().toISOString();
  });
  saveTasks();
};
