// =========================================================
// SISTEMA DE ATAQUES YORHA: ESPADAS AUTOMÁTICAS CON STROKE Y BRILLO,
// EMBESTIDAS CONTINUAS Y PROTECCIÓN DE BUCLES EN MUERTE
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
    spiralAngle: 0,
    swordImg: null,
    glowingSwordCanvas: null,

    // Pre-procesa img/icons/swordsprite.png (que es mayormente negra) para añadirle
    // un Stroke blanco marfil (#f7f5ed) y un Halo Dorado (#e5c158) de alto contraste
    initAssets() {
        if (!this.swordImg) {
            this.swordImg = new Image();
            this.swordImg.onload = () => {
                this.buildGlowingSwordSprite();
            };
            this.swordImg.src = "img/icons/swordsprite.png";
        } else if (this.swordImg.complete && !this.glowingSwordCanvas && this.swordImg.naturalWidth > 0) {
            this.buildGlowingSwordSprite();
        }
    },

    buildGlowingSwordSprite() {
        try {
            const w = 64;
            const h = 140;
            const pad = 10;

            // 1. Crear silueta blanca/dorada pura a partir del canal alfa de swordsprite.png
            const silCanvas = document.createElement('canvas');
            silCanvas.width = w;
            silCanvas.height = h;
            const sCtx = silCanvas.getContext('2d');
            sCtx.drawImage(this.swordImg, pad, pad, w - pad * 2, h - pad * 2);
            sCtx.globalCompositeOperation = 'source-in';
            sCtx.fillStyle = '#f7f5ed';
            sCtx.fillRect(0, 0, w, h);

            // 2. Componer el sprite final con doble Stroke luminoso + núcleo negro original
            const outCanvas = document.createElement('canvas');
            outCanvas.width = w;
            outCanvas.height = h;
            const oCtx = outCanvas.getContext('2d');

            oCtx.shadowColor = '#e5c158';
            oCtx.shadowBlur = 14;

            // Dibujar la silueta desplazada en 8 direcciones para crear un Stroke grueso y brillante
            const offsets = [
                [-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5],
                [-2, -2], [2, -2], [-2, 2], [2, 2]
            ];
            offsets.forEach(([ox, oy]) => {
                oCtx.drawImage(silCanvas, ox, oy);
            });

            // Superponer el sprite negro original en el centro
            oCtx.shadowBlur = 0;
            oCtx.drawImage(this.swordImg, pad, pad, w - pad * 2, h - pad * 2);

            this.glowingSwordCanvas = outCanvas;
        } catch (e) {
            this.glowingSwordCanvas = null;
        }
    },

    drawEnhancedSword(ctx, width = 46, height = 110) {
        this.initAssets();
        // Halo energético detrás de la hoja para garantizar visibilidad total
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
            ctx.shadowColor = '#e5c158';
            ctx.shadowBlur = 16;
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

    spawnLaserGrid(count = 2) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.spawnTelegraphLaser(), i * 220);
        }
    },

    spawnTelegraphLaser() {
        if (BossState.isDying || BossState.playerHp <= 0) return;
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
        if (typeof AudioManager !== 'undefined') AudioManager.beep(880, 0.09, 'triangle', 0.025);
    },

    // --- ESPADAS AUTOMÁTICAS DESDE LOS BORDES Y ESQUINAS QUE ATACAN A SAPHYNIEL ---
    spawnJudgmentSword(edgeIndex = null, damage = 20) {
        if (BossState.phase !== 3 || BossState.currentHp <= 0 || BossState.isDying) return;
        this.initAssets();

        const w = window.innerWidth;
        const h = window.innerHeight;
        // 8 puntos de aparición en los bordes y esquinas de la pantalla
        const spawnPoints = [
            { x: -40, y: -40 },
            { x: w + 40, y: -40 },
            { x: -40, y: h + 40 },
            { x: w + 40, y: h + 40 },
            { x: w * 0.25, y: -50 },
            { x: w * 0.75, y: -50 },
            { x: -50, y: h * 0.45 },
            { x: w + 50, y: h * 0.45 }
        ];
        const pt = edgeIndex !== null
            ? spawnPoints[edgeIndex % spawnPoints.length]
            : spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

        const core = BossState.getBossCoreCenter();
        const angle = Math.atan2(core.y - pt.y, core.x - pt.x);

        this.judgmentSwords.push({
            x: pt.x,
            y: pt.y,
            speed: 17.5,
            angle,
            damage
        });

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

        this.nodes.push({
            type: 'bomb',
            x, y,
            hp, maxHp: hp,
            radius: 26,
            timer: 4.3,
            maxTimer: 4.3,
            isGolden
        });
    },

    spawnQteCross() {
        if (BossState.playerHp <= 0 || BossState.isDying) return;
        const coords = this.getNonOverlappingCoords(18, 24);
        const x = (coords.left / 100) * window.innerWidth;
        const y = (coords.top / 100) * window.innerHeight;
        const hp = 9;

        this.nodes.push({
            type: 'cross',
            x, y,
            hp, maxHp: hp,
            radius: 26,
            timer: 4.8,
            maxTimer: 4.8
        });
        this.spawnDanmakuRing(x, y, 6, 1.8, 'ring');
    },

    spawnHeartTrap() {
        this.spawnQteCross();
    },

    spawnClones() {
        this.clearClones();
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
            this.clones.push({
                el,
                left: coords.left,
                top: coords.top,
                hp: 26,
                maxHp: 26,
                fireTimer: 2.0 + i * 1.3
            });
        }
    },

    moveClones() {
        this.clones.forEach(c => {
            if (c.el && document.body.contains(c.el)) {
                const coords = this.getNonOverlappingCoords(20, 22);
                c.left = coords.left;
                c.top = coords.top;
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

        // B. Espadas Automáticas (swordsprite.png) volando hacia Saphyniel y bajando su vida a 0%
        const core = BossState.getBossCoreCenter();
        for (let i = this.judgmentSwords.length - 1; i >= 0; i--) {
            const sw = this.judgmentSwords[i];
            if (!sw) continue;

            sw.angle = Math.atan2(core.y - sw.y, core.x - sw.x);
            sw.x += Math.cos(sw.angle) * sw.speed * (dt * 60);
            sw.y += Math.sin(sw.angle) * sw.speed * (dt * 60);

            ctx.save();
            ctx.translate(sw.x, sw.y);
            // El sprite tiene el mango abajo y la punta hacia arriba (^), rotamos angle + Math.PI / 2
            ctx.rotate(sw.angle + Math.PI / 2);
            this.drawEnhancedSword(ctx, 48, 114);
            ctx.restore();

            // Impacto contra Saphyniel
            if (Math.hypot(sw.x - core.x, sw.y - core.y) < core.radius * 0.78) {
                ParticleEngine.explode(sw.x, sw.y, '#f7f5ed', 14);
                ParticleEngine.explode(sw.x, sw.y, '#e5c158', 10);
                if (typeof AudioManager !== 'undefined') AudioManager.swordImpactSound();
                if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();

                if (BossState.impaledSwords.length < 20) {
                    const impactDist = 24 + Math.random() * 26;
                    BossState.impaledSwords.push({
                        angle: sw.angle,
                        offsetX: -Math.cos(sw.angle) * impactDist,
                        offsetY: -Math.sin(sw.angle) * impactDist
                    });
                }

                // Bajar la vida de Saphyniel hasta 0% con cada espada clavada
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
                    if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.bombExplode);
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

        // E. Láseres Telegráficos
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
                    if (typeof AudioManager !== 'undefined') AudioManager.swordImpactSound();
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

        // F. Esferas Danmaku YoRHa (Con verificación de muerte para no lanzar TypeError)
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

    // --- MODO SUPERVIVENCIA Y JUICIO AUTOMÁTICO EN FASE 3 ---
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

        // 1. Lluvia Automática de Espadas desde los bordes que bajan la vida de Saphyniel a 0%
        let swordTick = 0;
        const dmgPerSword = Math.ceil(BossState.maxHp / 32); // ~32 espadas en 21 segundos llevan su vida exactamente a 0%
        this.swordBarrageTimer = setInterval(() => {
            if (BossState.phase !== 3 || BossState.playerHp <= 0 || BossState.isDying || BossState.currentHp <= 0) {
                clearInterval(this.swordBarrageTimer);
                return;
            }
            this.spawnJudgmentSword(swordTick % 8, dmgPerSword);
            swordTick++;
        }, 640);

        // 2. Ataques intensos y Embestidas constantes de Saphyniel cada 1.7s
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

            // Saphyniel embiste constantemente hacia tu nave
            BossState.startBossTackle();

            if (attackTick % 2 === 0) {
                this.spawnLaserGrid(2);
            }
            if (attackTick % 3 === 0) {
                this.spawnFaithOrb();
            }
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
    }
};

window.BossAttacks = BossAttacks;