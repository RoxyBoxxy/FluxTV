(()=>{(()=>{let D=window.location.pathname||"/";document.addEventListener("DOMContentLoaded",()=>{if(D==="/"&&N(),D.startsWith("/media")){let b=U();j(b?.reloadVideos)}D.startsWith("/users")&&H(),D.startsWith("/playlists/")&&J()});function N(){b(),c(),f();function b(){let s=document.querySelector("#videosTable tbody"),t=document.getElementById("modalOverlay"),y=document.getElementById("modalCancel"),i=document.getElementById("modalTitle"),d=document.getElementById("modalContent"),r=document.getElementById("modalConfirm");if(!s||!t||!i||!d||!r)return;async function h(){let w=await(await fetch("/api/videos")).json();s.innerHTML="",w.forEach(n=>{let L=document.createElement("tr");L.innerHTML=`
            <td>${n.id}</td>
            <td>${n.title||"(no title)"}</td>
            <td>${n.artist||""}</td>
            <td>${n.year||""}</td>
            <td>${n.genre||""}</td>
            <td>
              <input type="checkbox" ${n.is_ident?"checked":""} data-id="${n.id}">
            </td>
            <td>${n.source_url?`<a href="${n.source_url}" target="_blank">source</a>`:""}</td>
            <td class="px-3 py-2 flex gap-2">
              <button data-id="${n.id}" class="editBtn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Edit</button>
              <button data-id="${n.id}" class="deleteBtn px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Delete</button>
            </td>
          `,s.appendChild(L),L.querySelector(".editBtn").addEventListener("click",()=>{i.textContent="Edit Video",d.innerHTML=`
              <div class="space-y-3">
                <label class="block text-sm font-medium">Title</label>
                <input id="edit_title" value="${n.title||""}"
                  class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                <label class="block text-sm font-medium">Artist</label>
                <input id="edit_artist" value="${n.artist||""}"
                  class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                <label class="block text-sm font-medium">Year</label>
                <input id="edit_year" value="${n.year||""}"
                  class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                <label class="block text-sm font-medium">Genre</label>
                <input id="edit_genre" value="${n.genre||""}"
                  class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                <label class="flex items-center gap-2 mt-2">
                  <input id="edit_ident" type="checkbox" ${n.is_ident?"checked":""}>
                  Ident
                </label>
              </div>
            `,r.onclick=async()=>{await fetch(`/api/videos/${n.id}/edit`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:document.getElementById("edit_title").value,artist:document.getElementById("edit_artist").value,year:document.getElementById("edit_year").value,genre:document.getElementById("edit_genre").value,is_ident:document.getElementById("edit_ident").checked})}),E(),h()},C()}),L.querySelector(".deleteBtn").addEventListener("click",()=>{i.textContent="Delete Video",d.innerHTML=`
              <p class="text-red-400">Are you sure you want to delete:<br>
              <strong>${n.title||"(no title)"}</strong>?</p>
            `,r.onclick=async()=>{await fetch(`/api/videos/${n.id}`,{method:"DELETE"}),E(),h()},C()})}),s.querySelectorAll("input[type=checkbox]").forEach(n=>{n.addEventListener("change",async()=>{let L=n.dataset.id;await fetch(`/api/videos/${L}/ident`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_ident:n.checked})})})})}function C(){t.classList.remove("hidden")}function E(){t.classList.add("hidden")}y?.addEventListener("click",E),h()}function c(){let s=document.getElementById("nowPlaying");if(!s)return;async function t(){let i=await(await fetch("/api/now-playing")).json();s.textContent=JSON.stringify(i,null,2)}t(),setInterval(t,5e3)}function f(){let s=document.getElementById("playlists"),t=document.getElementById("newPlaylistForm");if(!s&&!t)return;async function y(){if(!s)return;let d=await(await fetch("/api/playlists")).json();s.innerHTML="",d.forEach(r=>{let h=document.createElement("div");h.innerHTML=`
            <strong>${r.name}</strong> - ${r.description||""} 
            ${r.is_active?"(active)":""}
            <a href="/playlists/${r.id}">Edit</a>
            <button data-id="${r.id}" class="activate-btn">Set active</button>
          `,s.appendChild(h)}),s.querySelectorAll(".activate-btn").forEach(r=>{r.addEventListener("click",async()=>{let h=r.dataset.id;await fetch(`/api/playlists/${h}/activate`,{method:"POST"}),y()})})}t?.addEventListener("submit",async i=>{i.preventDefault();let d=Object.fromEntries(new FormData(t).entries());await fetch("/api/playlists",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}),t.reset(),y()}),y()}}function U(){let b=document.getElementById("videosTableBody");if(!b)return null;let c=1,f=25,s=1,t="",y="",i=document.getElementById("videoPageInfo"),d=document.getElementById("videoPrev"),r=document.getElementById("videoNext"),h=document.getElementById("videoSearch"),C=document.getElementById("videoSourceFilter"),E=document.getElementById("modalOverlay"),g=document.getElementById("modalCancel"),w=document.getElementById("modalTitle"),n=document.getElementById("modalContent"),L=document.getElementById("modalConfirm");h?.addEventListener("input",()=>{t=h.value.trim(),c=1,$(1)}),C?.addEventListener("change",()=>{y=C.value,c=1,$(1)}),d?.addEventListener("click",()=>{c>1&&$(c-1)}),r?.addEventListener("click",()=>{c<s&&$(c+1)}),g?.addEventListener("click",()=>E?.classList.add("hidden")),$();function $(S=1){c=S;let a=new URLSearchParams({page:String(c),limit:String(f)});t&&a.set("q",t),y&&a.set("source",y),fetch(`/api/videos?${a}`).then(u=>u.json()).then(u=>{let{rows:m,total:l,pages:p}=u;s=p,b.innerHTML="",m.forEach(e=>{let I=document.createElement("tr");I.innerHTML=`
              <td>${e.id}</td>
              <td>${e.title||"(no title)"}</td>
              <td>${e.artist||""}</td>
              <td>${e.year||""}</td>
              <td>${e.genre||""}</td>
              <td>
                <input type="checkbox" ${e.is_ident?"checked":""} data-id="${e.id}">
              </td>
              <td>${e.source_url?`<a href="${e.source_url}" target="_blank">source</a>`:""}</td>
              <td class="px-3 py-2 flex gap-2">
                <button data-id="${e.id}" class="editBtn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Edit</button>
                <button data-id="${e.id}" class="deleteBtn px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Delete</button>
              </td>
            `,b.appendChild(I),I.querySelector(".editBtn").addEventListener("click",()=>{if(!w||!n||!L||!E)return;w.textContent="Edit Video",n.innerHTML=`
                <div class="space-y-3">
                  <label class="block text-sm font-medium">Title</label>
                  <input id="edit_title" value="${e.title||""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="block text-sm font-medium">Artist</label>
                  <input id="edit_artist" value="${e.artist||""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="block text-sm font-medium">Year</label>
                  <input id="edit_year" value="${e.year||""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="block text-sm font-medium">Genre</label>
                  <input id="edit_genre" value="${e.genre||""}" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded" />
                  <label class="flex items-center gap-2 mt-2">
                    <input id="edit_ident" type="checkbox" ${e.is_ident?"checked":""}> Ident
                  </label>
                  <button id="modalGrab" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">Grab Metadata</button>
                </div>
              `,L.onclick=async()=>{await fetch(`/api/videos/${e.id}/edit`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:document.getElementById("edit_title").value,artist:document.getElementById("edit_artist").value,year:document.getElementById("edit_year").value,genre:document.getElementById("edit_genre").value,is_ident:document.getElementById("edit_ident").checked})}),_(),$(c)};let v=document.getElementById("modalGrab");v&&(v.onclick=async()=>{let T=new URLSearchParams;T.append("artist",document.getElementById("edit_artist").value),T.append("track",document.getElementById("edit_title").value);let o=await(await fetch("/api/grab",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:T})).json();o.year!==void 0&&(document.getElementById("edit_year").value=o.year),o.genre!==void 0&&(document.getElementById("edit_genre").value=o.genre)}),E.classList.remove("hidden")}),I.querySelector(".deleteBtn").addEventListener("click",()=>{!w||!n||!L||!E||(w.textContent="Delete Video",n.innerHTML=`
                <p class="text-red-400">Are you sure you want to delete:<br>
                <strong>${e.title||"(no title)"}</strong>?</p>
              `,L.onclick=async()=>{await fetch(`/api/videos/${e.id}`,{method:"DELETE"}),_(),$(c)},E.classList.remove("hidden"))})}),b.querySelectorAll("input[type=checkbox]").forEach(e=>{e.addEventListener("change",async()=>{let I=e.dataset.id;await fetch(`/api/videos/${I}/ident`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_ident:e.checked})})})}),M(l,c,s)})}function M(S,a,u){if(!i||!d||!r)return;let m=S===0?0:(a-1)*f+1,l=Math.min(a*f,S);i.textContent=`Showing ${m}\u2013${l} of ${S}`,d.disabled=a<=1,r.disabled=a>=u}function _(){E?.classList.add("hidden")}return{reloadVideos:()=>$(c)}}function j(b=()=>{}){let c=document.getElementById("addForm"),f=document.getElementById("addStatusText"),s=document.getElementById("addStatusBar"),t=document.getElementById("addStatusLog"),y=document.getElementById("addStatusToggleLog"),i=document.getElementById("addStatusModal"),d=document.getElementById("addStatusClose"),r=document.getElementById("addMeta"),h=document.getElementById("addMetaThumb"),C=document.getElementById("addMetaArtist"),E=document.getElementById("addMetaTrack");if(!c||!f||!s||!t||!i)return;let g=document.getElementById("manualUploadZone"),w=document.getElementById("manualUploadInput");function n(){typeof i.showModal=="function"?i.showModal():(i.style.display="block",i.classList.remove("hidden"))}function L(){typeof i.close=="function"?i.close():(i.style.display="none",i.classList.add("hidden"))}function $(a){f.textContent=a,s.style.width="0%",t.textContent="",t.classList.add("hidden"),y&&(y.textContent="Show log"),r?.classList.add("hidden"),h&&(h.src=""),C&&(C.textContent=""),E&&(E.textContent=""),d&&(d.disabled=!0)}y?.addEventListener("click",()=>{let a=!t.classList.contains("hidden");t.classList.toggle("hidden",a),y.textContent=a?"Show log":"Hide log"}),d&&(d.disabled=!0,d.addEventListener("click",()=>{let a=document.getElementById("url");a&&(a.value=""),L(),b()})),c.addEventListener("submit",async a=>{a.preventDefault();let u=Object.fromEntries(new FormData(c).entries());$("Starting yt-dlp import\u2026"),n();let m=u.url,l=new EventSource(`/api/add-url/stream?url=${encodeURIComponent(m)}`);l.addEventListener("status",p=>{let e=JSON.parse(p.data);f.textContent=e.message}),l.addEventListener("progress",p=>{let e=JSON.parse(p.data);typeof e.percent=="number"&&(s.style.width=`${e.percent}%`,f.textContent=`Downloading\u2026 ${e.percent.toFixed(1)}%`),e.speed&&(f.textContent+=` (${e.speed})`)}),l.addEventListener("log",p=>{let e=JSON.parse(p.data).line;t.textContent+=e+`
`,t.scrollTop=t.scrollHeight;let I=e.match(/\[download\]\s+([\d.]+)%.*?at\s+([^\s]+).*?ETA\s+([0-9:]+)/i);if(I){let v=parseFloat(I[1]),T=I[2],x=I[3];Number.isNaN(v)||(s.style.width=`${v}%`,f.textContent=`Downloading\u2026 ${v.toFixed(1)}% (${T}, ETA ${x})`)}}),l.addEventListener("video",p=>{let e=JSON.parse(p.data);f.textContent=`Added: ${e.artist||""} ${e.title||""}`}),l.addEventListener("meta",p=>{let e=JSON.parse(p.data);e.thumbnail&&h&&(h.src=e.thumbnail),(e.artist||e.uploader)&&(C.textContent=e.artist||e.uploader),(e.track||e.title)&&(E.textContent=e.track||e.title),r?.classList.remove("hidden")}),l.addEventListener("done",()=>{f.textContent="Import complete \u{1F389}",s.style.width="100%",l.close(),c.reset(),d&&(d.disabled=!1),b()}),l.addEventListener("error",p=>{try{let e=JSON.parse(p.data);f.textContent="Error: "+e.message}catch{f.textContent="Import failed"}l.close(),d&&(d.disabled=!1)})});let M=a=>!!a&&(a.name&&a.name.toLowerCase().endsWith(".mp4")||a.type==="video/mp4");function _(a,u){let m=new FormData;m.append("video",a);let l=new XMLHttpRequest;l.open("POST","/api/manual-upload"),l.upload.onprogress=p=>{if(!p.lengthComputable)return;let e=p.loaded/p.total*100;s.style.width=`${e}%`,f.textContent=`Uploading\u2026 ${e.toFixed(1)}%`},l.onload=()=>{if(l.status>=200&&l.status<300){s.style.width="100%",u(!0);return}let p="Upload failed";try{let e=JSON.parse(l.responseText);e.error&&(p=e.error)}catch{}u(!1,p)},l.onerror=()=>{u(!1,"Upload failed")},l.send(m)}function S(a){if(!a?.length)return;let u=Array.from(a),m=u.filter(M),l=u.filter(v=>!M(v));if(!m.length){window.alert("Only MP4 files are supported for manual upload.");return}l.length&&window.alert(`Skipped non-MP4 files:
${l.map(v=>v.name||"Unnamed").join(", ")}`);let p=m.length,e=0;n();let I=()=>{if(e>=p){f.textContent="Upload complete \u{1F389}",s.style.width="100%",d&&(d.disabled=!1),w&&(w.value=""),b();return}let v=m[e];$(`Uploading (${e+1}/${p}) ${v.name}`),_(v,(T,x)=>{T?(b(),e+=1,I()):(f.textContent=x||`Upload failed for ${v.name}`,d&&(d.disabled=!1))})};I()}if(g&&w){let a=u=>{g.style.borderColor=u?"rgba(216, 180, 254, 0.9)":"",g.style.backgroundColor=u?"rgba(76, 29, 149, 0.2)":""};["dragenter","dragover"].forEach(u=>{g.addEventListener(u,m=>{m.preventDefault(),m.stopPropagation(),a(!0)})}),["dragleave","drop"].forEach(u=>{g.addEventListener(u,m=>{m.preventDefault(),m.stopPropagation(),a(!1)})}),g.addEventListener("drop",u=>{let m=u.dataTransfer?.files;m?.length&&S(m)}),g.addEventListener("click",()=>{w.click()}),w.addEventListener("change",()=>{w.files?.length&&S(w.files)})}}function H(){let b=document.getElementById("usersPage"),c=document.getElementById("userForm"),f=document.getElementById("userUsername"),s=document.getElementById("userPassword"),t=document.getElementById("userFormAlert"),y=document.getElementById("userTableBody"),i=document.getElementById("userCount"),d=document.getElementById("userEditDialog"),r=document.getElementById("userEditForm"),h=document.getElementById("editUserId"),C=document.getElementById("editUsername"),E=document.getElementById("editPassword"),g=document.getElementById("userEditAlert"),w=document.getElementById("userEditCancel"),n=document.getElementById("userConfirmDialog"),L=document.getElementById("userConfirmText"),$=document.getElementById("userConfirmCancel"),M=document.getElementById("userConfirmDelete"),_=b?.dataset?.currentUser||"",S=null;if(!c||!f||!s||!y)return;let a=(x,o="success")=>{t&&(t.textContent=x,t.classList.remove("hidden"),t.classList.toggle("bg-green-500/10",o==="success"),t.classList.toggle("border-green-500/40",o==="success"),t.classList.toggle("text-green-200",o==="success"),t.classList.toggle("bg-red-500/10",o==="error"),t.classList.toggle("border-red-500/40",o==="error"),t.classList.toggle("text-red-200",o==="error"))},u=()=>{t&&(t.classList.add("hidden"),t.textContent="",t.classList.remove("bg-green-500/10","border-green-500/40","text-green-200","bg-red-500/10","border-red-500/40","text-red-200"))},m=(x,o="success")=>{g&&(g.textContent=x,g.classList.remove("hidden"),g.classList.toggle("bg-green-500/10",o==="success"),g.classList.toggle("border-green-500/40",o==="success"),g.classList.toggle("text-green-200",o==="success"),g.classList.toggle("bg-red-500/10",o==="error"),g.classList.toggle("border-red-500/40",o==="error"),g.classList.toggle("text-red-200",o==="error"))},l=()=>{g&&(g.classList.add("hidden"),g.textContent="",g.classList.remove("bg-green-500/10","border-green-500/40","text-green-200","bg-red-500/10","border-red-500/40","text-red-200"))},p=x=>{!d||!r||!h||!C||!E||(h.value=String(x.id),C.value=x.username,E.value="",l(),typeof d.showModal=="function"?d.showModal():d.style.display="block")},e=()=>{d&&(typeof d.close=="function"?d.close():d.style.display="none")};w?.addEventListener("click",()=>{e()});let I=(x,o)=>{!n||!L||!M||!$||(L.textContent=x,S=o,typeof n.showModal=="function"?n.showModal():n.style.display="block")},v=()=>{S=null,n&&(typeof n.close=="function"?n.close():n.style.display="none")};$?.addEventListener("click",()=>v()),M?.addEventListener("click",()=>{S&&S(),v()});async function T(){try{let o=await(await fetch("/api/users")).json();y.innerHTML="",o.length?o.forEach(B=>{let k=document.createElement("tr"),P=_&&B.username===_;k.innerHTML=`
              <td class="px-4 py-3 font-mono text-xs text-gray-400">#${B.id}</td>
              <td class="px-4 py-3 font-semibold">${B.username}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    data-id="${B.id}"
                    data-username="${B.username}"
                    class="user-edit-btn px-3 py-1.5 rounded-xl border border-white/15 text-xs text-purple-100 hover:bg-white/10 transition">
                    Edit
                  </button>
                  <button
                    data-id="${B.id}"
                    class="user-delete-btn px-3 py-1.5 rounded-xl border border-red-400/40 text-xs text-red-200 hover:bg-red-500/20 transition ${P?"opacity-40 cursor-not-allowed":""}"
                    ${P?"disabled":""}>
                    Delete
                  </button>
                </div>
              </td>
            `,y.appendChild(k);let q=k.querySelector(".user-edit-btn"),O=k.querySelector(".user-delete-btn");q?.addEventListener("click",()=>p(B)),O?.addEventListener("click",()=>{I(`Are you sure you want to delete "${B.username}"? This cannot be undone.`,async()=>{if(O){O.disabled=!0;try{let A=await fetch(`/api/users/${B.id}`,{method:"DELETE"}),F=await A.json();!A.ok||!F.ok?alert(F.error||"Failed to delete user"):T()}catch{alert("Failed to delete user")}finally{O.disabled=!1}}})})}):y.innerHTML=`
            <tr>
              <td colspan="3" class="px-4 py-6 text-center text-gray-400 text-sm">
                No users yet. Create one on the left.
              </td>
            </tr>
          `,i&&(i.textContent=`${o.length} user${o.length===1?"":"s"}`)}catch{y.innerHTML=`
          <tr>
            <td colspan="3" class="px-4 py-6 text-center text-red-300 text-sm">
              Failed to load users.
            </td>
          </tr>
        `}}c.addEventListener("submit",async x=>{x.preventDefault(),u();let o=c.querySelector("button[type=submit]");o&&(o.disabled=!0);try{let B=await fetch("/api/add-user",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:f.value.trim(),password:s.value})}),k=await B.json();!B.ok||!k.ok?a(k.error||"Failed to add user","error"):(a("User created successfully.","success"),c.reset(),T())}catch{a("Failed to add user","error")}finally{o&&(o.disabled=!1)}}),r?.addEventListener("submit",async x=>{if(x.preventDefault(),!h||!C||!E)return;l();let o=r.querySelector("button[type=submit]");o&&(o.disabled=!0);try{let B={username:C.value.trim(),password:E.value},k=await fetch(`/api/users/${h.value}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(B)}),P=await k.json();!k.ok||!P.ok?m(P.error||"Failed to update user","error"):(m("User updated.","success"),T(),setTimeout(()=>{e()},500))}catch{m("Failed to update user","error")}finally{o&&(o.disabled=!1)}}),T()}function J(){let b=document.getElementById("playlist"),c=document.getElementById("save"),s=document.getElementById("playlistId")?.dataset?.playlistId||window.playlistId;if(!b||!c||!s)return;async function t(){let i=await(await fetch(`/api/playlists/${s}/items`)).json();b.innerHTML="",i.forEach(d=>{let r=document.createElement("li");r.textContent=`${d.artist||""} - ${d.title||""} [${d.genre||""}]`,r.draggable=!0,r.dataset.id=d.id,b.appendChild(r)})}window.Sortable&&new Sortable(b,{animation:150,ghostClass:"opacity-50"}),c.addEventListener("click",async()=>{let y=[...b.querySelectorAll("li")].map(i=>Number(i.dataset.id));await fetch(`/api/playlists/${s}/order`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({order:y})}),alert("Order saved")}),t()}})();})();
