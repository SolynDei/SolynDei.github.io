window.ArcadeHub = {
    init() {
        this.renderGrid();

        document.getElementById("quick-launch-boss")?.addEventListener("click", () => {
            const boss = (window.SITE_CONFIG?.arcade || []).find((g) => g.id === "saphyniel-bossfight");
            if (boss) this.launchGame(boss);
        });

        document.getElementById("game-stage-close")?.addEventListener("click", () => this.closeGame());

        // Escuchar salida o victoria desde boss.html
        window.addEventListener("message", (e) => {
            if (!e.data) return;
            if (e.data.type === "BOSS_DEFEATED" || e.data.type === "BOSS_SURRENDERED") {
                this.closeGame();
                window.ReworkApp?.toast(
                    e.data.type === "BOSS_DEFEATED" ? "ENCUENTRO COMPLETADO" : "REGRESASTE AL PERFIL"
                );
            }
        });
    },

    renderGrid() {
        const grid = document.getElementById("arcade-grid");
        const games = window.SITE_CONFIG?.arcade || [];
        if (!grid) return;
        grid.innerHTML = "";

        games.forEach((g) => {
            const card = document.createElement("article");
            card.className = "tac-window rb-spotlight";
            const isPlayable = g.type === "iframe" && g.src;

            card.innerHTML = `
                <div class="tac-window-header">
                    <span>${g.id.toUpperCase()}</span>
                    <span>${g.status || "MODULE"}</span>
                </div>
                <div class="arcade-card-body">
                    <div class="arcade-thumb">
                        <img src="${g.thumb || 'img/icons/icon.png'}" alt="${g.title}" onerror="this.src='img/icons/icon.png'">
                    </div>
                    <h3 class="arcade-title">${g.title}</h3>
                    <p class="arcade-desc">${g.description || ""}</p>
                    <div class="post-tags-row">
                        ${(g.tags || []).map((t) => `<span class="post-tag">${t}</span>`).join("")}
                    </div>
                    <button type="button" class="tac-btn ${isPlayable ? "primary" : ""}" ${isPlayable ? "" : "disabled"}>
                        ${isPlayable ? "EXECUTE ▶" : "EN CONSTRUCCIÓN"}
                    </button>
                </div>
            `;

            if (isPlayable) {
                card.querySelector("button")?.addEventListener("click", () => this.launchGame(g));
            }
            grid.appendChild(card);
        });
    },

    launchGame(game) {
        const overlay = document.getElementById("game-stage-overlay");
        const frame = document.getElementById("game-stage-frame");
        const title = document.getElementById("game-stage-title");
        if (!overlay || !frame) return;

        // Pausar música del perfil y canvas de fondo para dar 100% FPS al juego
        window.MusicPlayer?.pause();
        window.ReactBitsFX?.stop();

        if (title) title.textContent = `ARCADE // ${game.title}`;
        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        frame.onload = () => {
            if (game.sendStartMessage && frame.contentWindow) {
                frame.contentWindow.postMessage({ type: "START_BOSS" }, "*");
            }
            frame.focus();
        };
        frame.src = game.src;
    },

    closeGame() {
        const overlay = document.getElementById("game-stage-overlay");
        const frame = document.getElementById("game-stage-frame");
        if (!overlay || !frame) return;

        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        frame.src = "about:blank";
        document.body.style.overflow = "";

        if (!window.PerfMode?.isLite) {
            window.ReactBitsFX?.start();
        }
    }
};