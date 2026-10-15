// =========================================================
// FASE 2: SERAFÍN DEL JUICIO (TRANSICIÓN METAL + COREOGRAFÍA POR ESTADOS)
// Alterna entre:
// - Estado A: «Juicio del Prisma» (Solo Rayos / Patrones Geométricos)
// - Estado B: «Santuario del Espejo de Agua» (Zonas Seguras y Olas Cristalinas)
// - Estado C: «Danza del Serafín» (Espirales, Nodos y Clones)
// =========================================================
const Phase2 = {
    hit75: false,
    cinematicTriggered: false,
    hit20: false,
    healInterval: null,
    stateLoopTimer: null,
    subTimers: [],
    currentStateIndex: 0,
    activeSessionId: 0,

    clearSubTimers() {
        clearInterval(this.healInterval);
        clearTimeout(this.stateLoopTimer);
        this.subTimers.forEach(t => clearTimeout(t));
        this.subTimers = [];
    },

    enter() {
        this.activeSessionId++;
        const currentSession = this.activeSessionId;

        BossState.phase = 2;
        BossState.maxHp = 680;
        BossState.currentHp = 1;
        BossState.damageLock = true;
        BossState.isInvulnerable = false;
        this.hit75 = false;
        this.cinematicTriggered = false;
        this.hit20 = false;
        this.currentStateIndex = 0;

        this.clearSubTimers();
        BossAttacks.clearAll();

        // Si se entra directo por debug (?phase=2), saltar la cinemática larga
        if (BossEngine.checkDebugParams() === '2') {
            this.igniteMetalPhase2(currentSession);
            return;
        }

        // 1. Drenaje de color y desaceleración del tema de Fase 1 (Orquestal -> Silencio)
        document.body.classList.add('combat-no-cursor', 'monochrome-drain', 'cinema-wide-bars');
        if (typeof AudioManager !== 'undefined') {
            AudioManager.pitchDownStopBgm(1500);
        }

        const core = document.getElementById('boss-core');
        if (core) {
            core.style.top = '30%';
            core.style.left = '50%';
        }

        // 2. Diálogos melancólicos rescatados de boss-flow.js antes del estallido Metal
        DialogueSystem.show({
            text: "Creí que si construía algo hermoso, te quedarías a mirar... no a demolerlo como un estorbo.",
            speaker: "SAPHYNIEL",
            tone: "low",
            autoHideTime: 2600,
            spriteMap: BOSS_SPRITES,
            callback: () => {
                if (this.activeSessionId !== currentSession || BossState.isDying) return;

                // 3. Ascensión del Serafín: Succión de partículas invertidas + Coro Angelical
                if (typeof AudioManager !== 'undefined') {
                    AudioManager.playAudio("audio/sfx/superattack.mp3", 0.6);
                }
                BossAttacks.spawnSuctionParticles(36);
                const tAscend = setTimeout(() => {
                    if (this.activeSessionId !== currentSession || BossState.isDying) return;
                    BossAttacks.spawnSuctionParticles(36);
                }, 700);
                this.subTimers.push(tAscend);

                DialogueSystem.show({
                    text: "Si la fuerza es el único idioma que respetas... ¡te responderé sin adornos!",
                    speaker: "SAPHYNIEL // SERAFÍN",
                    tone: "angry",
                    autoHideTime: 2200,
                    spriteMap: BOSS_SPRITES,
                    callback: () => {
                        if (this.activeSessionId !== currentSession || BossState.isDying) return;
                        this.igniteMetalPhase2(currentSession);
                    }
                });
            }
        });
    },

    igniteMetalPhase2(currentSession) {
        document.body.classList.remove('monochrome-drain', 'cinema-wide-bars');
        document.body.classList.add('combat-no-cursor', 'phase-2-active');

        const bossTitle = document.getElementById('boss-title-name');
        if (bossTitle) bossTitle.textContent = "SAPHYNIEL // SERAFÍN DEL JUICIO";

        BossState.triggerAnimeImpactFrame();
        BossState.showSpecialCutin("JUICIO CARMESÍ // DESPERTAR", BOSS_SPRITES.angry);
        ScreenUtils.triggerShake();

        if (typeof AudioManager !== 'undefined') {
            AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom, 0.65);
            // Arranca la versión Metal rápida e intensa de la canción
            AudioManager.playBgm(BOSS_AUDIO_PATHS.bgmPhase2, 0.55, true);
        }
        if (typeof BalatroEngine !== 'undefined') {
            BalatroEngine.triggerHit(window.innerWidth / 2, window.innerHeight * 0.3, 1.8);
        }

        BossState.updateCoreSprite();

        this.healInterval = setInterval(() => {
            if (this.activeSessionId !== currentSession || BossState.playerHp <= 0 || BossState.isDying) {
                clearInterval(this.healInterval);
                return;
            }
            BossState.currentHp += 32;
            BossState.shipY = Math.min(window.innerHeight - 50, BossState.shipY + 5);
            ScreenUtils.triggerShake();
            ParticleEngine.explode(window.innerWidth / 2, window.innerHeight * 0.30, '#d9381e', 6);
            if (typeof AudioManager !== 'undefined') {
                AudioManager.beep(220 + (BossState.currentHp / BossState.maxHp) * 660, 0.05, 'sawtooth', 0.025);
            }

            if (BossState.currentHp >= BossState.maxHp) {
                BossState.currentHp = BossState.maxHp;
                clearInterval(this.healInterval);
                BossState.damageLock = false;
                this.runChoreographedStateMachine(currentSession);
            }
            BossState.updateHpBar();
        }, 42);
    },

    // --- MÁQUINA DE ESTADOS COREOGRAFIADA DE LA FASE 2 ---
    runChoreographedStateMachine(currentSession) {
        if (this.activeSessionId !== currentSession || BossState.playerHp <= 0 || BossState.isDying || BossState.damageLock) return;

        const stateType = this.currentStateIndex % 3;
        this.currentStateIndex++;

        if (stateType === 0) {
            // ESTADO A: «JUICIO DEL PRISMA» (Solo Rayos / Láseres Geométricos)
            BossAttacks.bullets = [];
            const core = document.getElementById('boss-core');
            if (core) { core.style.left = '50%'; core.style.top = '24%'; }

            BossState.showSpecialCutin("JUICIO DEL PRISMA // RAYOS", BOSS_SPRITES.angry);
            BossAttacks.spawnClockSweepLasers();

            const t1 = setTimeout(() => {
                if (this.activeSessionId !== currentSession || BossState.damageLock || BossState.isDying) return;
                BossAttacks.spawnSacredCorridorLasers();
            }, 2200);

            const t2 = setTimeout(() => {
                if (this.activeSessionId !== currentSession || BossState.damageLock || BossState.isDying) return;
                BossAttacks.spawnPrismCageLasers();
            }, 4100);

            this.subTimers.push(t1, t2);
            this.stateLoopTimer = setTimeout(() => this.runChoreographedStateMachine(currentSession), 6200);

        } else if (stateType === 1) {
            // ESTADO B: «SANTUARIO DEL ESPEJO DE AGUA» (Zonas Seguras y Olas Cristalinas)
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartSpawn, 0.55); // Risa de Saphyniel al invocar el espejo
            }
            BossState.showSpecialCutin("SANTUARIO // ESPEJO DE AGUA", BOSS_SPRITES.yandere);
            BossAttacks.startWaterSanctuaryCycle();

            this.stateLoopTimer = setTimeout(() => this.runChoreographedStateMachine(currentSession), 5800);

        } else {
            // ESTADO C: «DANZA DEL SERAFÍN» (Espirales, Cortinas, Bombas y Cruces)
            BossAttacks.spawnBomb();
            BossAttacks.spawnSpiralVolley(4, 2, 3.4);

            const t1 = setTimeout(() => {
                if (this.activeSessionId !== currentSession || BossState.damageLock || BossState.isDying) return;
                BossAttacks.spawnCurtainWall();
                BossAttacks.spawnQteCross();
            }, 1900);

            const t2 = setTimeout(() => {
                if (this.activeSessionId !== currentSession || BossState.damageLock || BossState.isDying) return;
                BossAttacks.spawnAimedBurst();
                BossAttacks.spawnSpiralVolley(4, 2, 3.5);
            }, 3800);

            this.subTimers.push(t1, t2);
            this.stateLoopTimer = setTimeout(() => this.runChoreographedStateMachine(currentSession), 5800);
        }
    },

    onHit(dmg, coords) {
        if (BossState.currentHp <= 1) {
            BossState.currentHp = 1;
            BossState.updateHpBar();
            this.triggerIntermissionDialogue();
            return false;
        }

        const hpPercent = (BossState.currentHp / BossState.maxHp) * 100;
        if (hpPercent <= 75 && !this.hit75) {
            this.hit75 = true;
            BossAttacks.spawnQteCross();
            DialogueSystem.show({ text: "Duele ver con qué facilidad desmontas años de silencio.", speaker: "SAPHYNIEL // DIVINO", tone: "mid", autoHideTime: 2600, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 50 && !this.cinematicTriggered) {
            this.cinematicTriggered = true;
            ScreenUtils.triggerShake();
            AudioManager.playAudio(BOSS_AUDIO_PATHS.enrageAlarm);
            BossAttacks.spawnClones();
            DialogueSystem.show({
                text: "¡Incluso si logras derribarme, mis ilusiones no te dejarán llevar nada de aquí!",
                speaker: "SAPHYNIEL // DIVINO",
                tone: "yandere",
                autoHideTime: 2800,
                spriteMap: BOSS_SPRITES
            });
        } else if (hpPercent <= 20 && !this.hit20) {
            this.hit20 = true;
            BossAttacks.spawnQteCross();
            DialogueSystem.show({ text: "No eres un error del sistema. Eres alguien que disfruta ver cómo se apaga.", speaker: "SAPHYNIEL // DIVINO", tone: "angry", autoHideTime: 2600, spriteMap: BOSS_SPRITES });
        }
        return true;
    },

    triggerIntermissionDialogue() {
        BossState.damageLock = true;
        this.clearSubTimers();
        BossAttacks.clearAll();
        AudioManager.stopBgm();
        document.body.classList.remove('combat-no-cursor');

        document.getElementById('boss-core').style.display = 'none';
        document.getElementById('boss-hud').style.display = 'none';
        document.getElementById('player-hud').style.display = 'none';

        const silencio = document.getElementById('silencio-overlay');
        if (silencio) silencio.classList.add('show');
        AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom);

        setTimeout(() => {
            if (silencio) silencio.classList.remove('show');
            document.getElementById('cinematic-darkness')?.classList.add('active');

            setTimeout(() => {
                DialogueSystem.show({
                    text: "¿Te hizo sentir bien reducir mi espacio a escombros?",
                    speaker: "SAPHYNIEL",
                    tone: "mid",
                    autoHideTime: 0,
                    spriteMap: BOSS_SPRITES,
                    callback: () => {
                        document.getElementById('p5-choices')?.classList.add('active');
                    }
                });
            }, 700);
        }, 2000);
    },

    exit() {
        this.activeSessionId++;
        this.clearSubTimers();
        document.body.classList.remove('monochrome-drain', 'cinema-wide-bars');
        BossAttacks.clearAll();
    }
};
BossEngine.register('phase2', Phase2);