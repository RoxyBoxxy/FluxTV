(() => {
  const path = window.location.pathname || "/";

  document.addEventListener("DOMContentLoaded", () => {
    if (path === "/") initDashboardPage();
    if (path.startsWith("/media")) {
      const api = initMediaPage();
      initAddModule(api?.reloadVideos);
    }
    if (path.startsWith("/users")) initUsersPage();
    if (path.startsWith("/playlists/")) initPlaylistEditor();
  });

  function initDashboardPage() {
    initDashboardVideos();
    initDashboardNowPlaying();
    initDashboardPlaylists();

    function initDashboardVideos() {
      const tbody = document.querySelector("#videosTable tbody");
      const modalOverlay = document.getElementById("modalOverlay");
      const modalCancel = document.getElementById("modalCancel");
      const modalTitle = document.getElementById("modalTitle");
      const modalContent = document.getElementById("modalContent");
      const modalConfirm = document.getElementById("modalConfirm");
      if (!tbody || !modalOverlay || !modalTitle || !modalContent || !modalConfirm) return;

      async function loadVideos() {
        const res = await fetch("/api/videos");
        const videos = await res.json();
        tbody.innerHTML = "";
        videos.forEach((v) => {
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
            modalTitle.textContent = "Edit Video";
            modalContent.innerHTML = `
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

            modalConfirm.onclick = async () => {
              await fetch(`/api/videos/${v.id}/edit`, {
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
              loadVideos();
            };

            openModal();
          });

          tr.querySelector(".deleteBtn").addEventListener("click", () => {
            modalTitle.textContent = "Delete Video";
            modalContent.innerHTML = `
              <p class="text-red-400">Are you sure you want to delete:<br>
              <strong>${v.title || "(no title)"}</strong>?</p>
            `;
            modalConfirm.onclick = async () => {
              await fetch(`/api/videos/${v.id}`, { method: "DELETE" });
              closeModal();
              loadVideos();
            };
            openModal();
          });
        });

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

      function openModal() {
        modalOverlay.classList.remove("hidden");
      }

      function closeModal() {
        modalOverlay.classList.add("hidden");
      }

      modalCancel?.addEventListener("click", closeModal);
      loadVideos();
    }

    function initDashboardNowPlaying() {
      const nowPlayingEl = document.getElementById("nowPlaying");
      if (!nowPlayingEl) return;
      async function refreshNowPlaying() {
        const res = await fetch("/api/now-playing");
        const data = await res.json();
        nowPlayingEl.textContent = JSON.stringify(data, null, 2);
      }
      refreshNowPlaying();
      setInterval(refreshNowPlaying, 5000);
    }

    function initDashboardPlaylists() {
      const container = document.getElementById("playlists");
      const form = document.getElementById("newPlaylistForm");
      if (!container && !form) return;

      async function loadPlaylists() {
        if (!container) return;
        const res = await fetch("/api/playlists");
        const pls = await res.json();
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

      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        await fetch("/api/playlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        form.reset();
        loadPlaylists();
      });

      loadPlaylists();
    }
  }

  function initMediaPage() {
    const tbody = document.getElementById("videosTableBody");
    if (!tbody) return null;
    let currentPage = 1;
    const PAGE_SIZE = 25;
    let totalPages = 1;
    let currentSearch = "";
    let currentSource = "";

    const paginationInfo = document.getElementById("videoPageInfo");
    const paginationPrev = document.getElementById("videoPrev");
    const paginationNext = document.getElementById("videoNext");
    const searchInput = document.getElementById("videoSearch");
    const sourceFilter = document.getElementById("videoSourceFilter");
    const modalOverlay = document.getElementById("modalOverlay");
    const modalCancel = document.getElementById("modalCancel");
    const modalTitle = document.getElementById("modalTitle");
    const modalContent = document.getElementById("modalContent");
    const modalConfirm = document.getElementById("modalConfirm");

    searchInput?.addEventListener("input", () => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      loadVideos(1);
    });

    sourceFilter?.addEventListener("change", () => {
      currentSource = sourceFilter.value;
      currentPage = 1;
      loadVideos(1);
    });

    paginationPrev?.addEventListener("click", () => {
      if (currentPage > 1) loadVideos(currentPage - 1);
    });

    paginationNext?.addEventListener("click", () => {
      if (currentPage < totalPages) loadVideos(currentPage + 1);
    });

    modalCancel?.addEventListener("click", () => modalOverlay?.classList.add("hidden"));

    loadVideos();

    function loadVideos(page = 1) {
      currentPage = page;
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE)
      });
      if (currentSearch) params.set("q", currentSearch);
      if (currentSource) params.set("source", currentSource);

      fetch(`/api/videos?${params}`)
        .then((res) => res.json())
        .then((data) => {
          const { rows, total, pages } = data;
          totalPages = pages;
          tbody.innerHTML = "";
          rows.forEach((v) => {
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
              if (!modalTitle || !modalContent || !modalConfirm || !modalOverlay) return;
              modalTitle.textContent = "Edit Video";
              modalContent.innerHTML = `
                <div class="space-y-3">
                  <label class="block text-sm font-medium">Title</label>
                  <input id="edit_title" value="${v.title || ""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="block text-sm font-medium">Artist</label>
                  <input id="edit_artist" value="${v.artist || ""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="block text-sm font-medium">Year</label>
                  <input id="edit_year" value="${v.year || ""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="block text-sm font-medium">Genre</label>
                  <input id="edit_genre" value="${v.genre || ""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="flex items-center gap-2 mt-2">
                    <input id="edit_ident" type="checkbox" ${v.is_ident ? "checked" : ""}> Ident
                  </label>
                  <button id="modalGrab" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">Grab Metadata</button>
                </div>
              `;

              modalConfirm.onclick = async () => {
                await fetch(`/api/videos/${v.id}/edit`, {
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
                loadVideos(currentPage);
              };

              const grabBtn = document.getElementById("modalGrab");
              if (grabBtn) {
                grabBtn.onclick = async () => {
                  const urlencoded = new URLSearchParams();
                  urlencoded.append("artist", document.getElementById("edit_artist").value);
                  urlencoded.append("track", document.getElementById("edit_title").value);

                  const response = await fetch("/api/grab", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: urlencoded
                  });
                  const result = await response.json();

                  if (result.year !== undefined) document.getElementById("edit_year").value = result.year;
                  if (result.genre !== undefined) document.getElementById("edit_genre").value = result.genre;
                };
              }

              modalOverlay.classList.remove("hidden");
            });

            tr.querySelector(".deleteBtn").addEventListener("click", () => {
              if (!modalTitle || !modalContent || !modalConfirm || !modalOverlay) return;
              modalTitle.textContent = "Delete Video";
              modalContent.innerHTML = `
                <p class="text-red-400">Are you sure you want to delete:<br>
                <strong>${v.title || "(no title)"}</strong>?</p>
              `;
              modalConfirm.onclick = async () => {
                await fetch(`/api/videos/${v.id}`, { method: "DELETE" });
                closeModal();
                loadVideos(currentPage);
              };
              modalOverlay.classList.remove("hidden");
            });
          });

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

          updatePagination(total, currentPage, totalPages);
        });
    }

    function updatePagination(total, page, pages) {
      if (!paginationInfo || !paginationPrev || !paginationNext) return;
      const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
      const end = Math.min(page * PAGE_SIZE, total);
      paginationInfo.textContent = `Showing ${start}–${end} of ${total}`;
      paginationPrev.disabled = page <= 1;
      paginationNext.disabled = page >= pages;
    }

    function closeModal() {
      modalOverlay?.classList.add("hidden");
    }

    return { reloadVideos: () => loadVideos(currentPage) };
  }

  function initAddModule(reloadVideos = () => {}) {
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
    if (!form || !statusText || !statusBar || !statusLog || !addStatusModal) return;
    const manualDropZone = document.getElementById("manualUploadZone");
    const manualFileInput = document.getElementById("manualUploadInput");

    function openAddModal() {
      if (typeof addStatusModal.showModal === "function") {
        addStatusModal.showModal();
      } else {
        addStatusModal.style.display = "block";
        addStatusModal.classList.remove("hidden");
      }
    }

    function closeAddModal() {
      if (typeof addStatusModal.close === "function") {
        addStatusModal.close();
      } else {
        addStatusModal.style.display = "none";
        addStatusModal.classList.add("hidden");
      }
    }

    function prepareStatusUI(initialMessage) {
      statusText.textContent = initialMessage;
      statusBar.style.width = "0%";
      statusLog.textContent = "";
      statusLog.classList.add("hidden");
      if (toggleLogBtn) toggleLogBtn.textContent = "Show log";
      addMeta?.classList.add("hidden");
      if (addMetaThumb) addMetaThumb.src = "";
      if (addMetaArtist) addMetaArtist.textContent = "";
      if (addMetaTrack) addMetaTrack.textContent = "";
      if (addStatusClose) addStatusClose.disabled = true;
    }

    toggleLogBtn?.addEventListener("click", () => {
      const visible = !statusLog.classList.contains("hidden");
      statusLog.classList.toggle("hidden", visible);
      toggleLogBtn.textContent = visible ? "Show log" : "Hide log";
    });

    if (addStatusClose) {
      addStatusClose.disabled = true;
      addStatusClose.addEventListener("click", () => {
        const urlInput = document.getElementById("url");
        if (urlInput) urlInput.value = "";
        closeAddModal();
        reloadVideos();
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      prepareStatusUI("Starting yt-dlp import…");
      openAddModal();

      const url = data.url;
      const es = new EventSource(`/api/add-url/stream?url=${encodeURIComponent(url)}`);

      es.addEventListener("status", (event) => {
        const d = JSON.parse(event.data);
        statusText.textContent = d.message;
      });

      es.addEventListener("progress", (event) => {
        const p = JSON.parse(event.data);
        if (typeof p.percent === "number") {
          statusBar.style.width = `${p.percent}%`;
          statusText.textContent = `Downloading… ${p.percent.toFixed(1)}%`;
        }
        if (p.speed) {
          statusText.textContent += ` (${p.speed})`;
        }
      });

      es.addEventListener("log", (event) => {
        const line = JSON.parse(event.data).line;
        statusLog.textContent += line + "\n";
        statusLog.scrollTop = statusLog.scrollHeight;

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

      es.addEventListener("video", (event) => {
        const v = JSON.parse(event.data);
        statusText.textContent = `Added: ${v.artist || ""} ${v.title || ""}`;
      });

      es.addEventListener("meta", (event) => {
        const meta = JSON.parse(event.data);
        if (meta.thumbnail && addMetaThumb) addMetaThumb.src = meta.thumbnail;
        if (meta.artist || meta.uploader) addMetaArtist.textContent = meta.artist || meta.uploader;
        if (meta.track || meta.title) addMetaTrack.textContent = meta.track || meta.title;
        addMeta?.classList.remove("hidden");
      });

      es.addEventListener("done", () => {
        statusText.textContent = "Import complete 🎉";
        statusBar.style.width = "100%";
        es.close();
        form.reset();
        if (addStatusClose) addStatusClose.disabled = false;
        reloadVideos();
      });

      es.addEventListener("error", (event) => {
        try {
          const err = JSON.parse(event.data);
          statusText.textContent = "Error: " + err.message;
        } catch {
          statusText.textContent = "Import failed";
        }
        es.close();
        if (addStatusClose) addStatusClose.disabled = false;
      });
    });

    const isMp4File = (file) =>
      !!file &&
      ((file.name && file.name.toLowerCase().endsWith(".mp4")) || file.type === "video/mp4");

    function uploadManualFile(file, callback) {
      const formData = new FormData();
      formData.append("video", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/manual-upload");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = (event.loaded / event.total) * 100;
        statusBar.style.width = `${percent}%`;
        statusText.textContent = `Uploading… ${percent.toFixed(1)}%`;
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          statusBar.style.width = "100%";
          callback(true);
          return;
        }
        let errorMessage = "Upload failed";
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.error) errorMessage = response.error;
        } catch {}
        callback(false, errorMessage);
      };

      xhr.onerror = () => {
        callback(false, "Upload failed");
      };

      xhr.send(formData);
    }

    function handleManualUploads(fileList) {
      if (!fileList?.length) return;
      const files = Array.from(fileList);
      const validFiles = files.filter(isMp4File);
      const invalidFiles = files.filter((file) => !isMp4File(file));
      if (!validFiles.length) {
        window.alert("Only MP4 files are supported for manual upload.");
        return;
      }
      if (invalidFiles.length) {
        window.alert(
          `Skipped non-MP4 files:\n${invalidFiles
            .map((file) => file.name || "Unnamed")
            .join(", ")}`
        );
      }

      const total = validFiles.length;
      let index = 0;
      openAddModal();

      const uploadNext = () => {
        if (index >= total) {
          statusText.textContent = "Upload complete 🎉";
          statusBar.style.width = "100%";
          if (addStatusClose) addStatusClose.disabled = false;
          if (manualFileInput) manualFileInput.value = "";
          reloadVideos();
          return;
        }

        const currentFile = validFiles[index];
        prepareStatusUI(`Uploading (${index + 1}/${total}) ${currentFile.name}`);

        uploadManualFile(currentFile, (success, message) => {
          if (success) {
            reloadVideos();
            index += 1;
            uploadNext();
          } else {
            statusText.textContent = message || `Upload failed for ${currentFile.name}`;
            if (addStatusClose) addStatusClose.disabled = false;
          }
        });
      };

      uploadNext();
    }

    if (manualDropZone && manualFileInput) {
      const setDropActive = (active) => {
        manualDropZone.style.borderColor = active ? "rgba(216, 180, 254, 0.9)" : "";
        manualDropZone.style.backgroundColor = active ? "rgba(76, 29, 149, 0.2)" : "";
      };

      ["dragenter", "dragover"].forEach((eventName) => {
        manualDropZone.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();
          setDropActive(true);
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        manualDropZone.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();
          setDropActive(false);
        });
      });

      manualDropZone.addEventListener("drop", (event) => {
        const droppedFiles = event.dataTransfer?.files;
        if (droppedFiles?.length) {
          handleManualUploads(droppedFiles);
        }
      });

      manualDropZone.addEventListener("click", () => {
        manualFileInput.click();
      });

      manualFileInput.addEventListener("change", () => {
        if (manualFileInput.files?.length) {
          handleManualUploads(manualFileInput.files);
        }
      });
    }
  }

  function initUsersPage() {
    const page = document.getElementById("usersPage");
    const form = document.getElementById("userForm");
    const usernameInput = document.getElementById("userUsername");
    const passwordInput = document.getElementById("userPassword");
    const alertBox = document.getElementById("userFormAlert");
    const tableBody = document.getElementById("userTableBody");
    const userCount = document.getElementById("userCount");
    const editDialog = document.getElementById("userEditDialog");
    const editForm = document.getElementById("userEditForm");
    const editUserIdInput = document.getElementById("editUserId");
    const editUsernameInput = document.getElementById("editUsername");
    const editPasswordInput = document.getElementById("editPassword");
    const editAlert = document.getElementById("userEditAlert");
    const editCancel = document.getElementById("userEditCancel");
    const confirmDialog = document.getElementById("userConfirmDialog");
    const confirmText = document.getElementById("userConfirmText");
    const confirmCancel = document.getElementById("userConfirmCancel");
    const confirmDelete = document.getElementById("userConfirmDelete");
    const currentUsername = page?.dataset?.currentUser || "";
    let confirmAction = null;

    if (!form || !usernameInput || !passwordInput || !tableBody) return;

    const setAlert = (message, type = "success") => {
      if (!alertBox) return;
      alertBox.textContent = message;
      alertBox.classList.remove("hidden");
      alertBox.classList.toggle("bg-green-500/10", type === "success");
      alertBox.classList.toggle("border-green-500/40", type === "success");
      alertBox.classList.toggle("text-green-200", type === "success");
      alertBox.classList.toggle("bg-red-500/10", type === "error");
      alertBox.classList.toggle("border-red-500/40", type === "error");
      alertBox.classList.toggle("text-red-200", type === "error");
    };

    const clearAlert = () => {
      if (!alertBox) return;
      alertBox.classList.add("hidden");
      alertBox.textContent = "";
      alertBox.classList.remove(
        "bg-green-500/10",
        "border-green-500/40",
        "text-green-200",
        "bg-red-500/10",
        "border-red-500/40",
        "text-red-200"
      );
    };

    const setEditAlert = (message, type = "success") => {
      if (!editAlert) return;
      editAlert.textContent = message;
      editAlert.classList.remove("hidden");
      editAlert.classList.toggle("bg-green-500/10", type === "success");
      editAlert.classList.toggle("border-green-500/40", type === "success");
      editAlert.classList.toggle("text-green-200", type === "success");
      editAlert.classList.toggle("bg-red-500/10", type === "error");
      editAlert.classList.toggle("border-red-500/40", type === "error");
      editAlert.classList.toggle("text-red-200", type === "error");
    };

    const clearEditAlert = () => {
      if (!editAlert) return;
      editAlert.classList.add("hidden");
      editAlert.textContent = "";
      editAlert.classList.remove(
        "bg-green-500/10",
        "border-green-500/40",
        "text-green-200",
        "bg-red-500/10",
        "border-red-500/40",
        "text-red-200"
      );
    };

    const openEditDialog = (user) => {
      if (!editDialog || !editForm || !editUserIdInput || !editUsernameInput || !editPasswordInput) return;
      editUserIdInput.value = String(user.id);
      editUsernameInput.value = user.username;
      editPasswordInput.value = "";
      clearEditAlert();
      if (typeof editDialog.showModal === "function") {
        editDialog.showModal();
      } else {
        editDialog.style.display = "block";
      }
    };

    const closeEditDialog = () => {
      if (!editDialog) return;
      if (typeof editDialog.close === "function") {
        editDialog.close();
      } else {
        editDialog.style.display = "none";
      }
    };

    editCancel?.addEventListener("click", () => {
      closeEditDialog();
    });

    const openConfirmDialog = (message, action) => {
      if (!confirmDialog || !confirmText || !confirmDelete || !confirmCancel) return;
      confirmText.textContent = message;
      confirmAction = action;
      if (typeof confirmDialog.showModal === "function") {
        confirmDialog.showModal();
      } else {
        confirmDialog.style.display = "block";
      }
    };

    const closeConfirmDialog = () => {
      confirmAction = null;
      if (!confirmDialog) return;
      if (typeof confirmDialog.close === "function") {
        confirmDialog.close();
      } else {
        confirmDialog.style.display = "none";
      }
    };

    confirmCancel?.addEventListener("click", () => closeConfirmDialog());
    confirmDelete?.addEventListener("click", () => {
      if (confirmAction) confirmAction();
      closeConfirmDialog();
    });

    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        const users = await res.json();
        tableBody.innerHTML = "";
        if (!users.length) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="3" class="px-4 py-6 text-center text-gray-400 text-sm">
                No users yet. Create one on the left.
              </td>
            </tr>
          `;
        } else {
          users.forEach((user) => {
            const tr = document.createElement("tr");
            const isCurrent = currentUsername && user.username === currentUsername;
            tr.innerHTML = `
              <td class="px-4 py-3 font-mono text-xs text-gray-400">#${user.id}</td>
              <td class="px-4 py-3 font-semibold">${user.username}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    data-id="${user.id}"
                    data-username="${user.username}"
                    class="user-edit-btn px-3 py-1.5 rounded-xl border border-white/15 text-xs text-purple-100 hover:bg-white/10 transition">
                    Edit
                  </button>
                  <button
                    data-id="${user.id}"
                    class="user-delete-btn px-3 py-1.5 rounded-xl border border-red-400/40 text-xs text-red-200 hover:bg-red-500/20 transition ${isCurrent ? "opacity-40 cursor-not-allowed" : ""}"
                    ${isCurrent ? "disabled" : ""}>
                    Delete
                  </button>
                </div>
              </td>
            `;
            tableBody.appendChild(tr);

            const editBtn = tr.querySelector(".user-edit-btn");
            const deleteBtn = tr.querySelector(".user-delete-btn");

            editBtn?.addEventListener("click", () => openEditDialog(user));

            deleteBtn?.addEventListener("click", () => {
              openConfirmDialog(
                `Are you sure you want to delete "${user.username}"? This cannot be undone.`,
                async () => {
                  if (!deleteBtn) return;
                  deleteBtn.disabled = true;
                  try {
                    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
                    const data = await res.json();
                    if (!res.ok || !data.ok) {
                      alert(data.error || "Failed to delete user");
                    } else {
                      loadUsers();
                    }
                  } catch {
                    alert("Failed to delete user");
                  } finally {
                    deleteBtn.disabled = false;
                  }
                }
              );
            });
          });
        }
        if (userCount) {
          userCount.textContent = `${users.length} user${users.length === 1 ? "" : "s"}`;
        }
      } catch (e) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="3" class="px-4 py-6 text-center text-red-300 text-sm">
              Failed to load users.
            </td>
          </tr>
        `;
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearAlert();

      const submitBtn = form.querySelector("button[type=submit]");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch("/api/add-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: usernameInput.value.trim(),
            password: passwordInput.value
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setAlert(data.error || "Failed to add user", "error");
        } else {
          setAlert("User created successfully.", "success");
          form.reset();
          loadUsers();
        }
      } catch (e) {
        setAlert("Failed to add user", "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    editForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!editUserIdInput || !editUsernameInput || !editPasswordInput) return;

      clearEditAlert();
      const submitBtn = editForm.querySelector("button[type=submit]");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const payload = {
          username: editUsernameInput.value.trim(),
          password: editPasswordInput.value
        };
        const res = await fetch(`/api/users/${editUserIdInput.value}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setEditAlert(data.error || "Failed to update user", "error");
        } else {
          setEditAlert("User updated.", "success");
          loadUsers();
          setTimeout(() => {
            closeEditDialog();
          }, 500);
        }
      } catch {
        setEditAlert("Failed to update user", "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    loadUsers();
  }

  function initPlaylistEditor() {
    const playlistElement = document.getElementById("playlist");
    const saveBtn = document.getElementById("save");
    const playlistNode = document.getElementById("playlistId");
    const playlistId = playlistNode?.dataset?.playlistId || window.playlistId;
    if (!playlistElement || !saveBtn || !playlistId) return;

    async function loadList() {
      const res = await fetch(`/api/playlists/${playlistId}/items`);
      const items = await res.json();
      playlistElement.innerHTML = "";
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.artist || ""} - ${item.title || ""} [${item.genre || ""}]`;
        li.draggable = true;
        li.dataset.id = item.id;
        playlistElement.appendChild(li);
      });
    }

    if (window.Sortable) {
      new Sortable(playlistElement, {
        animation: 150,
        ghostClass: "opacity-50"
      });
    }

    saveBtn.addEventListener("click", async () => {
      const order = [...playlistElement.querySelectorAll("li")].map((li) => Number(li.dataset.id));
      await fetch(`/api/playlists/${playlistId}/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order })
      });
      alert("Order saved");
    });

    loadList();
  }
})();
