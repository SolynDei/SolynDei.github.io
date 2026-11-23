// =========================================================
// DISCORD LIVE PRESENCE HUB (LANYARD WEBSOCKET + REST)
// Muestra simultáneamente: Banner, PFP, Status, Actividad/Juego y Spotify
// =========================================================
const LanyardModule = {
    discordId: "409107659153735680",
    ws: null,
    heartbeatInterval: null,
    progressTimer: null,
    discordAvatarUrl: "img/portraits/saphyniel_normal.png",
    lastPresenceData: null,
    activeSpotifyTimestamps: null,
    activeGameTimestampStart: null,

    init() {
        if (typeof CODEX_DATA !== 'undefined' && CODEX_DATA.discordId) {
            this.discordId = CODEX_DATA.discordId;
        }
        this.fetchRestFallback();
        this.connectWebSocket();
        this.startLiveTimers();
    },

    async fetchRestFallback() {
        try {
            const res = await fetch(`https://api.lanyard.rest/v1/users/${this.discordId}`);
            const json = await res.json();
            if (json && json.success && json.data) {
                this.updatePresenceUI(json.data);
            }
        } catch (e) {}
    },

    connectWebSocket() {
        try {
            if (this.ws) {
                try { this.ws.close(); } catch (e) {}
            }
            this.ws = new WebSocket("wss://api.lanyard.rest/socket");

            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.op === 1) {
                    const interval = msg.d.heartbeat_interval;
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = setInterval(() => {
                        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                            this.ws.send(JSON.stringify({ op: 3 }));
                        }
                    }, interval);

                    this.ws.send(JSON.stringify({
                        op: 2,
                        d: { subscribe_to_id: this.discordId }
                    }));
                } else if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
                    this.updatePresenceUI(msg.d);
                }
            };

            this.ws.onclose = () => {
                clearInterval(this.heartbeatInterval);
                setTimeout(() => this.connectWebSocket(), 5000);
            };
        } catch (e) {}
    },

    resolveActivityImage(appId, assetId) {
        if (!assetId) return "img/icons/icon.png";
        if (assetId.startsWith("mp:external/")) {
            return `https://media.discordapp.net/external/${assetId.replace("mp:external/", "")}`;
        }
        if (assetId.startsWith("spotify:")) {
            return `https://i.scdn.co/image/${assetId.replace("spotify:", "")}`;
        }
        if (appId) {
            return `https://cdn.discordapp.com/app-assets/${appId}/${assetId}.png`;
        }
        return "img/icons/icon.png";
    },

    formatDuration(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        if (hrs > 0) {
            return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${mins}:${String(secs).padStart(2, '0')}`;
    },

    startLiveTimers() {
        clearInterval(this.progressTimer);
        this.progressTimer = setInterval(() => {
            const now = Date.now();

            if (this.activeSpotifyTimestamps) {
                const { start, end } = this.activeSpotifyTimestamps;
                const total = Math.max(1, end - start);
                const elapsed = Math.min(total, Math.max(0, now - start));
                const pct = Math.min(100, (elapsed / total) * 100);

                const fill = document.getElementById('sp-progress-fill');
                const curEl = document.getElementById('sp-time-cur');
                const endEl = document.getElementById('sp-time-end');
                if (fill) fill.style.width = `${pct.toFixed(1)}%`;
                if (curEl) curEl.textContent = this.formatDuration(elapsed);
                if (endEl) endEl.textContent = this.formatDuration(total);
            }

            if (this.activeGameTimestampStart) {
                const elapsedGame = Math.max(0, now - this.activeGameTimestampStart);
                const badge = document.getElementById('rp-game-elapsed');
                if (badge) badge.textContent = this.formatDuration(elapsedGame);
            }
        }, 1000);
    },

    updatePresenceUI(data) {
        if (!data) return;
        this.lastPresenceData = data;

        const user = data.discord_user || {};
        const status = data.discord_status || "offline";

        if (user.id && user.avatar) {
            const ext = user.avatar.startsWith("a_") ? "gif" : "png";
            this.discordAvatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
            const dcPfp = document.getElementById('dc-live-pfp');
            if (dcPfp) dcPfp.src = this.discordAvatarUrl;

            const mainAvatar = document.getElementById('avatar-img');
            if (mainAvatar && !window._isFallen) {
                mainAvatar.src = this.discordAvatarUrl;
            }
        }

        const bannerWrap = document.getElementById('dc-banner-wrap');
        if (bannerWrap && user.id) {
            if (user.banner) {
                const bExt = user.banner.startsWith("a_") ? "gif" : "png";
                bannerWrap.style.backgroundImage = `url('https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${bExt}?size=600')`;
            } else if (data.kv && data.kv.banner) {
                bannerWrap.style.backgroundImage = `url('${data.kv.banner}')`;
            }
        }

        const dispNameEl = document.getElementById('dc-display-name');
        const userNameEl = document.getElementById('dc-username');
        if (dispNameEl) dispNameEl.textContent = user.global_name || user.display_name || user.username || "Saphyniel";
        if (userNameEl && user.username) userNameEl.textContent = `@${user.username}`;

        const statusMap = {
            online: { label: "EN LÍNEA", color: "#23a55a" },
            idle:   { label: "AUSENTE", color: "#f0b232" },
            dnd:    { label: "NO MOLESTAR", color: "#f23f43" },
            offline:{ label: "EN REPOSO", color: "#80848e" }
        };
        const stInfo = statusMap[status] || statusMap.offline;

        const stText = document.getElementById('rp-status-text');
        const stDot = document.getElementById('dc-status-dot');
        const stRing = document.getElementById('dc-status-ring');
        const footerHud = document.getElementById('discord-status-hud');

        if (stText) stText.textContent = stInfo.label;
        if (stDot) {
            stDot.style.background = stInfo.color;
            stDot.style.boxShadow = status !== 'offline' ? `0 0 8px ${stInfo.color}` : 'none';
        }
        if (stRing) stRing.setAttribute('data-status', status);
        if (footerHud) {
            const firstSpan = footerHud.querySelector('span');
            if (firstSpan) firstSpan.textContent = `DISCORD: ${stInfo.label} // BITÁCORA PERSONAL`;
        }

        document.getElementById('badge-desktop')?.classList.toggle('active', !!data.active_on_discord_desktop);
        document.getElementById('badge-mobile')?.classList.toggle('active', !!data.active_on_discord_mobile);
        document.getElementById('badge-web')?.classList.toggle('active', !!data.active_on_discord_web);

        const activities = Array.isArray(data.activities) ? data.activities : [];

        const customAct = activities.find(a => a.type === 4);
        const customBox = document.getElementById('dc-custom-status');
        if (customBox) {
            if (customAct && customAct.state) {
                customBox.style.display = 'flex';
                const textEl = document.getElementById('dc-custom-text');
                if (textEl) textEl.textContent = customAct.state;
            } else {
                customBox.style.display = 'none';
            }
        }

        // Actividad de Juego (Simultánea con Spotify)
        const gameAct = activities.find(a => a.type !== 4 && a.id !== "spotify:1" && a.name !== "Spotify");
        const gameBox = document.getElementById('rp-game-box');
        if (gameBox) {
            if (gameAct) {
                gameBox.style.display = 'flex';
                const gTitle = document.getElementById('rp-game-title');
                const gSub = document.getElementById('rp-game-subtitle');
                const gLabel = document.getElementById('rp-game-label');
                const gArt = document.getElementById('rp-game-art');
                const gSmallArt = document.getElementById('rp-game-small-art');

                const typeLabels = { 0: "❖ JUGANDO AHORA", 1: "❖ TRANSMITIENDO", 2: "❖ ESCUCHANDO", 3: "❖ VIENDO", 5: "❖ EN PARTIDA" };
                if (gLabel) gLabel.textContent = typeLabels[gameAct.type] || "❖ ACTIVIDAD EN CURSO";
                if (gTitle) gTitle.textContent = gameAct.name || "Actividad";

                const detailsParts = [gameAct.details, gameAct.state].filter(Boolean);
                if (gSub) gSub.textContent = detailsParts.length > 0 ? detailsParts.join(" • ") : "Sesión activa";

                if (gArt) {
                    if (gameAct.assets && gameAct.assets.large_image) {
                        gArt.src = this.resolveActivityImage(gameAct.application_id, gameAct.assets.large_image);
                    } else if (gameAct.application_id) {
                        gArt.src = `https://dcdn.dstn.to/app-icons/${gameAct.application_id}.png`;
                    } else {
                        gArt.src = "img/icons/icon.png";
                    }
                    gArt.style.display = 'block';
                }

                if (gSmallArt) {
                    if (gameAct.assets && gameAct.assets.small_image) {
                        gSmallArt.src = this.resolveActivityImage(gameAct.application_id, gameAct.assets.small_image);
                        gSmallArt.style.display = 'block';
                    } else {
                        gSmallArt.style.display = 'none';
                    }
                }

                if (gameAct.timestamps && gameAct.timestamps.start) {
                    this.activeGameTimestampStart = gameAct.timestamps.start;
                } else {
                    this.activeGameTimestampStart = null;
                    const badge = document.getElementById('rp-game-elapsed');
                    if (badge) badge.textContent = "ACTIVO";
                }
            } else {
                gameBox.style.display = 'none';
                this.activeGameTimestampStart = null;
            }
        }

        // Spotify (Simultáneo con Juego)
        const spBox = document.getElementById('rp-spotify-box');
        const spVis = document.getElementById('rp-visualizer');
        if (spBox) {
            if (data.listening_to_spotify && data.spotify) {
                const sp = data.spotify;
                spBox.style.display = 'flex';
                if (spVis) spVis.style.display = 'flex';

                const sTitle = document.getElementById('rp-title');
                const sSub = document.getElementById('rp-subtitle');
                const sArt = document.getElementById('rp-art');

                if (sTitle) sTitle.textContent = sp.song || "Pista desconocida";
                if (sSub) sSub.textContent = `${sp.artist || "Artista"}${sp.album ? ` — ${sp.album}` : ""}`;
                if (sArt && sp.album_art_url) {
                    sArt.src = sp.album_art_url;
                    sArt.style.display = 'block';
                }
                this.activeSpotifyTimestamps = sp.timestamps || null;
            } else {
                spBox.style.display = 'none';
                if (spVis) spVis.style.display = 'none';
                this.activeSpotifyTimestamps = null;
            }
        }

        const idleBox = document.getElementById('rp-idle-box');
        if (idleBox) {
            const anyActive = (!!gameAct) || (!!(data.listening_to_spotify && data.spotify));
            idleBox.style.display = anyActive ? 'none' : 'flex';
        }
    }
};

window.LanyardModule = LanyardModule;