import { state, DEFAULT_CATEGORIES, setState } from "./state.js";
import { loadState, saveTasks, saveTheme, saveCategories, clearTasks } from "./storage.js";
import { addTask, updateTask, deleteTask, setCompleted, reorderTasks, bulkUpdate } from "./tasks.js";
import { debounce, isTypingTarget } from "./utils.js";
import { openTaskModal, openConfirmModal, openDetailsModal } from "./modal.js";
import { toast } from "./notifications.js";
import { renderAll } from "./ui.js";

loadState();
window.taskFlowCategories = state.categories;

const applyTheme = () => {
  document.documentElement.dataset.theme = state.theme;
  document.getElementById("themeToggle").textContent = state.theme === "dark" ? "☀" : "☾";
  document.getElementById("themeToggle").setAttribute("aria-label", `Switch to ${state.theme === "dark" ? "light" : "dark"} mode`);
};
applyTheme();
renderAll();

const refresh = () => { window.taskFlowCategories = state.categories; saveTasks(); renderAll(); };

document.getElementById("addTaskBtn").addEventListener("click", () => openTaskModal({
  onSubmit: data => { addTask(data); renderAll(); toast("Task created successfully"); }
}));
document.getElementById("taskList").addEventListener("click", event => {
  const card = event.target.closest(".task-card");
  if (!card) {
    if (event.target.id === "emptyAddBtn") document.getElementById("addTaskBtn").click();
    return;
  }
  const task = state.tasks.find(t => t.id === card.dataset.id);
  if (!task) return;
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (event.target.closest(".complete-check")) {
    setCompleted(task.id, !task.completed); renderAll(); toast(task.completed ? "Task completed" : "Task marked active"); return;
  }
  if (event.target.classList.contains("select-task")) {
    if (event.target.checked) state.selectedIds.add(task.id); else state.selectedIds.delete(task.id);
    document.getElementById("selectedCount").textContent = state.selectedIds.size;
    document.getElementById("bulkToolbar").classList.toggle("hidden", state.selectedIds.size === 0); return;
  }
  if (action === "details" || event.target.closest(".task-title")) openDetailsModal(task, { onEdit: editTask });
  if (action === "edit") editTask(task);
  if (action === "delete") confirmDelete(task);
});

const editTask = task => openTaskModal({ task, onSubmit: data => { updateTask(task.id, data); renderAll(); toast("Task updated"); } });

const confirmDelete = task => openConfirmModal({
  title: "Delete task?", message: `Are you sure you want to delete "${task.title}"?`, confirmText: "Delete",
  onConfirm: () => {
    const deleted = deleteTask(task.id);
    state.selectedIds.delete(task.id);
    renderAll();
    toast("Task deleted", "success", {
      duration: 5000, actionLabel: "Undo", onAction: () => {
        if (deleted) { state.tasks.splice(Math.min(deleted.index, state.tasks.length), 0, deleted.task); saveTasks(); renderAll(); toast("Task restored"); }
      }
    });
  }
});

document.getElementById("searchInput").addEventListener("input", debounce(e => { state.searchQuery = e.target.value; renderAll(); }));
document.getElementById("statusFilter").addEventListener("change", e => { state.statusFilter = e.target.value; state.currentView = "all"; renderAll(); });
document.getElementById("priorityFilter").addEventListener("change", e => { state.priorityFilter = e.target.value; renderAll(); });
document.getElementById("categoryFilter").addEventListener("change", e => { state.categoryFilter = e.target.value; renderAll(); });
document.getElementById("sortBy").addEventListener("change", e => { state.sortBy = e.target.value; renderAll(); });

document.querySelector(".sidebar-nav").addEventListener("click", e => {
  const button = e.target.closest("[data-view]"); if (!button) return;
  state.currentView = button.dataset.view; state.statusFilter = "all"; state.categoryFilter = "all"; closeMobileSidebar(); renderAll();
});
document.getElementById("categoryList").addEventListener("click", e => {
  const button = e.target.closest("[data-category]"); if (!button) return;
  state.categoryFilter = button.dataset.category; state.currentView = "all"; closeMobileSidebar(); renderAll();
});
document.getElementById("addCategoryBtn").addEventListener("click", () => {
  const name = prompt("Category name:");
  const clean = String(name || "").trim();
  if (!clean) return;
  if (state.categories.some(c => c.toLowerCase() === clean.toLowerCase())) return toast("That category already exists", "warning");
  state.categories.push(clean); saveCategories(); renderAll(); toast("Category added");
});

document.getElementById("bulkToolbar").addEventListener("click", e => {
  const action = e.target.closest("[data-bulk]")?.dataset.bulk;
  if (!action) return;
  if (action === "delete") {
    openConfirmModal({
      title: "Delete selected tasks?", message: `This will delete ${state.selectedIds.size} selected task(s).`, confirmText: "Delete", onConfirm: () => {
        state.tasks = state.tasks.filter(t => !state.selectedIds.has(t.id)); state.selectedIds.clear(); saveTasks(); renderAll(); toast("Selected tasks deleted");
      }
    });
    return;
  }
  bulkUpdate(state.selectedIds, action); state.selectedIds.clear(); renderAll(); toast(action === "priority" ? "Priority updated" : "Tasks updated");
});
document.getElementById("clearSelectionBtn").addEventListener("click", () => { state.selectedIds.clear(); renderAll(); });

let draggedId = null;
document.getElementById("taskList").addEventListener("dragstart", e => {
  const card = e.target.closest(".task-card"); if (!card) return;
  draggedId = card.dataset.id; card.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", draggedId);
});
document.getElementById("taskList").addEventListener("dragend", e => e.target.closest(".task-card")?.classList.remove("dragging"));
document.getElementById("taskList").addEventListener("dragover", e => {
  const card = e.target.closest(".task-card"); if (!card || card.dataset.id === draggedId) return;
  e.preventDefault();
  const rect = card.getBoundingClientRect();
  card.parentNode.insertBefore(document.querySelector(`.task-card[data-id="${CSS.escape(draggedId)}"]`), e.clientY < rect.top + rect.height / 2 ? card : card.nextSibling);
});
document.getElementById("taskList").addEventListener("drop", e => {
  e.preventDefault();
  const card = e.target.closest(".task-card"); if (!card || !draggedId) return;
  const visibleIds = [...document.querySelectorAll(".task-card")].map(el => el.dataset.id);
  const current = state.tasks.filter(t => visibleIds.includes(t.id));
  const reorderedIds = visibleIds;
  const visibleMap = new Map(current.map(t => [t.id, t]));
  const reorderedVisible = reorderedIds.map(id => visibleMap.get(id)).filter(Boolean);
  const remaining = state.tasks.filter(t => !visibleIds.includes(t.id));
  state.tasks = [...reorderedVisible, ...remaining];
  saveTasks(); renderAll(); draggedId = null;
});

document.getElementById("themeToggle").addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; saveTheme(); applyTheme(); });
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks: state.tasks, categories: state.categories }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `taskflow-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); toast("Tasks exported");
});
document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importInput").click());
document.getElementById("importInput").addEventListener("change", async e => {
  const file = e.target.files[0]; e.target.value = ""; if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const incoming = Array.isArray(parsed) ? parsed : parsed.tasks;
    if (!Array.isArray(incoming) || !incoming.every(t => t && typeof t.title === "string")) throw new Error("Invalid task structure");
    const valid = incoming.map(t => ({ ...t, id: t.id || crypto.randomUUID() }));
    openConfirmModal({
      title: "Import tasks?", message: `Import ${valid.length} task(s)? Existing tasks will remain.`, confirmText: "Import", danger: false, onConfirm: () => {
        const existing = new Set(state.tasks.map(t => t.id));
        valid.forEach(t => { if (existing.has(t.id)) t.id = crypto.randomUUID(); });
        state.tasks = [...valid, ...state.tasks]; if (Array.isArray(parsed.categories)) state.categories = [...new Set([...state.categories, ...parsed.categories.map(String)])];
        saveCategories(); saveTasks(); renderAll(); toast("Tasks imported");
      }
    });
  } catch { toast("Invalid JSON file. Nothing was imported.", "error"); }
});
document.getElementById("clearAllBtn").addEventListener("click", () => openConfirmModal({
  title: "Clear all tasks?", message: "This will permanently remove all tasks. Your theme and categories will remain.", confirmText: "Clear Everything",
  onConfirm: () => { state.tasks = []; state.selectedIds.clear(); clearTasks(); renderAll(); toast("All tasks cleared"); }
}));
document.getElementById("shortcutsBtn").addEventListener("click", () => openConfirmModal({
  title: "Keyboard shortcuts", message: "N = New task · / = Focus search · Esc = Close modal. Shortcuts are disabled while typing.", confirmText: "Close", danger: false, onConfirm: () => { }
}));

const openMobileSidebar = () => { document.getElementById("sidebar").classList.add("open"); document.getElementById("sidebarOverlay").classList.add("show"); };
const closeMobileSidebar = () => { document.getElementById("sidebar").classList.remove("open"); document.getElementById("sidebarOverlay").classList.remove("show"); };
document.getElementById("openSidebarBtn").addEventListener("click", openMobileSidebar);
document.getElementById("closeSidebarBtn").addEventListener("click", closeMobileSidebar);
document.getElementById("sidebarOverlay").addEventListener("click", closeMobileSidebar);

document.addEventListener("keydown", e => {
  if (isTypingTarget(e)) return;
  if (e.key.toLowerCase() === "n") document.getElementById("addTaskBtn").click();
  if (e.key === "/") { e.preventDefault(); document.getElementById("searchInput").focus(); }
});
