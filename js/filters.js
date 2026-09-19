import { state } from "./state.js";
import { isOverdue } from "./utils.js";

export const countCategories = () => state.categories.reduce((acc, category) => {
  acc[category] = state.tasks.filter(t => t.category === category).length;
  return acc;
}, {});

export const setFilter = (key, value) => {
  if (key in state) state[key] = value;
};

export const categoryFilter = (category) => {
  state.categoryFilter = category;
  state.currentView = "all";
};

export const filterLabel = () => state.currentView === "all" ? "All Tasks" : state.currentView[0].toUpperCase() + state.currentView.slice(1);
