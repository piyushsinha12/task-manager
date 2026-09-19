export const DEFAULT_CATEGORIES = ["Work", "Study", "Personal", "Shopping", "Fitness", "Other"];

export const state = {
  tasks: [],
  searchQuery: "",
  statusFilter: "all",
  priorityFilter: "all",
  categoryFilter: "all",
  sortBy: "newest",
  theme: "light",
  selectedIds: new Set(),
  currentView: "all",
  categories: [...DEFAULT_CATEGORIES]
};

export const setState = (patch) => Object.assign(state, patch);

export const priorityRank = { high: 3, medium: 2, low: 1 };

export const createTask = (data) => ({
  id: data.id || crypto.randomUUID(),
  title: data.title.trim(),
  description: (data.description || "").trim(),
  completed: Boolean(data.completed),
  priority: data.priority || "medium",
  category: data.category || "Other",
  tags: Array.isArray(data.tags) ? [...new Set(data.tags.map(String).map(t => t.trim()).filter(Boolean))] : [],
  dueDate: data.dueDate || "",
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString()
});
