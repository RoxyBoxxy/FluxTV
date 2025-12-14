const form = document.getElementById("addForm");
const statusText = document.getElementById("addStatusText");
const statusBar = document.getElementById("addStatusBar");
const statusLog = document.getElementById("addStatusLog");
const toggleLogBtn = document.getElementById("addStatusToggleLog");
const addStatusModal = document.getElementById("addStatusModal");
const addStatusClose = document.getElementById("addStatusClose");

const addMeta = document.getElementById("addMeta");
const addMetaThumb = document.getElementById("addMetaThumb");
const addMetaArtist = document.getElementById("addMetaArtist");
const addMetaTrack = document.getElementById("addMetaTrack");

function openAddModal() {
  if (!addStatusModal) return;
  // Prefer native dialog if supported
  if (typeof addStatusModal.showModal === "function") {
    addStatusModal.showModal();
  } else {
    addStatusModal.style.display = "block";
    addStatusModal.classList.remove("hidden");
  }
}

function closeAddModal() {
  if (!addStatusModal) return;
  if (typeof addStatusModal.close === "function") {
    addStatusModal.close();
  } else {
    addStatusModal.style.display = "none";
    addStatusModal.classList.add("hidden");
  }
}

if (toggleLogBtn && statusLog) {
  toggleLogBtn.addEventListener("click", () => {
    const visible = !statusLog.classList.contains("hidden");
    statusLog.classList.toggle("hidden", visible);
    toggleLogBtn.textContent = visible ? "Show log" : "Hide log";
  });
}

if (addStatusClose) {
  addStatusClose.disabled = true;
  addStatusClose.addEventListener("click", () => {
    document.getElementById('url').value = '' 
    closeAddModal();
    loadVideos();
  });
}

if (form && statusText) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    statusText.textContent = "Starting yt-dlp import…";
    statusBar.style.width = "0%";
    statusLog.textContent = "";
    statusLog.classList.add("hidden");
    toggleLogBtn.textContent = "Show log";

    addMeta.classList.add("hidden");
    addMetaThumb.src = "";
    addMetaArtist.textContent = "";
    addMetaTrack.textContent = "";

    openAddModal();

    const url = data.url;
    const es = new EventSource(`/api/add-url/stream?url=${encodeURIComponent(url)}`);

    es.addEventListener("status", (e) => {
      const d = JSON.parse(e.data);
      statusText.textContent = d.message;
    });

    es.addEventListener("progress", (e) => {
      const p = JSON.parse(e.data);
      if (p.percent !== undefined) {
        statusBar.style.width = `${p.percent}%`;
        statusText.textContent = `Downloading… ${p.percent.toFixed(1)}%`;
      }
      if (p.speed) {
        statusText.textContent += ` (${p.speed})`;
      }
    });

    es.addEventListener("log", (e) => {
      const line = JSON.parse(e.data).line;

      // Always append raw log
      statusLog.textContent += line + "\n";
      statusLog.scrollTop = statusLog.scrollHeight;

      // Parse yt-dlp download progress lines
      // Example:
      // [download] 100.0% of    3.75MiB at   68.14MiB/s ETA 00:00
      const match = line.match(/\[download\]\s+([\d.]+)%.*?at\s+([^\s]+).*?ETA\s+([0-9:]+)/i);
      if (match) {
        const percent = parseFloat(match[1]);
        const speed = match[2];
        const eta = match[3];

        if (!Number.isNaN(percent)) {
          statusBar.style.width = `${percent}%`;
          statusText.textContent = `Downloading… ${percent.toFixed(1)}% (${speed}, ETA ${eta})`;
        }
      }
    });

    es.addEventListener("video", (e) => {
      const v = JSON.parse(e.data);
      statusText.textContent = `Added: ${v.artist || ""} ${v.title || ""}`;
    });

    es.addEventListener("meta", (e) => {
      const meta = JSON.parse(e.data);

      if (meta.thumbnail) {
        addMetaThumb.src = meta.thumbnail;
      }

      if (meta.artist || meta.uploader) {
        addMetaArtist.textContent = meta.artist || meta.uploader;
      }

      if (meta.track || meta.title) {
        addMetaTrack.textContent = meta.track || meta.title;
      }

      addMeta.classList.remove("hidden");
    });

    es.addEventListener("done", () => {
      statusText.textContent = "Import complete 🎉";
      statusBar.style.width = "100%";
      es.close();
      form.reset();
      addStatusClose.disabled = false;
    });

    es.addEventListener("error", (e) => {
      try {
        const err = JSON.parse(e.data);
        statusText.textContent = "Error: " + err.message;
      } catch {
        statusText.textContent = "Import failed";
      }
      es.close();
      addStatusClose.disabled = false;
    });
  });
}
