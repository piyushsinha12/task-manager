import { state, DEFAULT_CATEGORIES, createTask } from "./state.js";

const KEYS = { tasks: "taskflow_tasks", theme: "taskflow_theme", categories: "taskflow_categories" };

const safeParse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

export const loadState = () => {
  const storedTasks = safeParse(localStorage.getItem(KEYS.tasks), []);
  state.tasks = Array.isArray(storedTasks)
    ? storedTasks.filter(t => t && typeof t === "object" && typeof t.title === "string").map(createTask)
    : [];
  const categories = safeParse(localStorage.getItem(KEYS.categories), DEFAULT_CATEGORIES);
  state.categories = Array.isArray(categories) && categories.length ? [...new Set(categories.map(String))] : [...DEFAULT_CATEGORIES];
  const theme = localStorage.getItem(KEYS.theme);
  state.theme = theme === "dark" ? "dark" : "light";
};

export const saveTasks = () => localStorage.setItem(KEYS.tasks, JSON.stringify(state.tasks));
export const saveTheme = () => localStorage.setItem(KEYS.theme, state.theme);
export const saveCategories = () => localStorage.setItem(KEYS.categories, JSON.stringify(state.categories));
export const clearTasks = () => localStorage.removeItem(KEYS.tasks);
