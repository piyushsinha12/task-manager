export const generateId = () => crypto.randomUUID();

export const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

export const formatDate = (dateString, options = { day: "numeric", month: "short", year: "numeric" }) => {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString(undefined, options);
};

export const dateOnly = (date = new Date()) => {
  const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
};

export const isToday = (dateString) => {
  if (!dateString) return false;
  return dateOnly(new Date(`${dateString}T00:00:00`)).getTime() === dateOnly().getTime();
};

export const isTomorrow = (dateString) => {
  if (!dateString) return false;
  const tomorrow = dateOnly(); tomorrow.setDate(tomorrow.getDate() + 1);
  return dateOnly(new Date(`${dateString}T00:00:00`)).getTime() === tomorrow.getTime();
};

export const isOverdue = (task) => Boolean(task.dueDate && !task.completed && dateOnly(new Date(`${task.dueDate}T00:00:00`)) < dateOnly());

export const getDaysDifference = (dateString) => {
  if (!dateString) return null;
  const target = dateOnly(new Date(`${dateString}T00:00:00`));
  return Math.round((target - dateOnly()) / 86400000);
};

export const dueLabel = (task) => {
  if (!task.dueDate) return "No due date";
  if (task.completed) return `Completed · ${formatDate(task.dueDate)}`;
  if (isOverdue(task)) return `Overdue · ${formatDate(task.dueDate)}`;
  if (isToday(task.dueDate)) return "Due today";
  if (isTomorrow(task.dueDate)) return "Due tomorrow";
  const days = getDaysDifference(task.dueDate);
  return days > 0 && days <= 30 ? `Due in ${days} day${days === 1 ? "" : "s"}` : formatDate(task.dueDate);
};

export const debounce = (fn, delay = 180) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

export const isTypingTarget = (event) => {
  const el = event.target;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el.isContentEditable;
};

export const normalizeTags = (value) => [...new Set(String(value || "").split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean))];

export const isValidDateInput = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
