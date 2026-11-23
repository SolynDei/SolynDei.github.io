window.MusicPlayer = {
    tracks: [],
    index: 0,
    audio: null,

    init() {
        this.tracks = window.SITE_CONFIG?.playlist || [];
        this.audio = document.getElementById("bg-audio-el");
        if (!this.audio || this.tracks.length === 0) return;

        this.audio.volume = 0.45;
        this.renderPlaylist();
        this.loadTrack(0, false);

        document.getElementById("music-play")?.addEventListener("click", () => this.togglePlay());
        document.getElementById("music-prev")?.addEventListener("click", () => this.prev());
        document.getElementById("music-next")?.addEventListener("click", () => this.next());

        const vol = document.getElementById("music-vol");
        if (vol) {
            vol.addEventListener("input", () => { this.audio.volume = parseFloat(vol.value); });
        }

        const seek = document.getElementById("music-seek");
        if (seek) {
            seek.addEventListener("input", () => {
                if (this.audio.duration) {
                    this.audio.currentTime = (parseFloat(seek.value) / 100) * this.audio.duration;
                }
            });
        }

        this.audio.addEventListener("timeupdate", () => this.updateProgress());
        this.audio.addEventListener("ended", () => this.next(true));
        this.audio.addEventListener("play", () => this.syncPlayBtn(true));
        this.audio.addEventListener("pause", () => this.syncPlayBtn(false));
    },

    renderPlaylist() {
        const list = document.getElementById("music-playlist");
        if (!list) return;
        list.innerHTML = "";
        this.tracks.forEach((tr, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "playlist-row" + (i === this.index ? " active" : "");
            btn.innerHTML = `<span>${String(i + 1).padStart(2, "0")}. ${tr.title}</span><span>▶</span>`;
            btn.addEventListener("click", () => this.loadTrack(i, true));
            list.appendChild(btn);
        });
    },

    loadTrack(idx, autoPlay = false) {
        this.index = (idx + this.tracks.length) % this.tracks.length;
        const tr = this.tracks[this.index];
        this.audio.src = tr.src;

        document.getElementById("music-track-title").textContent = tr.title;
        document.getElementById("music-track-artist").textContent = tr.artist || "ARCHIVE";
        document.getElementById("music-track-index").textContent =
            `TRK ${String(this.index + 1).padStart(2, "0")}/${String(this.tracks.length).padStart(2, "0")}`;

        document.querySelectorAll(".playlist-row").forEach((el, i) => {
            el.classList.toggle("active", i === this.index);
        });

        if (autoPlay) {
            this.audio.play().catch(() => {});
        }
    },

    togglePlay() {
        if (this.audio.paused) this.audio.play().catch(() => {});
        else this.audio.pause();
    },

    pause() {
        if (this.audio && !this.audio.paused) this.audio.pause();
    },

    prev() { this.loadTrack(this.index - 1, !this.audio.paused); },
    next(forcePlay = false) { this.loadTrack(this.index + 1, forcePlay || !this.audio.paused); },

    syncPlayBtn(isPlaying) {
        const btn = document.getElementById("music-play");
        const tag = document.getElementById("player-state-tag");
        if (btn) btn.textContent = isPlaying ? "❚❚ PAUSE" : "▶ PLAY";
        if (tag) tag.textContent = isPlaying ? "PLAYING" : "PAUSE";
    },

    updateProgress() {
        const cur = this.audio.currentTime || 0;
        const dur = this.audio.duration || 0;
        const seek = document.getElementById("music-seek");
        if (seek && dur > 0) seek.value = (cur / dur) * 100;
        document.getElementById("music-time-cur").textContent = this.fmt(cur);
        document.getElementById("music-time-dur").textContent = this.fmt(dur);
    },

    fmt(sec) {
        if (!isFinite(sec)) return "00:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
};