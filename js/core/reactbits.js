// =========================================================
// REACT BITS VISUAL SUITE (VANILLA JS / WEBGL-READY CANVAS)
// Incluye: ASCII Text (reactbits.dev/text-animations/ascii-text),
// Spotlight Cards, 3D Tilted Cards con Glare, Magnetic UI y Click Sparks
// =========================================================

const AsciiTextEngine = {
    canvas: null,
    ctx: null,
    offCanvas: null,
    offCtx: null,
    text: "SAPHYNIEL",
    chars: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    compactChars: " ·:;+*?%S#@",
    mouse: { x: -999, y: -999, active: false },
    animId: null,
    time: 0,
    isFallen: false,

    init(canvasId = 'ascii-text-canvas', initialText = 'SAPHYNIEL') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.offCanvas = document.createElement('canvas');
        this.offCtx = this.offCanvas.getContext('2d', { willReadFrequently: true });
        this.text = initialText;

        const bindPointer = (clientX, clientY) => {
            const r = this.canvas.getBoundingClientRect();
            this.mouse.x = clientX - r.left;
            this.mouse.y = clientY - r.top;
            this.mouse.active = true;
        };

        this.canvas.addEventListener('mousemove', (e) => bindPointer(e.clientX, e.clientY));
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches[0]) bindPointer(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        this.canvas.addEventListener('mouseleave', () => { this.mouse.active = false; });
        this.canvas.addEventListener('touchend', () => { this.mouse.active = false; });

        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.start();
    },

    setText(newText, fallenMode = false) {
        this.text = newText || "SAPHYNIEL";
        this.isFallen = fallenMode;
        this.sampleTextBuffer();
    },

    resize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        const w = Math.max(240, Math.min(440, (parent ? parent.clientWidth : 320)));
        const h = window.innerWidth <= 680 ? 54 : 66;
        const dpr = Math.min(2, window.devicePixelRatio || 1);

        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.logicalW = w;
        this.logicalH = h;
        this.sampleTextBuffer();
    },

    sampleTextBuffer() {
        if (!this.offCanvas || !this.logicalW) return;
        const cols = Math.floor(this.logicalW / 4.2);
        const rows = Math.floor(this.logicalH / 5.2);
        this.cols = Math.max(40, cols);
        this.rows = Math.max(8, rows);

        this.offCanvas.width = this.cols;
        this.offCanvas.height = this.rows;

        const octx = this.offCtx;
        octx.clearRect(0, 0, this.cols, this.rows);
        octx.fillStyle = '#000';
        octx.fillRect(0, 0, this.cols, this.rows);

        let fontSize = Math.floor(this.rows * 0.82);
        octx.font = `900 ${fontSize}px "Cinzel", "Rajdhani", sans-serif`;
        while (octx.measureText(this.text).width > this.cols * 0.92 && fontSize > 6) {
            fontSize--;
            octx.font = `900 ${fontSize}px "Cinzel", "Rajdhani", sans-serif`;
        }

        octx.fillStyle = '#fff';
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(this.text, this.cols / 2, this.rows / 2 + 0.5);

        this.pixelData = octx.getImageData(0, 0, this.cols, this.rows).data;
    },

    start() {
        if (this.animId) cancelAnimationFrame(this.animId);
        const loop = () => {
            this.render();
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    },

    render() {
        if (window._bossActive || !this.ctx || !this.pixelData) return;
        this.time += 0.045;

        const ctx = this.ctx;
        const w = this.logicalW;
        const h = this.logicalH;
        ctx.clearRect(0, 0, w, h);

        const cellW = w / this.cols;
        const cellH = h / this.rows;
        const charSet = this.compactChars;
        const charLen = charSet.length - 1;

        const isSanctuaryS = document.body.classList.contains('sanctuary-s-theme');
        const isSanctuaryE = document.body.classList.contains('sanctuary-e-theme');

        ctx.font = `bold ${Math.max(6, Math.floor(cellH * 1.08))}px "Share Tech Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const idx = (y * this.cols + x) * 4;
                const brightness = this.pixelData[idx] / 255;

                const px = x * cellW + cellW * 0.5;
                const py = y * cellH + cellH * 0.5;

                let wave = Math.sin(x * 0.18 + this.time) * Math.cos(y * 0.25 - this.time * 0.8) * 0.15;
                let dx = 0, dy = 0, mouseBoost = 0;

                if (this.mouse.active) {
                    const dist = Math.hypot(px - this.mouse.x, py - this.mouse.y);
                    if (dist < 64) {
                        const force = (1 - dist / 64);
                        const ang = Math.atan2(py - this.mouse.y, px - this.mouse.x);
                        dx = Math.cos(ang) * force * 4.5;
                        dy = Math.sin(ang) * force * 4.5;
                        mouseBoost = force * 0.45;
                    }
                }

                if (brightness > 0.12) {
                    const val = Math.min(1, Math.max(0.15, brightness + wave + mouseBoost));
                    const cIdx = Math.min(charLen, Math.max(1, Math.floor(val * charLen)));
                    const ch = charSet[cIdx];

                    if (this.isFallen) {
                        ctx.fillStyle = val > 0.78 ? '#ff5238' : '#b82828';
                    } else if (isSanctuaryS) {
                        ctx.fillStyle = val > 0.75 ? '#b58d28' : '#2c2a26';
                    } else if (isSanctuaryE) {
                        ctx.fillStyle = val > 0.75 ? '#ffffff' : '#e5c158';
                    } else {
                        ctx.fillStyle = val > 0.82 ? '#ffffff' : (val > 0.5 ? '#dad4bb' : '#8b8778');
                    }
                    ctx.fillText(ch, px + dx, py + dy);
                } else if (this.mouse.active && mouseBoost > 0.18 && (x + y) % 3 === 0) {
                    ctx.fillStyle = this.isFallen ? 'rgba(217, 56, 30, 0.28)' : 'rgba(229, 193, 88, 0.22)';
                    ctx.fillText('·', px, py);
                }
            }
        }
    }
};

const ReactBitsUI = {
    sparks: [],
    sparkCanvas: null,
    sparkCtx: null,

    init() {
        this.initSpotlightCards();
        this.initTiltedCards();
        this.initMagneticButtons();
        this.initClickSparks();
        AsciiTextEngine.init('ascii-text-canvas', 'SAPHYNIEL');
    },

    initSpotlightCards() {
        document.addEventListener('pointermove', (e) => {
            if (window._bossActive) return;
            const cards = document.querySelectorAll('.spotlight-card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                if (
                    e.clientX >= rect.left - 80 && e.clientX <= rect.right + 80 &&
                    e.clientY >= rect.top - 80 && e.clientY <= rect.bottom + 80
                ) {
                    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                }
            });
        }, { passive: true });
    },

    initTiltedCards() {
        document.querySelectorAll('.rb-tilted-card').forEach(card => {
            card.addEventListener('pointermove', (e) => {
                if (window.innerWidth <= 768) return;
                const r = card.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const cx = r.width / 2;
                const cy = r.height / 2;
                const rotX = ((y - cy) / cy) * -6.5;
                const rotY = ((x - cx) / cx) * 6.5;

                card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
                card.style.setProperty('--glare-x', `${(x / r.width) * 100}%`);
                card.style.setProperty('--glare-y', `${(y / r.height) * 100}%`);
                card.style.setProperty('--glare-opacity', '0.26');
            });

            card.addEventListener('pointerleave', () => {
                card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                card.style.setProperty('--glare-opacity', '0');
            });
        });
    },

    initMagneticButtons() {
        document.querySelectorAll('.rb-magnetic').forEach(el => {
            el.addEventListener('pointermove', (e) => {
                if (window.innerWidth <= 768) return;
                const r = el.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
                const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
                el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
            });
            el.addEventListener('pointerleave', () => {
                el.style.transform = 'translate(0px, 0px)';
            });
        });
    },

    initClickSparks() {
        window.addEventListener('pointerdown', (e) => {
            if (window._bossActive) return;
            const rays = 8;
            for (let i = 0; i < rays; i++) {
                const angle = (Math.PI * 2 * i) / rays + (Math.random() - 0.5) * 0.2;
                this.sparks.push({
                    x: e.clientX,
                    y: e.clientY,
                    angle,
                    dist: 2,
                    speed: 2.6 + Math.random() * 1.4,
                    len: 9 + Math.random() * 5,
                    alpha: 1.0
                });
            }
        }, { passive: true });

        const stepSparks = () => {
            if (!window._bossActive && typeof ParticleEngine !== 'undefined' && ParticleEngine.ctx && this.sparks.length > 0) {
                const ctx = ParticleEngine.ctx;
                ctx.save();
                ctx.strokeStyle = '#e5c158';
                ctx.lineWidth = 1.6;
                for (let i = this.sparks.length - 1; i >= 0; i--) {
                    const s = this.sparks[i];
                    s.dist += s.speed;
                    s.alpha -= 0.06;
                    if (s.alpha <= 0) {
                        this.sparks.splice(i, 1);
                        continue;
                    }
                    ctx.globalAlpha = Math.max(0, s.alpha);
                    const x1 = s.x + Math.cos(s.angle) * s.dist;
                    const y1 = s.y + Math.sin(s.angle) * s.dist;
                    const x2 = s.x + Math.cos(s.angle) * (s.dist + s.len * s.alpha);
                    const y2 = s.y + Math.sin(s.angle) * (s.dist + s.len * s.alpha);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                ctx.restore();
            }
            requestAnimationFrame(stepSparks);
        };
        requestAnimationFrame(stepSparks);
    }
};

window.AsciiTextEngine = AsciiTextEngine;
window.ReactBitsUI = ReactBitsUI;