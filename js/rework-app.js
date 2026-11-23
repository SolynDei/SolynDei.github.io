window.ReworkApp = {
    cfg: null, isLite: false, themeInvert: false, pfpClicks: 0, pfpTimer: null,
    audioCtx: null, playlistIndex: 0, pendingBossGame: null, toastTimer: null,
    isPreviewMode: new URLSearchParams(window.location.search).get("preview") === "1",
    studioEditEnabled: false,
    justDraggedUntil: 0,

    async init() {
        document.body.setAttribute("data-active-view", "view-profile");
        window.injectIcons(document);
        this.initPerfAndTheme();
        await this.loadConfig();
        this.bindGlobalControls();
        this.initClock();
        this.applyConfigToDOM(this.cfg);
        this.initEntryGate();
        window.ReactBitsFX.init();

        if (this.isPreviewMode) {
            this.bindStudioDirectEdit();
            window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
        }

        window.addEventListener("message", (e) => {
            if (!e.data) return;
            if (e.data.type === "STUDIO_PREVIEW_CONFIG" && e.data.config) {
                this.cfg = e.data.config;
                this.applyConfigToDOM(this.cfg);
            }
            if (e.data.type === "STUDIO_SET_EDIT_MODE") {
                this.studioEditEnabled = Boolean(e.data.enabled);
                document.body.classList.toggle("studio-edit-mode", this.studioEditEnabled);
                this.refreshDraggableModules();
            }
            if (e.data.type === "STUDIO_SWITCH_VIEW" && e.data.view) {
                this.switchView(e.data.view);
            }
            if (e.data.type === "BOSS_DEFEATED" || e.data.type === "BOSS_SURRENDERED") {
                this.closeGameStage();
                this.toast(e.data.type === "BOSS_DEFEATED" ? "MEMORIA COMPLETADA" : "REGRESASTE AL ARCHIVO");
            }
        });
    },

    // =========================================================================
    // ARRASTRE CON POINTER EVENTS (CERO IMAGEN FANTASMA DE CHROME + REORDEN EN VIVO)
    // =========================================================================
    bindStudioDirectEdit() {
        let pendingMod = null;
        let isDragging = false;
        let startX = 0, startY = 0;
        let ghostPill = null;
        const asEl = (node) => (node && node.nodeType === 3 ? node.parentElement : node);

        // Bloquear completamente el drag nativo del navegador en modo edicion
        document.addEventListener("dragstart", (e) => {
            if (this.studioEditEnabled) e.preventDefault();
        }, true);

        document.addEventListener("pointerdown", (e) => {
            if (!this.studioEditEnabled || e.button !== 0) return;
            const el = asEl(e.target);
            if (!el) return;

            // Si toca un campo editable o boton interactivo fuera del header, dejar que funcione el clic
            if (el.closest("[data-editable-img], [data-editable-post-img], [data-editable-text], input, textarea, select")) {
                return;
            }
            if (el.closest("button") && !el.closest(".tac-window-header")) {
                return;
            }

            const mod = el.closest("[data-module]");
            if (!mod) return;

            pendingMod = mod;
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            e.preventDefault();
        });

        document.addEventListener("pointermove", (e) => {
            if (!pendingMod || !this.studioEditEnabled) return;

            if (!isDragging) {
                if (Math.hypot(e.clientX - startX, e.clientY - startY) < 6) return;
                isDragging = true;
                pendingMod.classList.add("is-dragging-ptr");
                document.body.classList.add("is-ptr-dragging");

                ghostPill = document.createElement("div");
                ghostPill.className = "studio-drag-pill";
                ghostPill.textContent = `⠿ MOVIENDO: ${(pendingMod.getAttribute("data-module") || "MODULO").toUpperCase()}`;
                document.body.appendChild(ghostPill);
            }

            if (ghostPill) {
                ghostPill.style.left = `${e.clientX + 14}px`;
                ghostPill.style.top = `${e.clientY + 14}px`;
            }

            // Permitir mover dentro de sidebar, dentro de perfil o incluso ENTRE ambas columnas
            const sidebar = document.getElementById("profile-sidebar");
            const profileView = document.getElementById("view-profile");
            const containers = [sidebar];
            if (profileView && profileView.classList.contains("active")) containers.push(profileView);

            let targetContainer = pendingMod.parentElement;
            for (const c of containers) {
                if (!c) continue;
                const r = c.getBoundingClientRect();
                if (e.clientX >= r.left - 12 && e.clientX <= r.right + 12) {
                    targetContainer = c;
                    break;
                }
            }
            if (!targetContainer) return;

            const siblings = Array.from(targetContainer.querySelectorAll(":scope > [data-module]"))
                .filter((el) => el !== pendingMod && el.style.display !== "none");

            let insertBeforeEl = null;
            for (const sib of siblings) {
                const r = sib.getBoundingClientRect();
                if (e.clientY < r.top + r.height / 2) {
                    insertBeforeEl = sib;
                    break;
                }
            }

            if (insertBeforeEl) {
                if (pendingMod.nextElementSibling !== insertBeforeEl || pendingMod.parentElement !== targetContainer) {
                    targetContainer.insertBefore(pendingMod, insertBeforeEl);
                }
            } else {
                if (pendingMod.parentElement !== targetContainer || targetContainer.lastElementChild !== pendingMod) {
                    targetContainer.appendChild(pendingMod);
                }
            }
        });

        const finishDrag = () => {
            if (!pendingMod) return;
            if (isDragging) {
                pendingMod.classList.remove("is-dragging-ptr");
                document.body.classList.remove("is-ptr-dragging");
                if (ghostPill) { ghostPill.remove(); ghostPill = null; }
                this.justDraggedUntil = Date.now() + 260;

                const sidebarOrder = Array.from(document.querySelectorAll("#profile-sidebar > [data-module]"))
                    .map((el) => el.getAttribute("data-module"));
                const profileOrder = Array.from(document.querySelectorAll("#view-profile > [data-module]"))
                    .map((el) => el.getAttribute("data-module"));

                window.parent.postMessage({
                    type: "STUDIO_LAYOUT_ORDERS",
                    sidebarOrder,
                    profileOrder
                }, "*");
            }
            pendingMod = null;
            isDragging = false;
        };

        document.addEventListener("pointerup", finishDrag);
        document.addEventListener("pointercancel", finishDrag);

        // Clic directo sobre avatar, banner, fotos de posts o textos
        document.addEventListener("click", (e) => {
            if (!this.studioEditEnabled) return;
            if (Date.now() < this.justDraggedUntil) { e.preventDefault(); e.stopPropagation(); return; }

            const el = asEl(e.target);
            const imgTarget = el ? el.closest("[data-editable-img]") : null;
            if (imgTarget) {
                e.preventDefault(); e.stopPropagation();
                window.parent.postMessage({ type: "STUDIO_CLICK_IMAGE", target: imgTarget.getAttribute("data-editable-img") }, "*");
                return;
            }
            const postImg = el ? el.closest("[data-editable-post-img]") : null;
            if (postImg) {
                e.preventDefault(); e.stopPropagation();
                window.parent.postMessage({ type: "STUDIO_CLICK_POST_IMAGE", postId: postImg.getAttribute("data-editable-post-img") }, "*");
                return;
            }
            const txtTarget = el ? el.closest("[data-editable-text]") : null;
            if (txtTarget) {
                e.preventDefault(); e.stopPropagation();
                const field = txtTarget.getAttribute("data-editable-text");
                const updated = prompt(`Editar ${field.toUpperCase()}:`, this.cfg?.profile?.[field] || "");
                if (updated !== null) {
                    window.parent.postMessage({ type: "STUDIO_INLINE_TEXT", field, value: updated }, "*");
                }
            }
        }, true);
    },

    refreshDraggableModules() {
        document.querySelectorAll("[data-module], [data-module] img, [data-module] a").forEach((el) => {
            el.setAttribute("draggable", "false");
        });
    },

    async loadConfig() {
        try {
            const res = await fetch("data/site-config.json?t=" + Date.now(), { cache: "no-store" });
            if (res.ok) { this.cfg = await res.json(); return; }
        } catch {}
        this.cfg = { profile: { name: "SAPHYNIEL" }, splashQuotes: ["ARCHIVE READY"], layout: {}, socials: [], aboutMe: {}, playlist: [], stamps: [], samplePosts: [], arcade: [] };
    },

    beep(freq = 620, dur = 0.05, type = "square", gain = 0.03) {
        if (this.isLite) return;
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioCtx.state === "suspended") this.audioCtx.resume();
            const osc = this.audioCtx.createOscillator(), g = this.audioCtx.createGain();
            osc.type = type; osc.frequency.value = freq; g.gain.value = gain;
            osc.connect(g); g.connect(this.audioCtx.destination);
            osc.start(); osc.stop(this.audioCtx.currentTime + dur);
        } catch {}
    },

    initPerfAndTheme() {
        const saved = localStorage.getItem("solyn_perf_mode");
        this.isLite = saved ? saved === "lite" : (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        this.themeInvert = localStorage.getItem("solyn_theme_invert") === "1";
        this.syncPerfUI();
        document.getElementById("btn-perf-toggle")?.addEventListener("click", () => {
            this.isLite = !this.isLite;
            localStorage.setItem("solyn_perf_mode", this.isLite ? "lite" : "full");
            this.syncPerfUI();
            this.toast(this.isLite ? "MODO LITE ACTIVO" : "MODO FULL ACTIVO");
        });
        document.getElementById("btn-theme-invert")?.addEventListener("click", () => {
            this.themeInvert = !this.themeInvert;
            localStorage.setItem("solyn_theme_invert", this.themeInvert ? "1" : "0");
            this.syncPerfUI();
        });
    },

    syncPerfUI() {
        document.body.classList.toggle("perf-lite", this.isLite);
        document.body.classList.toggle("perf-full", !this.isLite);
        document.body.classList.toggle("theme-invert", this.themeInvert);
        const bp = document.getElementById("btn-perf-toggle");
        if (bp) { bp.textContent = this.isLite ? "PERF: LITE" : "PERF: FULL"; bp.classList.toggle("primary", !this.isLite); }
        const bi = document.getElementById("btn-theme-invert");
        if (bi) bi.classList.toggle("primary", this.themeInvert);
        if (window.ReactBitsFX) {
            const allowGrid = this.cfg?.effects?.squaresGrid !== false;
            if (this.isLite || !allowGrid) window.ReactBitsFX.stop();
            else window.ReactBitsFX.start();
        }
    },

    initEntryGate() {
        const gate = document.getElementById("entry-gate");
        if (!gate || this.cfg?.layout?.showIntroLogin === false || this.isPreviewMode || this.isLite) {
            this.finishEntry(true); return;
        }
        document.getElementById("gate-skip-btn")?.addEventListener("click", () => this.finishEntry(true));
        document.getElementById("btn-gate-access")?.addEventListener("click", () => this.runAutoLogin());
    },

    runAutoLogin() {
        this.beep(740, 0.06, "sine", 0.05);
        document.getElementById("gate-step-access")?.classList.remove("active");
        document.getElementById("gate-step-login")?.classList.add("active");
        const opName = document.getElementById("login-op-name");
        if (opName && this.cfg?.profile?.name) opName.textContent = this.cfg.profile.name;
        const passField = document.getElementById("login-pass-field"), bar = document.getElementById("login-bar-fill"),
              syncLbl = document.getElementById("login-sync-label"), logEl = document.getElementById("login-console"),
              execPill = document.getElementById("login-exec-pill");
        let dots = "", pct = 0;
        const t1 = setInterval(() => {
            if (dots.length < 8) { dots += "•"; passField.textContent = dots; this.beep(480 + dots.length * 40, 0.03, "square", 0.025); }
            else {
                clearInterval(t1); execPill.classList.add("active"); logEl.textContent = "> VERIFYING IDENTITY_";
                const t2 = setInterval(() => {
                    pct = Math.min(100, pct + 18); bar.style.width = `${pct}%`; syncLbl.textContent = `SYNC RATE ${String(pct).padStart(3, "0")}%`;
                    if (pct >= 100) { clearInterval(t2); this.showAccessGranted(); }
                }, 70);
            }
        }, 70);
    },

    showAccessGranted() {
        this.beep(880, 0.12, "sine", 0.05);
        document.getElementById("gate-step-login")?.classList.remove("active");
        document.getElementById("gate-step-granted")?.classList.add("active");
        const gbar = document.getElementById("granted-bar-fill"); let p = 0;
        const t = setInterval(() => { p = Math.min(100, p + 25); gbar.style.width = `${p}%`; if (p >= 100) { clearInterval(t); setTimeout(() => this.finishEntry(false), 160); } }, 60);
    },

    finishEntry(instant = false) {
        document.getElementById("entry-gate")?.classList.add("hidden");
        document.body.classList.remove("is-locked");
        const items = document.querySelectorAll(".build-item");
        if (instant || this.isLite) { document.body.classList.remove("constructing"); items.forEach((el) => el.classList.add("built")); return; }
        document.body.classList.add("constructing");
        items.forEach((el, idx) => setTimeout(() => { el.classList.add("built"); if (idx < 6) this.beep(320 + idx * 55, 0.025, "triangle", 0.02); }, 50 + idx * 80));
        setTimeout(() => { document.body.classList.remove("constructing"); window.ReactBitsFX.runDecryptAll(document.getElementById("view-profile")); }, 120 + items.length * 80);
    },

    renderButtonIcon(s) {
        const custom = String(s.customIcon || "").trim();
        if (custom) {
            if (/^(https?:\/\/|img\/|assets\/|data:)/i.test(custom)) {
                return `<img class="social-custom-icon" src="${this.esc(custom)}" alt="" onerror="this.style.display='none'">`;
            }
            return `<span class="inline-icon">${this.esc(custom)}</span>`;
        }
        return `<span class="inline-icon">${window.UI_ICONS[s.icon] || window.UI_ICONS.link}</span>`;
    },

    executeCustomButton(s) {
        const act = s.action || (s.url ? "url" : "copy");
        const val = s.value || s.url || "";
        if (act === "copy") {
            navigator.clipboard.writeText(val).catch(() => {});
            this.toast(`${s.label} COPIADO`);
        } else if (act === "view") {
            this.switchView(val || "view-posts");
        } else if (act === "bossfight") {
            const boss = (this.cfg?.arcade || []).find((g) => g.type === "bossfight");
            if (boss) this.openBossIntro(boss);
        } else if (act === "terminal") {
            this.openArgTerminal();
        } else if (act === "music") {
            document.getElementById("music-play")?.click();
        } else if (act === "invert") {
            document.getElementById("btn-theme-invert")?.click();
        } else if (act === "toast") {
            this.toast(val || s.label);
        } else if (val) {
            window.open(val, "_blank", "noopener");
        }
    },

    applyConfigToDOM(cfg) {
        if (!cfg) return;
        const p = cfg.profile || {}, l = cfg.layout || {}, t = cfg.themeTokens || {}, fx = cfg.effects || {};

        const rootStyle = document.documentElement.style;
        if (t.uiScale) rootStyle.setProperty("--ui-scale", String(t.uiScale));
        if (t.sidebarWidth) rootStyle.setProperty("--sidebar-w", `${t.sidebarWidth}px`);
        if (t.avatarSize) rootStyle.setProperty("--avatar-size", `${t.avatarSize}px`);
        if (t.borderWidth !== undefined) rootStyle.setProperty("--bd-w", `${t.borderWidth}px`);
        if (t.shadowOffset !== undefined) rootStyle.setProperty("--sh-off", `${t.shadowOffset}px`);

        document.body.classList.toggle("fx-scanlines", Boolean(fx.scanlines));
        document.body.classList.toggle("fx-no-glitch", fx.glitchTitle === false);
        document.body.classList.toggle("fx-no-spotlight", fx.spotlight === false);
        if (window.ReactBitsFX) {
            window.ReactBitsFX.allowClickSpark = fx.clickSpark !== false;
            if (!this.isLite && fx.squaresGrid !== false) window.ReactBitsFX.start();
            else window.ReactBitsFX.stop();
        }

        const pfp = document.getElementById("main-pfp");
        if (pfp && p.avatar && (!this._lanyardAvatarUrl || !p.avatar.includes("saphyniel_normal.png"))) {
            pfp.src = p.avatar;
        }
        const banner = document.getElementById("profile-banner");
        if (banner) {
            if (p.banner) { banner.style.backgroundImage = `url('${p.banner}')`; banner.style.display = "block"; }
            else banner.style.display = "none";
        }
        const nameEl = document.getElementById("op-display-name");
        if (nameEl) { nameEl.textContent = p.name || "SAPHYNIEL"; nameEl.setAttribute("data-text", p.name || "SAPHYNIEL"); }
        document.getElementById("op-uid").textContent = `UID: ${p.uid || "SOLYNDEI"}`;
        document.getElementById("op-pronouns").textContent = p.pronouns || "she / her";
        document.getElementById("op-mood-text").textContent = `Mood: ${p.mood || "..."}`;
        document.getElementById("op-bio-text").textContent = p.bio || "";
        document.getElementById("site-url-code").textContent = p.siteUrl || "https://solyndei.github.io/";

        const splashBar = document.getElementById("splash-quote-btn");
        if (splashBar) splashBar.style.display = l.showSplashQuotes === false ? "none" : "flex";
        this.pickRandomSplash();

        const visMap = {
            discord: l.showDiscordWidget !== false, music: l.showMusicPlayer !== false,
            socials: l.showSocials !== false, latestPosts: l.showLatestPostsOnProfile !== false,
            featuredBoss: l.showFeaturedBoss !== false, stamps: l.showStamps !== false
        };
        Object.entries(visMap).forEach(([k, v]) => { const el = document.querySelector(`[data-module="${k}"]`); if (el) el.style.display = v ? "" : "none"; });

        this.reorderChildren(document.getElementById("profile-sidebar"), l.sidebarOrder);
        this.reorderChildren(document.getElementById("view-profile"), l.profileOrder);

        const blurbsBox = document.getElementById("blurbs-content");
        if (blurbsBox) blurbsBox.innerHTML = (p.blurbs || []).map((b) => `<div><div class="blurb-heading">${this.esc(b.heading)}</div><p>${this.esc(b.text)}</p></div>`).join("");

        // Renderizar botones (URLs y funciones)
        const socialsGrid = document.getElementById("socials-grid");
        if (socialsGrid) {
            socialsGrid.innerHTML = "";
            const badgeMap = { copy: "COPY", view: "GO", bossfight: "PLAY", terminal: "CMD", music: "♪", invert: "◐", toast: "MSG", url: "↗" };
            (cfg.socials || []).filter((s) => s.enabled !== false).forEach((s) => {
                const act = s.action || (s.url ? "url" : "copy");
                const iconHtml = this.renderButtonIcon(s);
                const badge = badgeMap[act] || "↗";
                if (act === "url") {
                    const a = document.createElement("a");
                    a.href = s.url || s.value || "#";
                    a.target = "_blank"; a.rel = "noopener";
                    a.className = "social-link-btn";
                    a.setAttribute("draggable", "false");
                    a.innerHTML = `<span class="social-link-left">${iconHtml}${this.esc(s.label)}</span><span>${badge}</span>`;
                    socialsGrid.appendChild(a);
                } else {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "social-link-btn";
                    btn.innerHTML = `<span class="social-link-left">${iconHtml}${this.esc(s.label)}</span><span>${badge}</span>`;
                    btn.onclick = () => this.executeCustomButton(s);
                    socialsGrid.appendChild(btn);
                }
            });
        }

        const stampsWall = document.getElementById("stamps-wall");
        if (stampsWall) {
            stampsWall.innerHTML = (cfg.stamps || []).map((st) => st.type === "img"
                ? `<img class="stamp-img" src="${this.esc(st.src)}" alt="${this.esc(st.alt || "")}" loading="lazy">`
                : `<span class="stamp-chip">${this.esc(st.text)}</span>`).join("");
        }
        window.ReactBitsFX.renderStickers(cfg.floatingStickers || []);
        this.renderAboutMe(cfg.aboutMe || {}, p);
        this.initMusicPlayer(cfg.playlist || []);
        this.initLanyard(p.discordId, p.discordHandle);
        this.renderArcade(cfg.arcade || []);
        window.BlogFeed.init(cfg);
        this.updateSecretsCounter();
        this.refreshDraggableModules();
    },

    // Permite mover módulos tanto dentro de su columna como entre columnas y mantenerlo 1:1
    reorderChildren(parent, orderArr) {
        if (!parent || !Array.isArray(orderArr)) return;
        orderArr.forEach((modKey) => {
            const el = document.querySelector(`[data-module="${modKey}"]`);
            if (el) parent.appendChild(el);
        });
    },

    pickRandomSplash() {
        const list = this.cfg?.splashQuotes || [];
        const el = document.getElementById("splash-quote-text");
        if (el && list.length) el.textContent = list[Math.floor(Math.random() * list.length)];
    },

    renderAboutMe(about, profile) {
        const cGrid = document.getElementById("about-champions-grid"), inspector = document.getElementById("champ-inspector");
        if (cGrid && Array.isArray(about.champions)) {
            cGrid.innerHTML = "";
            about.champions.forEach((c, idx) => {
                const card = document.createElement("div"); card.className = "champ-card" + (idx === 0 ? " active" : "");
                card.innerHTML = `<img src="${this.esc(c.img)}" alt="${this.esc(c.name)}" loading="lazy"><div class="champ-meta"><div class="champ-name">${this.esc(c.name)}</div><div class="champ-pts">${this.esc(c.mastery)}</div></div>`;
                card.onclick = () => {
                    cGrid.querySelectorAll(".champ-card").forEach((x) => x.classList.remove("active")); card.classList.add("active");
                    this.beep(520 + idx * 140, 0.06, "triangle", 0.04);
                    if (inspector) {
                        inspector.innerHTML = `<div class="inspector-grid"><img src="${this.esc(c.img)}" class="inspector-art" alt="${this.esc(c.name)}"><div><div><strong>${this.esc(c.name)}</strong> // ${this.esc(c.title || "")}</div><div style="color:var(--ink-dim);font-size:0.7rem;">${this.esc(c.role)} • ${this.esc(c.mastery)} • ${this.esc(c.rank || "")}</div><div style="margin-top:6px;font-style:italic;">"${this.esc(c.quote)}"</div></div></div>`;
                        inspector.querySelector("img").onclick = () => this.openMediaModal("image", c.img, c.name, c.quote);
                    }
                };
                cGrid.appendChild(card);
                if (idx === 0) card.click();
            });
        }
        const mGrid = document.getElementById("about-music-grid");
        if (mGrid) {
            mGrid.innerHTML = "";
            (about.favoriteMusic || []).forEach((m) => {
                const el = document.createElement("div"); el.className = "reactive-card";
                el.innerHTML = `<div class="rc-top"><span>♫ ${this.esc(m.title)}</span><span>+</span></div><div class="rc-sub">${this.esc(m.artist)} // ${this.esc(m.vibe || "")}</div><div class="rc-extra"><p>${this.esc(m.note || "")}</p>${m.url ? `<a href="${this.esc(m.url)}" target="_blank" rel="noopener" class="tac-btn-xs" style="display:inline-block;margin-top:8px;">ESCUCHAR ↗</a>` : ""}</div>`;
                el.onclick = (e) => { if (e.target.tagName !== "A") { el.classList.toggle("open"); this.beep(680, 0.04, "sine", 0.03); } };
                mGrid.appendChild(el);
            });
        }
        const gGrid = document.getElementById("about-games-grid");
        if (gGrid) {
            gGrid.innerHTML = "";
            (about.favoriteGames || []).forEach((g) => {
                const el = document.createElement("div"); el.className = "reactive-card";
                el.innerHTML = `<div class="rc-top"><span>▸ ${this.esc(g.name)}</span><span>+</span></div><div class="rc-sub">${this.esc(g.tag || "")}</div><div class="rc-extra">${this.esc(g.detail || "")}</div>`;
                el.onclick = () => { el.classList.toggle("open"); this.beep(440, 0.04, "square", 0.025); };
                gGrid.appendChild(el);
            });
        }
        const steamBox = document.getElementById("steam-showcase"), steamLink = document.getElementById("about-steam-link");
        if (steamLink && profile.steamUrl) steamLink.href = profile.steamUrl;
        if (steamBox) {
            const st = about.steamHighlights || {}, achs = st.featuredAchievements || [];
            steamBox.innerHTML = `<div style="font-size:0.72rem;"><strong>STEAM // ${this.esc(st.handle || "PROFILE")}</strong> — <span style="color:var(--ink-dim);">${this.esc(st.statusText || "")}</span></div><div class="steam-ach-list">${achs.map((a) => `<div class="steam-ach-pill"><strong>${this.esc(a.title)}</strong><small>${this.esc(a.game)} • ${this.esc(a.rarity || "UNLOCKED")}</small></div>`).join("")}</div>`;
            if (profile.steamProxyUrl) {
                fetch(profile.steamProxyUrl).then((r) => r.ok ? r.json() : null).then((data) => {
                    if (!data || !data.recentGames) return;
                    steamBox.innerHTML = `<div style="font-size:0.72rem;"><strong>STEAM LIVE // ${this.esc(data.personaName || st.handle)}</strong> — <span style="color:var(--ink-dim);">${data.totalGames || ""} juegos</span></div><div class="steam-ach-list">${data.recentGames.slice(0, 3).map((g) => `<div class="steam-ach-pill"><strong>${this.esc(g.name)}</strong><small>${(g.playtime_forever / 60).toFixed(1)} hrs totales</small></div>`).join("")}</div>`;
                }).catch(() => {});
            }
        }
    },

    renderArcade(games) {
        const grid = document.getElementById("arcade-grid"); if (!grid) return;
        grid.innerHTML = "";
        games.forEach((g) => {
            const card = document.createElement("article"); card.className = "tac-window rb-spotlight";
            const playable = g.type === "bossfight" || g.type === "iframe" || g.type === "terminal";
            card.innerHTML = `<div class="tac-window-header"><span>${this.esc(g.id.toUpperCase())}</span><span>${this.esc(g.status || "")}</span></div><div class="arcade-card-body"><div class="arcade-thumb"><img src="${this.esc(g.thumb || 'img/icons/icon.png')}" alt="${this.esc(g.title)}" onerror="this.src='img/icons/icon.png'"></div><h3 class="arcade-title">${this.esc(g.title)}</h3><p class="arcade-desc">${this.esc(g.description || "")}</p><div class="post-tags-row">${(g.tags || []).map((t) => `<span class="post-tag">${this.esc(t)}</span>`).join("")}</div><button type="button" class="tac-btn ${playable ? "primary" : ""}" ${playable ? "" : "disabled"}>${g.type === "terminal" ? "ABRIR TERMINAL &gt;_" : (playable ? "EJECUTAR ▶" : "PRÓXIMAMENTE")}</button></div>`;
            if (playable) card.querySelector("button").onclick = () => { if (g.type === "terminal") this.openArgTerminal(); else if (g.type === "bossfight") this.openBossIntro(g); else this.launchGameStage(g); };
            grid.appendChild(card);
        });
    },

    openBossIntro(game) {
        this.pendingBossGame = game;
        document.body.classList.add("easter-alert");
        this.beep(140, 0.22, "sawtooth", 0.04);
        document.getElementById("boss-intro-modal")?.classList.add("active");
    },

    launchGameStage(game) {
        document.getElementById("boss-intro-modal")?.classList.remove("active");
        document.body.classList.remove("easter-alert");
        const overlay = document.getElementById("game-stage-overlay"), frame = document.getElementById("game-stage-frame");
        document.getElementById("bg-audio-el")?.pause(); window.ReactBitsFX.stop();
        document.getElementById("game-stage-title").textContent = `ARCADE // ${game.title}`;
        overlay.classList.add("active"); document.body.style.overflow = "hidden";
        frame.onload = () => { if (game.type === "bossfight" && frame.contentWindow) frame.contentWindow.postMessage({ type: "START_BOSS" }, "*"); frame.focus(); };
        frame.src = game.src;
    },

    closeGameStage() {
        document.getElementById("game-stage-overlay")?.classList.remove("active");
        const frame = document.getElementById("game-stage-frame"); if (frame) frame.src = "about:blank";
        document.body.style.overflow = "";
        if (!this.isLite && this.cfg?.effects?.squaresGrid !== false) window.ReactBitsFX.start();
    },

    openArgTerminal() {
        const m = document.getElementById("arg-terminal-modal");
        if (m) { m.classList.add("active"); document.getElementById("arg-input")?.focus(); }
    },

    toggleEasterAlert(reason = "PROTOCOLO CARMESÍ") {
        const active = document.body.classList.toggle("easter-alert");
        this.unlockSecret("crimson_protocol");
        this.beep(active ? 160 : 640, 0.18, "sawtooth", 0.04);
        this.toast(active ? `EASTER EGG: ${reason}` : "SISTEMA RESTAURADO");
    },

    unlockSecret(id) {
        let list = []; try { list = JSON.parse(localStorage.getItem("solyn_arg_secrets") || "[]"); } catch {}
        if (!list.includes(id)) { list.push(id); localStorage.setItem("solyn_arg_secrets", JSON.stringify(list)); }
        this.updateSecretsCounter();
    },

    updateSecretsCounter() {
        let list = []; try { list = JSON.parse(localStorage.getItem("solyn_arg_secrets") || "[]"); } catch {}
        const el = document.getElementById("secrets-progress-badge");
        if (el) el.textContent = `SECRETS: ${list.length}/3`;
    },

    handleArgCommand(raw) {
        const cmd = raw.trim().toUpperCase(), log = document.getElementById("arg-log");
        const print = (txt) => { const d = document.createElement("div"); d.innerHTML = txt; log.appendChild(d); log.scrollTop = log.scrollHeight; };
        print(`<span style="opacity:0.65;">&gt; ${this.esc(cmd)}</span>`);
        if (cmd === "HELP") print("&gt; COMANDOS: <b>HELP</b>, <b>STATUS</b>, <b>CLEAR</b>, <b>BOSS</b>, <b>HINTS</b> — o códigos secretos.");
        else if (cmd === "CLEAR") log.innerHTML = "";
        else if (cmd === "STATUS") print("&gt; NODO ACTIVO // 3 SECRETOS REGISTRADOS.");
        else if (cmd === "HINTS") print("&gt; 01: Toca el avatar 7 veces. 02: Usa RED SCAN en una foto. 03: Frase de los créditos del jefe.");
        else if (cmd === "BOSS") { document.getElementById("arg-terminal-modal")?.classList.remove("active"); const b = (this.cfg?.arcade || []).find((g) => g.type === "bossfight"); if (b) this.openBossIntro(b); }
        else if (cmd === "DENIED" || cmd === "RED" || cmd === "ALERT") { this.toggleEasterAlert("OVERRIDE DENIED"); print("&gt; [SECRET #1] PROTOCOLO ALTERNADO."); }
        else if (cmd === "SOLI DEO GLORIA" || cmd === "SAPHYNIEL") { this.unlockSecret("codex_echo"); print("&gt; [SECRET #2] ECO DEL CÓDICE RECONOCIDO."); }
        else if (cmd === "RED SCAN" || cmd === "PHASE S") { this.unlockSecret("lunar_trace"); print("&gt; [SECRET #3] FRECUENCIA LUNAR DESBLOQUEADA."); }
        else print("&gt; COMANDO DESCONOCIDO. ESCRIBE <b>HELP</b>.");
    },

    initMusicPlayer(tracks) {
        const audio = document.getElementById("bg-audio-el"), list = document.getElementById("music-playlist");
        if (!audio || !list || !tracks.length) return;
        const sig = JSON.stringify(tracks);
        if (this._lastTracksSig === sig) return;
        this._lastTracksSig = sig;

        audio.volume = 0.45;
        const load = (idx, play = false) => {
            this.playlistIndex = (idx + tracks.length) % tracks.length;
            const tr = tracks[this.playlistIndex];
            if (audio.getAttribute("data-src") !== tr.src) {
                audio.src = tr.src;
                audio.setAttribute("data-src", tr.src);
            }
            document.getElementById("music-track-title").textContent = tr.title;
            document.getElementById("music-track-artist").textContent = tr.artist || "ARCHIVE";
            document.getElementById("music-track-index").textContent = `TRK ${String(this.playlistIndex + 1).padStart(2, "0")}/${String(tracks.length).padStart(2, "0")}`;
            list.querySelectorAll(".playlist-row").forEach((r, i) => r.classList.toggle("active", i === this.playlistIndex));
            if (play) audio.play().catch(() => {});
        };
        list.innerHTML = "";
        tracks.forEach((tr, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "playlist-row"; b.innerHTML = `<span>${String(i + 1).padStart(2, "0")}. ${this.esc(tr.title)}</span><span>▶</span>`; b.onclick = () => load(i, true); list.appendChild(b); });
        load(0, false);
        document.getElementById("music-play").onclick = () => audio.paused ? audio.play().catch(() => {}) : audio.pause();
        document.getElementById("music-prev").onclick = () => load(this.playlistIndex - 1, !audio.paused);
        document.getElementById("music-next").onclick = () => load(this.playlistIndex + 1, !audio.paused);
        document.getElementById("music-vol").oninput = (e) => { audio.volume = parseFloat(e.target.value); };
        document.getElementById("music-seek").oninput = (e) => { if (audio.duration) audio.currentTime = (parseFloat(e.target.value) / 100) * audio.duration; };
        audio.ontimeupdate = () => {
            const fmt = (s) => isFinite(s) ? `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}` : "00:00";
            document.getElementById("music-time-cur").textContent = fmt(audio.currentTime);
            document.getElementById("music-time-dur").textContent = fmt(audio.duration);
            if (audio.duration) document.getElementById("music-seek").value = (audio.currentTime / audio.duration) * 100;
        };
        audio.onplay = () => { document.getElementById("music-play").textContent = "❚❚ PAUSE"; document.getElementById("player-state-tag").textContent = "PLAY"; };
        audio.onpause = () => { document.getElementById("music-play").textContent = "▶ PLAY"; document.getElementById("player-state-tag").textContent = "PAUSE"; };
        audio.onended = () => load(this.playlistIndex + 1, true);
    },

    resolveDiscordAsset(act) {
        const img = act?.assets?.large_image;
        if (!img) return "img/icons/icon.png";
        if (img.startsWith("mp:external/")) {
            const raw = img.replace("mp:external/", "");
            const hi = raw.indexOf("/https/");
            if (hi !== -1) return "https://" + raw.slice(hi + 7);
            const h2 = raw.indexOf("/http/");
            if (h2 !== -1) return "http://" + raw.slice(h2 + 6);
            return `https://media.discordapp.net/external/${raw}`;
        }
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        if (act.application_id) return `https://cdn.discordapp.com/app-assets/${act.application_id}/${img}.png`;
        return "img/icons/icon.png";
    },

    initLanyard(userId, fallbackHandle) {
        const id = String(userId || "").trim();
        if (!id) return;
        if (this._lanyardId === id && this._lanyardTimer) return;
        this._lanyardId = id;
        if (this._lanyardTimer) clearInterval(this._lanyardTimer);

        const poll = async () => {
            try {
                const res = await fetch(`https://api.lanyard.rest/v1/users/${id}?t=${Date.now()}`, { cache: "no-store" });
                const payload = await res.json().catch(() => null);
                if (!res.ok || !payload || !payload.success || !payload.data) return;

                const data = payload.data;
                const st = data.discord_status || "offline";
                const map = { online: "● ONLINE", idle: "◐ IDLE", dnd: "⊘ DND", offline: "○ OFFLINE" };
                document.getElementById("dc-state-label").textContent = st.toUpperCase();
                document.getElementById("profile-mood-badge").textContent = map[st] || "○ OFFLINE";
                document.getElementById("pfp-status-dot").setAttribute("data-status", st);

                const u = data.discord_user || {};
                if (u.id && u.avatar) {
                    const avatarUrl = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith("a_") ? "gif" : "png"}?size=256`;
                    this._lanyardAvatarUrl = avatarUrl;
                    document.getElementById("dc-avatar").src = avatarUrl;
                    const cfgAv = this.cfg?.profile?.avatar || "";
                    if (!cfgAv || cfgAv.includes("saphyniel_normal.png")) {
                        document.getElementById("main-pfp").src = avatarUrl;
                    }
                }
                document.getElementById("dc-name").textContent = u.global_name || u.display_name || u.username || "Saphyniel";
                document.getElementById("dc-handle").textContent = `@${u.username || fallbackHandle || "discord"}`;

                const acts = Array.isArray(data.activities) ? data.activities : [];
                const custom = acts.find((a) => a.type === 4), cEl = document.getElementById("dc-custom-note");
                if (custom && (custom.state || custom.emoji?.name)) {
                    cEl.textContent = `"${custom.emoji?.name ? custom.emoji.name + " " : ""}${custom.state || ""}"`;
                    cEl.style.display = "block";
                } else cEl.style.display = "none";

                let html = "";
                const typeLabels = { 0: "PLAYING", 1: "STREAMING", 2: "LISTENING", 3: "WATCHING", 5: "COMPETING" };
                acts.filter((a) => a.type !== 4 && a.id !== "spotify:1").forEach((act) => {
                    const art = this.resolveDiscordAsset(act);
                    const sub = [act.details, act.state].filter(Boolean).join(" — ") || "En sesión";
                    html += `<div class="dc-act-card"><img class="dc-act-art" src="${this.esc(art)}" alt="" referrerpolicy="no-referrer" onerror="this.src='img/icons/icon.png'"><div class="dc-act-info"><div class="dc-act-kicker">${typeLabels[act.type] || "ACTIVE"}</div><div class="dc-act-title">${this.esc(act.name)}</div><div class="dc-act-sub">${this.esc(sub)}</div></div></div>`;
                });
                if (data.listening_to_spotify && data.spotify) {
                    const sp = data.spotify;
                    const pct = sp.timestamps?.start && sp.timestamps?.end
                        ? Math.min(100, Math.max(0, ((Date.now() - sp.timestamps.start) / Math.max(1, sp.timestamps.end - sp.timestamps.start)) * 100))
                        : 0;
                    html += `<div class="dc-act-card"><img class="dc-act-art" src="${this.esc(sp.album_art_url || 'img/icons/icon.png')}" alt="" referrerpolicy="no-referrer"><div class="dc-act-info"><div class="dc-act-kicker">SPOTIFY</div><div class="dc-act-title">${this.esc(sp.song)}</div><div class="dc-act-sub">${this.esc(sp.artist)}</div><div class="sp-bar-track"><div class="sp-bar-fill" style="width:${pct.toFixed(1)}%"></div></div></div></div>`;
                }
                document.getElementById("dc-activities").innerHTML = html || `<div class="dc-idle-msg">&gt; EN CALMA (${st.toUpperCase()})_</div>`;
            } catch {}
        };
        poll();
        this._lanyardTimer = setInterval(poll, 12000);
    },

    initClock() {
        const tick = () => {
            const d = new Date();
            document.getElementById("hud-clock-time").textContent = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
            document.getElementById("hud-clock-date").textContent = `${d.toISOString().slice(0, 10)} // UTC`;
        };
        tick(); setInterval(tick, 10000);
    },

    bindGlobalControls() {
        document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => this.switchView(b.getAttribute("data-view"))));
        document.querySelectorAll("[data-jump-view]").forEach((b) => b.addEventListener("click", () => this.switchView(b.getAttribute("data-jump-view"))));
        document.getElementById("splash-quote-btn")?.addEventListener("click", () => { this.pickRandomSplash(); this.beep(660, 0.03, "sine", 0.025); });
        document.getElementById("btn-copy-url")?.addEventListener("click", () => { navigator.clipboard.writeText(this.cfg?.profile?.siteUrl || location.href).catch(() => {}); this.toast("URL COPIADA"); });
        document.getElementById("btn-copy-discord")?.addEventListener("click", () => { navigator.clipboard.writeText(this.cfg?.profile?.discordHandle || "").catch(() => {}); this.toast("DISCORD COPIADO"); });

        document.getElementById("pfp-easter-trigger")?.addEventListener("click", () => {
            if (this.studioEditEnabled) return;
            this.pfpClicks++; clearTimeout(this.pfpTimer);
            this.pfpTimer = setTimeout(() => { this.pfpClicks = 0; }, 2400);
            if (this.pfpClicks >= 7) { this.pfpClicks = 0; this.toggleEasterAlert("ANOMALÍA DETECTADA"); }
        });

        document.getElementById("quick-launch-boss")?.addEventListener("click", () => { const boss = (this.cfg?.arcade || []).find((g) => g.type === "bossfight"); if (boss) this.openBossIntro(boss); });
        document.getElementById("boss-intro-confirm")?.addEventListener("click", () => { if (this.pendingBossGame) this.launchGameStage(this.pendingBossGame); });
        document.getElementById("boss-intro-cancel")?.addEventListener("click", () => { document.getElementById("boss-intro-modal")?.classList.remove("active"); document.body.classList.remove("easter-alert"); });
        document.getElementById("game-stage-close")?.addEventListener("click", () => this.closeGameStage());

        const mm = document.getElementById("media-modal");
        const closeMedia = () => { mm?.classList.remove("active"); document.getElementById("media-modal-content").innerHTML = ""; };
        document.getElementById("media-modal-close")?.addEventListener("click", closeMedia);
        mm?.addEventListener("click", (e) => { if (e.target === mm) closeMedia(); });
        document.querySelectorAll("[data-img-filter]").forEach((btn) => btn.addEventListener("click", () => {
            const f = btn.getAttribute("data-img-filter");
            document.querySelectorAll("[data-img-filter]").forEach((x) => x.classList.remove("primary")); btn.classList.add("primary");
            const img = document.querySelector("#media-modal-content img");
            if (img) { img.className = f === "none" ? "" : `filter-${f}`; if (f === "red") this.unlockSecret("red_channel_eye"); }
        }));

        const tm = document.getElementById("arg-terminal-modal");
        document.getElementById("btn-open-terminal")?.addEventListener("click", () => this.openArgTerminal());
        document.getElementById("arg-terminal-close")?.addEventListener("click", () => tm?.classList.remove("active"));
        tm?.addEventListener("click", (e) => { if (e.target === tm) tm.classList.remove("active"); });
        document.getElementById("arg-form")?.addEventListener("submit", (e) => { e.preventDefault(); const inp = document.getElementById("arg-input"); if (inp.value.trim()) { this.handleArgCommand(inp.value); inp.value = ""; } });

        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); this.openArgTerminal(); }
            if (e.key === "Escape") { closeMedia(); tm?.classList.remove("active"); }
        });
    },

    switchView(viewId) {
        document.body.setAttribute("data-active-view", viewId);
        document.querySelectorAll(".stage-view").forEach((v) => v.classList.toggle("active", v.id === viewId));
        document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-view") === viewId));
        this.beep(560, 0.03, "triangle", 0.02);
        const active = document.getElementById(viewId);
        if (active) window.ReactBitsFX.runDecryptAll(active);
        if (window.innerWidth < 960) window.scrollTo({ top: 0, behavior: "smooth" });
    },

    openMediaModal(type, src, title, desc = "") {
        const m = document.getElementById("media-modal"), content = document.getElementById("media-modal-content"), bar = document.getElementById("media-filter-bar");
        document.getElementById("media-modal-title").textContent = title || "MEDIA // INSPECTOR";
        document.querySelectorAll("[data-img-filter]").forEach((b) => b.classList.toggle("primary", b.getAttribute("data-img-filter") === "none"));
        if (bar) bar.style.display = type === "image" ? "flex" : "none";
        content.innerHTML = type === "video" ? `<video controls autoplay src="${this.esc(src)}"></video>` : `<img src="${this.esc(src)}" alt="${this.esc(title || "")}">`;
        const meta = document.getElementById("media-modal-meta"); meta.textContent = desc || ""; meta.style.display = desc ? "block" : "none";
        m.classList.add("active");
    },

    toast(msg) {
        const el = document.getElementById("sys-toast"); if (!el) return;
        el.textContent = `> ${msg}`; el.classList.add("show");
        clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
    },

    esc(s) { return String(s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]); }
};

window.addEventListener("DOMContentLoaded", () => window.ReworkApp.init());
// ============================================================================
// MOTOR DE SCROLLBAR NEO-BRUTALIST DINÁMICA E INTERACTIVA (PC + MÓVIL)
// ============================================================================
(function initNeoBruteScrollbar() {
    let track, thumb, hideTimer = null, isDragging = false, dragOffsetY = 0;

    function mount() {
        if (document.getElementById("nb-scrollbar-track")) return;
        track = document.createElement("div");
        track.id = "nb-scrollbar-track";
        track.className = "nb-scrollbar-track";
        track.setAttribute("aria-hidden", "true");
        track.innerHTML = `<div class="nb-scrollbar-rail"></div><div class="nb-scrollbar-thumb" id="nb-scrollbar-thumb"></div>`;
        document.body.appendChild(track);
        thumb = document.getElementById("nb-scrollbar-thumb");

        bindEvents();
        updateGeometry();
    }

    function getMetrics() {
        const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        const viewH = window.innerHeight;
        const maxScroll = Math.max(0, docH - viewH);
        const trackH = track ? track.clientHeight : viewH;
        const thumbH = maxScroll > 0 ? Math.max(36, Math.min(trackH * 0.55, (viewH / docH) * trackH)) : trackH;
        return { docH, viewH, maxScroll, trackH, thumbH };
    }

    function updateGeometry() {
        if (!track || !thumb) return;
        const { maxScroll, trackH, thumbH } = getMetrics();
        if (maxScroll <= 12 || document.body.classList.contains("is-locked")) {
            track.classList.add("is-hidden-fit");
            track.classList.remove("is-visible");
            return;
        }
        track.classList.remove("is-hidden-fit");
        const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        const y = ratio * Math.max(0, trackH - thumbH);
        thumb.style.height = `${thumbH.toFixed(1)}px`;
        thumb.style.transform = `translateY(${y.toFixed(1)}px)`;
    }

    function revealTemporarily(ms = 1150) {
        if (!track || track.classList.contains("is-hidden-fit")) return;
        track.classList.add("is-visible");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (!isDragging && !track.matches(":hover")) {
                track.classList.remove("is-visible");
            }
        }, ms);
    }

    function scrollToTrackClientY(clientY, offset = null) {
        const rect = track.getBoundingClientRect();
        const { maxScroll, trackH, thumbH } = getMetrics();
        if (maxScroll <= 0) return;
        const usable = Math.max(1, trackH - thumbH);
        const targetTop = offset === null
            ? (clientY - rect.top - thumbH / 2)
            : (clientY - rect.top - offset);
        const ratio = Math.min(1, Math.max(0, targetTop / usable));
        window.scrollTo({ top: ratio * maxScroll, behavior: "auto" });
    }

    function bindEvents() {
        window.addEventListener("scroll", () => {
            updateGeometry();
            revealTemporarily(1100);
        }, { passive: true });

        window.addEventListener("resize", updateGeometry, { passive: true });

        // En PC: revelar al acercar el cursor al borde derecho
        window.addEventListener("pointermove", (e) => {
            if (e.pointerType !== "mouse" || isDragging) return;
            if (e.clientX >= window.innerWidth - 28) {
                updateGeometry();
                revealTemporarily(1500);
            }
        }, { passive: true });

        track.addEventListener("pointerenter", () => {
            clearTimeout(hideTimer);
            updateGeometry();
            track.classList.add("is-visible");
        });

        track.addEventListener("pointerleave", () => {
            if (!isDragging) revealTemporarily(700);
        });

        track.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            const thumbRect = thumb.getBoundingClientRect();
            isDragging = true;
            track.classList.add("is-dragging", "is-visible");
            track.setPointerCapture?.(e.pointerId);

            if (e.clientY >= thumbRect.top && e.clientY <= thumbRect.bottom) {
                dragOffsetY = e.clientY - thumbRect.top;
            } else {
                dragOffsetY = null;
                scrollToTrackClientY(e.clientY, null);
                dragOffsetY = thumb.clientHeight / 2;
            }
        });

        track.addEventListener("pointermove", (e) => {
            if (!isDragging) return;
            e.preventDefault();
            scrollToTrackClientY(e.clientY, dragOffsetY);
        });

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            track.classList.remove("is-dragging");
            revealTemporarily(900);
        };
        track.addEventListener("pointerup", endDrag);
        track.addEventListener("pointercancel", endDrag);

        // Recalcular al cambiar de pestaña o cargar nuevos posts
        if ("MutationObserver" in window) {
            const mo = new MutationObserver(() => requestAnimationFrame(updateGeometry));
            mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
        }
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", mount);
    } else {
        mount();
    }
})();