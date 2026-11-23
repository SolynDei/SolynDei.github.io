window.BlogFeed = {
    posts: [], activeFilter: "all", useSupabase: false, cfg: null,

    normalizeBaseUrl(raw) {
        return String(raw || "").trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    },

    buildHeaders(key, extra = {}) {
        const h = { apikey: key, ...extra };
        if (String(key || "").startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
        return h;
    },

    async init(cfg) {
        this.cfg = cfg;
        const sb = cfg?.supabase;
        this.useSupabase = Boolean(sb && sb.url && sb.anonKey);
        const badge = document.getElementById("feed-source-badge");
        if (badge) badge.textContent = this.useSupabase ? "SUPABASE + LOCAL" : "LOCAL MODE";

        document.querySelectorAll("#feed-filters .pill-btn").forEach((btn) => {
            btn.onclick = () => {
                this.activeFilter = btn.getAttribute("data-filter");
                document.querySelectorAll("#feed-filters .pill-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                this.renderFeed();
            };
        });
        const refBtn = document.getElementById("btn-refresh-feed");
        if (refBtn) refBtn.onclick = () => this.loadPosts(true);
        await this.loadPosts(false);
    },

    async loadPosts(notify = false) {
        let remotePosts = [];
        if (this.useSupabase) {
            try {
                const base = this.normalizeBaseUrl(this.cfg.supabase.url);
                const key = this.cfg.supabase.anonKey;
                const res = await fetch(`${base}/rest/v1/posts?select=*&order=published_at.desc`, {
                    headers: this.buildHeaders(key)
                });
                if (res.ok) remotePosts = await res.json();
            } catch {}
        }

        // Si ya hay posts en Supabase, los combina con los locales o muestra los remotos ordenados por fecha (más viejos al fondo)
        const localPosts = Array.isArray(this.cfg?.samplePosts) ? this.cfg.samplePosts : [];
        const combined = remotePosts.length ? [...remotePosts, ...localPosts] : [...localPosts];
        const seen = new Set();
        this.posts = combined.filter((p) => {
            const k = String(p.id || p.title);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        }).sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

        this.renderLatest();
        this.renderFeed();
        this.renderGallery();
        if (notify) window.ReworkApp?.toast("FEED ACTUALIZADO");
    },

    parseMedia(url, category = "") {
        const u = String(url || "").trim();
        if (!u) return null;

        // YouTube (watch, youtu.be, shorts)
        const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (yt) return { kind: "youtube", id: yt[1], embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` };

        // TikTok (/video/ID)
        const tt = u.match(/tiktok\.com\/.*\/video\/(\d+)/);
        if (tt) return { kind: "tiktok", id: tt[1], embed: `https://www.tiktok.com/player/v1/${tt[1]}?music_info=1&description=1` };

        // Spotify (track, album, playlist, episode)
        const sp = u.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
        if (sp) return { kind: "spotify", embed: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}?utm_source=generator&theme=0` };

        // Video directo MP4/WEBM/OGG
        if (category === "video" || /\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) {
            return { kind: "video", src: u };
        }

        // Imagen o GIF
        return { kind: "image", src: u };
    },

    createNeoBruteMediaNode(post) {
        const parsed = this.parseMedia(post.media_url, post.category);
        if (!parsed) return null;

        const useLoader = this.cfg?.effects?.neoBruteLoaders !== false;
        const wrap = document.createElement("div");
        wrap.className = "nb-media-frame" + (useLoader ? " is-loading" : "");
        wrap.setAttribute("data-editable-post-img", String(post.id));

        const loader = document.createElement("div");
        loader.className = "nb-loader-overlay";
        loader.innerHTML = `<div class="nb-loader-stripe"></div><div class="nb-loader-label">[ LOADING ${parsed.kind.toUpperCase()} // ... ]</div>`;
        wrap.appendChild(loader);

        const show404 = () => {
            wrap.classList.remove("is-loading");
            wrap.innerHTML = `
                <div class="nb-error-box">
                    <div class="nb-error-head"><span>ERR_MEDIA_MISSING</span><span>[ 404 ]</span></div>
                    <div class="nb-error-body">
                        <div class="nb-error-code">404 // NOT FOUND</div>
                        <div class="nb-error-msg">La imagen o video no se encontró o no pudo cargarse.</div>
                        <div class="nb-error-path">${this.esc(post.media_url)}</div>
                    </div>
                </div>`;
        };

        if (parsed.kind === "youtube") {
            wrap.classList.add("is-embed-yt");
            const ifr = document.createElement("iframe");
            ifr.src = parsed.embed;
            ifr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            ifr.allowFullscreen = true;
            ifr.onload = () => wrap.classList.remove("is-loading");
            setTimeout(() => wrap.classList.remove("is-loading"), 2200);
            wrap.appendChild(ifr);
        } else if (parsed.kind === "tiktok") {
            wrap.classList.add("is-embed-tiktok");
            const ifr = document.createElement("iframe");
            ifr.src = parsed.embed;
            ifr.allow = "autoplay; encrypted-media; fullscreen";
            ifr.allowFullscreen = true;
            ifr.onload = () => wrap.classList.remove("is-loading");
            setTimeout(() => wrap.classList.remove("is-loading"), 2600);
            wrap.appendChild(ifr);
        } else if (parsed.kind === "spotify") {
            wrap.classList.add("is-embed-spotify");
            const ifr = document.createElement("iframe");
            ifr.src = parsed.embed;
            ifr.height = "152";
            ifr.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
            ifr.onload = () => wrap.classList.remove("is-loading");
            setTimeout(() => wrap.classList.remove("is-loading"), 2200);
            wrap.appendChild(ifr);
        } else if (parsed.kind === "video") {
            const vid = document.createElement("video");
            vid.src = parsed.src;
            vid.controls = true;
            vid.playsInline = true;
            vid.preload = "metadata";
            vid.onloadeddata = () => wrap.classList.remove("is-loading");
            vid.onerror = show404;
            wrap.appendChild(vid);
        } else {
            const img = document.createElement("img");
            img.src = parsed.src;
            img.alt = post.title || "Media";
            img.loading = "lazy";
            img.onload = () => wrap.classList.remove("is-loading");
            img.onerror = show404;
            img.addEventListener("click", () => {
                if (document.body.classList.contains("studio-edit-mode")) return;
                window.ReworkApp.openMediaModal("image", parsed.src, post.title, post.content);
            });
            wrap.appendChild(img);
        }
        return wrap;
    },

    renderLatest() {
        const strip = document.getElementById("latest-posts-strip");
        if (!strip) return;
        const top = this.posts.slice(0, 3);
        if (!top.length) { strip.innerHTML = `<div class="dc-idle-msg">&gt; SIN ENTRADAS TODAVÍA_</div>`; return; }
        strip.innerHTML = "";
        top.forEach((p) => {
            const row = document.createElement("div");
            row.className = "latest-post-row";
            row.innerHTML = `<span>[${(p.category || "POST").toUpperCase()}] ${this.esc(p.title)}</span><span class="latest-post-date">${this.fmtDate(p.published_at)}</span>`;
            row.onclick = () => window.ReworkApp.switchView("view-posts");
            strip.appendChild(row);
        });
    },

    renderFeed() {
        const list = document.getElementById("posts-feed-list");
        if (!list) return;
        const filtered = this.activeFilter === "all" ? this.posts : this.posts.filter((p) => (p.category || "post") === this.activeFilter);
        if (!filtered.length) {
            list.innerHTML = `<article class="tac-window"><div class="post-card-body"><div class="dc-idle-msg">&gt; SIN ENTRADAS EN ESTA CATEGORÍA_</div></div></article>`;
            return;
        }
        const likedSet = this.getLiked();
        list.innerHTML = "";
        filtered.forEach((post) => {
            const card = document.createElement("article");
            card.className = "tac-window rb-spotlight";
            const isLiked = likedSet.has(String(post.id));
            const likesCount = Number(post.likes_count || 0) + (isLiked && !this.useSupabase ? 1 : 0);
            const tags = Array.isArray(post.tags) ? post.tags : [];

            card.innerHTML = `
                <div class="tac-window-header">
                    <span>ENTRY // ${(post.category || "POST").toUpperCase()}</span>
                    <span>${this.fmtDate(post.published_at)}</span>
                </div>
                <div class="post-card-body">
                    <h2 class="post-title">${this.esc(post.title)}</h2>
                    <div class="post-media-slot"></div>
                    ${post.content ? `<p class="post-text">${this.esc(post.content)}</p>` : ""}
                    ${tags.length ? `<div class="post-tags-row">${tags.map((t) => `<span class="post-tag">#${this.esc(t)}</span>`).join("")}</div>` : ""}
                    <div class="post-actions-bar">
                        <button type="button" class="tac-btn-xs like-btn ${isLiked ? "liked" : ""}">♥ LIKE (<span class="like-num">${likesCount}</span>)</button>
                        <button type="button" class="tac-btn-xs btn-comments">⌘ COMENTARIOS</button>
                    </div>
                    <div class="comments-drawer" id="drawer-${post.id}">
                        <div class="comments-list" id="clist-${post.id}"><div class="dc-idle-msg">&gt; CARGANDO...</div></div>
                        <form class="comment-form">
                            <div class="comment-form-row">
                                <input type="text" class="tac-input" name="author" placeholder="Tu apodo..." maxlength="32" required>
                                <input type="text" class="tac-input" name="content" placeholder="Escribe un comentario..." maxlength="280" required>
                            </div>
                            <button type="submit" class="tac-btn-xs primary" style="align-self:flex-start;">PUBLICAR</button>
                        </form>
                    </div>
                </div>`;

            const mediaNode = this.createNeoBruteMediaNode(post);
            if (mediaNode) card.querySelector(".post-media-slot").appendChild(mediaNode);

            card.querySelector(".like-btn")?.addEventListener("click", (e) => this.handleLike(post, e.currentTarget));
            card.querySelector(".btn-comments")?.addEventListener("click", () => {
                const d = document.getElementById(`drawer-${post.id}`);
                d.classList.toggle("open");
                if (d.classList.contains("open")) this.loadComments(post.id);
            });
            card.querySelector(".comment-form")?.addEventListener("submit", async (e) => {
                e.preventDefault();
                const f = e.currentTarget;
                const a = f.author.value.trim(), c = f.content.value.trim();
                if (!a || !c) return;
                await this.submitComment(post.id, a, c);
                f.reset();
                this.loadComments(post.id);
            });
            list.appendChild(card);
        });
    },

    renderGallery() {
        const grid = document.getElementById("media-gallery-grid");
        if (!grid) return;
        const items = this.posts.filter((p) => {
            const m = this.parseMedia(p.media_url, p.category);
            return m && (m.kind === "image" || m.kind === "video");
        });
        if (!items.length) { grid.innerHTML = `<div class="dc-idle-msg">&gt; SUBE FOTOS, GIFS O VIDEOS PARA VER LA GALERÍA_</div>`; return; }
        grid.innerHTML = "";
        items.forEach((p) => {
            const m = this.parseMedia(p.media_url, p.category);
            const tile = document.createElement("div");
            tile.className = "media-tile";
            tile.innerHTML = m.kind === "video"
                ? `<video class="media-tile-thumb" src="${this.esc(m.src)}" muted preload="metadata"></video><div class="media-tile-cap">▶ ${this.esc(p.title)}</div>`
                : `<img class="media-tile-thumb" src="${this.esc(m.src)}" alt="${this.esc(p.title)}" loading="lazy" onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('afterbegin','<div style=padding:20px;font-family:monospace;font-size:0.7rem;text-align:center;>404 // NOT FOUND</div>');"><div class="media-tile-cap">${this.esc(p.title)}</div>`;
            tile.onclick = () => window.ReworkApp.openMediaModal(m.kind, m.src, p.title, p.content);
            grid.appendChild(tile);
        });
    },

    getLiked() { try { return new Set(JSON.parse(localStorage.getItem("solyn_liked_posts") || "[]")); } catch { return new Set(); } },

    async handleLike(post, btn) {
        const s = this.getLiked(), k = String(post.id);
        if (s.has(k)) { window.ReworkApp.toast("YA DISTE LIKE A ESTE POST"); return; }
        s.add(k); localStorage.setItem("solyn_liked_posts", JSON.stringify([...s]));
        const n = btn.querySelector(".like-num"); if (n) n.textContent = String(Number(n.textContent) + 1);
        btn.classList.add("liked");
        if (this.useSupabase && /^[0-9a-f-]{36}$/i.test(k)) {
            const base = this.normalizeBaseUrl(this.cfg.supabase.url);
            await fetch(`${base}/rest/v1/rpc/increment_post_like`, {
                method: "POST",
                headers: this.buildHeaders(this.cfg.supabase.anonKey, { "Content-Type": "application/json" }),
                body: JSON.stringify({ p_post_id: post.id })
            }).catch(() => {});
        }
    },

    async loadComments(postId) {
        const box = document.getElementById(`clist-${postId}`);
        if (!box) return;
        let comments = [];
        if (this.useSupabase && /^[0-9a-f-]{36}$/i.test(String(postId))) {
            try {
                const base = this.normalizeBaseUrl(this.cfg.supabase.url);
                const res = await fetch(`${base}/rest/v1/comments?post_id=eq.${encodeURIComponent(postId)}&order=created_at.asc`, {
                    headers: this.buildHeaders(this.cfg.supabase.anonKey)
                });
                if (res.ok) comments = await res.json();
            } catch {}
        } else {
            const all = JSON.parse(localStorage.getItem("solyn_local_comments") || "{}");
            comments = all[postId] || [];
        }
        box.innerHTML = comments.length
            ? comments.map((c) => `<div class="comment-item"><div class="comment-item-head"><strong>${this.esc(c.author_name)}</strong><span>${this.fmtDate(c.created_at)}</span></div><div>${this.esc(c.content)}</div></div>`).join("")
            : `<div class="dc-idle-msg">&gt; SIN COMENTARIOS TODAVÍA_</div>`;
    },

    async submitComment(postId, author, content) {
        if (this.useSupabase && /^[0-9a-f-]{36}$/i.test(String(postId))) {
            const base = this.normalizeBaseUrl(this.cfg.supabase.url);
            await fetch(`${base}/rest/v1/comments`, {
                method: "POST",
                headers: this.buildHeaders(this.cfg.supabase.anonKey, { "Content-Type": "application/json", Prefer: "return=minimal" }),
                body: JSON.stringify({ post_id: postId, author_name: author, content })
            }).catch(() => {});
        } else {
            const all = JSON.parse(localStorage.getItem("solyn_local_comments") || "{}");
            all[postId] = all[postId] || [];
            all[postId].push({ author_name: author, content, created_at: new Date().toISOString() });
            localStorage.setItem("solyn_local_comments", JSON.stringify(all));
        }
        window.ReworkApp.toast("COMENTARIO ENVIADO");
    },

    fmtDate(iso) { const d = new Date(iso); return isNaN(d.getTime()) ? String(iso || "----") : d.toISOString().slice(0, 10); },
    esc(s) { return String(s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]); }
};