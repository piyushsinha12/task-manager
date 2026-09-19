import { escapeHTML, normalizeTags } from "./utils.js";

const root = document.getElementById("modalRoot");

const close = () => {
  root.innerHTML = "";
  document.body.style.overflow = "";
};

export const closeModal = close;

export const openTaskModal = ({ task = null, onSubmit }) => {
  root.innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <form class="modal" id="taskForm" novalidate>
        <div class="modal-header"><h2>${task ? "Edit Task" : "Create Task"}</h2><button type="button" class="icon-btn" data-close-modal aria-label="Close">×</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field full"><label for="taskTitle">Title *</label><input id="taskTitle" name="title" maxlength="120" value="${escapeHTML(task?.title || "")}" autofocus><span class="field-error" data-error="title"></span></div>
            <div class="field full"><label for="taskDescription">Description</label><textarea id="taskDescription" name="description" maxlength="1000">${escapeHTML(task?.description || "")}</textarea><span class="field-error" data-error="description"></span></div>
            <div class="field"><label for="taskPriority">Priority</label><select id="taskPriority" name="priority"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div class="field"><label for="taskCategory">Category</label><select id="taskCategory" name="category"></select></div>
            <div class="field"><label for="taskDueDate">Due date</label><input id="taskDueDate" name="dueDate" type="date" value="${escapeHTML(task?.dueDate || "")}"><span class="field-error" data-error="dueDate"></span></div>
            <div class="field"><label for="taskTags">Tags</label><input id="taskTags" name="tags" placeholder="javascript, frontend" value="${escapeHTML(task?.tags?.join(", ") || "")}"><span class="field-error" data-error="tags"></span></div>
          </div>
        </div>
        <div class="modal-footer"><button type="button" class="secondary-btn" data-close-modal>Cancel</button><button class="primary-btn" type="submit">${task ? "Save changes" : "Create task"}</button></div>
      </form>
    </div>`;
  const form = root.querySelector("#taskForm");
  const category = form.querySelector("[name=category]");
  category.innerHTML = "";
  (window.taskFlowCategories || ["Work","Study","Personal","Shopping","Fitness","Other"]).forEach(c => {
    const option = document.createElement("option"); option.value = c; option.textContent = c; category.appendChild(option);
  });
  form.querySelector("[name=priority]").value = task?.priority || "medium";
  category.value = task?.category || "Other";

  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = [];
    if (!data.title.trim() || data.title.trim().length < 2) errors.push(["title", "Title must be at least 2 characters."]);
    if (data.description.length > 1000) errors.push(["description", "Description is too long."]);
    if (data.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) errors.push(["dueDate", "Enter a valid date."]);
    const tags = normalizeTags(data.tags);
    if (tags.length > 12) errors.push(["tags", "Use up to 12 tags."]);
    root.querySelectorAll("[data-error]").forEach(el => el.textContent = "");
    errors.forEach(([field, msg]) => root.querySelector(`[data-error="${field}"]`).textContent = msg);
    if (errors.length) return;
    onSubmit({ ...data, title: data.title.trim(), description: data.description.trim(), tags });
    close();
  });
  root.addEventListener("click", event => { if (event.target.matches("[data-close-modal]")) close(); }, { once: true });
  document.addEventListener("keydown", escHandler, { once: true });
};

export const openConfirmModal = ({ title, message, confirmText = "Confirm", danger = true, onConfirm }) => {
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><div class="modal small" role="dialog" aria-modal="true" aria-labelledby="confirmTitle"><div class="modal-header"><h2 id="confirmTitle">${escapeHTML(title)}</h2><button class="icon-btn" data-close-modal aria-label="Close">×</button></div><div class="modal-body"><p>${escapeHTML(message)}</p></div><div class="modal-footer"><button class="secondary-btn" data-close-modal>Cancel</button><button class="${danger ? "danger-btn" : "primary-btn"}" id="confirmBtn">${escapeHTML(confirmText)}</button></div></div></div>`;
  root.querySelector("#confirmBtn").addEventListener("click", () => { onConfirm(); close(); });
  root.addEventListener("click", event => { if (event.target.matches("[data-close-modal]")) close(); });
  document.addEventListener("keydown", escHandler, { once: true });
};

export const openDetailsModal = (task, { onEdit }) => {
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><div class="modal" role="dialog" aria-modal="true"><div class="modal-header"><h2>Task Details</h2><button class="icon-btn" data-close-modal aria-label="Close">×</button></div><div class="modal-body"><div class="details-grid">
    <div><h3>${escapeHTML(task.title)}</h3><div class="detail-description">${escapeHTML(task.description || "No description.")}</div></div>
    <div class="detail-row"><span>Status</span><strong>${task.completed ? "Completed" : "Active"}</strong></div>
    <div class="detail-row"><span>Priority</span><strong>${escapeHTML(task.priority)}</strong></div>
    <div class="detail-row"><span>Category</span><strong>${escapeHTML(task.category)}</strong></div>
    <div class="detail-row"><span>Tags</span><strong>${task.tags.length ? task.tags.map(t => "#" + escapeHTML(t)).join(" ") : "None"}</strong></div>
    <div class="detail-row"><span>Due date</span><strong>${escapeHTML(task.dueDate || "None")}</strong></div>
    <div class="detail-row"><span>Created</span><strong>${new Date(task.createdAt).toLocaleString()}</strong></div>
    <div class="detail-row"><span>Updated</span><strong>${new Date(task.updatedAt).toLocaleString()}</strong></div>
  </div></div><div class="modal-footer"><button class="secondary-btn" data-close-modal>Close</button><button class="primary-btn" id="detailEdit">Edit Task</button></div></div></div>`;
  root.querySelector("#detailEdit").addEventListener("click", () => { close(); onEdit(task); });
  root.addEventListener("click", event => { if (event.target.matches("[data-close-modal]")) close(); });
  document.addEventListener("keydown", escHandler, { once: true });
};

const escHandler = event => { if (event.key === "Escape") close(); };
