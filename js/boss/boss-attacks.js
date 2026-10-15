// =========================================================
// SISTEMA DE ATAQUES YORHA: JUICIO DEL PRISMA, SANTUARIO DE AGUA CRISTALINA,
// ALAS DE SERAFÍN, OJOS OFANIM Y ESPADAS AUTOMÁTICAS CON STROKE
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
    waterSanctuary: null, // Zona segura y olas cristalinas de la Fase 2
    suctionParticles: [], // Partículas invertidas en transición Fase 1 -> 2
    spiralAngle: 0,
    swordImg: null,
    eyeImg: null,
    glowingSwordCanvas: null,

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
            oCtx.shadowBlur = 14;

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
        ctx.save();
        const grad = ctx.createLinearGradient(0, -height * 0.5, 0, height * 0.5);
        grad.addColorStop(0, 'rgba(247, 245, 237, 0.95)');
        grad.addColorStop(0.5, 'rgba(229, 193, 88, 0.55)');
        grad.addColorStop(1, 'rgba(217, 56, 30, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -height * 0.52);
        ctx.lineTo(width * 0.28, height * 0.25);
        ctx.lineTo(-width * 0.28, height * 0.25);
        ctx.closePath();
        ctx.fill();

        if (this.glowingSwordCanvas) {
            ctx.shadowColor = '#f7f5ed';
            ctx.shadowBlur = 16;
            ctx.drawImage(this.glowingSwordCanvas, -width / 2, -height / 2, width, height);
        } else if (this.swordImg && this.swordImg.complete && this.swordImg.naturalWidth > 0) {
            ctx.shadowColor = '#f7f5ed';
            ctx.shadowBlur = 18;
            ctx.strokeStyle = '#f7f5ed';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-4, -height * 0.42, 8, height * 0.7);
            ctx.drawImage(this.swordImg, -width / 2, -height / 2, width, height);
        } else {
            ctx.fillStyle = '#09090b';
            ctx.strokeStyle = '#f7f5ed';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -height * 0.46);
            ctx.lineTo(8, height * 0.15);
            ctx.lineTo(-8, height * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    },

    // --- ALAS DE SERAFÍN GEOMÉTRICAS + OJOS OFANIM ORBITALES + GRIETAS DE LUZ ---
    renderBossWingsAndEyes(ctx, dt) {
        const coreEl = document.getElementById('boss-core');
        if (!coreEl || coreEl.style.display === 'none' || BossState.isDying) return;
        this.initAssets();

        const core = BossState.getBossCoreCenter();
        const t = performance.now() * 0.001;
        const pulse = (typeof AudioManager !== 'undefined') ? AudioManager.getAudioPulse() : 0;

        ctx.save();
        ctx.translate(core.x, core.y);

        // 1. Dibujar 6 Alas de Serafín de plumas de luz geométricas en Fases 2 y 3 (o durante ascensión)
        if (BossState.phase >= 2 || this.suctionParticles.length > 0) {
            const wingColor = BossState.phase === 3 ? 'rgba(247, 245, 237, 0.42)' : 'rgba(217, 56, 30, 0.42)';
            const strokeCol = BossState.phase === 3 ? '#f7f5ed' : '#e5c158';
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

        // 2. Ojos Ofanim (img/icons/eye.png) orbitando el núcleo en Fases 2 y 3
        if (BossState.phase >= 2 && this.eyeImg && this.eyeImg.complete) {
            const eyeCount = BossState.phase === 3 ? 6 : 4;
            const orbitRadius = core.radius + 42 + Math.sin(t * 2.5) * 6;
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

        // 3. Grietas y Cadenas de Luz Dorada en el Clímax de Fase 3 conforme su HP baja a 0%
        if (BossState.phase === 3 && BossState.currentHp < BossState.maxHp) {
            const missingRatio = 1 - (BossState.currentHp / BossState.maxHp);
            const rays = Math.floor(missingRatio * 10);
            ctx.strokeStyle = '#f7f5ed';
            ctx.shadowColor = '#e5c158';
            ctx.shadowBlur = 16;
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

        // 4. Partículas invertidas de succión (Transición Fase 1 -> 2)
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
            ctx.shadowColor = sp.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(sp.x - 3, sp.y - 3, 6, 6);
            ctx.restore();
        }
    },

    spawnSuctionParticles(count = 28) {
        const w = window.innerWidth, h = window.innerHeight;
        for (let i = 0; i < count; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 220 + Math.random() * 240;
            const core = BossState.getBossCoreCenter();
            this.suctionParticles.push({
                x: core.x + Math.cos(ang) * dist,
                y: core.y + Math.sin(ang) * dist,
                speed: 3.5 + Math.random() * 3,
                color: i % 2 === 0 ? '#f7f5ed' : '#d9381e'
            });
        }
    },

    getNonOverlappingCoords(marginVw = 18, marginVh = 22) {
        const left = Math.floor(Math.random() * (100 - marginVw * 2)) + marginVw;
        const top = Math.floor(Math.random() * (100 - marginVh * 2)) + marginVh;
        return { left, top };
    },

    spawnDanmakuRing(originX, originY, count = 12, speed = 3.2, pattern = 'ring') {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        if (BossState.damageLock && BossState.phase !== 3) return;

        const isMob = window.innerWidth <= 680;
        const finalCount = isMob ? Math.max(6, Math.floor(count * 0.7)) : count;
        const baseAngle = Math.atan2(BossState.shipY - originY, BossState.shipX - originX);

        for (let i = 0; i < finalCount; i++) {
            const angle = pattern === 'aimed'
                ? baseAngle + (i - (finalCount - 1) / 2) * 0.18
                : (Math.PI * 2 * i) / finalCount + (performance.now() * 0.0012);
            const isLight = i % 2 === 0;
            this.bullets.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: isMob ? 8.5 : 10,
                coreColor: isLight ? '#d9381e' : '#1c0d26',
                ringColor: isLight ? '#ff9e80' : '#b8325a',
                centerColor: isLight ? '#f7f5ed' : '#dad4bb'
            });
        }
        if (typeof AudioManager !== 'undefined') AudioManager.beep(240, 0.04, 'sawtooth', 0.02);
    },

    spawnSpiralVolley(arms = 3, bulletsPerArm = 2, speed = 3.4) {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        if (BossState.damageLock && BossState.phase !== 3) return;
        const core = BossState.getBossCoreCenter();
        this.spiralAngle += 0.42;

        for (let a = 0; a < arms; a++) {
            const armAngle = this.spiralAngle + (Math.PI * 2 * a) / arms;
            for (let k = 0; k < bulletsPerArm; k++) {
                const spd = speed + k * 0.65;
                const isLight = (a + k) % 2 === 0;
                this.bullets.push({
                    x: core.x,
                    y: core.y,
                    vx: Math.cos(armAngle) * spd,
                    vy: Math.sin(armAngle) * spd,
                    radius: 9.5,
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
                this.spawnDanmakuRing(core.x, core.y, 5, 4.3 + w * 0.5, 'aimed');
            }, w * 180);
        }
    },

    spawnCurtainWall() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        const total = window.innerWidth <= 680 ? 11 : 18;
        const gapIndex = Math.floor(Math.random() * (total - 4)) + 2;
        const stepX = window.innerWidth / total;

        for (let i = 0; i <= total; i++) {
            if (Math.abs(i - gapIndex) <= 1) continue;
            this.bullets.push({
                x: i * stepX,
                y: 65,
                vx: 0,
                vy: 2.95,
                radius: 9.5,
                coreColor: '#1c0d26',
                ringColor: '#d9381e',
                centerColor: '#dad4bb'
            });
        }
        if (typeof AudioManager !== 'undefined') AudioManager.beep(190, 0.12, 'sawtooth', 0.03);
    },

    // --- FASE 2 ESTADO A: «JUICIO DEL PRISMA» (COREOGRAFÍA EXCLUSIVA DE RAYOS) ---
    // MECÁNICA EMPERATRIZ DE LA LUZ (TERRARIA):
    // Traza líneas de disparo prediciendo la trayectoria de movimiento de la nave
    spawnPrismCageLasers(waves = 6) {
        if (BossState.isDying || BossState.playerHp <= 0) return;

        for (let w = 0; w < waves; w++) {
            setTimeout(() => {
                if (BossState.isDying || BossState.playerHp <= 0 || BossState.damageLock) return;
                if (typeof AudioManager !== 'undefined') AudioManager.laserChargeSound();

                // Leer hacia dónde se mueve el jugador en este instante
                let moveX = BossState.joyDx + (BossState.keys.d ? 1 : 0) - (BossState.keys.a ? 1 : 0);
                let moveY = BossState.joyDy + (BossState.keys.s ? 1 : 0) - (BossState.keys.w ? 1 : 0);

                // Punto futuro donde estará la nave en 0.45 segundos
                const predictX = Math.max(60, Math.min(window.innerWidth - 60, BossState.shipX + moveX * 165));
                const predictY = Math.max(90, Math.min(window.innerHeight - 60, BossState.shipY + moveY * 165));

                // Trazar 3 lanzas de luz que se cruzan sobre la trayectoria futura + 1 directa a la posición actual
                const baseAng = Math.atan2( moveY || 0.5, moveX || 0.5 );
                const angles = [baseAng + Math.PI / 2, baseAng + Math.PI / 4, baseAng - Math.PI / 4];

                angles.forEach((ang, i) => {
                    this.lasers.push({
                        x: i === 0 ? predictX : BossState.shipX + (Math.random() - 0.5) * 90,
                        y: i === 0 ? predictY : BossState.shipY + (Math.random() - 0.5) * 90,
                        angle: ang,
                        state: 'warn',
                        timer: 0,
                        warnDuration: 0.72, // Aviso rápido tipo Emperatriz de la Luz
                        fireDuration: 0.32,
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
                    fireDuration: 0.35,
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
                warnDuration: 1.05,
                fireDuration: 0.4,
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
            y: Math.max(110, Math.min(window.innerHeight - 110, yPos)),
            angle,
            state: 'warn',
            timer: 0,
            warnDuration: 1.0,
            fireDuration: 0.38,
            hasDamaged: false
        });
    },

    // --- FASE 2 ESTADO B: «SANTUARIO DEL ESPEJO DE AGUA» (ZONAS SEGURAS + OLAS CRISTALINAS) ---
    startWaterSanctuaryCycle() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
        this.bullets = [];

        const radius = window.innerWidth <= 680 ? 75 : 100;
        const margin = radius + 40;
        const sx = Math.floor(margin + Math.random() * Math.max(40, window.innerWidth - margin * 2));
        const sy = Math.floor(window.innerHeight * 0.45 + Math.random() * (window.innerHeight * 0.35));

        this.waterSanctuary = {
            x: sx,
            y: sy,
            radius: radius,
            circleActive: true, // Se apaga en cuanto sale la 3ra ola
            dropTimer: 0.9,
            dropsTriggered: 0,
            waves: []
        };

        if (typeof AudioManager !== 'undefined') AudioManager.waterDropSound();
    },

    updateWaterSanctuary(dt, ctx) {
        if (!this.waterSanctuary) return;
        const ws = this.waterSanctuary;
        ws.dropTimer -= dt;

        // Distancia circular desde tu nave al centro del santuario
        const distToSafeCenter = Math.hypot(BossState.shipX - ws.x, BossState.shipY - ws.y);
        const insideSafeCircle = distToSafeCenter <= ws.radius + 10;

        // Generar las 3 oleadas
        if (ws.dropTimer <= 0 && ws.dropsTriggered < 3) {
            ws.dropsTriggered++;
            ws.dropTimer = 1.25;
            if (typeof AudioManager !== 'undefined') AudioManager.waterDropSound();
            if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(ws.x, ws.y, 1.4);
            ParticleEngine.explode(ws.x, ws.y, '#dad4bb', 16);

            ws.waves.push({
                x: ws.x,
                y: ws.y,
                radius: ws.radius,
                maxRadius: Math.max(window.innerWidth, window.innerHeight) * 1.15,
                speed: 450,
                hasDamaged: false
            });

            // REGLA 2: En cuanto spawnea la 3ra oleada, el círculo del santuario desaparece
            if (ws.dropsTriggered >= 3) {
                ws.circleActive = false;
            }
        }

        // Dibujar el Santuario Circular (Solo mientras no hayan salido las 3 olas, y SIN textos)
        if (ws.circleActive) {
            ctx.save();
            ctx.translate(ws.x, ws.y);
            const ringColor = insideSafeCircle ? '#f7f5ed' : '#e5c158';
            ctx.fillStyle = insideSafeCircle ? 'rgba(247, 245, 237, 0.09)' : 'rgba(218, 212, 187, 0.05)';
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#dad4bb';
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.arc(0, 0, ws.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Segundo anillo interior punteado estilo YoRHa
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, ws.radius - 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Dibujar las Olas con colores de NieR (#dad4bb y #f7f5ed)
        const now = performance.now() * 0.005;
        for (let i = ws.waves.length - 1; i >= 0; i--) {
            const wv = ws.waves[i];
            wv.radius += wv.speed * dt;

            ctx.save();
            ctx.translate(wv.x, wv.y);
            ctx.strokeStyle = 'rgba(218, 212, 187, 0.88)';
            ctx.lineWidth = 4.5;
            ctx.shadowColor = '#f7f5ed';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            const segments = 64;
            for (let s = 0; s <= segments; s++) {
                const a = (Math.PI * 2 * s) / segments;
                const ripple = Math.sin(a * 12 + now * 4) * 5;
                const rx = Math.cos(a) * (wv.radius + ripple);
                const ry = Math.sin(a) * (wv.radius + ripple);
                if (s === 0) ctx.moveTo(rx, ry);
                else ctx.lineTo(rx, ry);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = 'rgba(247, 245, 237, 0.55)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, wv.radius - 14), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            if (!wv.hasDamaged && Math.abs(distToSafeCenter - wv.radius) < 22) {
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
            x: (coords.left / 100) * window.innerWidth,
            y: (coords.top / 100) * window.innerHeight,
            radius: 13,
            timer: 6.5
        });
    },

    spawnBomb(isGolden = false) {
        if (BossState.playerHp <= 0 || BossState.isDying) return;
        const coords = this.getNonOverlappingCoords(18, 24);
        const x = (coords.left / 100) * window.innerWidth;
        const y = (coords.top / 100) * window.innerHeight;
        const hp = BossState.phase === 3 ? 6 : 9;

        this.nodes.push({ type: 'bomb', x, y, hp, maxHp: hp, radius: 26, timer: 4.3, maxTimer: 4.3, isGolden });
    },

    spawnQteCross() {
        if (BossState.playerHp <= 0 || BossState.isDying) return;
        const coords = this.getNonOverlappingCoords(18, 24);
        const x = (coords.left / 100) * window.innerWidth;
        const y = (coords.top / 100) * window.innerHeight;
        const hp = 9;

        this.nodes.push({ type: 'cross', x, y, hp, maxHp: hp, radius: 26, timer: 4.8, maxTimer: 4.8 });
        this.spawnDanmakuRing(x, y, 6, 1.8, 'ring');
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
            el.style.left = `${coords.left}%`;
            el.style.top = `${coords.top}%`;
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

        // Renderizar Alas de Serafín, Ojos Ofanim y partículas de succión
        this.renderBossWingsAndEyes(ctx, dt);

        // Renderizar Santuario del Espejo de Agua si está activo
        if (this.waterSanctuary) {
            this.updateWaterSanctuary(dt, ctx);
            if (BossState.isDying || BossState.playerHp <= 0) return;
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

        // B. Espadas Automáticas (swordsprite.png) volando hacia Saphyniel
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
                ParticleEngine.explode(sw.x, sw.y, '#f7f5ed', 14);
                ParticleEngine.explode(sw.x, sw.y, '#e5c158', 10);
                if (typeof AudioManager !== 'undefined') {
                    AudioManager.swordImpactSound();
                    AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartHit, 0.5);
                }
                if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
                BossState.triggerCoreRgbGlitch();

                if (BossState.impaledSwords.length < 20) {
                    const impactDist = 24 + Math.random() * 26;
                    BossState.impaledSwords.push({
                        angle: sw.angle,
                        offsetX: -Math.cos(sw.angle) * impactDist,
                        offsetY: -Math.sin(sw.angle) * impactDist
                    });
                }

                BossState.currentHp = Math.max(0, BossState.currentHp - sw.damage);
                BossState.updateHpBar();
                BossState.spawnDamagePopup(core.x, core.y, sw.damage, 'normal');
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
            ctx.shadowColor = '#e5c158';
            ctx.shadowBlur = 14;
            ctx.strokeRect(-9, -9, 18, 18);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();

            if (Math.hypot(BossState.shipX - orb.x, BossState.shipY - orb.y) < 34) {
                BossState.shieldCooldown = 0;
                ParticleEngine.explode(orb.x, orb.y, '#e5c158', 12);
                if (typeof AudioManager !== 'undefined') AudioManager.beep(1046, 0.08, 'sine', 0.05);
                BossState.spawnDamagePopup(orb.x, orb.y, "ESCUDO RECARGADO", 'heal');
                this.faithOrbs.splice(i, 1);
            }
        }

        // D. Bombas y Cruces de Curación
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            if (!n) continue;
            n.timer -= dt;

            if (n.timer <= 0) {
                if (n.type === 'bomb') {
                    ParticleEngine.explode(n.x, n.y, '#d9381e', 24);
                    if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.bombExplode, 0.55);
                    this.spawnDanmakuRing(n.x, n.y, 12, 3.3, 'ring');
                } else if (n.type === 'cross') {
                    BossState.currentHp = Math.min(BossState.maxHp, BossState.currentHp + 40);
                    BossState.updateHpBar();
                    BossState.spawnDamagePopup(core.x, core.y, "CURACIÓN +40", 'heal');
                    ParticleEngine.explode(n.x, n.y, '#e5c158', 20);
                    if (typeof AudioManager !== 'undefined') AudioManager.beep(660, 0.25, 'sine', 0.06);

                    ctx.save();
                    ctx.strokeStyle = '#e5c158';
                    ctx.lineWidth = 6;
                    ctx.shadowColor = '#f7f5ed';
                    ctx.shadowBlur = 20;
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
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, n.radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeRatio);
            ctx.stroke();

            if (n.type === 'bomb') {
                ctx.fillStyle = '#1a0d0a';
                ctx.strokeStyle = '#ff9e80';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#d9381e';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#f7f5ed';
                ctx.font = 'bold 11px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(n.timer.toFixed(1), 0, 4);
            } else {
                ctx.save();
                ctx.rotate(performance.now() * 0.0025);
                ctx.fillStyle = '#e5c158';
                ctx.shadowColor = '#f7f5ed';
                ctx.shadowBlur = 16;
                ctx.fillRect(-n.radius, -5, n.radius * 2, 10);
                ctx.fillRect(-5, -n.radius, 10, n.radius * 2);
                ctx.restore();
            }

            if (n.hp < n.maxHp) {
                const w = 42;
                ctx.fillStyle = '#09090b';
                ctx.fillRect(-w / 2, -n.radius - 16, w, 5);
                ctx.fillStyle = '#dad4bb';
                ctx.fillRect(-w / 2, -n.radius - 16, w * (n.hp / n.maxHp), 5);
            }
            ctx.restore();
        }

        // E. Láseres Telegráficos (Con laserFireSynth integrado)
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
                ctx.lineWidth = 2.5;
                ctx.setLineDash([14, 8]);
                ctx.beginPath();
                ctx.moveTo(-window.innerWidth, 0);
                ctx.lineTo(window.innerWidth, 0);
                ctx.stroke();

                if (l.timer >= l.warnDuration) {
                    l.state = 'fire';
                    l.timer = 0;
                    if (typeof AudioManager !== 'undefined') AudioManager.laserFireSynth();
                    if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
                }
            } else if (l.state === 'fire') {
                const width = 34 * (1 - l.timer / l.fireDuration);
                ctx.fillStyle = '#f7f5ed';
                ctx.shadowColor = '#d9381e';
                ctx.shadowBlur = 24;
                ctx.fillRect(-window.innerWidth, -width / 2, window.innerWidth * 2, width);

                if (!l.hasDamaged) {
                    const dx = BossState.shipX - l.x;
                    const dy = BossState.shipY - l.y;
                    const perpDist = Math.abs(-Math.sin(l.angle) * dx + Math.cos(l.angle) * dy);
                    if (perpDist < width * 0.65 + 12) {
                        l.hasDamaged = true;
                        ctx.restore();
                        BossState.tryHitPlayer(BossState.shipX, BossState.shipY);
                        if (BossState.isDying || BossState.playerHp <= 0) return;
                        continue;
                    }
                }
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
            ctx.arc(b.x, b.y, b.radius + 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 6, 8, 0.88)';
            ctx.fill();

            ctx.shadowColor = b.ringColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.coreColor;
            ctx.fill();
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = b.ringColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.38, 0, Math.PI * 2);
            ctx.fillStyle = b.centerColor || '#f7f5ed';
            ctx.fill();
            ctx.restore();

            const distToShip = Math.hypot(b.x - BossState.shipX, b.y - BossState.shipY);
            if (BossState.shieldActive && distToShip < b.radius + 36) {
                ParticleEngine.explode(b.x, b.y, '#dad4bb', 5);
                if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock, 0.3);
                this.bullets.splice(i, 1);
                continue;
            }

            if (distToShip < b.radius + 11) {
                this.bullets.splice(i, 1);
                BossState.tryHitPlayer(b.x, b.y);
                if (BossState.isDying || BossState.playerHp <= 0) return;
            }
        }
    },

    startSurvivalMode() {
        clearInterval(this.survivalTimer);
        clearInterval(this.swordBarrageTimer);

        const surviveText = document.getElementById('survive-text');
        if (surviveText) {
            surviveText.classList.remove('show');
            void surviveText.offsetWidth;
            surviveText.classList.add('show');
            setTimeout(() => surviveText.classList.remove('show'), 3000);
        }

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
        this.waterSanctuary = null;
        this.suctionParticles = [];
    }
};

window.BossAttacks = BossAttacks;