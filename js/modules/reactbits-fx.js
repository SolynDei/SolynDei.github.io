window.ReactBitsFX = {
    rafId: null, canvas: null, ctx: null, mouse: { x: -999, y: -999 }, initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.canvas = document.getElementById("fx-grid-canvas");
        if (this.canvas) this.ctx = this.canvas.getContext("2d");
        this.bindInteractive();
        window.addEventListener("resize", () => this.resize(), { passive: true });
        this.resize();
        if (!document.body.classList.contains("perf-lite")) this.start();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    start() {
        if (this.rafId || document.body.classList.contains("perf-lite") || window.innerWidth < 960) return;
        const loop = () => {
            if (document.body.classList.contains("perf-lite") || window.innerWidth < 960) { this.stop(); return; }
            this.drawSquares();
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    },

    stop() {
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawSquares() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.mouse.x < 0) return;
        const size = 42;
        const gx = Math.floor(this.mouse.x / size) * size;
        const gy = Math.floor(this.mouse.y / size) * size;
        const isInv = document.body.classList.contains("theme-invert");
        const isRed = document.body.classList.contains("easter-alert");
        ctx.fillStyle = isRed ? "rgba(255,56,71,0.2)" : (isInv ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)");
        ctx.fillRect(gx, gy, size, size);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.strokeRect(gx - size, gy, size, size);
        ctx.strokeRect(gx + size, gy, size, size);
        ctx.strokeRect(gx, gy - size, size, size);
        ctx.strokeRect(gx, gy + size, size, size);
    },

    decrypt(el, duration = 360) {
        if (!el || document.body.classList.contains("perf-lite")) return;
        const target = el.getAttribute("data-text") || el.textContent;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/[]_#<>";
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const done = Math.floor(p * target.length);
            let out = "";
            for (let i = 0; i < target.length; i++) {
                out += (i < done || target[i] === " ") ? target[i] : chars[Math.floor(Math.random() * chars.length)];
            }
            el.textContent = out;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        };
        requestAnimationFrame(tick);
    },

    runDecryptAll(scope = document) {
        if (document.body.classList.contains("perf-lite")) return;
        scope.querySelectorAll(".rb-decrypt").forEach((el) => this.decrypt(el, 380));
    },

    bindInteractive() {
        document.addEventListener("pointermove", (e) => {
            if (document.body.classList.contains("perf-lite") || window.innerWidth < 960) return;
            this.mouse.x = e.clientX; this.mouse.y = e.clientY;
            const spot = e.target.closest(".rb-spotlight");
            if (spot) {
                const r = spot.getBoundingClientRect();
                spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
                spot.style.setProperty("--my", `${e.clientY - r.top}px`);
            }
        }, { passive: true });

        document.addEventListener("click", (e) => {
            if (document.body.classList.contains("perf-lite") || window.innerWidth < 960) return;
            for (let i = 0; i < 6; i++) {
                const dot = document.createElement("span");
                dot.className = "click-spark-dot";
                dot.style.left = `${e.clientX - 3}px`; dot.style.top = `${e.clientY - 3}px`;
                document.body.appendChild(dot);
                const ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.3;
                const d = 18 + Math.random() * 16;
                dot.animate([
                    { transform: "translate(0,0) scale(1)", opacity: 0.9 },
                    { transform: `translate(${Math.cos(ang)*d}px,${Math.sin(ang)*d}px) scale(0.1)`, opacity: 0 }
                ], { duration: 300, easing: "cubic-bezier(0.16,1,0.3,1)" }).onfinish = () => dot.remove();
            }
        });
    },

    renderStickers(stickers = []) {
        const layer = document.getElementById("floating-stickers-layer");
        if (!layer) return;
        layer.innerHTML = "";
        stickers.forEach((st) => {
            if (!st.src) return;
            const img = document.createElement("img");
            img.src = st.src; img.alt = ""; img.className = "floating-sticker";
            if (st.top) img.style.top = st.top;
            if (st.bottom) img.style.bottom = st.bottom;
            if (st.left) img.style.left = st.left;
            if (st.right) img.style.right = st.right;
            img.style.width = st.width || "64px";
            img.style.setProperty("--float-dur", st.duration || "6s");
            layer.appendChild(img);
        });
    }
};