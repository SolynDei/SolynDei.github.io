// =========================================================
// FILE: js/boss.js
// NAVE YORHA + COMPAÑERA ÁNGEL SOLYN (ESCALA REDUCIDA EN FASE S
// PARA CÁMARA ALEJADA + ARMAS 100% DEFENSIVAS)
// =========================================================
const BOSS_AUDIO_PATHS = {
    bgmPhase1: "audio/bgm/boss-music-fase1.mp3",
    bgmPhase2: "audio/bgm/boss-music-fase2.mp3",
    bgmPhase3: "audio/bgm/boss-music-fase3.mp3",
    bgmPhaseS: "audio/bgm/boss-music-fase-alternativa.mp3",
    bossIntro: "audio/sfx/superattack.mp3",
    bossDefeat: "audio/bgm/ending.mp3",
    vineBoom: "audio/sfx/boom.mp3",
    defeatLaugh: "audio/sfx/defeatlaught.mp3",
    crystalSpawn: "audio/sfx/crystalbreak.mp3",
    crystalBreak: "audio/sfx/crystalbreak.mp3",
    trapHeartSpawn: "audio/sfx/trapspawn.mp3",
    trapHeartHit: "audio/sfx/traphit.mp3",
    enrageAlarm: "audio/sfx/enragealarm.mp3",
    sealBreak: "audio/sfx/sealbreak.mp3",
    antiSpamBlock: "audio/sfx/antispamblock.mp3",
    hitBoss: "audio/sfx/hitboss.mp3",
    bombExplode: "audio/sfx/bombexplode.mp3",
    bellSound: "audio/sfx/bell.mp3",
    rewindSound: "audio/sfx/rewind.mp3",
    ecoOrbital: "audio/sfx/ecoorbital.mp3",
    endingBgm: "audio/bgm/ending.mp3"
};

const isMobile = window.innerWidth <= 920 || ('ontouchstart' in window);
const BOSS_SPRITES = {
    normal: "img/portraits/cabezanormal.png",
    angry: "img/portraits/cabezaenojada.png",
    yandere: "img/portraits/cabezayandere.png",
    corePhase1_2: "img/boss/core.png",
    corePhase3_pc: "img/boss/boos_fase3.gif",
    corePhase3_mobile: "img/boss/boss_fase3.png"
};

const BossState = {
    phase: 1, maxHp: 480, currentHp: 480, playerHp: 3, maxPlayerHp: 3,
    damageLock: true, isInvulnerable: false, weaponLost: false,
    history: [], battleStartTime: 0, hpAtStart: 0,

    railgunUsed: false,
    inPhaseSCheckpoint: false,
    solynCompanionActive: false,

    isDying: false,
    rebirthAssembled: false,
    deathSequenceTimers: [],
    deathFragments: [],
    deathShockwaveRadius: 0,
    deathOriginX: 0,
    deathOriginY: 0,

    shipX: window.innerWidth / 2,
    shipY: window.innerHeight * 0.78,
    shipSpeed: 385,
    keys: { w: false, a: false, s: false, d: false },
    joyDx: 0,
    joyDy: 0,

    playerBullets: [],
    fireCooldown: 0,
    fireRate: 0.085,
    hitsSinceLastMove: 0,
    lastPopupTime: 0,
    lastHitBossAudioTime: 0,
    aggroRange: 360,

    shieldActive: false,
    shieldTimer: 0,
    shieldDuration: 0.90,
    shieldCooldown: 0,
    shieldMaxCooldown: 1.50,
    playerIFrames: 0,

    railgunCharge: 0,
    railgunBeamTimer: 0,
    railgunMaxBeamDuration: 0.45,
    railgunTargetX: 0,
    railgunTargetY: 0,

    afterimages: [],
    lastCoreX: window.innerWidth / 2,
    lastCoreY: window.innerHeight * 0.3,
    impaledSwords: [],
    tackleState: 'idle',
    tackleTimer: 0,
    tackleOriginX: 0,
    tackleOriginY: 0,
    tackleTargetX: 0,
    tackleTargetY: 0,
    tackleHasHit: false,

    getShipRenderScale() {
        if (this.phase === 'S') {
            return isMobile ? 0.44 : 0.65; // Alejamiento de cámara en Fase S
        }
        return isMobile ? 0.58 : 1.0;
    },

    recordEvent(type, x, y) {
        if (this.phase < 3) {
            this.history.push({ time: Date.now() - this.battleStartTime, type, x, y, drawn: false });
        }
    },

    clearDeathTimers() {
        this.deathSequenceTimers.forEach(t => clearTimeout(t));
        this.deathSequenceTimers = [];
    },

    unlockCombatAchievementOnce(achId, displayTitle) {
        const storageKey = "saphyniel_codex_achievements_v1";
        let unlockedList = [];
        try {
            unlockedList = JSON.parse(localStorage.getItem(storageKey)) || [];
        } catch (e) {
            unlockedList = [];
        }

        const alreadyUnlocked = unlockedList.includes(achId);
        if (!alreadyUnlocked) {
            unlockedList.push(achId);
            localStorage.setItem(storageKey, JSON.stringify(unlockedList));
            if (displayTitle) {
                this.showCombatAchievementToast(displayTitle);
            }
        }
        window.parent.postMessage({ type: 'UNLOCK_ACHIEVEMENT', id: achId }, '*');
        return !alreadyUnlocked;
    },

    showCombatAchievementToast(title) {
        const toast = document.getElementById('boss-ach-toast');
        const titleEl = document.getElementById('boss-ach-toast-title');
        if (!toast || !titleEl) return;
        titleEl.textContent = title;
        toast.classList.add('show');
        if (typeof AudioManager !== 'undefined') AudioManager.liturgicalChime();
        setTimeout(() => toast.classList.remove('show'), 3600);
    },

    triggerAnimeImpactFrame() {
        const frame = document.getElementById('anime-impact-frame');
        if (!frame) return;
        frame.classList.remove('active');
        void frame.offsetWidth;
        frame.classList.add('active');
        setTimeout(() => frame.classList.remove('active'), 180);
    },

    showSpecialCutin() {
        return;
    },

    triggerCoreRgbGlitch() {
        const img = document.getElementById('boss-core-img');
        if (!img) return;
        img.classList.add('rgb-glitch');
        setTimeout(() => img.classList.remove('rgb-glitch'), 220);
    },

    getBossCoreCenter() {
        const core = document.getElementById('boss-core');
        if (core && core.style.display !== 'none') {
            const r = core.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius: r.width * 0.42, kind: 'core' };
        }
        return { x: window.innerWidth / 2, y: window.innerHeight * 0.30, radius: 42, kind: 'core' };
    },

    getPriorityTarget() {
        let bestNode = null;
        let minDist = this.aggroRange;

        for (let i = 0; i < BossAttacks.nodes.length; i++) {
            const n = BossAttacks.nodes[i];
            const d = Math.hypot(n.x - this.shipX, n.y - this.shipY);
            if (d <= minDist) {
                minDist = d;
                bestNode = n;
            }
        }
        if (bestNode) {
            return { x: bestNode.x, y: bestNode.y, radius: bestNode.radius, kind: 'node', ref: bestNode };
        }

        for (let i = 0; i < BossAttacks.clones.length; i++) {
            const c = BossAttacks.clones[i];
            if (c.x && c.y) {
                const d = Math.hypot(c.x - this.shipX, c.y - this.shipY);
                if (d <= 300) {
                    return { x: c.x, y: c.y, radius: 42, kind: 'clone', ref: c };
                }
            }
        }

        return this.getBossCoreCenter();
    },

    startBossTackle() {
        const core = document.getElementById('boss-core');
        if (!core || core.style.display === 'none' || this.tackleState !== 'idle' || this.currentHp <= 0 || this.isDying) return;

        const cPos = this.getBossCoreCenter();
        this.tackleOriginX = cPos.x;
        this.tackleOriginY = cPos.y;
        this.tackleTargetX = Math.max(70, Math.min(window.innerWidth - 70, this.shipX));
        this.tackleTargetY = Math.max(90, Math.min(window.innerHeight - 70, this.shipY));
        this.tackleState = 'warn';
        this.tackleTimer = 0.52;
        this.tackleHasHit = false;

        if (typeof AudioManager !== 'undefined') AudioManager.beep(520, 0.16, 'sawtooth', 0.045);
    },

    updateBossTackleAndBlur(dt, ctx) {
        const core = document.getElementById('boss-core');
        const coreImg = document.getElementById('boss-core-img');
        if (!core || core.style.display === 'none') return;

        const curPos = this.getBossCoreCenter();
        const moveDist = Math.hypot(curPos.x - this.lastCoreX, curPos.y - this.lastCoreY);

        if (moveDist > 4.0 && coreImg) {
            this.afterimages.push({
                x: curPos.x,
                y: curPos.y,
                size: curPos.radius * 2.1,
                alpha: 0.5,
                img: coreImg
            });
        }
        this.lastCoreX = curPos.x;
        this.lastCoreY = curPos.y;

        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const af = this.afterimages[i];
            af.alpha -= dt * 1.9;
            if (af.alpha <= 0) {
                this.afterimages.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.max(0, af.alpha);
            ctx.translate(af.x, af.y);
            try {
                ctx.drawImage(af.img, -af.size / 2, -af.size / 2, af.size, af.size);
            } catch (e) {}
            ctx.restore();
        }

        if (this.tackleState === 'warn') {
            this.tackleTimer -= dt;
            ctx.save();
            ctx.strokeStyle = `rgba(217, 56, 30, ${0.5 + Math.sin(performance.now() * 0.035) * 0.35})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.moveTo(curPos.x, curPos.y);
            ctx.lineTo(this.tackleTargetX, this.tackleTargetY);
            ctx.stroke();

            ctx.strokeStyle = '#e5c158';
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(this.tackleTargetX, this.tackleTargetY, 26, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            if (this.tackleTimer <= 0) {
                this.tackleState = 'charge';
                this.tackleTimer = 0.35;
                core.classList.add('tackle-mode');
                if (typeof AudioManager !== 'undefined') AudioManager.swordImpactSound();
            }
        } else if (this.tackleState === 'charge') {
            this.tackleTimer -= dt;
            const progress = Math.min(1, 1 - (this.tackleTimer / 0.35));
            const ease = 1 - Math.pow(1 - progress, 3);
            const nx = this.tackleOriginX + (this.tackleTargetX - this.tackleOriginX) * ease;
            const ny = this.tackleOriginY + (this.tackleTargetY - this.tackleOriginY) * ease;

            core.style.left = `${(nx / window.innerWidth) * 100}%`;
            core.style.top = `${(ny / window.innerHeight) * 100}%`;

            const distToShip = Math.hypot(nx - this.shipX, ny - this.shipY);
            if (!this.tackleHasHit && distToShip < curPos.radius + 18) {
                this.tackleHasHit = true;
                if (this.shieldActive) {
                    if (this.phase === 'S' && typeof PhaseSUIArena !== 'undefined') {
                        PhaseSUIArena.spawnFreeButterflyBurst(this.shipX, this.shipY, 10);
                    } else {
                        ParticleEngine.explode(this.shipX, this.shipY, '#e5c158', 30);
                    }
                    this.triggerAnimeImpactFrame();
                    if (typeof AudioManager !== 'undefined') {
                        AudioManager.parryClangSound();
                        AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock, 0.6);
                    }
                    if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
                    if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(this.shipX, this.shipY, 1.8);
                } else {
                    this.tryHitPlayer(this.shipX, this.shipY);
                    if (this.isDying || this.playerHp <= 0) return;
                }
            }

            if (this.tackleTimer <= 0) {
                this.tackleState = 'idle';
                core.classList.remove('tackle-mode');
                BossAttacks.spawnDanmakuRing(nx, ny, 8, 3.3, 'ring');
                setTimeout(() => { if (this.tackleState === 'idle' && !this.isDying) this.moveBossCore(); }, 180);
            }
        }

        if (this.impaledSwords.length > 0) {
            this.impaledSwords.forEach(sw => {
                ctx.save();
                ctx.translate(curPos.x + sw.offsetX, curPos.y + sw.offsetY);
                ctx.rotate(sw.angle + Math.PI / 2);
                BossAttacks.drawEnhancedSword(ctx, 40, 96);
                ctx.restore();
            });
        }
    },

    activateShield() {
        if (this.shieldActive || this.shieldCooldown > 0 || this.playerHp <= 0 || this.isDying) return;
        this.shieldActive = true;
        this.shieldTimer = this.shieldDuration;
        this.shieldCooldown = this.shieldMaxCooldown;

        if (typeof AudioManager !== 'undefined') AudioManager.evadeOverclockSound();
        if (typeof ParticleEngine !== 'undefined') {
            ParticleEngine.explode(this.shipX, this.shipY, this.solynCompanionActive ? '#ffffff' : '#dad4bb', 14);
        }
    },

    activateRailgun() {
        if (this.playerHp <= 0 || this.isDying || this.weaponLost || this.damageLock || this.railgunCharge < 100) return;

        // En Fase S, [E] es una onda puramente defensiva que disuelve proyectiles en mariposas libres
        if (this.phase === 'S') {
            this.railgunCharge = 0;
            if (typeof PhaseS !== 'undefined') {
                PhaseS.triggerHitStop(0.055);
            }
            if (typeof PhaseSUIArena !== 'undefined') {
                PhaseSUIArena.triggerAstralResonancePulse();
            }
            return;
        }

        this.railgunUsed = true;
        this.railgunCharge = 0;
        this.railgunMaxBeamDuration = 0.45;
        this.railgunBeamTimer = 0.45;
        const target = this.getPriorityTarget();
        this.railgunTargetX = target.x;
        this.railgunTargetY = target.y;

        this.triggerAnimeImpactFrame();
        this.triggerCoreRgbGlitch();

        if (typeof AudioManager !== 'undefined') {
            AudioManager.railgunFireSound();
            AudioManager.playAudio(BOSS_AUDIO_PATHS.ecoOrbital, 0.55);
            AudioManager.playAudio(BOSS_AUDIO_PATHS.hitBoss, 0.65);
        }
        if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
        if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(target.x, target.y, 1.5);
        if (typeof ParticleEngine !== 'undefined') ParticleEngine.explode(target.x, target.y, '#e5c158', 30);

        BossAttacks.bullets = [];

        if (target.kind === 'node' && target.ref) {
            const idx = BossAttacks.nodes.indexOf(target.ref);
            if (idx !== -1) BossAttacks.nodes.splice(idx, 1);
            this.dealDamageToBoss(25, target.x, target.y, true);
        } else {
            this.dealDamageToBoss(25, target.x, target.y, true);
        }
    },

    dealDamageToBoss(dmg, hitX, hitY, isRailgun = false) {
        if (localStorage.getItem('codex_debug_oneshot') === 'true') dmg = 9999;
        if (this.damageLock || this.weaponLost || this.isDying || this.phase === 'S') return;

        this.currentHp = Math.max(1, this.currentHp - dmg);
        this.recordEvent('hit', hitX, hitY);
        this.updateHpBar();

        const now = performance.now();
        if (!isRailgun && now - this.lastHitBossAudioTime > 420) {
            this.lastHitBossAudioTime = now;
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playAudio(BOSS_AUDIO_PATHS.hitBoss, 0.35);
            }
        }

        if (isRailgun || now - this.lastPopupTime > 190) {
            this.lastPopupTime = now;
            this.spawnDamagePopup(hitX, hitY, isRailgun ? `RAILGUN -${dmg}` : dmg, isRailgun ? 'blocked' : 'normal');
        }

        this.hitsSinceLastMove += dmg;
        if (this.hitsSinceLastMove >= 24 && this.tackleState === 'idle') {
            this.hitsSinceLastMove = 0;
            this.moveBossCore();
        }

        BossEngine.handleHit(dmg, { x: hitX, y: hitY });
    },

    renderDeathShatterSequence(dt, ctx) {
        this.deathShockwaveRadius += dt * 320;
        const maxR = Math.max(window.innerWidth, window.innerHeight) * 0.7;

        if (this.deathShockwaveRadius < maxR) {
            const alpha = Math.max(0, 1 - this.deathShockwaveRadius / maxR);
            ctx.save();
            ctx.strokeStyle = `rgba(218, 212, 187, ${alpha * 0.75})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.deathOriginX, this.deathOriginY, this.deathShockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = `rgba(217, 56, 30, ${alpha * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.deathOriginX, this.deathOriginY, this.deathShockwaveRadius * 0.65, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        for (let i = this.deathFragments.length - 1; i >= 0; i--) {
            const f = this.deathFragments[i];
            f.x += f.vx * (dt * 60);
            f.y += f.vy * (dt * 60);
            if (!f.noGravity) {
                f.vx *= 0.985;
                f.vy = f.vy * 0.985 + 0.04;
            }
            f.rot += f.vRot;
            f.life -= f.decay * dt;

            if (f.life <= 0) {
                this.deathFragments.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rot);
            ctx.globalAlpha = Math.max(0, f.life);
            ctx.fillStyle = f.color;
            ctx.shadowColor = f.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
            ctx.restore();
        }

        if (this.rebirthAssembled) {
            ctx.save();
            ctx.translate(this.shipX, this.shipY);
            const shipScale = this.getShipRenderScale();
            ctx.scale(shipScale, shipScale);
            ctx.fillStyle = '#f7f5ed';
            ctx.strokeStyle = '#e5c158';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#f7f5ed';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.moveTo(0, -22);
            ctx.lineTo(18, 15);
            ctx.lineTo(6, 10);
            ctx.lineTo(0, 16);
            ctx.lineTo(-6, 10);
            ctx.lineTo(-18, 15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    },

    renderSolynAngelCompanion(ctx) {
        if (!this.solynCompanionActive) return;
        const shipScale = this.getShipRenderScale();
        const t = performance.now() * 0.004;
        const compX = this.shipX + 34 * shipScale + Math.cos(t) * 5;
        const compY = this.shipY - 14 * shipScale + Math.sin(t * 1.5) * 6;

        ctx.save();
        ctx.translate(compX, compY);
        ctx.scale(shipScale, shipScale);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo((this.shipX - compX) / shipScale, (this.shipY - compY) / shipScale);
        ctx.stroke();

        const flap = Math.sin(t * 2.5) * 0.22;
        [-1, 1].forEach(dir => {
            ctx.save();
            ctx.scale(dir, 1);
            ctx.rotate(-0.3 + flap);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.strokeStyle = '#e5c158';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(4, 0);
            ctx.lineTo(28, -14);
            ctx.lineTo(20, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e5c158';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -12, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    updateAndRenderShip(dt, ctx) {
        if (this.isDying) {
            this.renderDeathShatterSequence(dt, ctx);
            return;
        }
        if (this.phase === 'S' && typeof PhaseS !== 'undefined' && PhaseS.inPlaceRefusalActive) {
            return;
        }
        if (this.playerHp <= 0) return;

        this.updateBossTackleAndBlur(dt, ctx);
        if (this.isDying || this.playerHp <= 0) return;

        let vx = this.joyDx;
        let vy = this.joyDy;
        if (this.keys.w) vy -= 1;
        if (this.keys.s) vy += 1;
        if (this.keys.a) vx -= 1;
        if (this.keys.d) vx += 1;

        if (vx !== 0 || vy !== 0) {
            const len = Math.hypot(vx, vy);
            if (len > 1) { vx /= len; vy /= len; }
            const speedBoost = (this.phase === 'S' && this.solynCompanionActive) ? 1.15 : 1.0;
            this.shipX += vx * this.shipSpeed * speedBoost * dt;
            this.shipY += vy * this.shipSpeed * speedBoost * dt;
        }

        const margin = 26;
        this.shipX = Math.max(margin, Math.min(window.innerWidth - margin, this.shipX));
        this.shipY = Math.max(margin + 60, Math.min(window.innerHeight - margin - 20, this.shipY));

        const cooldownMult = this.silverMultiplier || 1.0;

        if (this.playerIFrames > 0) this.playerIFrames = Math.max(0, this.playerIFrames - dt);
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        } else if (this.shieldCooldown > 0) {
            this.shieldCooldown = Math.max(0, this.shieldCooldown - dt * cooldownMult * (this.weaponLost ? 1.5 : 1.0));
        }

        if (!this.damageLock && !this.weaponLost && this.railgunCharge < 100 && this.phase !== 'S') {
            this.railgunCharge = Math.min(100, this.railgunCharge + dt * 9 * cooldownMult);
        }
        if (localStorage.getItem('codex_debug_infrail') === 'true') {
            this.railgunCharge = 100;
            this.shieldCooldown = 0;
        }
        this.updateSkillHudBars();

        const target = this.getPriorityTarget();
        const aimAngle = Math.atan2(target.y - this.shipY, target.x - this.shipX);

        this.fireCooldown -= dt;
        const effectiveFireRate = this.fireRate;
        if (this.phase !== 'S' && this.fireCooldown <= 0 && !this.damageLock && !this.weaponLost && this.playerHp > 0) {
            this.fireCooldown = effectiveFireRate;
            const spread = (Math.random() - 0.5) * 10;
            const perpX = -Math.sin(aimAngle) * spread;
            const perpY = Math.cos(aimAngle) * spread;

            this.playerBullets.push({
                x: this.shipX + Math.cos(aimAngle) * 18 + perpX,
                y: this.shipY + Math.sin(aimAngle) * 18 + perpY,
                vx: Math.cos(aimAngle) * 16,
                vy: Math.sin(aimAngle) * 16
            });
            if (typeof AudioManager !== 'undefined' && Math.random() < 0.3) {
                AudioManager.podFireSound();
            }
        }

        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const pb = this.playerBullets[i];
            if (!pb) continue;
            pb.x += pb.vx * (dt * 60);
            pb.y += pb.vy * (dt * 60);

            if (pb.x < -20 || pb.x > window.innerWidth + 20 || pb.y < -20 || pb.y > window.innerHeight + 20) {
                this.playerBullets.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.fillStyle = '#f7f5ed';
            ctx.shadowColor = '#dad4bb';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pb.x, pb.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            let hitNode = false;
            for (let j = BossAttacks.nodes.length - 1; j >= 0; j--) {
                const n = BossAttacks.nodes[j];
                if (n && Math.hypot(pb.x - n.x, pb.y - n.y) < n.radius + 6) {
                    n.hp -= 1;
                    this.railgunCharge = Math.min(100, this.railgunCharge + 1.2);
                    ParticleEngine.explode(pb.x, pb.y, '#e5c158', 2);
                    if (n.hp <= 0) {
                        ParticleEngine.explode(n.x, n.y, '#dad4bb', 18);
                        if (typeof AudioManager !== 'undefined') {
                            const sfxUrl = n.type === 'bomb' ? BOSS_AUDIO_PATHS.crystalBreak : BOSS_AUDIO_PATHS.sealBreak;
                            AudioManager.playAudio(sfxUrl, 0.55);
                        }
                        BossAttacks.nodes.splice(j, 1);
                    }
                    hitNode = true;
                    break;
                }
            }
            if (hitNode) {
                this.playerBullets.splice(i, 1);
                continue;
            }

            let hitClone = false;
            for (let j = BossAttacks.clones.length - 1; j >= 0; j--) {
                const c = BossAttacks.clones[j];
                if (c && c.x && c.y && Math.hypot(pb.x - c.x, pb.y - c.y) < 42) {
                    c.hp -= 1;
                    ParticleEngine.explode(pb.x, pb.y, '#d9381e', 2);
                    if (c.hp <= 0) {
                        ParticleEngine.explode(c.x, c.y, '#d9381e', 18);
                        if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.crystalBreak, 0.55);
                        if (c.el) c.el.remove();
                        BossAttacks.clones.splice(j, 1);
                    }
                    hitClone = true;
                    break;
                }
            }
            if (hitClone) {
                this.playerBullets.splice(i, 1);
                continue;
            }

            const corePos = this.getBossCoreCenter();
            if (Math.hypot(pb.x - corePos.x, pb.y - corePos.y) < corePos.radius) {
                this.playerBullets.splice(i, 1);
                this.railgunCharge = Math.min(100, this.railgunCharge + 0.65);
                ParticleEngine.explode(pb.x, pb.y, '#dad4bb', 2);
                this.dealDamageToBoss(1, pb.x, pb.y, false);
            }
        }

        if (this.railgunBeamTimer > 0) {
            this.railgunBeamTimer -= dt;
            const progressRatio = Math.max(0, this.railgunBeamTimer / (this.railgunMaxBeamDuration || 0.45));
            const beamWidth = 38 * progressRatio;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#e5c158';
            ctx.lineWidth = beamWidth;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.moveTo(this.shipX, this.shipY);
            ctx.lineTo(this.railgunTargetX, this.railgunTargetY);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = beamWidth * 0.45;
            ctx.beginPath();
            ctx.moveTo(this.shipX, this.shipY);
            ctx.lineTo(this.railgunTargetX, this.railgunTargetY);
            ctx.stroke();
            ctx.restore();
        }

        this.renderSolynAngelCompanion(ctx);

        ctx.save();
        ctx.translate(this.shipX, this.shipY);
        const shipScale = this.getShipRenderScale();
        ctx.scale(shipScale, shipScale);

        if (this.shieldActive) {
            const shieldRad = this.solynCompanionActive ? 64 : 36;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.rotate(performance.now() * 0.005);
            ctx.strokeStyle = '#ffffff';
            ctx.fillStyle = this.solynCompanionActive ? 'rgba(255, 235, 160, 0.28)' : 'rgba(218, 212, 187, 0.22)';
            ctx.lineWidth = this.solynCompanionActive ? 3.5 : 2.5;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = this.solynCompanionActive ? 26 : 16;
            ctx.beginPath();
            const sides = this.solynCompanionActive ? 8 : 6;
            for (let s = 0; s < sides; s++) {
                const a = (Math.PI * 2 * s) / sides;
                const rx = Math.cos(a) * shieldRad;
                const ry = Math.sin(a) * shieldRad;
                if (s === 0) ctx.moveTo(rx, ry);
                else ctx.lineTo(rx, ry);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.rotate(aimAngle + Math.PI / 2);

        ctx.fillStyle = this.solynCompanionActive ? '#ffffff' : (this.weaponLost ? '#d9381e' : '#f7f5ed');
        ctx.shadowColor = this.solynCompanionActive ? '#ffd700' : '#dad4bb';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-7, 14);
        ctx.lineTo(0, 24 + Math.random() * 8);
        ctx.lineTo(7, 14);
        ctx.fill();

        ctx.fillStyle = this.solynCompanionActive ? '#ffffff' : (this.weaponLost ? '#8b8778' : '#dad4bb');
        ctx.strokeStyle = '#f7f5ed';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(16, 14);
        ctx.lineTo(6, 9);
        ctx.lineTo(0, 15);
        ctx.lineTo(-6, 9);
        ctx.lineTo(-16, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.weaponLost ? '#d9381e' : (this.railgunCharge >= 100 ? '#e5c158' : '#09090b');
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    updateSkillHudBars() {
        const shieldFill = document.getElementById('shield-bar-fill');
        const mobShieldBtn = document.getElementById('mob-shield-btn');
        const mobShieldState = document.getElementById('mob-shield-state');

        if (this.shieldActive) {
            const pct = (this.shieldTimer / this.shieldDuration) * 100;
            if (shieldFill) shieldFill.style.width = `${pct}%`;
            if (mobShieldBtn) mobShieldBtn.classList.add('active');
            if (mobShieldState) mobShieldState.textContent = "ACTIVO";
        } else if (this.shieldCooldown > 0) {
            const pct = ((this.shieldMaxCooldown - this.shieldCooldown) / this.shieldMaxCooldown) * 100;
            if (shieldFill) shieldFill.style.width = `${pct}%`;
            if (mobShieldBtn) mobShieldBtn.classList.remove('active');
            if (mobShieldState) mobShieldState.textContent = `${this.shieldCooldown.toFixed(1)}s`;
        } else {
            if (shieldFill) shieldFill.style.width = '100%';
            if (mobShieldBtn) mobShieldBtn.classList.remove('active');
            if (mobShieldState) mobShieldState.textContent = "LISTO";
        }

        const railFill = document.getElementById('railgun-bar-fill');
        const railLabel = document.getElementById('railgun-label');
        const railBox = document.getElementById('hud-railgun-btn');
        const mobRailBtn = document.getElementById('mob-railgun-btn');
        const mobRailState = document.getElementById('mob-railgun-state');

        if (this.weaponLost) {
            if (railBox) {
                railBox.classList.remove('ready');
                railBox.classList.add('disabled-weapon');
            }
            if (railLabel) railLabel.textContent = "ARMAMENTO: DEPUESTO";
            if (mobRailBtn) mobRailBtn.classList.remove('ready');
            if (mobRailState) mobRailState.textContent = "ROTO";
            return;
        }

        if (railBox) railBox.classList.remove('disabled-weapon');
        const rPct = Math.floor(this.railgunCharge);
        if (railFill) railFill.style.width = `${rPct}%`;
        const prefix = this.phase === 'S' ? "DISPERSAR [E]" : "RAILGUN [E]";
        if (railLabel) railLabel.textContent = rPct >= 100 ? `${prefix} ¡LISTO!` : `${prefix}${rPct}%`;
        if (railBox) railBox.classList.toggle('ready', rPct >= 100);
        if (mobRailBtn) mobRailBtn.classList.toggle('ready', rPct >= 100);
        if (mobRailState) mobRailState.textContent = rPct >= 100 ? "¡LIBERAR!" : `${rPct}%`;
    },

    tryHitPlayer(x, y) {
        if (localStorage.getItem('codex_debug_godmode') === 'true') {
            this.spawnDamagePopup(this.shipX, this.shipY - 20, 'GODMODE', 'blocked');
            return;
        }
        if (this.isDying || this.playerHp <= 0) return;
        if (this.phase === 'S' && typeof PhaseS !== 'undefined' && (PhaseS.unionCutsceneActive || PhaseS.inPlaceRefusalActive)) return;

        if (this.shieldActive) {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.parryClangSound();
                AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock, 0.5);
            }
            return;
        }
        if (this.playerIFrames > 0) return;
        this.playerIFrames = 1.15;
        this.damagePlayer();
    },

    resetBossEncounter(keepPhaseSCheckpoint = false) {
        this.clearDeathTimers();
        this.isDying = false;
        this.rebirthAssembled = false;
        this.deathFragments = [];
        this.deathShockwaveRadius = 0;

        if (!keepPhaseSCheckpoint) {
            this.railgunUsed = false;
            this.inPhaseSCheckpoint = false;
            this.solynCompanionActive = false;
        }

        DialogueSystem.hide();
        BossAttacks.clearAll();
        if (BossEngine.currentPhase && typeof BossEngine.currentPhase.exit === 'function') {
            BossEngine.currentPhase.exit();
        }

        if (typeof ParticleEngine !== 'undefined') {
            ParticleEngine.particles = [];
            ParticleEngine.swords = [];
            ParticleEngine.petals = [];
            ParticleEngine.lunarFlowers = [];
            if (ParticleEngine.ctx && ParticleEngine.canvas) {
                ParticleEngine.ctx.clearRect(0, 0, ParticleEngine.canvas.width, ParticleEngine.canvas.height);
            }
            ParticleEngine.resume();
        }
        if (typeof BalatroEngine !== 'undefined' && !BalatroEngine.animId) {
            BalatroEngine.render();
        }

        let blessingsList = [];
        try { blessingsList = JSON.parse(localStorage.getItem('codex_active_blessings_list')) || []; } catch (e) {}
        if (blessingsList.length === 0 && localStorage.getItem('codex_active_blessing')) {
            blessingsList = [localStorage.getItem('codex_active_blessing')];
        }
        const goldCount = blessingsList.filter(b => b === 'gold').length;
        const crimsonCount = blessingsList.filter(b => b === 'crimson').length;
        const silverCount = blessingsList.filter(b => b === 'silver').length;
        this.maxPlayerHp = 3 + goldCount;
        this.fireRate = Math.max(0.045, 0.085 * Math.pow(0.78, crimsonCount));
        this.silverMultiplier = 1.0 + (silverCount * 0.28);
        this.playerHp = this.maxPlayerHp;
        this.shipX = window.innerWidth / 2;
        this.shipY = window.innerHeight * 0.78;
        this.keys = { w: false, a: false, s: false, d: false };
        this.joyDx = 0;
        this.joyDy = 0;
        this.playerBullets = [];
        this.afterimages = [];
        this.impaledSwords = [];
        this.tackleState = 'idle';
        this.railgunCharge = 50;
        this.shieldActive = false;
        this.shieldCooldown = 0;
        this.playerIFrames = 0;
        this.weaponLost = false;

        document.body.className = 'combat-no-cursor';
        document.getElementById('cinematic-darkness')?.classList.remove('active');
        document.getElementById('silencio-overlay')?.classList.remove('show');
        document.getElementById('plastic-horse-overlay')?.classList.remove('show');
        document.getElementById('carton-sword-overlay')?.classList.remove('show');

        const core = document.getElementById('boss-core');
        if (core) {
            core.style.display = 'flex';
            core.style.opacity = '1';
            core.style.top = '30%';
            core.style.left = '50%';
            core.style.transform = `translate(-50%, -50%) scale(${isMobile ? 1.0 : 1.45})`;
            core.className = 'boss-core-container';
        }

        const coreImg = document.getElementById('boss-core-img');
        if (coreImg) {
            coreImg.className = 'boss-core-img';
            coreImg.src = BOSS_SPRITES.corePhase1_2;
        }

        const bossHud = document.getElementById('boss-hud');
        if (bossHud) { bossHud.style.display = 'flex'; bossHud.style.opacity = '1'; }

        const playerHud = document.getElementById('player-hud');
        if (playerHud) { playerHud.style.display = 'flex'; playerHud.style.opacity = '1'; }

        const heartsRow = document.getElementById('hearts-row');
        if (heartsRow) {
            heartsRow.innerHTML = Array.from({ length: this.maxPlayerHp }, (_, idx) =>
                `<span class="player-heart" id="heart-${idx + 1}">❤</span>`
            ).join('');
        }

        document.getElementById('boss-shield')?.classList.remove('active', 'divine');
        document.getElementById('boss-aura-farm')?.classList.remove('active', 'max-power');
        document.getElementById('ending-screen')?.classList.remove('visible');
        document.getElementById('game-over-screen')?.classList.remove('visible');
        document.getElementById('end-record-final')?.classList.remove('active');
        const lyrics = document.getElementById('lyrics-container');
        if (lyrics) lyrics.innerHTML = '';
    },

    updateCoreSprite() {
        const img = document.getElementById('boss-core-img');
        if (!img) return;
        if (this.phase === 3 || this.phase === 'S') {
            img.src = isMobile ? BOSS_SPRITES.corePhase3_mobile : BOSS_SPRITES.corePhase3_pc;
        } else if (this.phase === 2) {
            img.src = "img/boss/ddddboss_fase2.png";
            img.onerror = () => { img.src = BOSS_SPRITES.corePhase1_2; };
        } else {
            img.src = BOSS_SPRITES.corePhase1_2;
        }
    },

    updateHpBar() {
        const ratio = Math.max(0, this.currentHp / this.maxHp);
        const pct = Math.round(ratio * 100);
        const fill = document.getElementById('boss-hp-fill');
        const num = document.getElementById('boss-hp-num');
        const core = document.getElementById('boss-core');
        if (fill) fill.style.width = `${pct}%`;
        if (num) num.textContent = this.phase === 'S' ? `[AUTOPURIFICACIÓN ${pct}%]` : `[${pct}%]`;
        if (core) core.classList.toggle('critical-hp', this.phase !== 'S' && ratio > 0 && ratio <= 0.25);
        if (typeof BalatroEngine !== 'undefined') {
            BalatroEngine.setBossHpRatio(ratio);
        }
    },

    spawnDamagePopup(x, y, dmg, type = 'normal') {
        const el = document.createElement('div');
        el.className = `damage-number ${type}`;
        if (type === 'heal') el.textContent = typeof dmg === 'number' ? `+${dmg}` : dmg;
        else if (type === 'blocked') el.textContent = dmg;
        else el.textContent = `-${dmg}`;
        el.style.left = `${x + (Math.random() - 0.5) * 35}px`;
        el.style.top = `${y + (Math.random() - 0.5) * 20}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 550);
    },

    damagePlayer() {
        if (this.playerHp <= 0 || this.isDying) return;

        if (this.phase === 'S' && typeof PhaseS !== 'undefined') {
            if (this.playerHp <= 1) {
                PhaseS.triggerInPlaceRefusal();
                return;
            }
            if (this.solynCompanionActive) {
                PhaseS.sacrificeOneGoldenHeart();
                return;
            }
        }

        this.playerHp--;
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartHit, 0.55);
            AudioManager.beep(90, 0.3, 'sawtooth', 0.08);
        }
        if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
        for (let i = 1; i <= this.maxPlayerHp; i++) {
            const heart = document.getElementById(`heart-${i}`);
            if (heart) heart.classList.toggle('lost', i > this.playerHp);
        }
        if (this.playerHp <= 0) {
            this.triggerBadEnding();
        }
    },

    triggerBadEnding() {
        if (this.isDying) return;
        this.isDying = true;
        this.rebirthAssembled = false;
        this.damageLock = true;
        this.playerBullets = [];
        this.clearDeathTimers();

        DialogueSystem.hide();
        BossAttacks.clearAll();
        AudioManager.stopBgm();

        if (BossEngine.currentPhase && typeof BossEngine.currentPhase.exit === 'function') {
            BossEngine.currentPhase.exit();
        }

        this.deathOriginX = this.shipX;
        this.deathOriginY = this.shipY;
        this.deathShockwaveRadius = 5;
        this.deathFragments = [];

        const palette = ['#f7f5ed', '#dad4bb', '#e5c158', '#d9381e', '#8b8778'];
        for (let i = 0; i < 65; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 7.5;
            this.deathFragments.push({
                x: this.shipX + (Math.random() - 0.5) * 16,
                y: this.shipY + (Math.random() - 0.5) * 16,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                size: 4 + Math.random() * 8,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.14,
                life: 1.0,
                decay: 0.22 + Math.random() * 0.18,
                color: palette[i % palette.length]
            });
        }

        if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(this.shipX, this.shipY, 1.8);
        if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playAudio(BOSS_AUDIO_PATHS.bombExplode, 0.55);
            AudioManager.beep(110, 0.8, 'sawtooth', 0.08);
        }

        ParticleEngine.startPetalRain(45);
        const lyrics = document.getElementById('lyrics-container');
        if (lyrics) lyrics.innerHTML = '';

        window.parent.postMessage({ type: 'UNLOCK_PSALMS_REROLL' }, '*');

        const t1 = setTimeout(() => {
            document.getElementById('cinematic-darkness')?.classList.add('active');
            document.getElementById('boss-hud').style.display = 'none';
            document.getElementById('player-hud').style.display = 'none';

            AudioManager.playAudio(BOSS_AUDIO_PATHS.defeatLaugh, 0.65);

            DialogueSystem.show({
                text: "Tanto ruido, tanta prisa por derribar mis muros... solo para quedarnos los dos en el mismo silencio.",
                speaker: "SAPHYNIEL",
                tone: "yandere",
                autoHideTime: 3600,
                spriteMap: BOSS_SPRITES,
                callback: () => {
                    this.showGameOverModal();
                }
            });
        }, 1100);
        this.deathSequenceTimers.push(t1);
    },

    showGameOverModal() {
        DialogueSystem.hide();
        document.body.className = '';
        document.getElementById('boss-core').style.display = 'none';
        const goScreen = document.getElementById('game-over-screen');
        if (goScreen) goScreen.classList.add('visible');
    },

    triggerUndertaleRebirth() {
        this.clearDeathTimers();
        DialogueSystem.hide();
        document.getElementById('game-over-screen')?.classList.remove('visible');
        document.getElementById('cinematic-darkness')?.classList.add('active');
        document.body.className = 'combat-no-cursor';

        if (typeof ParticleEngine !== 'undefined') {
            ParticleEngine.petals = [];
            ParticleEngine.resume();
        }
        BossEngine.startLoop();

        const cx = window.innerWidth / 2;
        const cy = window.innerHeight * 0.72;
        this.shipX = cx;
        this.shipY = cy;

        this.isDying = true;
        this.rebirthAssembled = false;
        this.deathShockwaveRadius = 99999;
        this.deathFragments = [];

        for (let i = 0; i < 42; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const spreadX = side * (28 + Math.random() * 55);
            const spreadY = (Math.random() - 0.5) * 70;
            this.deathFragments.push({
                x: cx + spreadX,
                y: cy + spreadY,
                vx: 0,
                vy: 0,
                size: 5 + (i % 3) * 2,
                rot: Math.random() * Math.PI * 2,
                vRot: 0.08,
                life: 1.0,
                decay: 0,
                noGravity: true,
                color: i % 3 === 0 ? '#e5c158' : '#f7f5ed'
            });
        }

        if (typeof AudioManager !== 'undefined' && typeof AudioManager.undertaleRefuseRumble === 'function') {
            AudioManager.undertaleRefuseRumble();
        }
        const shakeInterval = setInterval(() => {
            this.deathFragments.forEach(f => {
                f.x += (Math.random() - 0.5) * 7;
                f.y += (Math.random() - 0.5) * 7;
            });
        }, 35);

        const tAssemble = setTimeout(() => {
            clearInterval(shakeInterval);
            if (typeof AudioManager !== 'undefined' && typeof AudioManager.undertaleRefuseHeal === 'function') {
                AudioManager.undertaleRefuseHeal();
            }
            this.deathFragments.forEach(f => {
                f.vx = (cx - f.x) / 14;
                f.vy = (cy - f.y) / 14;
            });
        }, 650);

        const tGlow = setTimeout(() => {
            this.deathFragments = [];
            this.rebirthAssembled = true;
            ParticleEngine.explode(cx, cy, '#e5c158', 24);
        }, 950);

        const tStart = setTimeout(() => {
            this.rebirthAssembled = false;
            const resumeInPhaseS = this.inPhaseSCheckpoint;
            this.resetBossEncounter(resumeInPhaseS);
            this.battleStartTime = Date.now();
            this.history = [];
            BossEngine.startLoop();
            if (resumeInPhaseS) {
                BossEngine.transitionTo('phaseS');
            } else {
                BossEngine.transitionTo('phase1', true);
            }
        }, 1350);

        this.deathSequenceTimers.push(tAssemble, tGlow, tStart);
    },

    moveBossCore() {
        const core = document.getElementById('boss-core');
        if (!core || this.tackleState !== 'idle' || this.isDying) return;
        const targetX = isMobile ? Math.random() * 50 + 25 : Math.random() * 62 + 19;
        const targetY = isMobile ? Math.random() * 24 + 18 : Math.random() * 28 + 16;

        const cPos = this.getBossCoreCenter();
        if (typeof BalatroEngine !== 'undefined') {
            BalatroEngine.triggerHit(cPos.x, cPos.y, 0.55);
        }

        core.style.top = `${targetY}%`;
        core.style.left = `${targetX}%`;
        this.recordEvent('move', targetX, targetY);
        if (BossAttacks.clones.length > 0) BossAttacks.moveClones();
    }
};

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || e.key === 'ArrowUp') BossState.keys.w = true;
    if (k === 'a' || e.key === 'ArrowLeft') BossState.keys.a = true;
    if (k === 's' || e.key === 'ArrowDown') BossState.keys.s = true;
    if (k === 'd' || e.key === 'ArrowRight') BossState.keys.d = true;

    if (e.code === 'Space') {
        e.preventDefault();
        BossState.activateShield();
    }
    if (k === 'e' || k === 'q' || e.key === 'Enter') {
        e.preventDefault();
        BossState.activateRailgun();
    }
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || e.key === 'ArrowUp') BossState.keys.w = false;
    if (k === 'a' || e.key === 'ArrowLeft') BossState.keys.a = false;
    if (k === 's' || e.key === 'ArrowDown') BossState.keys.s = false;
    if (k === 'd' || e.key === 'ArrowRight') BossState.keys.d = false;
});

(function initMobileControls() {
    const zone = document.getElementById('joystick-zone');
    const stick = document.getElementById('joystick-stick');
    const shieldBtn = document.getElementById('mob-shield-btn');
    const railBtn = document.getElementById('mob-railgun-btn');

    if (shieldBtn) {
        shieldBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            BossState.activateShield();
        });
    }
    if (railBtn) {
        railBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            BossState.activateRailgun();
        });
    }

    if (!zone || !stick) return;
    let activeTouchId = null;
    const maxRadius = 40;

    const handleMove = (clientX, clientY) => {
        const rect = zone.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
        }
        stick.style.transform = `translate(${dx}px,${dy}px)`;
        BossState.joyDx = dx / maxRadius;
        BossState.joyDy = dy / maxRadius;
    };

    const resetJoystick = () => {
        activeTouchId = null;
        stick.style.transform = 'translate(0px, 0px)';
        BossState.joyDx = 0;
        BossState.joyDy = 0;
    };

    zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        activeTouchId = t.identifier;
        handleMove(t.clientX, t.clientY);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
                handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                break;
            }
        }
    }, { passive: false });

    zone.addEventListener('touchend', resetJoystick);
    zone.addEventListener('touchcancel', resetJoystick);
})();

function initBossEncounterSequence() {
    checkAndShowMobileWarning(() => _runBossEncounterSequenceNow());
}
function _runBossEncounterSequenceNow() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }
    window.focus();
    BossState.resetBossEncounter(false);
    BossState.battleStartTime = Date.now();
    BossState.history = [];
    BossEngine.startLoop();

    const debugParam = BossEngine.checkDebugParams();
    if (debugParam) {
        if (debugParam.toLowerCase() === 's') BossEngine.transitionTo('phaseS');
        else if (debugParam.startsWith('3')) BossEngine.transitionTo('phase3');
        else if (debugParam === '2') BossEngine.transitionTo('phase2');
        else BossEngine.transitionTo('phase1', false);
    } else {
        BossEngine.transitionTo('phase1', false);
    }
}

document.getElementById('choice-yes')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('p5-choices')?.classList.remove('active');
    DialogueSystem.show({
        text: "Al menos no fingiste compasión. Gracias por no disfrazar tu indiferencia.",
        speaker: "SAPHYNIEL",
        tone: "mid",
        autoHideTime: 3000,
        spriteMap: BOSS_SPRITES,
        callback: () => {
            setTimeout(() => {
                window.parent.postMessage({ type: 'BOSS_DEFEATED', ending: 'HONEST_EXIT' }, '*');
            }, 800);
        }
    });
});

document.getElementById('choice-no')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('p5-choices')?.classList.remove('active');
    document.body.classList.add('combat-no-cursor');
    DialogueSystem.show({
        text: "Disparaste hasta dejarme sin aliento. No hables de piedad ahora que ya no tengo adónde huir.",
        speaker: "SAPHYNIEL",
        tone: "yandere",
        autoHideTime: 3000,
        spriteMap: BOSS_SPRITES,
        callback: () => {
            document.getElementById('cinematic-darkness')?.classList.add('active');
            BossEngine.transitionTo('phase3');
        }
    });
});

document.getElementById('retry-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.blur();

    BossState.unlockCombatAchievementOnce('perseverance', 'PERSEVERANCIA');
    BossState.triggerUndertaleRebirth();
});

document.getElementById('surrender-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.blur();

    BossState.clearDeathTimers();
    BossState.inPhaseSCheckpoint = false;
    BossAttacks.clearAll();
    AudioManager.stopBgm();
    document.getElementById('game-over-screen')?.classList.remove('visible');

    BossState.unlockCombatAchievementOnce('fragile_faith', null);
    window.parent.postMessage({
        type: 'BOSS_SURRENDERED',
        achievementId: 'fragile_faith'
    }, '*');
});

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'START_BOSS') {
        if (typeof BalatroEngine !== 'undefined' && !BalatroEngine.animId) {
            BalatroEngine.init('balatro-canvas');
        }
        initBossEncounterSequence();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (typeof BalatroEngine !== 'undefined') BalatroEngine.init('balatro-canvas');
    if (typeof ParticleEngine !== 'undefined') ParticleEngine.init('particle-canvas');
    if (window.parent === window) {
        setTimeout(initBossEncounterSequence, 500);
    }
});

function checkAndShowMobileWarning(onProceed) {
    const isMobDevice = window.innerWidth <= 920 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isMobDevice || sessionStorage.getItem('codex_mobile_warn_accepted') === 'true') {
        onProceed();
        return;
    }

    let modal = document.getElementById('mobile-warning-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mobile-warning-modal';
        modal.className = 'mobile-warning-overlay active';
        modal.innerHTML = `
            <div class="mobile-warning-box">
                <div class="mobile-warning-title">⚠️ AVISO DE SISTEMA YORHA // DISPOSITIVO MÓVIL</div>
                <p class="mobile-warning-text">
                    En teléfonos el combate puede experimentar caídas de rendimiento o espacio reducido.<br><br>
                    Se ha activado el <b>Modo Optimizado (Escala Reducida)</b>. ¿Deseas activar la <b>Pantalla Completa Horizontal</b> para jugar mejor?
                </p>
                <div class="mobile-warning-btns">
                    <button type="button" class="mob-warn-btn" id="btn-mob-landscape">[ ⛶ ACEPTAR Y JUGAR EN HORIZONTAL ]</button>
                    <button type="button" class="mob-warn-btn secondary" id="btn-mob-continue">[ CONTINUAR SIN ROTAR ]</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.classList.add('active');
    }

    const requestLandscapeFullscreen = () => {
        sessionStorage.setItem('codex_mobile_warn_accepted', 'true');
        modal.classList.remove('active');

        const docEl = document.documentElement;
        const parentDocEl = (window.parent && window.parent.document) ? window.parent.document.documentElement : docEl;
        const reqFs = parentDocEl.requestFullscreen || parentDocEl.webkitRequestFullscreen || docEl.requestFullscreen;
        if (reqFs) {
            reqFs.call(parentDocEl).then(() => {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(() => {});
                }
            }).catch(() => {});
        } else if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
        setTimeout(onProceed, 250);
    };

    document.getElementById('btn-mob-landscape').onclick = (e) => {
        e.stopPropagation();
        requestLandscapeFullscreen();
    };
    document.getElementById('btn-mob-continue').onclick = (e) => {
        e.stopPropagation();
        sessionStorage.setItem('codex_mobile_warn_accepted', 'true');
        modal.classList.remove('active');
        onProceed();
    };
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
        e.preventDefault();
        const cur = localStorage.getItem('codex_debug_godmode') === 'true';
        localStorage.setItem('codex_debug_godmode', (!cur).toString());
        BossState.spawnDamagePopup(BossState.shipX, BossState.shipY - 30, !cur ? "GODMODE: ON" : "GODMODE: OFF", 'blocked');
    } else if (e.key === 'F2') {
        e.preventDefault();
        BossState.railgunCharge = 100;
        BossState.shieldCooldown = 0;
        BossState.spawnDamagePopup(BossState.shipX, BossState.shipY - 30, "CARGA MÁXIMA", 'heal');
    } else if (e.key === 'F3') {
        e.preventDefault();
        if (typeof PhaseS !== 'undefined') {
            BossEngine.transitionTo('phaseS');
            setTimeout(() => PhaseS.triggerSolynCinematicUnion(), 400);
        }
    } else if (e.key === 'F4') {
        e.preventDefault();
        if (BossState.phase === 1) BossEngine.transitionTo('phase2');
        else if (BossState.phase === 2) BossEngine.transitionTo('phase3');
        else if (BossState.phase === 3) BossEngine.transitionTo('phaseS');
        else if (BossState.phase === 'S' && typeof PhaseS !== 'undefined') PhaseS.triggerEndingSSequence();
    }
});