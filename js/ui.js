import { state } from "./state.js";
import { getVisibleTasks, getStats } from "./tasks.js";
import { countCategories, filterLabel } from "./filters.js";
import { dueLabel, escapeHTML, isOverdue } from "./utils.js";

export const renderStats = () => {
  const s = getStats();
  document.getElementById("totalStat").textContent = s.total;
  document.getElementById("activeStat").textContent = s.active;
  document.getElementById("completedStat").textContent = s.completed;
  document.getElementById("overdueStat").textContent = s.overdue;
  document.getElementById("progressText").textContent = `${s.percent}%`;
  document.getElementById("progressCount").textContent = `${s.completed} / ${s.total} completed`;
  document.getElementById("progressBar").style.width = `${s.percent}%`;
  document.getElementById("pageTitle").textContent = filterLabel();
};

export const renderSidebar = () => {
  const counts = {
    all: state.tasks.length,
    today: state.tasks.filter(t => !t.completed && t.dueDate && new Date(`${t.dueDate}T00:00:00`).getTime() === new Date(new Date().toDateString()).getTime()).length,
    upcoming: state.tasks.filter(t => !t.completed && t.dueDate && new Date(`${t.dueDate}T00:00:00`) > new Date(new Date().toDateString())).length,
    overdue: state.tasks.filter(isOverdue).length,
    completed: state.tasks.filter(t => t.completed).length
  };
  document.getElementById("navAllCount").textContent = counts.all;
  document.getElementById("navTodayCount").textContent = counts.today;
  document.getElementById("navUpcomingCount").textContent = counts.upcoming;
  document.getElementById("navOverdueCount").textContent = counts.overdue;
  document.getElementById("navCompletedCount").textContent = counts.completed;
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === state.currentView));
  const categoryCounts = countCategories();
  const list = document.getElementById("categoryList");
  list.innerHTML = "";
  state.categories.forEach(category => {
    const button = document.createElement("button");
    button.className = `category-item ${state.categoryFilter === category ? "active" : ""}`;
    button.dataset.category = category;
    button.innerHTML = `<span class="category-dot"></span><span></span><b>${categoryCounts[category] || 0}</b>`;
    button.querySelector("span:nth-child(2)").textContent = category;
    list.appendChild(button);
  });
};

export const renderCategoryOptions = () => {
  const select = document.getElementById("categoryFilter");
  const current = state.categoryFilter;
  select.innerHTML = `<option value="all">All categories</option>`;
  state.categories.forEach(c => { const o = document.createElement("option"); o.value = c; o.textContent = c; select.appendChild(o); });
  select.value = state.categories.includes(current) ? current : "all";
};

export const renderTasks = () => {
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  const tasks = getVisibleTasks();
  if (!tasks.length) {
    const hasTasks = state.tasks.length > 0;
    const title = hasTasks ? "No tasks found" : "No tasks yet";
    const message = hasTasks ? "Try changing your search or filters." : "Create your first task to get started.";
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h2>${title}</h2><p>${message}</p>${hasTasks ? "" : `<button class="primary-btn" id="emptyAddBtn">+ Add Task</button>`}</div>`;
    return;
  }
  const template = document.getElementById("taskCardTemplate");
  tasks.forEach(task => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = task.id;
    card.classList.toggle("completed", task.completed);
    card.querySelector(".select-task").checked = state.selectedIds.has(task.id);
    const check = card.querySelector(".complete-check"); check.setAttribute("aria-pressed", String(task.completed)); check.title = task.completed ? "Mark active" : "Mark completed";
    card.querySelector(".task-title").textContent = task.title;
    card.querySelector(".task-description").textContent = task.description || "No description";
    const priority = card.querySelector(".priority-pill"); priority.textContent = task.priority; priority.classList.add(task.priority);
    card.querySelector(".category-pill").textContent = task.category;
    const due = card.querySelector(".due-pill"); due.textContent = dueLabel(task); if (isOverdue(task)) due.classList.add("overdue");
    const tags = card.querySelector(".tag-list"); task.tags.forEach(tag => { const el = document.createElement("span"); el.className = "tag"; el.textContent = `#${tag}`; tags.appendChild(el); });
    list.appendChild(card);
  });
};

export const renderAll = () => { renderStats(); renderSidebar(); renderCategoryOptions(); renderTasks(); updateBulkToolbar(); };

export const updateBulkToolbar = () => {
  const count = state.selectedIds.size;
  document.getElementById("bulkToolbar").classList.toggle("hidden", count === 0);
  document.getElementById("selectedCount").textContent = count;
};
