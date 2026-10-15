// ============================================================================
// ARCHIVO INDEPENDIENTE: js/boss/phases/phase-s/phase-s-controller.js
// Coreografía 100% Musical de la Fase Secreta [S]:
// - Saphyniel se purifica SOLA al ritmo exacto de la canción (0% -> 100%).
// - Nuestras armas ([ESPACIO] y [E]) son únicamente defensivas y liberan mariposas.
// - La pelea termina SIEMPRE cuando acaba la canción, activando el fundido a negro
//   con el título del Final [S].
// ============================================================================
const PhaseS = {
    STORAGE_PURIFICATION_KEY: 'codex_phase_s_saved_pct',
    STORAGE_DIED_AFTER_50_KEY: 'codex_phase_s_died_after_50',

    activeSessionId: 0,
    virtualSongTime: 0,
    songTotalDuration: 196.0, // Duración coreográfica objetivo (~3:16 de los 3:20 de la pista)
    attackSubTimer: 0,
    swordVolleyTimer: 0,
    metaAttackTimer: 0,
    boxDetachTimer: 0,
    endingTriggered: false,
    solynAwakenedInRun: false,
    unionCutsceneActive: false,
    unionBeamProgress: 0,
    hitStopTimer: 0,

    inPlaceRefusalActive: false,
    refusalTimer: 0,
    refusalCount: 0,
    refusalLineText: "",
    refusalFragments: [],

    climax1Triggered: false,
    buildupTriggered: false,
    climax2Triggered: false,
    sacrificedHeartsCount: 0,
    lastSacrificeBeatTime: 0,
    currentLyricText: "",

    REFUSAL_LINES: [
        "Pero tus manos se negaron a dejarla sola.",
        "Aunque duela, prometiste resistir hasta que su canción termine.",
        "No vas a apagarte mientras ella sigue llorando en el escenario.",
        "Tus escudos tiemblan, pero tu corazón sigue latiendo a su lado."
    ],

    PHASE_S_MONOLOGUE: [
        { start: 2.5,  end: 9.5,  text: "No intentes curarme... tú no tienes por qué cargar con mis heridas." },
        { start: 10.5, end: 17.5, text: "Solo quédate bajo la luz mientras dejo caer esta armadura." },
        { start: 21.0, end: 28.5, text: "Cada espada que lanzo es un miedo que no sabía cómo soltar." },
        { start: 32.0, end: 40.0, text: "Tenías con qué borrarme y elegiste quedarte en silencio." },
        { start: 45.0, end: 53.5, text: "Protégete de mi tormenta... yo sola encontraré la calma." },
        { start: 56.0, end: 65.0, text: "Mira cómo mis espinas se convierten en mariposas cuando las detienes." },
        { start: 76.0, end: 81.8, text: "BAILA CONMIGO AUNQUE EL ESCENARIO SE QUIEBRE" },
        { start: 82.0, end: 88.0, text: "RESISTE HASTA QUE MI VOZ DEJE DE TEMBLAR" },
        { start: 93.0, end: 102.0, text: "Cuando vi que te levantabas una y otra vez, entendí mi propio miedo." },
        { start: 106.0, end: 116.0, text: "Ya no quiero esconderme detrás de tanta ceniza." },
        { start: 122.0, end: 132.0, text: "Prometimos no irnos nunca uno sin el otro." },
        { start: 138.0, end: 148.0, text: "Si mi voz se apaga, deja que la tuya me acompañe en la sombra." },
        { start: 154.0, end: 164.0, text: "Ya falta poco... la canción está llegando a su último compás." },
        { start: 167.0, end: 170.2, text: "Dos reflectores en la penumbra..." },
        { start: 170.3, end: 172.8, text: "...y un último aliento antes de que caiga el telón." },
        { start: 173.2, end: 179.5, text: "RESISTE CONMIGO EL ÚLTIMO ACTO" },
        { start: 180.0, end: 186.5, text: "MIS ESPADAS SE ROMPEN EN LIBERTAD" },
        { start: 187.0, end: 195.0, text: "GRACIAS POR QUEDARTE HASTA EL FINAL DE LA CANCIÓN" }
    ],

    enter() {
        this.activeSessionId++;
        const currentSession = this.activeSessionId;
        BossAttacks.clearAll();
        PhaseSUIArena.initArenaDOM();

        BossState.phase = 'S';
        BossState.inPhaseSCheckpoint = true;
        BossState.maxHp = 1000;
        BossState.currentHp = 10;

        BossState.damageLock = false;
        BossState.weaponLost = false;
        this.endingTriggered = false;
        this.solynAwakenedInRun = false;
        this.unionCutsceneActive = false;
        this.unionBeamProgress = 0;
        this.hitStopTimer = 0;
        this.inPlaceRefusalActive = false;
        this.refusalTimer = 0;
        this.refusalCount = 0;
        this.refusalFragments = [];

        this.climax1Triggered = false;
        this.buildupTriggered = false;
        this.climax2Triggered = false;
        this.sacrificedHeartsCount = 0;
        this.lastSacrificeBeatTime = 0;
        this.currentLyricText = "";
        this.virtualSongTime = 0;
        this.songTotalDuration = 196.0;
        this.attackSubTimer = 0.65;
        this.swordVolleyTimer = 2.4;
        this.metaAttackTimer = 5.5;
        this.boxDetachTimer = 3.5;

        BossState.solynCompanionActive = false;
        BossState.shieldDuration = 1.05;
        BossState.shieldMaxCooldown = 1.25;

        document.getElementById('cinematic-darkness')?.classList.remove('active');
        document.body.className = 'combat-no-cursor phase-3-active phase-s-active phase-s-shattered';

        const core = document.getElementById('boss-core');
        if (core) {
            core.style.display = 'flex';
            core.style.top = '22%';
            core.style.left = '50%';
        }
        document.getElementById('boss-hud').style.display = 'flex';
        document.getElementById('player-hud').style.display = 'flex';
        document.getElementById('boss-hud').style.opacity = '1';
        document.getElementById('player-hud').style.opacity = '1';

        const title = document.getElementById('boss-title-name');
        if (title) {
            title.textContent = "SAPHYNIEL // ACTO I: TELÓN DE CRISTAL";
        }

        BossState.updateCoreSprite();
        BossState.updateHpBar();

        // Reproducir la canción SIN loop para que su final dispare el 100% y la transición en negro
        AudioManager.playBgm(BOSS_AUDIO_PATHS.bgmPhaseS, 0.78, false);
        const bgm = AudioManager.bgmTrack;
        if (bgm) {
            bgm.addEventListener('loadedmetadata', () => {
                if (bgm.duration && isFinite(bgm.duration) && bgm.duration > 60) {
                    this.songTotalDuration = Math.max(180, bgm.duration - 2.0);
                }
            }, { once: true });

            bgm.addEventListener('ended', () => {
                if (this.activeSessionId === currentSession && BossState.phase === 'S' && !this.endingTriggered) {
                    BossState.currentHp = BossState.maxHp;
                    BossState.updateHpBar();
                    this.endingTriggered = true;
                    this.triggerEndingSSequence();
                }
            }, { once: true });
        }
    },

    triggerHitStop(duration = 0.055) {
        this.hitStopTimer = Math.max(this.hitStopTimer, duration);
    },

    // =========================================================================
    // "BUT IT REFUSED" EN TIEMPO REAL (LA MÚSICA CONTINÚA SIN REINICIAR)
    // =========================================================================
    triggerInPlaceRefusal() {
        if (this.inPlaceRefusalActive || this.endingTriggered) return;
        this.inPlaceRefusalActive = true;
        this.refusalTimer = 2.35;
        this.refusalLineText = this.REFUSAL_LINES[this.refusalCount % this.REFUSAL_LINES.length];
        this.refusalCount++;

        BossState.unlockCombatAchievementOnce('perseverance', 'PERSEVERANCIA');

        if (typeof AudioManager !== 'undefined') {
            AudioManager.muffleBgmForRefusal();
        }
        document.body.classList.add('phase-s-refusal-submerged');
        if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();

        // Los ataques en pantalla se dispersan en mariposas libres
        BossAttacks.bullets.forEach(b => PhaseSUIArena.spawnFreeButterflyBurst(b.x, b.y, 1));
        BossAttacks.lightSwords.forEach(ls => PhaseSUIArena.spawnFreeButterflyBurst(ls.x, ls.y, 2));
        BossAttacks.bullets = [];
        BossAttacks.lightSwords = [];

        this.refusalFragments = [];
        for (let i = 0; i < 32; i++) {
            const ang = (Math.PI * 2 * i) / 32;
            const dist = 16 + Math.random() * 52;
            this.refusalFragments.push({
                ox: BossState.shipX + Math.cos(ang) * dist,
                oy: BossState.shipY + Math.sin(ang) * dist,
                x: BossState.shipX,
                y: BossState.shipY,
                size: 3.5 + (i % 3) * 1.5,
                color: i % 2 === 0 ? '#ffd700' : '#ffffff'
            });
        }
    },

    updateAndRenderInPlaceRefusal(dt, ctx) {
        this.refusalTimer -= dt;
        const progress = 1 - Math.max(0, this.refusalTimer / 2.35);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.refusalFragments.length; i++) {
            const f = this.refusalFragments[i];
            if (progress < 0.55) {
                const p = progress / 0.55;
                f.x = BossState.shipX + (f.ox - BossState.shipX) * p + (Math.random() - 0.5) * 5;
                f.y = BossState.shipY + (f.oy - BossState.shipY) * p + (Math.random() - 0.5) * 5;
            } else {
                const p = (progress - 0.55) / 0.45;
                const ease = p * p * p;
                f.x = f.ox + (BossState.shipX - f.ox) * ease;
                f.y = f.oy + (BossState.shipY - f.oy) * ease;
            }
            ctx.fillStyle = f.color;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 14;
            ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
        }

        ctx.font = 'bold 13px "Cinzel", serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.fillText(this.refusalLineText, BossState.shipX, BossState.shipY - 46);
        ctx.restore();

        if (this.refusalTimer <= 0) {
            this.inPlaceRefusalActive = false;
            document.body.classList.remove('phase-s-refusal-submerged');

            if (typeof AudioManager !== 'undefined') {
                AudioManager.restoreBgmFromRefusal();
            }
            BossState.triggerAnimeImpactFrame();
            PhaseSUIArena.spawnFreeButterflyBurst(BossState.shipX, BossState.shipY, 16);
            if (typeof BalatroEngine !== 'undefined') {
                BalatroEngine.triggerHit(BossState.shipX, BossState.shipY, 1.8);
            }

            if (!this.solynAwakenedInRun) {
                this.triggerSolynCinematicUnion("Te negaste a desaparecer incluso cuando mis espinas te rompieron... Toma mis corazones; resistamos juntos.");
            } else {
                BossState.playerHp = Math.max(4, BossState.maxPlayerHp - this.sacrificedHeartsCount);
                BossState.playerIFrames = 2.2;
                for (let i = 1; i <= BossState.maxPlayerHp; i++) {
                    const hEl = document.getElementById(`heart-${i}`);
                    if (hEl && !hEl.classList.contains('sacrificed')) {
                        hEl.classList.remove('lost');
                    }
                }
            }
        }
    },

    // =========================================================================
    // UNIÓN CINEMÁTICA CON SOLYN (10 CORAZONES DORADOS)
    // =========================================================================
    triggerSolynCinematicUnion(customLine = null) {
        if (this.solynAwakenedInRun || this.unionCutsceneActive) return;
        this.unionCutsceneActive = true;
        this.unionBeamProgress = 0;
        const currentSession = this.activeSessionId;

        BossAttacks.bullets.forEach(b => PhaseSUIArena.spawnFreeButterflyBurst(b.x, b.y, 1));
        BossAttacks.bullets = [];
        BossAttacks.lasers = [];
        BossAttacks.lightSwords = [];

        document.body.classList.add('phase-s-union-freeze');
        BossState.triggerAnimeImpactFrame();
        if (typeof AudioManager !== 'undefined') {
            AudioManager.synthRewind();
            AudioManager.liturgicalChime();
        }
        if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();

        const unionQuote = customLine || "Basta... No puedo seguir viendo cómo resistes ahí abajo tú solo. Toma lo que me queda de luz; bailemos bajo esta tormenta hasta que termine.";

        DialogueSystem.show({
            text: unionQuote,
            speaker: "SAPHYNIEL // SOLYN",
            tone: "mid",
            autoHideTime: 3200,
            spriteMap: BOSS_SPRITES
        });

        setTimeout(() => {
            if (this.activeSessionId !== currentSession) return;
            this.activateSolynAndGoldenHearts();
        }, 900);

        setTimeout(() => {
            if (this.activeSessionId !== currentSession) return;
            this.unionCutsceneActive = false;
            document.body.classList.remove('phase-s-union-freeze', 'phase-s-shattered');
            document.body.classList.add('phase-s-golden-union');
            PhaseSUIArena.spawnFreeButterflyBurst(BossState.shipX, BossState.shipY, 18);
            if (typeof BalatroEngine !== 'undefined') {
                BalatroEngine.triggerHit(BossState.shipX, BossState.shipY, 1.8);
            }
        }, 1950);
    },

    activateSolynAndGoldenHearts() {
        if (this.solynAwakenedInRun) return;
        this.solynAwakenedInRun = true;
        BossState.solynCompanionActive = true;
        localStorage.setItem(this.STORAGE_DIED_AFTER_50_KEY, 'true');

        BossState.unlockCombatAchievementOnce('golden_covenant', 'NUNCA UNO SIN EL OTRO');

        BossState.maxPlayerHp = 10;
        BossState.playerHp = 10;
        BossState.playerIFrames = 2.5;
        this.sacrificedHeartsCount = 0;

        const heartsRow = document.getElementById('hearts-row');
        if (heartsRow) {
            heartsRow.innerHTML = '';
            for (let i = 1; i <= 10; i++) {
                const span = document.createElement('span');
                span.className = 'player-heart golden-heart forging';
                span.id = `heart-${i}`;
                span.textContent = '❤';
                span.style.opacity = '0';
                heartsRow.appendChild(span);

                setTimeout(() => {
                    span.style.opacity = '1';
                    if (typeof AudioManager !== 'undefined' && i % 2 === 0) {
                        AudioManager.beep(523.25 + i * 55, 0.09, 'sine', 0.045);
                    }
                }, i * 75);
            }
        }

        BossState.shieldDuration = 2.2;
        BossState.shieldMaxCooldown = 0.85;

        const title = document.getElementById('boss-title-name');
        if (title) title.textContent = "SAPHYNIEL & SOLYN // DOS ALMAS EN EL ESCENARIO";

        ParticleEngine.startLunarFlowerField(26);
    },

    sacrificeOneGoldenHeart(customReason = null) {
        if (!BossState.solynCompanionActive) {
            this.triggerSolynCinematicUnion();
            return;
        }

        const remainingHearts = 10 - this.sacrificedHeartsCount;
        if (remainingHearts <= 1) {
            const lastHeart = document.getElementById('heart-1');
            if (lastHeart) lastHeart.classList.add('last-beat');
            BossState.playerHp = 1;
            return;
        }

        const heartIndexToSacrifice = remainingHearts;
        this.sacrificedHeartsCount++;
        BossState.playerHp = Math.max(1, 10 - this.sacrificedHeartsCount);

        const heartEl = document.getElementById(`heart-${heartIndexToSacrifice}`);
        const corePos = BossState.getBossCoreCenter();
        const reasons = [
            "[ CORAZÓN ENTREGADO ]",
            "[ MEMORIA LIBERADA ]",
            "[ PROMESA SOSTENIDA ]",
            "[ SALMO OFRENDADO ]",
            "[ ESCUDO POR SU VIDA ]"
        ];
        const label = customReason || reasons[this.sacrificedHeartsCount % reasons.length];

        PhaseSUIArena.spawnHeartSacrificeComet(heartEl, corePos.x, corePos.y, label);
        BossState.spawnDamagePopup(BossState.shipX, BossState.shipY - 24, label, 'heal');

        if (BossState.playerHp === 1) {
            const lastHeart = document.getElementById('heart-1');
            if (lastHeart) lastHeart.classList.add('last-beat');
            BossState.unlockCombatAchievementOnce('curtain_call_e', 'EL PESO DEL TELÓN [E]');
        }
    },

    updateLyricsOverlay(songTime) {
        const mvContainer = document.getElementById('lyrics-container');
        if (!mvContainer) return;
        const entry = this.PHASE_S_MONOLOGUE.find(m => songTime >= m.start && songTime <= m.end);
        if (entry) {
            if (this.currentLyricText !== entry.text) {
                this.currentLyricText = entry.text;
                mvContainer.innerHTML = `<span class="mv-text-beat" data-text="${entry.text}">${entry.text}</span>`;
            }
        } else if (this.currentLyricText !== "") {
            this.currentLyricText = "";
            mvContainer.innerHTML = '';
        }
    },

    update(dt) {
        if (BossState.phase !== 'S' || BossState.isDying || this.endingTriggered) return;
        const ctx = ParticleEngine.ctx;
        if (!ctx) return;

        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            return;
        }

        this.virtualSongTime += dt;
        const bgm = AudioManager.bgmTrack;
        const songTime = (bgm && !bgm.paused && bgm.currentTime > 0.2) ? bgm.currentTime : this.virtualSongTime;

        // ====================================================================
        // PUNTOS 1, 2 Y 7: AUTOPURIFICACIÓN ESTRICTAMENTE LIGADA AL TIEMPO DE LA CANCIÓN
        // Saphyniel se cura sola a medida que avanza la canción y llega a 100% SOLO al final
        // ====================================================================
        const timeRatio = Math.min(1.0, Math.max(0.01, songTime / this.songTotalDuration));
        BossState.currentHp = Math.min(BossState.maxHp, Math.max(10, Math.floor(timeRatio * BossState.maxHp)));
        BossState.updateHpBar();

        const curPct = Math.min(100, Math.floor(timeRatio * 100));
        if (curPct >= 50) {
            document.body.classList.add('phase-s-purified-high');
        }
        PhaseSUIArena.updateSyncText(curPct, BossState.solynCompanionActive);

        const isEpicPart1 = (songTime >= 76.0 && songTime <= 88.5);       // 1:16 a 1:28
        const isEmotionalBuild = (songTime >= 167.0 && songTime <= 172.8); // 2:47 a 2:52
        const isBestPartClimax = (songTime >= 173.0 && songTime <= 205.0); // 2:53 al final

        // Renderizar siempre los reflectores (con el reflector de la nave 100% fijo sobre ella)
        PhaseSUIArena.renderTheaterDanceSpotlights(dt, ctx, isEmotionalBuild, isBestPartClimax);
        PhaseSUIArena.corruptParentBrowserUI(songTime);
        this.updateLyricsOverlay(songTime);

        const corePos = BossState.getBossCoreCenter();

        if (this.inPlaceRefusalActive) {
            this.updateAndRenderInPlaceRefusal(dt, ctx);
            PhaseSUIArena.updateAndRenderStageFX(dt, ctx);
            return;
        }

        if (this.unionCutsceneActive) {
            this.unionBeamProgress = Math.min(1, this.unionBeamProgress + dt * 1.3);
            const curX = corePos.x + (BossState.shipX - corePos.x) * this.unionBeamProgress;
            const curY = corePos.y + (BossState.shipY - corePos.y) * this.unionBeamProgress;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 28;
            ctx.beginPath();
            ctx.moveTo(corePos.x, corePos.y);
            ctx.lineTo(curX, curY);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(curX, curY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            PhaseSUIArena.updateAndRenderStageFX(dt, ctx);
            return;
        }

        // ====================================================================
        // TRANSICIONES DE LOS 5 ACTOS MUSICALES
        // ====================================================================
        if (isEpicPart1 && !this.climax1Triggered) {
            this.climax1Triggered = true;
            document.body.classList.add('phase-s-spotlights');
            BossState.triggerAnimeImpactFrame();
            ScreenUtils.triggerShake();
            const title = document.getElementById('boss-title-name');
            if (title) title.textContent = "SAPHYNIEL // ACTO III: LLUVIA DE ESPADAS";
        } else if (!isEpicPart1 && songTime > 88.5 && songTime < 165.0) {
            document.body.classList.remove('phase-s-spotlights');
            if (!this.solynAwakenedInRun) {
                this.triggerSolynCinematicUnion();
            }
        }

        if (isEmotionalBuild && !this.buildupTriggered) {
            this.buildupTriggered = true;
            document.body.classList.remove('phase-s-hud-hijack-left', 'phase-s-hud-hijack-right');
            document.body.classList.add('phase-s-emotional-buildup');
            BossAttacks.bullets.forEach(b => PhaseSUIArena.spawnFreeButterflyBurst(b.x, b.y, 1));
            BossAttacks.bullets = [];
            BossAttacks.lasers = [];
            BossAttacks.lightSwords = [];
            BossAttacks.spawnSuctionParticles(42);
            if (!this.solynAwakenedInRun) {
                this.triggerSolynCinematicUnion("No tengas miedo de lo que viene... Sostén mi mano.");
            }
        }

        if (isBestPartClimax && !this.climax2Triggered) {
            this.climax2Triggered = true;
            document.body.classList.remove('phase-s-emotional-buildup');
            document.body.classList.add('phase-s-climax', 'phase-s-spotlights');
            BossState.triggerAnimeImpactFrame();
            ScreenUtils.triggerShake();
            ParticleEngine.startLunarFlowerField(45);
            if (typeof BalatroEngine !== 'undefined') {
                BalatroEngine.triggerHit(window.innerWidth / 2, window.innerHeight / 2, 1.8);
            }
            const title = document.getElementById('boss-title-name');
            if (title) title.textContent = "ACTO FINAL [E] // EL MUNDO ES UN ESCENARIO";
        }

        // ====================================================================
        // COREOGRAFÍA DE ESPADAS DE PUNTA A PUNTA Y ATAQUES META
        // ====================================================================
        this.attackSubTimer -= dt;
        this.swordVolleyTimer -= dt;
        this.metaAttackTimer -= dt;

        if (isEmotionalBuild) {
            if (Math.random() < 0.35) BossAttacks.spawnSuctionParticles(3);
        } else if (isBestPartClimax) {
            // CLÍMAX 2:53 - 3:16: Tormenta de espadas largas cruzando toda la pantalla + sacrificio
            if (this.swordVolleyTimer <= 0) {
                this.swordVolleyTimer = 0.82;
                BossAttacks.spawnArenaCrossingSwordVolley(5, 16.5);
            }
            if (this.attackSubTimer <= 0) {
                this.attackSubTimer = 0.42;
                BossAttacks.spawnSpiralVolley(4, 2, 4.6);
                PhaseSUIArena.spawnMemoryWordProjectile();
                if (Math.random() < 0.42) BossAttacks.spawnPrismCageLasers(2);
            }

            if (songTime >= 175.0 && songTime - this.lastSacrificeBeatTime >= 2.0 && BossState.playerHp > 1) {
                this.lastSacrificeBeatTime = songTime;
                this.sacrificeOneGoldenHeart();
            }
        } else if (isEpicPart1) {
            // 1:16 - 1:28: Ráfagas intensas de espadas largas de punta a punta
            if (this.swordVolleyTimer <= 0) {
                this.swordVolleyTimer = 0.95;
                BossAttacks.spawnArenaCrossingSwordVolley(5, 15.5);
            }
            if (this.attackSubTimer <= 0) {
                this.attackSubTimer = 0.55;
                BossAttacks.spawnSpiralVolley(4, 2, 4.4);
                if (Math.random() < 0.4) BossAttacks.spawnClockSweepLasers();
                if (Math.random() < 0.3) BossState.startBossTackle();
            }
        } else if (songTime < 42.0) {
            // ACTO I (0:00 - 0:42): Cruces de espadas largas por toda la arena
            if (this.swordVolleyTimer <= 0) {
                this.swordVolleyTimer = 1.45;
                BossAttacks.spawnArenaCrossingSwordVolley(3, 13.8);
            }
            if (this.attackSubTimer <= 0) {
                this.attackSubTimer = 0.72;
                BossAttacks.spawnDanmakuRing(corePos.x, corePos.y, 10, 4.0, 'aimed');
                if (Math.random() < 0.35) BossState.moveBossCore();
            }
        } else if (songTime < 76.0) {
            // ACTO II (0:42 - 1:15): Secuestro de HUD + Espadas cruzadas + Lanzas de Terminal
            this.boxDetachTimer -= dt;
            if (this.boxDetachTimer <= 0 && BossAttacks.uiBoxes.length < 3) {
                this.boxDetachTimer = 3.2;
                PhaseSUIArena.detachSlotAsEntity();
            }
            if (this.swordVolleyTimer <= 0) {
                this.swordVolleyTimer = 1.25;
                BossAttacks.spawnArenaCrossingSwordVolley(4, 14.2);
            }
            if (this.attackSubTimer <= 0) {
                this.attackSubTimer = 0.78;
                BossAttacks.spawnSpiralVolley(3, 2, 4.2);
                if (Math.random() < 0.4) BossAttacks.spawnPrismCageLasers(2);
            }
            if (this.metaAttackTimer <= 0) {
                this.metaAttackTimer = 6.2;
                document.body.classList.toggle('phase-s-hud-hijack-left');
                PhaseSUIArena.spawnTerminalCommandBarrage();
            }
        } else {
            // ACTO IV (1:29 - 2:46): Dúo con Solyn + Espadas de punta a punta + Kindred + Tarot 3D
            this.boxDetachTimer -= dt;
            if (this.boxDetachTimer <= 0 && BossAttacks.uiBoxes.length < 3) {
                this.boxDetachTimer = 3.4;
                PhaseSUIArena.detachSlotAsEntity();
            }
            if (this.swordVolleyTimer <= 0) {
                this.swordVolleyTimer = 1.10;
                BossAttacks.spawnArenaCrossingSwordVolley(4, 15.0);
            }
            if (this.attackSubTimer <= 0) {
                this.attackSubTimer = 0.65;
                BossAttacks.spawnSpiralVolley(4, 2, 4.3);
                if (!BossAttacks.waterSanctuary && Math.random() < 0.25) {
                    BossAttacks.startWaterSanctuaryCycle();
                }
            }
            if (this.metaAttackTimer <= 0) {
                this.metaAttackTimer = 6.5;
                const roll = Math.random();
                if (roll < 0.38 && !PhaseSUIArena.kindredWolf) {
                    PhaseSUIArena.spawnKindredWolfAndLambHunt();
                } else if (roll < 0.72 && PhaseSUIArena.tarotCards.length === 0) {
                    PhaseSUIArena.spawnTarotJudgmentCards();
                } else {
                    document.body.classList.toggle('phase-s-hud-hijack-right');
                    PhaseSUIArena.spawnTerminalCommandBarrage();
                }
            }
        }

        // Actualizar cajas de memoria (Se calman solas al sobrevivir o al usar tu defensa [E]/Escudo)
        for (let i = BossAttacks.uiBoxes.length - 1; i >= 0; i--) {
            const b = BossAttacks.uiBoxes[i];
            b.x += b.vx * (dt * 60);
            b.y += b.vy * (dt * 60);
            b.lifeTimer -= dt;
            b.healProgress = Math.min(b.maxHeal, b.healProgress + dt * 16);

            if (b.x < b.w / 2 + 20 || b.x > window.innerWidth - b.w / 2 - 20) b.vx *= -1;
            if (b.y > window.innerHeight - 90) b.vy = -Math.abs(b.vy);
            if (b.y < 90) b.vy = Math.abs(b.vy);

            if (!b.purified && (b.healProgress >= b.maxHeal || (BossState.shieldActive && Math.hypot(b.x - BossState.shipX, b.y - BossState.shipY) < 150))) {
                b.purified = true;
                b.lifeTimer = 0.8;
                PhaseSUIArena.markSlotPurified(b.slotIndex);
                PhaseSUIArena.spawnFreeButterflyBurst(b.x, b.y, 7);
            }

            if (b.lifeTimer <= 0) {
                BossAttacks.uiBoxes.splice(i, 1);
                continue;
            }

            if (!b.purified) {
                b.fireTimer -= dt;
                if (b.fireTimer <= 0) {
                    b.fireTimer = 1.55;
                    BossAttacks.spawnDanmakuRing(b.x, b.y, 6, 3.8, 'aimed');
                }
            }

            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.fillStyle = b.purified ? 'rgba(255, 255, 255, 0.92)' : 'rgba(12, 12, 16, 0.92)';
            ctx.strokeStyle = b.purified ? '#ffd700' : '#d9381e';
            ctx.lineWidth = 1.8;
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);

            const ratio = Math.min(1, b.healProgress / b.maxHeal);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-b.w / 2, b.h / 2 - 3, b.w * ratio, 3);

            ctx.fillStyle = b.purified ? '#1a1917' : '#dad4bb';
            ctx.font = 'bold 10px "Rajdhani", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(b.title, -b.w / 2 + 10, 3);

            ctx.fillStyle = b.purified ? '#b58d28' : '#d9381e';
            ctx.textAlign = 'right';
            ctx.fillText(b.purified ? '[LIBRE]' : b.tag, b.w / 2 - 10, 3);
            ctx.restore();
        }

        // Recarga defensiva del Pulso de Resonancia [E]
        BossState.railgunCharge = Math.min(100, BossState.railgunCharge + dt * (BossState.solynCompanionActive ? 22 : 14));

        PhaseSUIArena.updateAndRenderStageFX(dt, ctx);

        // ====================================================================
        // PUNTOS 7 Y 8: AL TERMINAR LA CANCIÓN, SAPHYNIEL LLEGA AL 100% Y PASA A NEGRO
        // ====================================================================
        if (songTime >= this.songTotalDuration && !this.endingTriggered) {
            BossState.currentHp = BossState.maxHp;
            BossState.updateHpBar();
            this.endingTriggered = true;
            this.triggerEndingSSequence();
        }
    },

    triggerEndingSSequence() {
        const currentSession = this.activeSessionId;
        BossState.damageLock = true;
        BossState.currentHp = BossState.maxHp;
        BossState.updateHpBar();

        // Convertir todas las balas y espadas restantes en una bandada masiva de mariposas libres
        BossAttacks.bullets.forEach(b => PhaseSUIArena.spawnFreeButterflyBurst(b.x, b.y, 2));
        BossAttacks.lightSwords.forEach(ls => PhaseSUIArena.spawnFreeButterflyBurst(ls.x, ls.y, 3));
        BossAttacks.clearAll();

        const corePos = BossState.getBossCoreCenter();
        PhaseSUIArena.spawnFreeButterflyBurst(corePos.x, corePos.y, 45);
        ParticleEngine.startLunarFlowerField(55);
        ParticleEngine.explode(corePos.x, corePos.y, '#ffd700', 120);

        if (typeof AudioManager !== 'undefined') {
            AudioManager.pitchDownStopBgm(1600);
            AudioManager.liturgicalChime();
        }

        localStorage.removeItem(this.STORAGE_PURIFICATION_KEY);
        localStorage.removeItem(this.STORAGE_DIED_AFTER_50_KEY);

        BossState.unlockCombatAchievementOnce('curtain_call_e', 'EL PESO DEL TELÓN [E]');
        BossState.unlockCombatAchievementOnce('lunar_sanctuary_s', 'EL MUNDO ES UN ESCENARIO [S]');

        const mvContainer = document.getElementById('lyrics-container');
        if (mvContainer) mvContainer.innerHTML = '';

        document.body.classList.remove('combat-no-cursor', 'phase-s-hud-hijack-left', 'phase-s-hud-hijack-right');

        // Paso 1 (1.3s): Se apagan las luces del escenario -> Pantalla en Negro con el Título del Final
        setTimeout(() => {
            if (this.activeSessionId !== currentSession) return;
            document.getElementById('boss-hud').style.display = 'none';
            document.getElementById('player-hud').style.display = 'none';
            document.getElementById('boss-core').style.display = 'none';

            const blackout = document.getElementById('phase-s-blackout-ending');
            if (blackout) blackout.classList.add('active');
            if (typeof AudioManager !== 'undefined') {
                AudioManager.synthBell();
                AudioManager.playBgm(BOSS_AUDIO_PATHS.endingBgm, 0.7, true);
            }
        }, 1300);

        // Paso 2 (5.2s): Sobre el fondo negro, Saphyniel se despide en calma antes de abrir el Santuario
        setTimeout(() => {
            if (this.activeSessionId !== currentSession) return;
            const sLines = [
                {
                    text: "La canción terminó... y al fin pude soltar todas las espadas que me lastimaban.",
                    tone: "mid",
                    time: 3800
                },
                {
                    text: "No intentaste forzarme ni cambiarme; solo te quedaste conmigo bajo la luz hasta que dejé de temblar.",
                    tone: "low",
                    time: 4200
                },
                {
                    text: "Ven conmigo. El telón ya cayó... nuestro jardín de Flores Lunares nos espera.",
                    tone: "mid",
                    time: 4200
                }
            ];

            let idx = 0;
            const nextLine = () => {
                if (this.activeSessionId !== currentSession) return;
                if (idx < sLines.length) {
                    const l = sLines[idx];
                    DialogueSystem.show({
                        text: l.text,
                        speaker: "SAPHYNIEL // EN PAZ",
                        tone: l.tone,
                        autoHideTime: l.time,
                        spriteMap: BOSS_SPRITES,
                        callback: () => { idx++; setTimeout(nextLine, 320); }
                    });
                } else {
                    PhaseSUIArena.cleanup();
                    window.parent.postMessage({
                        type: 'BOSS_DEFEATED',
                        ending: 'ENDING_S'
                    }, '*');
                }
            };
            nextLine();
        }, 5200);
    },

    exit() {
        this.activeSessionId++;
        const mvContainer = document.getElementById('lyrics-container');
        if (mvContainer) mvContainer.innerHTML = '';
        PhaseSUIArena.cleanup();
        BossAttacks.clearAll();
    }
};

BossEngine.register('phaseS', PhaseS);