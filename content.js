// ---------- Utilities ----------
const DEBOUNCE_MS = 150;
let renderTimer = null;
let ratingsCache = {};

function debounceRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderAll, DEBOUNCE_MS);
}

function q(selector, root = document) { return root.querySelector(selector); }
function qa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

// ---------- Storage helpers ----------
chrome.storage.local.get({ ratings: {} }, data => {
  ratingsCache = data.ratings;
});

function saveRating(animeId, dim, val) {
  if (!ratingsCache[animeId]) ratingsCache[animeId] = {};
  if (val) {
    ratingsCache[animeId][dim] = val;
  } else {
    delete ratingsCache[animeId][dim];
  }
  chrome.storage.local.set({ ratings: ratingsCache });
}

// ---------- Header & row injection ----------
function injectHeaders(dimensions) {
  document.querySelectorAll(".custom-dimension-header").forEach(el => el.remove());
  if (!dimensions.length) return;

  qa(".list-head.row .score").forEach(scoreHeader => {
    let insertAfter = scoreHeader;
    dimensions.forEach(dim => {
      const header = document.createElement("div");
      header.className = "column custom-dimension-header";
      header.textContent = dim;
      insertAfter.insertAdjacentElement("afterend", header);
      insertAfter = header;
    });
  });
}

function injectRowInputs(dims, ratings) {
  qa(".entry.row").forEach(row => {
    const link = row.querySelector(".title a");
    const animeId = link ? (link.getAttribute("href") || "").split("/")[2] : null;
    if (!animeId) return;

    row.querySelectorAll(".custom-dimension-cell").forEach(el => el.remove());

    const scoreEl = row.querySelector(".score");
    if (!scoreEl) return;

    let insertAfter = scoreEl;
    dims.forEach(dim => {
      const cell = document.createElement("div");
      cell.className = "column custom-dimension-cell";

      const input = document.createElement("input");
      input.type = "text";
      input.dataset.dim = dim;
      input.className = "custom-dimension-input";
      input.value = ratings[animeId]?.[dim] ?? "";

      input.addEventListener("input", () => {
        saveRating(animeId, dim, input.value.trim());
      });

      cell.appendChild(input);
      insertAfter.insertAdjacentElement("afterend", cell);
      insertAfter = cell;
    });
  });
}

// ---------- Render ----------
function renderAll() {
  chrome.storage.local.get({ dimensions: [], ratings: {} }, data => {
    try {
      render(data.dimensions, data.ratings);
    } catch (e) {
      if (e.message?.includes("Extension context invalidated")) return;
      console.warn("render failed:", e);
    }
  });
}

function render(dimensions, ratings) {
  const active = document.activeElement;
  const activeDim = active?.dataset?.dim;
  const activeRow = active?.closest(".entry.row")?.querySelector(".title a")?.getAttribute("href");

  injectHeaders(dimensions);
  injectRowInputs(dimensions, ratings);

  // Restore focus if possible
  if (activeDim && activeRow) {
    const animeId = activeRow.split("/")[2];
    const newInput = document.querySelector(`.entry.row a[href*="/${animeId}"]`)
      ?.closest(".entry.row")
      ?.querySelector(`input[data-dim="${activeDim}"]`);
    if (newInput) {
      newInput.focus();
      newInput.selectionStart = newInput.selectionEnd = newInput.value.length;
    }
  }
}

// ---------- Boot ----------
console.log("AniList extension content script loaded ✅");

// Render once on DOM ready (AniList is SPA; wait for body)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderAll);
} else {
  renderAll();
}

// Re-render when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.dimensions || changes.ratings)) {
    debounceRender();
  }
});

// Observe SPA navigation and row updates
const observer = new MutationObserver(() => debounceRender());
observer.observe(document.body, { childList: true, subtree: true });
