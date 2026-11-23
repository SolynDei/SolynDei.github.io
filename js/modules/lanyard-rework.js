window.LanyardRework = {
    pollTimer: null,

    init() {
        const id = window.SITE_CONFIG?.profile?.discordId;
        if (!id) {
            const el = document.getElementById("dc-activities");
            if (el) el.innerHTML = `<div class="dc-idle-msg">&gt; AGREGA TU DISCORD ID EN site-config.js PARA VER ESTADO EN VIVO</div>`;
            return;
        }
        this.fetchStatus(id);
        this.pollTimer = setInterval(() => this.fetchStatus(id), 15000);
    },

    async fetchStatus(userId) {
        try {
            const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
            if (!res.ok) return;
            const json = await res.json();
            if (!json.success || !json.data) return;
            this.render(json.data);
        } catch (err) {
            // Silencioso si no hay red
        }
    },

    render(data) {
        const user = data.discord_user || {};
        const status = data.discord_status || "offline";
        const statusMap = { online: "● ONLINE", idle: "◐ IDLE", dnd: "⊘ DND", offline: "○ OFFLINE" };

        const labelEl = document.getElementById("dc-state-label");
        const moodBadge = document.getElementById("profile-mood-badge");
        const pfpDot = document.getElementById("pfp-status-dot");

        if (labelEl) labelEl.textContent = status.toUpperCase();
        if (moodBadge) moodBadge.textContent = statusMap[status] || "○ OFFLINE";
        if (pfpDot) pfpDot.setAttribute("data-status", status);

        if (user.id && user.avatar) {
            const ext = user.avatar.startsWith("a_") ? "gif" : "png";
            const url = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
            const dcAv = document.getElementById("dc-avatar");
            if (dcAv) dcAv.src = url;
        }

        const dcName = document.getElementById("dc-name");
        const dcHandle = document.getElementById("dc-handle");
        if (dcName) dcName.textContent = user.global_name || user.username || "Saphyniel";
        if (dcHandle) dcHandle.textContent = `@${user.username || window.SITE_CONFIG.profile.discordHandle}`;

        const activities = Array.isArray(data.activities) ? data.activities : [];
        const custom = activities.find((a) => a.type === 4);
        const customEl = document.getElementById("dc-custom-note");
        if (customEl) {
            if (custom && custom.state) {
                customEl.textContent = `"${custom.state}"`;
                customEl.style.display = "block";
            } else {
                customEl.style.display = "none";
            }
        }

        const container = document.getElementById("dc-activities");
        if (!container) return;
        let html = "";

        // Juego / App activa
        const game = activities.find((a) => a.type === 0);
        if (game) {
            let gameArt = "img/icons/icon.png";
            if (game.assets?.large_image) {
                const img = game.assets.large_image;
                if (img.startsWith("mp:external/")) {
                    gameArt = `https://media.discordapp.net/external/${img.replace("mp:external/", "")}`;
                } else if (game.application_id) {
                    gameArt = `https://cdn.discordapp.com/app-assets/${game.application_id}/${img}.png`;
                }
            }
            html += `
                <div class="dc-act-card">
                    <img class="dc-act-art" src="${gameArt}" alt="" onerror="this.src='img/icons/icon.png'">
                    <div class="dc-act-info">
                        <div class="dc-act-kicker">PLAYING // ACTIVO</div>
                        <div class="dc-act-title">${this.escape(game.name)}</div>
                        <div class="dc-act-sub">${this.escape(game.details || game.state || "En sesión")}</div>
                    </div>
                </div>`;
        }

        // Spotify en vivo
        if (data.listening_to_spotify && data.spotify) {
            const sp = data.spotify;
            const total = Math.max(1, sp.timestamps.end - sp.timestamps.start);
            const pct = Math.min(100, Math.max(0, ((Date.now() - sp.timestamps.start) / total) * 100));
            html += `
                <div class="dc-act-card">
                    <img class="dc-act-art" src="${sp.album_art_url || 'img/icons/icon.png'}" alt="">
                    <div class="dc-act-info">
                        <div class="dc-act-kicker">SPOTIFY // LISTENING</div>
                        <div class="dc-act-title">${this.escape(sp.song)}</div>
                        <div class="dc-act-sub">${this.escape(sp.artist)}</div>
                        <div class="sp-bar-track"><div class="sp-bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
                    </div>
                </div>`;
        }

        container.innerHTML = html || `<div class="dc-idle-msg">&gt; EN CALMA // SIN ACTIVIDAD EN DISCORD_</div>`;
    },

    escape(str) {
        return String(str || "").replace(/[&<>"']/g, (m) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[m]);
    }
};