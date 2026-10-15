// =========================================================
// SISTEMA DE ATAQUES YORHA:
// - Alejamiento de escala (0.68x) en Fase S para mayor amplitud
// - Espadas de luz largas que cruzan toda la arena de punta a punta
// - Bloqueos con escudo liberan mariposas en libertad (sin curar al boss)
// =========================================================
const BossAttacks = {
    qteSpawnerTimer: null,
    bombSpawnerTimer: null,
    danmakuSpawnerTimer: null,
    laserSpawnerTimer: null,
    patternSpawnerTimer: null,
    survivalTimer: null,
    swordBarrageTimer: null,
    clones: [],
    bullets: [],
    lasers: [],
    nodes: [],
    faithOrbs: [],
    judgmentSwords: [],
    lightSwords: [],
    uiBoxes: [],
    waterSanctuary: null,
    suctionParticles: [],
    spiralAngle: 0,
    swordImg: null,
    eyeImg: null,
    glowingSwordCanvas: null,

    getMobScale() {
        const mob = window.innerWidth <= 920 || ('ontouchstart' in window);
        if (typeof BossState !== 'undefined' && BossState.phase === 'S') {
            return mob ? 0.46 : 0.68; // Alejamiento de cámara en Fase S
        }
        return mob ? 0.58 : 1.0;
    },

    isMob() {
        return window.innerWidth <= 920 || ('ontouchstart' in window);
    },

    initAssets() {
        if (!this.swordImg) {
            this.swordImg = new Image();
            this.swordImg.onload = () => this.buildGlowingSwordSprite();
            this.swordImg.src = "img/icons/swordsprite.png";
        } else if (this.swordImg.complete && !this.glowingSwordCanvas && this.swordImg.naturalWidth > 0) {
            this.buildGlowingSwordSprite();
        }
        if (!this.eyeImg) {
            this.eyeImg = new Image();
            this.eyeImg.src = "img/icons/eye.png";
        }
    },

    buildGlowingSwordSprite() {
        try {
            const w = 64, h = 140, pad = 10;
            const silCanvas = document.createElement('canvas');
            silCanvas.width = w; silCanvas.height = h;
            const sCtx = silCanvas.getContext('2d');
            sCtx.drawImage(this.swordImg, pad, pad, w - pad * 2, h - pad * 2);
            sCtx.globalCompositeOperation = 'source-in';
            sCtx.fillStyle = '#f7f5ed';
            sCtx.fillRect(0, 0, w, h);

            const outCanvas = document.createElement('canvas');
            outCanvas.width = w; outCanvas.height = h;
            const oCtx = outCanvas.getContext('2d');
            oCtx.shadowColor = '#e5c158';
            oCtx.shadowBlur = 12;

            const offsets = [[-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5], [-2, -2], [2, -2], [-2, 2], [2, 2]];
            offsets.forEach(([ox, oy]) => oCtx.drawImage(silCanvas, ox, oy));

            oCtx.shadowBlur = 0;
            oCtx.drawImage(this.swordImg, pad, pad, w - pad * 2, h - pad * 2);
            this.glowingSwordCanvas = outCanvas;
        } catch (e) {
            this.glowingSwordCanvas = null;
        }
    },

    drawEnhancedSword(ctx, width = 46, height = 110) {
        this.initAssets();
        const sc = this.getMobScale();
        const w = width * sc;
        const h = height * sc;
        ctx.save();
        const grad = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
        grad.addColorStop(0, 'rgba(247, 245, 237, 0.95)');
        grad.addColorStop(0.5, 'rgba(229, 193, 88, 0.55)');
        grad.addColorStop(1, 'rgba(217, 56, 30, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.52);
        ctx.lineTo(w * 0.28, h * 0.25);
        ctx.lineTo(-w * 0.28, h * 0.25);
        ctx.closePath();
        ctx.fill();

        if (this.glowingSwordCanvas) {
            if (!this.isMob()) { ctx.shadowColor = '#f7f5ed'; ctx.shadowBlur = 14; }
            ctx.drawImage(this.glowingSwordCanvas, -w / 2, -h / 2, w, h);
        } else if (this.swordImg && this.swordImg.complete && this.swordImg.naturalWidth > 0) {
            ctx.drawImage(this.swordImg, -w / 2, -h / 2, w, h);
        } else {
            ctx.fillStyle = '#09090b';
            ctx.strokeStyle = '#f7f5ed';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.46);
            ctx.lineTo(8 * sc, h * 0.15);
            ctx.lineTo(-8 * sc, h * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    },

    getNonOverlappingCoords(marginVw = 18, marginVh = 22) {
        const minSafeDist = this.isMob() ? 145 : 220;
        let bestLeft = 50, bestTop = 30, maxDistFound = -1;

        for (let attempt = 0; attempt < 28; attempt++) {
            const left = Math.floor(Math.random() * (100 - marginVw * 2)) + marginVw;
            const top = Math.floor(Math.random() * (100 - marginVh * 2)) + marginVh;
            const px = (left / 100) * window.innerWidth;
            const py = (top / 100) * window.innerHeight;
            const distToShip = Math.hypot(px - (BossState.shipX || window.innerWidth / 2), py - (BossState.shipY || window.innerHeight * 0.75));

            if (distToShip >= minSafeDist) {
                return { left, top, x: px, y: py };
            }
            if (distToShip > maxDistFound) {
                maxDistFound = distToShip;
                bestLeft = left;
                bestTop = top;
            }
        }
        return {
            left: bestLeft,
            top: bestTop,
            x: (bestLeft / 100) * window.innerWidth,
            y: (bestTop / 100) * window.innerHeight
        };
    },

    // --- PUNTO 4: ESPADAS LARGAS QUE NACEN EN UN BORDE Y CRUZAN TODA LA ARENA ---
    spawnLightSword(originX, originY, targetX, targetY, speed = 13.5) {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        const sc = this.getMobScale();
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Proyectar el punto de origen hacia el borde exterior para que cruce de punta a punta
        const ang = Math.atan2(targetY - originY, targetX - originX);
        const diag = Math.hypot(w, h) + 220;

        // Si el origen estaba dentro de la pantalla, retrocederlo al borde para que cruce entera
        let startX = originX;
        let startY = originY;
        if (originX > 20 && originX < w - 20 && originY > 20 && originY < h - 20) {
            startX = targetX - Math.cos(ang) * (diag * 0.55);
            startY = targetY - Math.sin(ang) * (diag * 0.55);
        }

        this.lightSwords.push({
            x: startX,
            y: startY,
            vx: Math.cos(ang) * speed * (this.isMob() ? 0.85 : 1.0),
            vy: Math.sin(ang) * speed * (this.isMob() ? 0.85 : 1.0),
            angle: ang,
            warnTimer: 0.50,
            reflected: false,
            scale: sc,
            rayLength: diag * 1.25
        });
        if (typeof AudioManager !== 'undefined') AudioManager.beep(980, 0.04, 'triangle', 0.02);
    },

    // Ráfaga de múltiples espadas largas cruzando toda la arena desde los 4 bordes
    spawnArenaCrossingSwordVolley(count = 4, speed = 14.5) {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const finalCount = this.isMob() ? Math.max(2, Math.floor(count * 0.7)) : count;

        for (let i = 0; i < finalCount; i++) {
            setTimeout(() => {
                if (BossState.isDying || BossState.playerHp <= 0) return;
                const edge = (i + Math.floor(Math.random() * 4)) % 4;
                let ox, oy;
                if (edge === 0) { ox = Math.random() * w; oy = -90; }
                else if (edge === 1) { ox = w + 90; oy = Math.random() * h; }
                else if (edge === 2) { ox = Math.random() * w; oy = h + 90; }
                else { ox = -90; oy = Math.random() * h; }

                // La primera apunta directo a la nave; las demás abren abanico cruzando toda la pantalla
                const spread = i === 0 ? 0 : (i - (finalCount - 1) / 2) * 115;
                const tx = Math.max(60, Math.min(w - 60, BossState.shipX + spread));
                const ty = Math.max(80, Math.min(h - 60, BossState.shipY + (Math.random() - 0.5) * 90));
                this.spawnLightSword(ox, oy, tx, ty, speed);
            }, i * 95);
        }
    },

    drawShipStyledLightSword(ctx, ls) {
        const sc = ls.scale || this.getMobScale();
        ctx.save();
        ctx.translate(ls.x, ls.y);
        ctx.rotate(ls.angle + Math.PI / 2);
        ctx.scale(sc, sc);
        ctx.globalCompositeOperation = 'lighter';

        const mainCol = '#ffffff';
        const glowCol = '#ffd700';

        // Estela luminosa larga detrás de la espada (efecto de corte de punta a punta)
        const trailGrad = ctx.createLinearGradient(0, -105, 0, 190);
        trailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        trailGrad.addColorStop(0.4, 'rgba(229, 193, 88, 0.65)');
        trailGrad.addColorStop(1, 'rgba(229, 193, 88, 0.0)');
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(0, -105);
        ctx.lineTo(7, 185);
        ctx.lineTo(-7, 185);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = mainCol;
        ctx.strokeStyle = glowCol;
        ctx.lineWidth = 2;
        if (!this.isMob()) {
            ctx.shadowColor = glowCol;
            ctx.shadowBlur = 18;
        }

        // Hoja principal mucho más larga y estilizada (-105 a +42)
        ctx.beginPath();
        ctx.moveTo(0, -105);
        ctx.lineTo(9, 12);
        ctx.lineTo(3, 6);
        ctx.lineTo(0, 42);
        ctx.lineTo(-3, 6);
        ctx.lineTo(-9, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Guardamanos / Alas laterales de la espada
        ctx.beginPath();
        ctx.moveTo(4, -8);
        ctx.lineTo(28, -22);
        ctx.lineTo(14, 8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(-28, -22);
        ctx.lineTo(-14, 8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    },

    renderBossWingsAndEyes(ctx, dt) {
        const coreEl = document.getElementById('boss-core');
        if (!coreEl || coreEl.style.display === 'none' || BossState.isDying) return;
        this.initAssets();

        const sc = this.getMobScale();
        const core = BossState.getBossCoreCenter();
        const t = performance.now() * 0.001;
        const pulse = (typeof AudioManager !== 'undefined') ? AudioManager.getAudioPulse() : 0;

        ctx.save();
        ctx.translate(core.x, core.y);
        ctx.scale(sc, sc);

        if (BossState.phase >= 2 || BossState.phase === 'S' || this.suctionParticles.length > 0) {
            const isPhaseS = BossState.phase === 'S';
            const wingColor = isPhaseS ? 'rgba(255, 255, 255, 0.55)' : (BossState.phase === 3 ? 'rgba(247, 245, 237, 0.42)' : 'rgba(217, 56, 30, 0.42)');
            const strokeCol = isPhaseS ? '#e5c158' : (BossState.phase === 3 ? '#f7f5ed' : '#e5c158');
            const wingPairs = [
                { baseAng: -0.45, len: 135, flapSpeed: 2.2 },
                { baseAng: 0.05, len: 160, flapSpeed: 1.8 },
                { baseAng: 0.52, len: 120, flapSpeed: 2.6 }
            ];

            wingPairs.forEach((wp, idx) => {
                const flap = Math.sin(t * wp.flapSpeed + idx) * 0.14;
                const length = wp.len * (1 + pulse * 0.18);

                [-1, 1].forEach(dir => {
                    ctx.save();
                    ctx.scale(dir, 1);
                    ctx.rotate(wp.baseAng + flap);
                    ctx.fillStyle = wingColor;
                    ctx.strokeStyle = strokeCol;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.moveTo(28, 0);
                    ctx.lineTo(length, -18);
                    ctx.lineTo(length * 0.78, 14);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                });
            });
        }

        if ((BossState.phase >= 2 || BossState.phase === 'S') && this.eyeImg && this.eyeImg.complete) {
            const eyeCount = BossState.phase === 3 ? 6 : 4;
            const orbitRadius = 85 + Math.sin(t * 2.5) * 6;
            for (let i = 0; i < eyeCount; i++) {
                const ang = t * 1.1 + (Math.PI * 2 * i) / eyeCount;
                const ex = Math.cos(ang) * orbitRadius;
                const ey = Math.sin(ang) * orbitRadius;
                ctx.save();
                ctx.translate(ex, ey);
                ctx.globalAlpha = 0.8;
                ctx.drawImage(this.eyeImg, -13, -13, 26, 26);
                ctx.restore();
            }
        }

        if (BossState.phase === 3 && BossState.currentHp < BossState.maxHp) {
            const missingRatio = 1 - (BossState.currentHp / BossState.maxHp);
            const rays = Math.floor(missingRatio * 10);
            ctx.strokeStyle = '#f7f5ed';
            ctx.lineWidth = 2 + missingRatio * 2.5;
            for (let r = 0; r < rays; r++) {
                const rayAng = (Math.PI * 2 * r) / Math.max(1, rays) + t * 0.35;
                const rayLen = 40 + missingRatio * 95;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(rayAng) * (rayLen * 0.5), Math.sin(rayAng + 0.15) * (rayLen * 0.5));
                ctx.lineTo(Math.cos(rayAng) * rayLen, Math.sin(rayAng) * rayLen);
                ctx.stroke();
            }
        }

        ctx.restore();

        for (let i = this.suctionParticles.length - 1; i >= 0; i--) {
            const sp = this.suctionParticles[i];
            const dx = core.x - sp.x;
            const dy = core.y - sp.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 18) {
                this.suctionParticles.splice(i, 1);
                continue;
            }
            sp.x += (dx / dist) * sp.speed * (dt * 60);
            sp.y += (dy / dist) * sp.speed * (dt * 60);
            sp.speed += 0.35;

            ctx.save();
            ctx.fillStyle = sp.color;
            ctx.fillRect(sp.x - 2, sp.y - 2, 5 * sc, 5 * sc);
            ctx.restore();
        }
    },

    spawnSuctionParticles(count = 28) {
        const finalCount = this.isMob() ? Math.floor(count * 0.4) : count;
        for (let i = 0; i < finalCount; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 180 + Math.random() * 200;
            const core = BossState.getBossCoreCenter();
            this.suctionParticles.push({
                x: core.x + Math.cos(ang) * dist,
                y: core.y + Math.sin(ang) * dist,
                speed: 3.5 + Math.random() * 3,
                color: i % 2 === 0 ? '#f7f5ed' : '#d9381e'
            });
        }
    },

    spawnDanmakuRing(originX, originY, count = 12, speed = 3.2, pattern = 'ring') {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        if (BossState.damageLock && BossState.phase !== 3 && BossState.phase !== 'S') return;

        const mob = this.isMob();
        const sc = this.getMobScale();
        const finalCount = mob ? Math.max(5, Math.floor(count * 0.65)) : count;
        const finalSpeed = mob ? speed * 0.82 : speed;
        const baseAngle = Math.atan2(BossState.shipY - originY, BossState.shipX - originX);

        for (let i = 0; i < finalCount; i++) {
            const angle = pattern === 'aimed'
                ? baseAngle + (i - (finalCount - 1) / 2) * 0.18
                : (Math.PI * 2 * i) / finalCount + (performance.now() * 0.0012);
            const isLight = i % 2 === 0;
            this.bullets.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * finalSpeed,
                vy: Math.sin(angle) * finalSpeed,
                radius: 10 * sc,
                coreColor: isLight ? '#d9381e' : '#1c0d26',
                ringColor: isLight ? '#ff9e80' : '#b8325a',
                centerColor: isLight ? '#f7f5ed' : '#dad4bb'
            });
        }
        if (typeof AudioManager !== 'undefined') AudioManager.beep(240, 0.04, 'sawtooth', 0.02);
    },

    spawnSpiralVolley(arms = 3, bulletsPerArm = 2, speed = 3.4) {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        if (BossState.damageLock && BossState.phase !== 3 && BossState.phase !== 'S') return;
        const core = BossState.getBossCoreCenter();
        const sc = this.getMobScale();
        const finalSpeed = this.isMob() ? speed * 0.82 : speed;
        this.spiralAngle += 0.42;

        for (let a = 0; a < arms; a++) {
            const armAngle = this.spiralAngle + (Math.PI * 2 * a) / arms;
            for (let k = 0; k < bulletsPerArm; k++) {
                const spd = finalSpeed + k * 0.55;
                const isLight = (a + k) % 2 === 0;
                this.bullets.push({
                    x: core.x,
                    y: core.y,
                    vx: Math.cos(armAngle) * spd,
                    vy: Math.sin(armAngle) * spd,
                    radius: 9.5 * sc,
                    coreColor: isLight ? '#d9381e' : '#1c0d26',
                    ringColor: isLight ? '#ff9e80' : '#b8325a',
                    centerColor: '#f7f5ed'
                });
            }
        }
    },

    spawnAimedBurst() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        for (let w = 0; w < 3; w++) {
            setTimeout(() => {
                if (BossState.playerHp <= 0 || BossState.isDying) return;
                const core = BossState.getBossCoreCenter();
                this.spawnDanmakuRing(core.x, core.y, 5, 4.2 + w * 0.45, 'aimed');
            }, w * 180);
        }
    },

    spawnCurtainWall() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        const sc = this.getMobScale();
        const total = this.isMob() ? 12 : 18;
        const gapIndex = Math.floor(Math.random() * (total - 4)) + 2;
        const stepX = window.innerWidth / total;

        for (let i = 0; i <= total; i++) {
            if (Math.abs(i - gapIndex) <= 1) continue;
            this.bullets.push({
                x: i * stepX,
                y: 55,
                vx: 0,
                vy: this.isMob() ? 2.4 : 2.95,
                radius: 9.5 * sc,
                coreColor: '#1c0d26',
                ringColor: '#d9381e',
                centerColor: '#dad4bb'
            });
        }
        if (typeof AudioManager !== 'undefined') AudioManager.beep(190, 0.12, 'sawtooth', 0.03);
    },

    spawnPrismCageLasers(waves = 6) {
        if (BossState.isDying || BossState.playerHp <= 0) return;

        for (let w = 0; w < waves; w++) {
            setTimeout(() => {
                if (BossState.isDying || BossState.playerHp <= 0 || BossState.damageLock) return;
                if (typeof AudioManager !== 'undefined') AudioManager.laserChargeSound();

                let moveX = BossState.joyDx + (BossState.keys.d ? 1 : 0) - (BossState.keys.a ? 1 : 0);
                let moveY = BossState.joyDy + (BossState.keys.s ? 1 : 0) - (BossState.keys.w ? 1 : 0);

                const predictX = Math.max(60, Math.min(window.innerWidth - 60, BossState.shipX + moveX * 155));
                const predictY = Math.max(90, Math.min(window.innerHeight - 60, BossState.shipY + moveY * 155));

                const baseAng = Math.atan2(moveY || 0.5, moveX || 0.5);
                const angles = [baseAng + Math.PI / 2, baseAng + Math.PI / 4, baseAng - Math.PI / 4];

                angles.forEach((ang, i) => {
                    this.lasers.push({
                        x: i === 0 ? predictX : BossState.shipX + (Math.random() - 0.5) * 90,
                        y: i === 0 ? predictY : BossState.shipY + (Math.random() - 0.5) * 90,
                        angle: ang,
                        state: 'warn',
                        timer: 0,
                        warnDuration: 0.72,
                        fireDuration: 0.15,
                        hasDamaged: false
                    });
                });
            }, w * 620);
        }
    },

    spawnClockSweepLasers() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        if (typeof AudioManager !== 'undefined') AudioManager.laserChargeSound();
        const core = BossState.getBossCoreCenter();
        for (let step = 0; step < 6; step++) {
            setTimeout(() => {
                if (BossState.isDying || BossState.playerHp <= 0) return;
                const ang = (step * Math.PI) / 6;
                this.lasers.push({
                    x: core.x,
                    y: core.y,
                    angle: ang,
                    state: 'warn',
                    timer: 0,
                    warnDuration: 0.85,
                    fireDuration: 0.15,
                    hasDamaged: false
                });
            }, step * 210);
        }
    },

    spawnSacredCorridorLasers() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        if (typeof AudioManager !== 'undefined') AudioManager.laserChargeSound();
        const lanes = 5;
        const safeLane = Math.floor(Math.random() * lanes);
        const laneH = (window.innerHeight - 160) / lanes;

        for (let i = 0; i < lanes; i++) {
            if (i === safeLane) continue;
            this.lasers.push({
                x: window.innerWidth / 2,
                y: 100 + i * laneH + laneH / 2,
                angle: 0,
                state: 'warn',
                timer: 0,
                warnDuration: 1.0,
                fireDuration: 0.15,
                hasDamaged: false
            });
        }
    },

    spawnLaserGrid(count = 2) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.spawnTelegraphLaser(), i * 220);
        }
    },

    spawnTelegraphLaser() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        if (typeof AudioManager !== 'undefined') AudioManager.laserChargeSound();
        const yPos = BossState.shipY + (Math.random() - 0.5) * 150;
        const angle = (Math.random() - 0.5) * 0.65;
        this.lasers.push({
            x: window.innerWidth / 2,
            y: Math.max(100, Math.min(window.innerHeight - 100, yPos)),
            angle,
            state: 'warn',
            timer: 0,
            warnDuration: 0.95,
            fireDuration: 0.15,
            hasDamaged: false
        });
    },

    startWaterSanctuaryCycle() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        this.bullets = [];

        const radius = this.isMob() ? 58 : 88;
        const sx = window.innerWidth / 2;
        const sy = window.innerHeight / 2;

        this.waterSanctuary = {
            x: sx,
            y: sy,
            radius: radius,
            circleActive: true,
            dropTimer: 3.0,
            dropsTriggered: 0,
            waves: []
        };

        if (typeof AudioManager !== 'undefined') AudioManager.waterDropSound();
    },

    updateWaterSanctuary(dt, ctx) {
        if (!this.waterSanctuary) return;
        const ws = this.waterSanctuary;
        ws.dropTimer -= dt;

        const distToSafeCenter = Math.hypot(BossState.shipX - ws.x, BossState.shipY - ws.y);
        const insideSafeCircle = distToSafeCenter <= ws.radius + 10;

        if (ws.dropTimer <= 0 && ws.dropsTriggered < 3) {
            ws.dropsTriggered++;
            ws.dropTimer = 1.25;
            if (typeof AudioManager !== 'undefined') AudioManager.waterDropSound();
            if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(ws.x, ws.y, 1.4);
            ParticleEngine.explode(ws.x, ws.y, '#dad4bb', 12);

            ws.waves.push({
                x: ws.x,
                y: ws.y,
                radius: ws.radius,
                maxRadius: Math.max(window.innerWidth, window.innerHeight) * 1.15,
                speed: this.isMob() ? 360 : 450,
                hasDamaged: false
            });

            if (ws.dropsTriggered >= 3) {
                ws.circleActive = false;
            }
        }

        if (ws.circleActive) {
            ctx.save();
            ctx.translate(ws.x, ws.y);
            const ringColor = insideSafeCircle ? '#f7f5ed' : '#e5c158';
            ctx.fillStyle = insideSafeCircle ? 'rgba(247, 245, 237, 0.10)' : 'rgba(218, 212, 187, 0.05)';
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(0, 0, ws.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, ws.radius - 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        const now = performance.now() * 0.005;
        for (let i = ws.waves.length - 1; i >= 0; i--) {
            const wv = ws.waves[i];
            wv.radius += wv.speed * dt;

            ctx.save();
            ctx.translate(wv.x, wv.y);
            ctx.strokeStyle = 'rgba(218, 212, 187, 0.88)';
            ctx.lineWidth = this.isMob() ? 3 : 4.5;
            ctx.beginPath();
            const segments = this.isMob() ? 40 : 64;
            for (let s = 0; s <= segments; s++) {
                const a = (Math.PI * 2 * s) / segments;
                const ripple = Math.sin(a * 12 + now * 4) * 4;
                const rx = Math.cos(a) * (wv.radius + ripple);
                const ry = Math.sin(a) * (wv.radius + ripple);
                if (s === 0) ctx.moveTo(rx, ry);
                else ctx.lineTo(rx, ry);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();

            if (!wv.hasDamaged && Math.abs(distToSafeCenter - wv.radius) < 20) {
                wv.hasDamaged = true;
                if (!insideSafeCircle) {
                    BossState.tryHitPlayer(BossState.shipX, BossState.shipY);
                }
            }

            if (wv.radius > wv.maxRadius) {
                ws.waves.splice(i, 1);
            }
        }

        if (!ws.circleActive && ws.waves.length === 0) {
            this.waterSanctuary = null;
        }
    },

    spawnJudgmentSword(edgeIndex = null, damage = 20) {
        if (BossState.phase !== 3 || BossState.currentHp <= 0 || BossState.isDying) return;
        this.initAssets();

        const w = window.innerWidth, h = window.innerHeight;
        const spawnPoints = [
            { x: -40, y: -40 }, { x: w + 40, y: -40 },
            { x: -40, y: h + 40 }, { x: w + 40, y: h + 40 },
            { x: w * 0.25, y: -50 }, { x: w * 0.75, y: -50 },
            { x: -50, y: h * 0.45 }, { x: w + 50, y: h * 0.45 }
        ];
        const pt = edgeIndex !== null
            ? spawnPoints[edgeIndex % spawnPoints.length]
            : spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

        const core = BossState.getBossCoreCenter();
        const angle = Math.atan2(core.y - pt.y, core.x - pt.x);

        this.judgmentSwords.push({ x: pt.x, y: pt.y, speed: 17.5, angle, damage });
        if (typeof AudioManager !== 'undefined') AudioManager.beep(1180, 0.05, 'sawtooth', 0.025);
    },

    spawnFaithOrb() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        const coords = this.getNonOverlappingCoords(20, 25);
        this.faithOrbs.push({
            x: coords.x,
            y: coords.y,
            radius: 13 * this.getMobScale(),
            timer: 6.5
        });
    },

    spawnBomb(isGolden = false) {
        if (BossState.playerHp <= 0 || BossState.isDying) return;
        const coords = this.getNonOverlappingCoords(18, 24);
        const hp = BossState.phase === 3 ? 6 : 9;

        this.nodes.push({
            type: 'bomb',
            x: coords.x,
            y: coords.y,
            hp, maxHp: hp,
            radius: 26 * this.getMobScale(),
            timer: 4.3,
            maxTimer: 4.3,
            isGolden
        });
    },

    spawnQteCross() {
        if (BossState.playerHp <= 0 || BossState.isDying) return;
        const coords = this.getNonOverlappingCoords(18, 24);
        const hp = 9;

        this.nodes.push({
            type: 'cross',
            x: coords.x,
            y: coords.y,
            hp, maxHp: hp,
            radius: 26 * this.getMobScale(),
            timer: 4.8,
            maxTimer: 4.8
        });
        this.spawnDanmakuRing(coords.x, coords.y, 6, 1.8, 'ring');
    },

    spawnHeartTrap() {
        this.spawnQteCross();
    },

    spawnClones() {
        this.clearClones();
        if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartSpawn, 0.55);
        for (let i = 0; i < 2; i++) {
            const coords = this.getNonOverlappingCoords(20, 22);
            const el = document.createElement('div');
            el.className = 'boss-core-container boss-clone-container spawn-blip';
            el.style.opacity = '0.55';
            el.style.filter = 'sepia(80%) hue-rotate(-30deg) contrast(135%)';
            el.style.left = `${coords.left}\%`; el.style.top = `${coords.top}%`;
            el.innerHTML = `
                <div class="sacred-wheel-1"></div>
                <div class="boss-core-btn">
                    <img class="boss-core-img" src="img/boss/ddddboss_fase2.png" onerror="this.src='img/boss/core.png'" alt="Clone">
                </div>
            `;
            document.body.appendChild(el);
            this.clones.push({ el, left: coords.left, top: coords.top, hp: 26, maxHp: 26, fireTimer: 2.0 + i * 1.3 });
        }
    },

    moveClones() {
        this.clones.forEach(c => {
            if (c.el && document.body.contains(c.el)) {
                const coords = this.getNonOverlappingCoords(20, 22);
                c.left = coords.left; c.top = coords.top;
                c.el.style.left = `${coords.left}%`;
                c.el.style.top = `${coords.top}%`;
            }
        });
    },

    clearClones() {
        this.clones.forEach(c => { if (c.el) c.el.remove(); });
        this.clones = [];
    },

    updateProjectilesAndLasers(dt, ctx) {
        if (!ctx || BossState.isDying || BossState.playerHp <= 0) return;
        this.initAssets();
        const sc = this.getMobScale();
        const mob = this.isMob();

        this.renderBossWingsAndEyes(ctx, dt);

        if (this.waterSanctuary) {
            this.updateWaterSanctuary(dt, ctx);
            if (BossState.isDying || BossState.playerHp <= 0) return;
        }

        // Espadas de Luz Largas que cruzan toda la arena (Fase S)
        const shieldRadius = (BossState.solynCompanionActive ? 54 : 30) * sc;
        const shipHitboxRadius = 9 * sc;

        for (let i = this.lightSwords.length - 1; i >= 0; i--) {
            const ls = this.lightSwords[i];
            if (!ls) continue;

            if (ls.warnTimer > 0) {
                ls.warnTimer -= dt;
                ctx.save();
                const alpha = 0.25 + Math.sin(ls.warnTimer * 25) * 0.2;
                ctx.strokeStyle = `rgba(255, 235, 175, ${alpha})`;
                ctx.lineWidth = 1.6;
                ctx.setLineDash([10, 8]);
                ctx.beginPath();
                ctx.moveTo(ls.x, ls.y);
                const len = ls.rayLength || 2200;
                ctx.lineTo(ls.x + Math.cos(ls.angle) * len, ls.y + Math.sin(ls.angle) * len);
                ctx.stroke();
                ctx.restore();
            } else {
                ls.x += ls.vx * (dt * 60);
                ls.y += ls.vy * (dt * 60);
            }

            if (ls.x < -300 || ls.x > window.innerWidth + 300 || ls.y < -300 || ls.y > window.innerHeight + 300) {
                this.lightSwords.splice(i, 1);
                continue;
            }

            this.drawShipStyledLightSword(ctx, ls);

            const distToShip = Math.hypot(ls.x - BossState.shipX, ls.y - BossState.shipY);
            if (BossState.shieldActive && distToShip < shieldRadius + 18 * sc) {
                // Al bloquear la espada con tu escudo, se disuelve en mariposas libres (NO cura a Saphyniel)
                if (typeof PhaseSUIArena !== 'undefined') {
                    PhaseSUIArena.spawnFreeButterflyBurst(ls.x, ls.y, 4);
                } else {
                    ParticleEngine.explode(ls.x, ls.y, '#ffffff', 6);
                }
                if (typeof AudioManager !== 'undefined') AudioManager.parryClangSound();
                this.lightSwords.splice(i, 1);
                continue;
            }

            if (distToShip < 16 * sc) {
                this.lightSwords.splice(i, 1);
                BossState.tryHitPlayer(ls.x, ls.y);
                if (BossState.isDying || BossState.playerHp <= 0) return;
            }
        }

        // A. Clones Atacantes
        for (let i = this.clones.length - 1; i >= 0; i--) {
            const c = this.clones[i];
            if (!c || !c.el || !document.body.contains(c.el)) {
                this.clones.splice(i, 1);
                continue;
            }
            const r = c.el.getBoundingClientRect();
            c.x = r.left + r.width / 2;
            c.y = r.top + r.height / 2;

            if (!BossState.damageLock) {
                c.fireTimer -= dt;
                if (c.fireTimer <= 0) {
                    c.fireTimer = 3.8;
                    this.spawnDanmakuRing(c.x, c.y, 4, 2.5, 'aimed');
                }
            }
        }

        // B. Espadas Automáticas (swordsprite.png) en Fase 3
        const core = BossState.getBossCoreCenter();
        for (let i = this.judgmentSwords.length - 1; i >= 0; i--) {
            const sw = this.judgmentSwords[i];
            if (!sw) continue;

            sw.angle = Math.atan2(core.y - sw.y, core.x - sw.x);
            sw.x += Math.cos(sw.angle) * sw.speed * (dt * 60);
            sw.y += Math.sin(sw.angle) * sw.speed * (dt * 60);

            ctx.save();
            ctx.translate(sw.x, sw.y);
            ctx.rotate(sw.angle + Math.PI / 2);
            this.drawEnhancedSword(ctx, 48, 114);
            ctx.restore();

            if (Math.hypot(sw.x - core.x, sw.y - core.y) < core.radius * 0.78) {
                ParticleEngine.explode(sw.x, sw.y, '#f7f5ed', 10);
                if (typeof AudioManager !== 'undefined') {
                    AudioManager.swordImpactSound();
                    AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartHit, 0.5);
                }
                if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
                BossState.triggerCoreRgbGlitch();

                if (BossState.impaledSwords.length < 20) {
                    const impactDist = (24 + Math.random() * 26) * sc;
                    BossState.impaledSwords.push({
                        angle: sw.angle,
                        offsetX: -Math.cos(sw.angle) * impactDist,
                        offsetY: -Math.sin(sw.angle) * impactDist
                    });
                }

                BossState.currentHp = Math.max(0, BossState.currentHp - sw.damage);
                BossState.updateHpBar();
                this.judgmentSwords.splice(i, 1);

                if (BossState.currentHp <= 0 && typeof SubphaseSurvival !== 'undefined' && !SubphaseSurvival.climaxTriggered) {
                    SubphaseSurvival.climaxTriggered = true;
                    SubphaseSurvival.triggerClimax();
                    return;
                }
            }
        }

        // C. Orbes de Fe dorados
        for (let i = this.faithOrbs.length - 1; i >= 0; i--) {
            const orb = this.faithOrbs[i];
            if (!orb) continue;
            orb.timer -= dt;
            if (orb.timer <= 0) {
                this.faithOrbs.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.translate(orb.x, orb.y);
            ctx.rotate(performance.now() * 0.004);
            ctx.strokeStyle = '#e5c158';
            ctx.fillStyle = '#f7f5ed';
            ctx.strokeRect(-9 * sc, -9 * sc, 18 * sc, 18 * sc);
            ctx.fillRect(-4 * sc, -4 * sc, 8 * sc, 8 * sc);
            ctx.restore();

            if (Math.hypot(BossState.shipX - orb.x, BossState.shipY - orb.y) < 34 * sc) {
                BossState.shieldCooldown = 0;
                ParticleEngine.explode(orb.x, orb.y, '#e5c158', 10);
                if (typeof AudioManager !== 'undefined') AudioManager.beep(1046, 0.08, 'sine', 0.05);
                this.faithOrbs.splice(i, 1);
            }
        }

        // D. Bombas y Cruces de Curación (Fases 1-3)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            if (!n) continue;
            n.timer -= dt;

            if (n.timer <= 0) {
                if (n.type === 'bomb') {
                    ParticleEngine.explode(n.x, n.y, '#d9381e', 18);
                    if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.bombExplode, 0.55);
                    this.spawnDanmakuRing(n.x, n.y, 12, 3.3, 'ring');
                } else if (n.type === 'cross') {
                    BossState.currentHp = Math.min(BossState.maxHp, BossState.currentHp + 40);
                    BossState.updateHpBar();
                    ParticleEngine.explode(n.x, n.y, '#e5c158', 16);
                    if (typeof AudioManager !== 'undefined') AudioManager.beep(660, 0.25, 'sine', 0.06);

                    ctx.save();
                    ctx.strokeStyle = '#e5c158';
                    ctx.lineWidth = 5 * sc;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(core.x, core.y);
                    ctx.stroke();
                    ctx.restore();
                }
                this.nodes.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(n.x, n.y);
            const timeRatio = Math.max(0, n.timer / n.maxTimer);
            ctx.strokeStyle = n.type === 'bomb' ? '#d9381e' : '#e5c158';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, n.radius + 5 * sc, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeRatio);
            ctx.stroke();

            if (n.type === 'bomb') {
                ctx.fillStyle = '#1a0d0a';
                ctx.strokeStyle = '#ff9e80';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.save();
                ctx.rotate(performance.now() * 0.0025);
                ctx.fillStyle = '#e5c158';
                ctx.fillRect(-n.radius, -4 * sc, n.radius * 2, 8 * sc);
                ctx.fillRect(-4 * sc, -n.radius, 8 * sc, n.radius * 2);
                ctx.restore();
            }

            if (n.hp < n.maxHp) {
                const w = 38 * sc;
                ctx.fillStyle = '#09090b';
                ctx.fillRect(-w / 2, -n.radius - 12 * sc, w, 4);
                ctx.fillStyle = '#dad4bb';
                ctx.fillRect(-w / 2, -n.radius - 12 * sc, w * (n.hp / n.maxHp), 4);
            }
            ctx.restore();
        }

        // E. Láseres instantáneos (Hitscan)
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            if (!l) continue;
            l.timer += dt;

            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.angle);

            if (l.state === 'warn') {
                const alpha = 0.5 + Math.sin(l.timer * 28) * 0.35;
                ctx.strokeStyle = `rgba(217, 56, 30, ${alpha})`;
                ctx.lineWidth = 2.2 * sc;
                ctx.setLineDash([12, 8]);
                ctx.beginPath();
                ctx.moveTo(-window.innerWidth, 0);
                ctx.lineTo(window.innerWidth, 0);
                ctx.stroke();

                if (l.timer >= l.warnDuration) {
                    l.state = 'fire';
                    l.timer = 0;
                    l.fireDuration = 0.15;
                    if (typeof AudioManager !== 'undefined') AudioManager.laserFireSynth();
                    if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();

                    const beamHitWidth = 30 * sc;
                    const dx = BossState.shipX - l.x;
                    const dy = BossState.shipY - l.y;
                    const perpDist = Math.abs(-Math.sin(l.angle) * dx + Math.cos(l.angle) * dy);
                    if (perpDist < beamHitWidth * 0.6 + shipHitboxRadius) {
                        l.hasDamaged = true;
                        ctx.restore();
                        BossState.tryHitPlayer(BossState.shipX, BossState.shipY);
                        if (BossState.isDying || BossState.playerHp <= 0) return;
                        continue;
                    }
                }
            } else if (l.state === 'fire') {
                const width = (32 * sc) * Math.max(0, 1 - l.timer / l.fireDuration);
                ctx.fillStyle = '#f7f5ed';
                if (!mob) { ctx.shadowColor = '#d9381e'; ctx.shadowBlur = 20; }
                ctx.fillRect(-window.innerWidth, -width / 2, window.innerWidth * 2, width);

                if (l.timer >= l.fireDuration) this.lasers.splice(i, 1);
            }
            ctx.restore();
        }

        // F. Esferas Danmaku YoRHa
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (BossState.isDying || BossState.playerHp <= 0) return;
            const b = this.bullets[i];
            if (!b) continue;

            b.x += b.vx * (dt * 60);
            b.y += b.vy * (dt * 60);

            if (b.x < -50 || b.x > window.innerWidth + 50 || b.y < -50 || b.y > window.innerHeight + 50) {
                this.bullets.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius + 2 * sc, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 6, 8, 0.88)';
            ctx.fill();

            if (!mob) {
                ctx.shadowColor = b.ringColor;
                ctx.shadowBlur = 10;
            }
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.coreColor;
            ctx.fill();
            ctx.lineWidth = 2 * sc;
            ctx.strokeStyle = b.ringColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.38, 0, Math.PI * 2);
            ctx.fillStyle = b.centerColor || '#f7f5ed';
            ctx.fill();
            ctx.restore();

            const distToShip = Math.hypot(b.x - BossState.shipX, b.y - BossState.shipY);
            if (BossState.shieldActive && distToShip < b.radius + shieldRadius) {
                // En Fase S, bloquear con el escudo libera mariposas que vuelan en libertad (sin curar al boss)
                if (BossState.phase === 'S' && typeof PhaseSUIArena !== 'undefined') {
                    PhaseSUIArena.spawnFreeButterflyBurst(b.x, b.y, 2);
                } else {
                    ParticleEngine.explode(b.x, b.y, '#dad4bb', 4);
                }
                if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock, 0.3);
                this.bullets.splice(i, 1);
                continue;
            }

            if (distToShip < b.radius + shipHitboxRadius) {
                this.bullets.splice(i, 1);
                BossState.tryHitPlayer(b.x, b.y);
                if (BossState.isDying || BossState.playerHp <= 0) return;
            }
        }
    },

    startSurvivalMode() {
        clearInterval(this.survivalTimer);
        clearInterval(this.swordBarrageTimer);

        let swordTick = 0;
        const dmgPerSword = Math.ceil(BossState.maxHp / 32);
        this.swordBarrageTimer = setInterval(() => {
            if (BossState.phase !== 3 || BossState.playerHp <= 0 || BossState.isDying || BossState.currentHp <= 0) {
                clearInterval(this.swordBarrageTimer);
                return;
            }
            this.spawnJudgmentSword(swordTick % 8, dmgPerSword);
            swordTick++;
        }, 640);

        let attackTick = 0;
        BossState.startBossTackle();
        this.survivalTimer = setInterval(() => {
            if (BossState.phase !== 3 || BossState.playerHp <= 0 || BossState.isDying || BossState.currentHp <= 0) {
                clearInterval(this.survivalTimer);
                return;
            }
            attackTick++;

            const core = BossState.getBossCoreCenter();
            this.spawnDanmakuRing(core.x, core.y, 12, 3.6, attackTick % 2 === 0 ? 'aimed' : 'ring');
            this.spawnSpiralVolley(4, 2, 3.6);
            BossState.startBossTackle();

            if (attackTick % 2 === 0) this.spawnLaserGrid(2);
            if (attackTick % 3 === 0) this.spawnFaithOrb();
        }, 1700);
    },

    clearAll() {
        clearInterval(this.qteSpawnerTimer);
        clearInterval(this.bombSpawnerTimer);
        clearInterval(this.danmakuSpawnerTimer);
        clearInterval(this.laserSpawnerTimer);
        clearInterval(this.patternSpawnerTimer);
        clearInterval(this.survivalTimer);
        clearInterval(this.swordBarrageTimer);

        this.clearClones();
        this.bullets = [];
        this.lasers = [];
        this.nodes = [];
        this.faithOrbs = [];
        this.judgmentSwords = [];
        this.lightSwords = [];
        this.uiBoxes = [];
        this.waterSanctuary = null;
        this.suctionParticles = [];
    }
};

window.BossAttacks = BossAttacks;