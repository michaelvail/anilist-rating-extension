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
    li.textContent = dim;

    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.className = "remove-btn";
    btn.dataset.index = index;
    li.appendChild(btn);

    list.appendChild(li);
  });
}

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
