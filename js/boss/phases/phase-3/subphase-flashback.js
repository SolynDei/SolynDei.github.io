// =========================================================
// PROYECTOR DE CINE ANTIGUO 35MM Y TEATRO DE RECUERDOS
// Usa el icono de núcleo (img/icons/icon.png), core.png y la Nave YoRHa
// =========================================================
const SubphaseFlashback = {
    canvas: null,
    ctx: null,
    startTime: 0,
    duration: 12500,
    iconImg: null,
    coreImg: null,
    simBullets: [],
    simBombs: [],
    lastSimShot: 0,
    lastSimBomb: 0,

    enter() {
        this.canvas = document.getElementById('flashback-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.opacity = '1';

        this.startTime = performance.now();
        // REQUERIMIENTO: Usar img/icons/icon.png en lugar de un retrato
        this.iconImg = new Image();
        this.iconImg.src = "img/icons/icon.png";
        this.coreImg = new Image();
        this.coreImg.src = "img/boss/core.png";

        this.simBullets = [];
        this.simBombs = [];
        this.lastSimShot = 0;
        this.lastSimBomb = 0;

        BossAttacks.clearAll();
        document.body.classList.add('cinema-wide-bars');
        DialogueSystem.hide();
    },

    update(currentTime) {
        if (!this.canvas || !this.ctx) return;
        const now = performance.now();
        const elapsed = now - this.startTime;
        if (elapsed > this.duration) {
            this.exit();
            return;
        }

        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;
        const t = elapsed * 0.001;

        const flicker = 0.92 + Math.random() * 0.08;
        ctx.fillStyle = `rgba(18, 14, 10, ${0.38 * flicker})`;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        const jitterX = (Math.random() - 0.5) * 3;
        const jitterY = (Math.random() - 0.5) * 3;
        ctx.translate(jitterX, jitterY);

        // Emblema central del núcleo (img/icons/icon.png) girando lentamente en el teatro antiguo
        if (this.iconImg && this.iconImg.complete) {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(t * 0.18);
            ctx.globalAlpha = 0.22 * flicker;
            const imgSize = Math.min(w, h) * 0.48;
            ctx.drawImage(this.iconImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
            ctx.restore();
        }

        const bossX = w * 0.5 + Math.sin(t * 1.7) * (w * 0.22);
        const bossY = h * 0.32 + Math.cos(t * 2.3) * (h * 0.08);

        const shipX = w * 0.5 + Math.sin(t * 2.6 + 1.2) * (w * 0.28);
        const shipY = h * 0.72 + Math.sin(t * 3.1) * (h * 0.07);

        ctx.save();
        ctx.translate(bossX, bossY);
        ctx.strokeStyle = 'rgba(218, 212, 187, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 48 + Math.sin(t * 6) * 5, 0, Math.PI * 2);
        ctx.stroke();
        if (this.coreImg && this.coreImg.complete) {
            ctx.globalAlpha = 0.85;
            ctx.drawImage(this.coreImg, -38, -38, 76, 76);
        }
        ctx.restore();

        if (now - this.lastSimShot > 140) {
            this.lastSimShot = now;
            const ang = Math.atan2(bossY - shipY, bossX - shipX);
            this.simBullets.push({
                x: shipX, y: shipY,
                vx: Math.cos(ang) * 14, vy: Math.sin(ang) * 14,
                fromShip: true
            });
            if (Math.random() < 0.45) {
                const bAng = Math.atan2(shipY - bossY, shipX - bossX) + (Math.random() - 0.5) * 0.8;
                this.simBullets.push({
                    x: bossX, y: bossY,
                    vx: Math.cos(bAng) * 6, vy: Math.sin(bAng) * 6,
                    fromShip: false
                });
            }
        }

        if (now - this.lastSimBomb > 1100) {
            this.lastSimBomb = now;
            this.simBombs.push({
                x: w * (0.2 + Math.random() * 0.6),
                y: h * (0.25 + Math.random() * 0.45),
                r: 5,
                maxR: 42 + Math.random() * 25,
                alpha: 0.85
            });
        }

        for (let i = this.simBombs.length - 1; i >= 0; i--) {
            const b = this.simBombs[i];
            b.r += 1.2;
            b.alpha -= 0.022;
            ctx.save();
            ctx.strokeStyle = `rgba(218, 212, 187, ${Math.max(0, b.alpha)})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            if (b.alpha <= 0) this.simBombs.splice(i, 1);
        }

        for (let i = this.simBullets.length - 1; i >= 0; i--) {
            const sb = this.simBullets[i];
            sb.x += sb.vx;
            sb.y += sb.vy;
            ctx.save();
            ctx.fillStyle = sb.fromShip ? '#f5ecd5' : '#c99e67';
            ctx.beginPath();
            ctx.arc(sb.x, sb.y, sb.fromShip ? 3.5 : 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (sb.y < 0 || sb.y > h || sb.x < 0 || sb.x > w) {
                this.simBullets.splice(i, 1);
            }
        }

        const aimAngle = Math.atan2(bossY - shipY, bossX - shipX);
        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.rotate(aimAngle + Math.PI / 2);
        ctx.strokeStyle = '#f5ecd5';
        ctx.fillStyle = 'rgba(218, 212, 187, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(14, 12);
        ctx.lineTo(0, 7);
        ctx.lineTo(-14, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = 'rgba(235, 220, 190, 0.22)';
        ctx.lineWidth = 1;
        for (let s = 0; s < 3; s++) {
            const sx = Math.random() * w;
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx + (Math.random() - 0.5) * 8, h);
            ctx.stroke();
        }

        ctx.fillStyle = '#050403';
        ctx.fillRect(0, 0, 44, h);
        ctx.fillRect(w - 44, 0, 44, h);

        ctx.fillStyle = 'rgba(218, 212, 187, 0.55)';
        const holeOffset = (elapsed * 0.18) % 40;
        for (let y = -40 + holeOffset; y < h; y += 40) {
            ctx.fillRect(12, y, 18, 24);
            ctx.fillRect(w - 30, y, 18, 24);
        }

        ctx.fillStyle = 'rgba(218, 212, 187, 0.85)';
        ctx.font = '14px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`PROYECTOR DE MEMORIA // CINTA 35MM [T+${elapsed.toFixed(0)}ms]`, 64, h * 0.18);

        ctx.restore();
    },

    exit() {
        if (this.canvas && this.ctx) {
            this.canvas.style.opacity = '0';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        document.body.classList.remove('cinema-wide-bars');
    }
};