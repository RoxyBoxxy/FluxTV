(() => {
  // src/add.js
  var form = document.getElementById("addForm");
  var statusEl = document.getElementById("addStatus");
  var addStatusModal = document.getElementById("addStatusModal");
  var addStatusClose = document.getElementById("addStatusClose");
  function openAddModal() {
    if (!addStatusModal) return;
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
  if (addStatusClose) {
    addStatusClose.disabled = true;
    addStatusClose.addEventListener("click", () => {
      document.getElementById("url").value = "";
      closeAddModal();
      loadVideos();
    });
  }
  if (form && statusEl) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      statusEl.textContent = "Downloading and importing via yt-dlp...\n";
      openAddModal();
      try {
        const res = await fetch("/api/add-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.body && !contentType.includes("application/json")) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            statusEl.textContent = buffer;
            statusEl.scrollTop = statusEl.scrollHeight;
            if (buffer.includes("SQLITE_CONSTRAINT: UNIQUE constraint failed: videos.path")) {
              statusEl.textContent += "\nError: Video already exists in the database\n";
              addStatusClose.disabled = false;
            }
            if (buffer.includes("=== DONE ===")) {
              addStatusClose.disabled = false;
            }
          }
          return;
        }
        const json = await res.json();
        if (!json.ok) {
          statusEl.textContent += "\nError: " + json.error;
        } else {
          statusEl.textContent += "\nAdded: " + json.video.artist + " - " + json.video.title;
          form.reset();
          addStatusClose.disabled = false;
        }
      } catch (err) {
        if (err.message.includes("SQLITE_CONSTRAINT")) {
          statusEl.textContent += "\nError: Video already exists in the database\n";
        } else {
          statusEl.textContent += "\nRequest failed: " + err.message;
        }
        addStatusClose.disabled = false;
      }
    });
  }

  // src/dashboard.js
  async function loadVideos2() {
    const res = await fetch("/api/videos");
    const videos = await res.json();
    const tbody = document.querySelector("#videosTable tbody");
    tbody.innerHTML = "";
    for (const v of videos) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${v.id}</td>
      <td>${v.title || "(no title)"}</td>
      <td>${v.artist || ""}</td>
      <td>${v.year || ""}</td>
      <td>${v.genre || ""}</td>
      <td>
        <input type="checkbox" ${v.is_ident ? "checked" : ""} data-id="${v.id}">
      </td>
      <td>${v.source_url ? `<a href="${v.source_url}" target="_blank">source</a>` : ""}</td>
      <td class="px-3 py-2 flex gap-2">
        <button data-id="${v.id}" class="editBtn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Edit</button>
        <button data-id="${v.id}" class="deleteBtn px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Delete</button>
      </td>
    `;
      tbody.appendChild(tr);
      tr.querySelector(".editBtn").addEventListener("click", () => {
        const id = v.id;
        document.getElementById("modalTitle").textContent = "Edit Video";
        document.getElementById("modalContent").innerHTML = `
        <div class="space-y-3">
          <label class="block text-sm font-medium">Title</label>
          <input id="edit_title" value="${v.title || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="block text-sm font-medium">Artist</label>
          <input id="edit_artist" value="${v.artist || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="block text-sm font-medium">Year</label>
          <input id="edit_year" value="${v.year || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="block text-sm font-medium">Genre</label>
          <input id="edit_genre" value="${v.genre || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="flex items-center gap-2 mt-2">
            <input id="edit_ident" type="checkbox" ${v.is_ident ? "checked" : ""}>
            Ident
          </label>
        </div>
      `;
        document.getElementById("modalConfirm").onclick = async () => {
          await fetch(`/api/videos/${id}/edit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: document.getElementById("edit_title").value,
              artist: document.getElementById("edit_artist").value,
              year: document.getElementById("edit_year").value,
              genre: document.getElementById("edit_genre").value,
              is_ident: document.getElementById("edit_ident").checked
            })
          });
          closeModal();
          loadVideos2();
        };
        openModal();
      });
      tr.querySelector(".deleteBtn").addEventListener("click", () => {
        const id = v.id;
        document.getElementById("modalTitle").textContent = "Delete Video";
        document.getElementById("modalContent").innerHTML = `
        <p class="text-red-400">Are you sure you want to delete:<br>
        <strong>${v.title || "(no title)"}</strong>?</p>
      `;
        document.getElementById("modalConfirm").onclick = async () => {
          await fetch(`/api/videos/${id}`, { method: "DELETE" });
          closeModal();
          loadVideos2();
        };
        openModal();
      });
    }
    tbody.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", async () => {
        const id = cb.dataset.id;
        await fetch(`/api/videos/${id}/ident`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_ident: cb.checked })
        });
      });
    });
  }
  async function refreshNowPlaying() {
    const res = await fetch("/api/now-playing");
    const data = await res.json();
    document.querySelector("#nowPlaying").textContent = JSON.stringify(data, null, 2);
  }
  async function loadPlaylists() {
    const res = await fetch("/api/playlists");
    const pls = await res.json();
    const container = document.getElementById("playlists");
    container.innerHTML = "";
    pls.forEach((p) => {
      const div = document.createElement("div");
      div.innerHTML = `
      <strong>${p.name}</strong> - ${p.description || ""} 
      ${p.is_active ? "(active)" : ""}
      <a href="/playlists/${p.id}">Edit</a>
      <button data-id="${p.id}" class="activate-btn">Set active</button>
    `;
      container.appendChild(div);
    });
    container.querySelectorAll(".activate-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        await fetch(`/api/playlists/${id}/activate`, { method: "POST" });
        loadPlaylists();
      });
    });
  }
  document.getElementById("newPlaylistForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form2 = e.target;
    const data = Object.fromEntries(new FormData(form2).entries());
    await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    form2.reset();
    loadPlaylists();
  });
  setInterval(refreshNowPlaying, 5e3);
  loadVideos2();
  loadPlaylists();
  refreshNowPlaying();
  function openModal() {
    document.getElementById("modalOverlay").classList.remove("hidden");
  }
  function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
  }
  document.getElementById("modalCancel").addEventListener("click", closeModal);

  // src/media.js
  async function loadVideos3() {
    const res = await fetch("/api/videos");
    const videos = await res.json();
    const tbody = document.querySelector("#videosTable tbody");
    tbody.innerHTML = "";
    for (const v of videos) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${v.id}</td>
      <td>${v.title || "(no title)"}</td>
      <td>${v.artist || ""}</td>
      <td>${v.year || ""}</td>
      <td>${v.genre || ""}</td>
      <td>
        <input type="checkbox" ${v.is_ident ? "checked" : ""} data-id="${v.id}">
      </td>
      <td>${v.source_url ? `<a href="${v.source_url}" target="_blank">source</a>` : ""}</td>
      <td class="px-3 py-2 flex gap-2">
        <button data-id="${v.id}" class="editBtn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Edit</button>
        <button data-id="${v.id}" class="deleteBtn px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Delete</button>
      </td>
    `;
      tbody.appendChild(tr);
      tr.querySelector(".editBtn").addEventListener("click", () => {
        const id = v.id;
        document.getElementById("modalTitle").textContent = "Edit Video";
        document.getElementById("modalContent").innerHTML = `
        <div class="space-y-3">
          <label class="block text-sm font-medium">Title</label>
          <input id="edit_title" value="${v.title || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="block text-sm font-medium">Artist</label>
          <input id="edit_artist" value="${v.artist || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="block text-sm font-medium">Year</label>
          <input id="edit_year" value="${v.year || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="block text-sm font-medium">Genre</label>
          <input id="edit_genre" value="${v.genre || ""}"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />

          <label class="flex items-center gap-2 mt-2">
            <input id="edit_ident" type="checkbox" ${v.is_ident ? "checked" : ""}>
            Ident
          </label>

          <button id="modalGrab" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">Grab Metadata</button>
        </div>
      `;
        document.getElementById("modalConfirm").onclick = async () => {
          await fetch(`/api/videos/${id}/edit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: document.getElementById("edit_title").value,
              artist: document.getElementById("edit_artist").value,
              year: document.getElementById("edit_year").value,
              genre: document.getElementById("edit_genre").value,
              is_ident: document.getElementById("edit_ident").checked
            })
          });
          closeModal2();
          loadVideos3();
        };
        openModal2();
        const grabBtn = document.getElementById("modalGrab");
        if (grabBtn) {
          grabBtn.onclick = async () => {
            const urlencoded = new URLSearchParams();
            urlencoded.append("artist", document.getElementById("edit_artist").value);
            urlencoded.append("track", document.getElementById("edit_title").value);
            const requestOptions = {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: urlencoded,
              redirect: "follow"
            };
            const response = await fetch("/api/grab", requestOptions);
            const result = await response.json();
            if (result.year !== void 0) {
              document.getElementById("edit_year").value = result.year;
            }
            if (result.genre !== void 0) {
              document.getElementById("edit_genre").value = result.genre;
            }
          };
        }
      });
      tr.querySelector(".deleteBtn").addEventListener("click", () => {
        const id = v.id;
        document.getElementById("modalTitle").textContent = "Delete Video";
        document.getElementById("modalContent").innerHTML = `
        <p class="text-red-400">Are you sure you want to delete:<br>
        <strong>${v.title || "(no title)"}</strong>?</p>
      `;
        document.getElementById("modalConfirm").onclick = async () => {
          await fetch(`/api/videos/${id}`, { method: "DELETE" });
          closeModal2();
          loadVideos3();
        };
        openModal2();
      });
    }
    tbody.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", async () => {
        const id = cb.dataset.id;
        await fetch(`/api/videos/${id}/ident`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_ident: cb.checked })
        });
      });
    });
  }
  loadVideos3();
  function openModal2() {
    document.getElementById("modalOverlay").classList.remove("hidden");
  }
  function closeModal2() {
    document.getElementById("modalOverlay").classList.add("hidden");
  }
  document.getElementById("modalCancel").addEventListener("click", closeModal2);

  // src/playlist.js
  async function loadList() {
    const res = await fetch(`/api/playlists/${playlistId}/items`);
    const items = await res.json();
    const ul = document.getElementById("playlist");
    ul.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.artist || ""} - ${item.title || ""} [${item.genre || ""}]`;
      li.draggable = true;
      li.dataset.id = item.id;
      ul.appendChild(li);
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    new Sortable(document.getElementById("playlist"), {
      animation: 150,
      ghostClass: "opacity-50"
    });
  });
  document.getElementById("save").addEventListener("click", async () => {
    const order = [...document.querySelectorAll("#playlist li")].map((li) => Number(li.dataset.id));
    await fetch(`/api/playlists/${playlistId}/order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order })
    });
    alert("Order saved");
  });
  loadList();
})();
