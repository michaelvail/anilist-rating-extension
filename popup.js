const storage = {
  get: keys => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
  set: items => new Promise(resolve => chrome.storage.local.set(items, resolve))
}

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const { dimensions = [] } = await storage.get({ dimensions: [] });
  renderDimensions(dimensions);

  // Add dimension
  document.getElementById("add-btn").addEventListener("click", onAddDimension);

  // Remove dimension
  document.getElementById("dimensions-list").addEventListener("click", onRemoveDimension);

  // Backup
  document.getElementById("backup").addEventListener("click", onBackup);

  // Restore
  const restoreFile = document.getElementById("restore-file");
  document.getElementById("restore").addEventListener("click", () => restoreFile.click());
  restoreFile.addEventListener("change", onRestore);
}

function renderDimensions(dimensions) {
  const list = document.getElementById("dimensions-list");
  list.innerHTML = "";

  dimensions.forEach((dim, index) => {
    const li = document.createElement("li");
    li.className = "dimension-item";
    li.dataset.index = index;
    li.dataset.name = dim;

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "\u2630";
    handle.draggable = true;

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = dim;

    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.textContent = "\u2715";
    btn.addEventListener("click", () => {
      const newDims = dimensions.filter(d => d !== dim);
      chrome.storage.local.set({ dimensions: newDims }, () => {
        renderDimensions(newDims);
      });
    });
    
    li.appendChild(handle);
    li.appendChild(label);
    li.appendChild(btn);
    list.appendChild(li);

    handle.addEventListener("dragstart", e => {
      draggedItem = li;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", li.dataset.name);
    });
  });
}

// Drag and drop reordering
const list = document.getElementById("dimensions-list");
let draggedItem = null;

list.addEventListener("dragover", event => {
  event.preventDefault();
  const target = event.target.closest(".dimension-item");
  if (target && target !== draggedItem) {
    const rect = target.getBoundingClientRect();
    const next = (event.clientY - rect.top) / rect.height > 0.5;
    list.insertBefore(draggedItem, next ? target.nextSibling : target);
  }
});

list.addEventListener("dragend", e => {
  e.preventDefault();
  const newOrder = Array.from(list.querySelectorAll(".dimension-item"))
    .map(li => li.dataset.name);
  chrome.storage.local.set({ dimensions: newOrder }, () => {
    renderDimensions(newOrder);
  });
});

async function onAddDimension() {
  const input = document.getElementById("new-dimension");
  const newDim = input.value.trim();
  if (!newDim) return;

  const { dimensions = [] } = await storage.get({ dimensions: [] });
  if (!dimensions.includes(newDim)) {
    dimensions.push(newDim);
    await storage.set({ dimensions });
    renderDimensions(dimensions);
  }

  input.value = "";
}

async function onRemoveDimension(event) {
  if (!event.target.matches("button")) return;
  const index = Number(event.target.dataset.index);
  const { dimensions = [] } = await storage.get({ dimensions: [] });
  dimensions.splice(index, 1);
  await storage.set({ dimensions });
  renderDimensions(dimensions);
}

async function onBackup() {
  const data = await storage.get({ dimensions: [], ratings: {} });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const now = new Date().toISOString().replace(/[:.]/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `anilist-backup-${now}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function onRestore(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);

      if (!confirm("Restoring will overwrite your current data. Continue?")) {
        return alert("Restore cancelled.");
      }

      await storage.set({
        dimensions: data.dimensions || [],
        ratings: data.ratings || {}
      });

      alert("Restore complete! Refresh AniList to see changes.");
      renderDimensions(data.dimensions || []);
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);

  event.target.value = "";
}
