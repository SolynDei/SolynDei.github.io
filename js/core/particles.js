class PixelParticle {
    constructor(x, y, col, vx, vy, decay = 0.025, size = 4) {
        this.x = x; this.y = y; this.size = size || (Math.random() * 4 + 2);
        this.vx = vx !== undefined ? vx : (Math.random() - 0.5) * 14;
        this.vy = vy !== undefined ? vy : (Math.random() - 0.5) * 14;
        this.life = 1.0; this.decay = decay || (Math.random() * 0.03 + 0.015); this.color = col;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

class WhitePetalEntity {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * -window.innerHeight;
        this.size = Math.random() * 4 + 3;
        this.vx = Math.sin(Math.random() * 3) * 0.8;
        this.vy = Math.random() * 1.5 + 1.0;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.04;
        this.alpha = Math.random() * 0.5 + 0.35;
        this.wobble = Math.random() * 10;
    }
    update() {
        this.wobble += 0.02;
        this.x += this.vx + Math.sin(this.wobble) * 0.6;
        this.y += this.vy;
        this.rotation += this.vRot;
        if (this.y > window.innerHeight + 20) {
            this.y = -20;
            this.x = Math.random() * window.innerWidth;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + this.alpha + ')';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class HolySwordEntity {
    constructor(x) { this.x = x; this.y = -100; this.vy = 28; this.done = false; }
    update() {
        this.y += this.vy;
        if (this.y > window.innerHeight * 0.55) {
            this.done = true; ParticleEngine.explode(this.x, this.y, '#ffffff', 40);
            if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake('main-hud');
            if (typeof AudioManager !== 'undefined') AudioManager.swordImpactSound();
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#dad4bb'; ctx.shadowBlur = 18;
        ctx.fillRect(this.x - 3, this.y, 6, 80); ctx.fillRect(this.x - 14, this.y + 20, 28, 6);
        ctx.restore();
    }
}

const ParticleEngine = {
    canvas: null, ctx: null, particles: [], swords: [], petals: [],
    running: true, animId: null, customOverlayRender: null,

    init(canvasId = 'particle-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.running = true;
        if (this.animId) cancelAnimationFrame(this.animId);
        this.animate();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    pause() {
        this.running = false;
        if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = [];
        this.swords = [];
    },

    resume() {
        this.running = true;
        if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
        this.animate();
    },

    startPetalRain(count = 35) {
        this.petals = [];
        const total = window.innerWidth <= 680 ? Math.floor(count / 2) : count;
        for (let i = 0; i < total; i++) this.petals.push(new WhitePetalEntity());
    },

    explode(x, y, color = '#dad4bb', count = 18) {
        if (!this.running) return;
        const finalCount = window.innerWidth <= 680 ? Math.min(count, 6) : count;
        for (let i = 0; i < finalCount; i++) this.particles.push(new PixelParticle(x, y, color));
    },

    spawnSword(x) {
        if (!this.running) return;
        this.swords.push(new HolySwordEntity(x));
    },

    rainBlessing() {
        if (!this.running) return;
        const limit = window.innerWidth <= 680 ? 15 : 45;
        for (let i = 0; i < limit; i++) {
            this.particles.push(new PixelParticle(Math.random() * window.innerWidth, Math.random() * -200, '#ffffff', (Math.random() - 0.5) * 1.5, Math.random() * 3 + 2, 0.006, 3));
        }
    },

    animate() {
        if (!this.running) return;
        // Programar siempre el siguiente fotograma primero para que ningún error detenga el motor
        this.animId = requestAnimationFrame(() => this.animate());

        if (this.ctx && this.canvas) {
            try {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                for (let i = this.petals.length - 1; i >= 0; i--) {
                    this.petals[i].update();
                    this.petals[i].draw(this.ctx);
                }
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    this.particles[i].update();
                    this.particles[i].draw(this.ctx);
                    if (this.particles[i].life <= 0) this.particles.splice(i, 1);
                }
                for (let i = this.swords.length - 1; i >= 0; i--) {
                    this.swords[i].update();
                    this.swords[i].draw(this.ctx);
                    if (this.swords[i].done) this.swords.splice(i, 1);
                }
                if (typeof this.customOverlayRender === 'function') {
                    this.customOverlayRender(this.ctx);
                }
            } catch (err) {
                console.error("[ParticleEngine Render Error]:", err);
            }
        }
    }
};

const ScreenUtils = {
    triggerShake(targetId = null) {
        const el = targetId ? document.getElementById(targetId) : document.body;
        if (!el) return;
        el.classList.remove('shake-active');
        void el.offsetWidth;
        el.classList.add('shake-active');
        setTimeout(() => el.classList.remove('shake-active'), 180);
    }
};