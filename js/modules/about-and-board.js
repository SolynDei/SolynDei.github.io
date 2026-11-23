// ============================================================================
// MÓDULO: ABOUT ME MINIPOSTS + PERSONAJES 1:1 + PIZARRÓN PIXEL-ART + ↑ TOP
// ============================================================================
(function initAboutAndBoardModule() {
    const App = window.ReworkApp;
    if (!App) return;

    const origApply = App.applyConfigToDOM.bind(App);
    const origRenderArcade = App.renderArcade.bind(App);

    let activeMpFilter = "all";
    let sbSignatures = [];

    App.applyConfigToDOM = function(cfg) {
        origApply(cfg);
        renderAboutMiniposts(cfg?.aboutMe?.miniposts || []);
        renderCharacterEchoes(cfg?.aboutMe?.characterEchoes || []);
        renderCodingPlaylistEmbed(cfg?.aboutMe?.codingPlaylistUrl || "");
    };

    App.renderArcade = function(games) {
        origRenderArcade(games);
        const grid = document.getElementById("arcade-grid");
        if (!grid) return;
        const cards = grid.querySelectorAll("article");
        (games || []).forEach((g, idx) => {
            if (g.type !== "signature_wall") return;
            const card = cards[idx];
            if (!card) return;
            const btn = card.querySelector("button");
            if (btn) {
                btn.disabled = false;
                btn.classList.add("primary");
                btn.textContent = "ABRIR PIZARRÓN ✎";
                btn.onclick = () => openSignatureWall();
            }
        });
    };

    // A) MINIPOSTS / CASES DE ABOUT ME
    function renderAboutMiniposts(list) {
        const root = document.getElementById("about-miniposts-grid");
        if (!root) return;

        const filterBar = document.getElementById("about-mp-filters");
        if (filterBar && !filterBar.dataset.bound) {
            filterBar.dataset.bound = "1";
            filterBar.addEventListener("click", (e) => {
                const btn = e.target.closest("[data-mp-filter]");
                if (!btn) return;
                activeMpFilter = btn.dataset.mpFilter;
                filterBar.querySelectorAll("[data-mp-filter]").forEach((x) => x.classList.toggle("active", x === btn));
                renderAboutMiniposts(App.cfg?.aboutMe?.miniposts || []);
            });
        }

        const filtered = activeMpFilter === "all"
            ? list
            : list.filter((m) => (m.type || "gusto") === activeMpFilter);

        if (!filtered.length) {
            root.innerHTML = `<div class="dc-idle-msg">&gt; SIN FICHAS EN ESTA CATEGORÍA_</div>`;
            return;
        }

        const typeLabels = { gusto: "GUSTO", disgusto: "NOPE", faq: "FAQ", vibra: "VIBRA", gif: "GIF / VISUAL" };
        root.innerHTML = "";

        filtered.forEach((m) => {
            const isFaq = m.type === "faq";
            const card = document.createElement("article");
            card.className = `about-mp-card mp-type-${m.type || "gusto"}`;

            if (isFaq) {
                card.classList.add("is-faq");
                card.innerHTML = `
                    <div class="mp-head">
                        <span class="mp-badge">${typeLabels[m.type] || "FAQ"}</span>
                        <span class="mp-title">${App.esc(m.title)}</span>
                        <span class="mp-chevron">+</span>
                    </div>
                    <div class="mp-faq-body">${App.esc(m.text)}</div>
                `;
                card.onclick = () => {
                    if (document.body.classList.contains("studio-edit-mode")) {
                        window.parent.postMessage({ type: "STUDIO_SELECT_MINIPOST", id: m.id }, "*");
                        return;
                    }
                    card.classList.toggle("open");
                    App.beep(620, 0.03, "sine", 0.025);
                };
            } else {
                card.innerHTML = `
                    <div class="mp-head">
                        <span class="mp-badge">${typeLabels[m.type] || "NOTE"}</span>
                        <span class="mp-title">${App.esc(m.title)}</span>
                    </div>
                    ${m.img ? `<div class="mp-media"><img src="${App.esc(m.img)}" alt="${App.esc(m.title)}" loading="lazy" referrerpolicy="no-referrer"></div>` : ""}
                    ${m.text ? `<p class="mp-text">${App.esc(m.text)}</p>` : ""}
                `;
                card.onclick = () => {
                    if (document.body.classList.contains("studio-edit-mode")) {
                        window.parent.postMessage({ type: "STUDIO_SELECT_MINIPOST", id: m.id }, "*");
                    } else if (m.img) {
                        App.openMediaModal("image", m.img, m.title, m.text);
                    }
                };
            }
            root.appendChild(card);
        });
    }

    // B) "SI ALGÚN DÍA NO ESTOY, BÚSCAME EN ESTOS PERSONAJES" (ICONOS 1:1)
    function renderCharacterEchoes(chars) {
        const grid = document.getElementById("char-echoes-grid");
        const inspector = document.getElementById("char-echoes-inspector");
        if (!grid) return;

        if (!chars.length) {
            grid.innerHTML = `<div class="dc-idle-msg">&gt; AGREGA PERSONAJES DESDE LA PESTAÑA ABOUT DEL STUDIO_</div>`;
            return;
        }

        grid.innerHTML = "";
        chars.forEach((ch) => {
            const tile = document.createElement("button");
            tile.type = "button";
            const isTop = Boolean(ch.rank);
            tile.className = "char-echo-tile" + (isTop ? " is-top" : "");
            const initials = (ch.name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

            const sq = document.createElement("div");
            sq.className = "char-echo-square";

            const makeMonogram = () => {
                sq.innerHTML = `<div class="char-echo-monogram"><span>${App.esc(initials)}</span><small>1:1</small></div>`;
                if (ch.rank) {
                    const rk = document.createElement("span");
                    rk.className = "char-echo-rank";
                    rk.textContent = ch.rank;
                    sq.appendChild(rk);
                }
            };

            if (ch.img) {
                const img = document.createElement("img");
                img.src = ch.img;
                img.alt = ch.name || "";
                img.loading = "lazy";
                img.decoding = "async";
                img.referrerPolicy = "no-referrer";
                img.onerror = makeMonogram;
                sq.appendChild(img);
                if (ch.rank) {
                    const rk = document.createElement("span");
                    rk.className = "char-echo-rank";
                    rk.textContent = ch.rank;
                    sq.appendChild(rk);
                }
            } else {
                makeMonogram();
            }

            const nameEl = document.createElement("div");
            nameEl.className = "char-echo-name";
            nameEl.textContent = ch.name || "";

            const srcEl = document.createElement("div");
            srcEl.className = "char-echo-src";
            srcEl.textContent = ch.source || "";

            tile.appendChild(sq);
            tile.appendChild(nameEl);
            tile.appendChild(srcEl);

            tile.onclick = () => {
                if (document.body.classList.contains("studio-edit-mode")) {
                    window.parent.postMessage({ type: "STUDIO_SELECT_CHARACTER", id: ch.id }, "*");
                    return;
                }
                grid.querySelectorAll(".char-echo-tile").forEach((x) => x.classList.remove("active"));
                tile.classList.add("active");
                App.beep(580, 0.04, "triangle", 0.03);
                if (inspector) {
                    inspector.style.display = "block";
                    inspector.innerHTML = `
                        <div class="inspector-grid">
                            ${ch.img ? `<img src="${App.esc(ch.img)}" class="char-insp-sq" alt="${App.esc(ch.name)}" referrerpolicy="no-referrer">` : `<div class="char-insp-sq char-echo-monogram"><span>${App.esc(initials)}</span></div>`}
                            <div>
                                <div><strong>${App.esc(ch.name)}</strong> ${ch.rank ? `<span class="mp-badge">${App.esc(ch.rank)}</span>` : ""}</div>
                                <div style="color:var(--ink-dim);font-size:0.7rem;margin-top:2px;">${App.esc(ch.source || "")}</div>
                                <div style="margin-top:6px;">${App.esc(ch.note || "Uno de los personajes donde vive un pedacito de mí.")}</div>
                            </div>
                        </div>`;
                    inspector.querySelector("img")?.addEventListener("click", () => App.openMediaModal("image", ch.img, ch.name, ch.note || ch.source));
                }
            };
            grid.appendChild(tile);
        });
    }

    // C) EMBED DE PLAYLIST EN ABOUT -> MÚSICA
    function renderCodingPlaylistEmbed(url) {
        const slot = document.getElementById("about-playlist-embed");
        if (!slot) return;
        const m = String(url || "").match(/open\.spotify\.com\/(?:intl-[a-z0-9-]+\/)?(?:embed\/)?(playlist|album|track)\/([a-zA-Z0-9]+)/i);
        if (!m) { slot.innerHTML = ""; return; }
        const embedUrl = `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
        if (slot.dataset.url === embedUrl) return;
        slot.dataset.url = embedUrl;
        slot.innerHTML = `
            <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--ink-dim);margin:6px 0;">PLAYLIST DE MADRUGADA // EN VIVO DESDE SPOTIFY</div>
            <div class="nb-media-frame is-embed-spotify" style="min-height:152px;">
                <iframe src="${embedUrl}" height="152" style="height:152px;min-height:152px;" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>`;
    }

    // D) PIZARRÓN DE FIRMAS PIXEL-ART (ARCADE)
    const PIXEL_W = 64, PIXEL_H = 32;
    let pCanvas, pCtx, pDrawing = false, pColor = "#f4f4f0", pSize = 1, pEraser = false, pLast = null, pUndo = [];

    function openSignatureWall() {
        const modal = document.getElementById("signature-wall-modal");
        if (!modal) return;
        initPixelPad();
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        loadSignatures();
    }

    function closeSignatureWall() {
        const modal = document.getElementById("signature-wall-modal");
        if (!modal) return;
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function initPixelPad() {
        if (pCanvas) return;
        pCanvas = document.getElementById("sig-pixel-canvas");
        if (!pCanvas) return;
        pCanvas.width = PIXEL_W;
        pCanvas.height = PIXEL_H;
        pCtx = pCanvas.getContext("2d");
        pCtx.imageSmoothingEnabled = false;
        clearPad(false);

        const getXY = (e) => {
            const r = pCanvas.getBoundingClientRect();
            return {
                x: Math.floor(((e.clientX - r.left) / r.width) * PIXEL_W),
                y: Math.floor(((e.clientY - r.top) / r.height) * PIXEL_H)
            };
        };

        const plot = (x, y) => {
            const half = Math.floor(pSize / 2);
            pCtx.fillStyle = pEraser ? "#08080a" : pColor;
            pCtx.fillRect(x - half, y - half, pSize, pSize);
        };

        const drawLine = (a, b) => {
            let x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;
            const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
            const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
            let err = dx - dy;
            while (true) {
                plot(x0, y0);
                if (x0 === x1 && y0 === y1) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x0 += sx; }
                if (e2 < dx) { err += dx; y0 += sy; }
            }
        };

        pCanvas.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            pUndo.push(pCtx.getImageData(0, 0, PIXEL_W, PIXEL_H));
            if (pUndo.length > 20) pUndo.shift();
            pDrawing = true;
            pCanvas.setPointerCapture?.(e.pointerId);
            pLast = getXY(e);
            plot(pLast.x, pLast.y);
        });
        pCanvas.addEventListener("pointermove", (e) => {
            if (!pDrawing) return;
            e.preventDefault();
            const cur = getXY(e);
            if (pLast) drawLine(pLast, cur);
            pLast = cur;
        });
        const stop = () => { pDrawing = false; pLast = null; };
        pCanvas.addEventListener("pointerup", stop);
        pCanvas.addEventListener("pointercancel", stop);

        document.querySelectorAll("[data-sig-color]").forEach((btn) => {
            btn.onclick = () => {
                pEraser = false;
                pColor = btn.dataset.sigColor;
                document.querySelectorAll("[data-sig-color], #sig-btn-eraser").forEach((x) => x.classList.remove("active"));
                btn.classList.add("active");
            };
        });
        document.getElementById("sig-btn-eraser")?.addEventListener("click", (e) => {
            pEraser = !pEraser;
            e.currentTarget.classList.toggle("active", pEraser);
        });
        document.querySelectorAll("[data-sig-size]").forEach((btn) => {
            btn.onclick = () => {
                pSize = parseInt(btn.dataset.sigSize, 10) || 1;
                document.querySelectorAll("[data-sig-size]").forEach((x) => x.classList.remove("primary"));
                btn.classList.add("primary");
            };
        });
        document.getElementById("sig-btn-undo")?.addEventListener("click", () => {
            if (pUndo.length) pCtx.putImageData(pUndo.pop(), 0, 0);
        });
        document.getElementById("sig-btn-clear")?.addEventListener("click", () => clearPad(true));
        document.getElementById("sig-wall-close")?.addEventListener("click", closeSignatureWall);
        document.getElementById("signature-wall-modal")?.addEventListener("click", (e) => {
            if (e.target.id === "signature-wall-modal") closeSignatureWall();
        });
        document.getElementById("sig-submit-form")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            await submitSignature();
        });
    }

    function clearPad(pushHist = true) {
        if (!pCtx) return;
        if (pushHist) pUndo.push(pCtx.getImageData(0, 0, PIXEL_W, PIXEL_H));
        pCtx.fillStyle = "#08080a";
        pCtx.fillRect(0, 0, PIXEL_W, PIXEL_H);
    }

    function sbHeaders(key, extra = {}) {
        const h = { apikey: key, ...extra };
        if (String(key || "").startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
        return h;
    }

    async function loadSignatures() {
        const grid = document.getElementById("sig-mosaic-wall");
        const countEl = document.getElementById("sig-wall-count");
        if (!grid) return;

        const sb = App.cfg?.supabase;
        let items = [];
        if (sb && sb.url && sb.anonKey) {
            try {
                const base = sb.url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
                const res = await fetch(`${base}/rest/v1/signatures?select=*&order=created_at.desc&limit=120`, {
                    headers: sbHeaders(sb.anonKey)
                });
                if (res.ok) items = await res.json();
            } catch {}
        }

        let localItems = [];
        try { localItems = JSON.parse(localStorage.getItem("solyn_local_signatures") || "[]"); } catch {}
        sbSignatures = items.length ? items : localItems;

        if (countEl) countEl.textContent = `${sbSignatures.length} FIRMAS EN EL MURO`;
        if (!sbSignatures.length) {
            grid.innerHTML = `<div class="dc-idle-msg" style="grid-column:1/-1;padding:18px;">&gt; EL PIZARRÓN ESTÁ LIMPIO. ¡SÉ EL PRIMERO EN DEJAR TU FIRMA PIXEL-ART!_</div>`;
            return;
        }

        grid.innerHTML = sbSignatures.map((s) => `
            <div class="sig-tile">
                <img class="sig-tile-img" src="${App.esc(s.drawing_data)}" alt="Firma de ${App.esc(s.author_name)}" loading="lazy">
                <div class="sig-tile-meta">
                    <strong>${App.esc(s.author_name)}</strong>
                    <span>${(s.created_at || "").slice(0, 10)}</span>
                </div>
                ${s.note ? `<div class="sig-tile-note">${App.esc(s.note)}</div>` : ""}
            </div>
        `).join("");
    }

    async function submitSignature() {
        const authorEl = document.getElementById("sig-author-input");
        const noteEl = document.getElementById("sig-note-input");
        const author = (authorEl?.value || "").trim();
        const note = (noteEl?.value || "").trim();
        if (!author) { App.toast("ESCRIBE TU APODO PARA FIRMAR"); return; }

        const dataUrl = pCanvas.toDataURL("image/png");
        const payload = { author_name: author, note, drawing_data: dataUrl };
        const sb = App.cfg?.supabase;
        let savedRemote = false;

        if (sb && sb.url && sb.anonKey) {
            try {
                const base = sb.url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
                const res = await fetch(`${base}/rest/v1/signatures`, {
                    method: "POST",
                    headers: sbHeaders(sb.anonKey, { "Content-Type": "application/json", Prefer: "return=minimal" }),
                    body: JSON.stringify(payload)
                });
                savedRemote = res.ok;
            } catch {}
        }

        if (!savedRemote) {
            let localItems = [];
            try { localItems = JSON.parse(localStorage.getItem("solyn_local_signatures") || "[]"); } catch {}
            localItems.unshift({ id: "loc-" + Date.now(), ...payload, created_at: new Date().toISOString() });
            localStorage.setItem("solyn_local_signatures", JSON.stringify(localItems));
        }

        if (noteEl) noteEl.value = "";
        clearPad(false);
        App.beep(880, 0.08, "sine", 0.04);
        App.toast(savedRemote ? "FIRMA ESTAMPADA EN EL PIZARRÓN ✓" : "FIRMA GUARDADA LOCALMENTE");
        await loadSignatures();
    }

    // E) BOTÓN DISCRETO SUBIR ARRIBA
    function initBackToTop() {
        const btn = document.getElementById("btn-back-to-top");
        if (!btn) return;
        const sync = () => {
            const show = window.scrollY > 340 && !document.body.classList.contains("is-locked");
            btn.classList.toggle("visible", show);
        };
        window.addEventListener("scroll", sync, { passive: true });
        btn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            App.beep(720, 0.04, "triangle", 0.025);
        });
        sync();
    }

    window.addEventListener("DOMContentLoaded", initBackToTop);
})();