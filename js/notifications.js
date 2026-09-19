export const toast = (message, type = "success", { duration = 3200, actionLabel = "", onAction = null } = {}) => {
  const container = document.getElementById("toastContainer");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.innerHTML = `<b>${type === "success" ? "✓" : type === "warning" ? "⚠" : "!"}</b><span></span>`;
  item.querySelector("span").textContent = message;
  if (actionLabel && onAction) {
    const btn = document.createElement("button");
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => { onAction(); item.remove(); });
    item.appendChild(btn);
  }
  container.appendChild(item);
  const timer = setTimeout(() => item.remove(), duration);
  return () => { clearTimeout(timer); item.remove(); };
};
