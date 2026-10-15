// =========================================================
// FASE 2: SERAFÍN DEL JUICIO
// Si derrotas Fase 1 y 2 SIN disparar el Railgun, ocurre el Desarme Voluntario
// y se abre la Fase Secreta [S] con diálogos melancólicos y logro secreto.
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
        BossState.maxHp = 880;
        BossState.currentHp = 1;
        BossState.damageLock = true;
        BossState.isInvulnerable = false;
        this.hit75 = false;
        this.cinematicTriggered = false;
        this.hit20 = false;
        this.currentStateIndex = 0;

        this.clearSubTimers();
        BossAttacks.clearAll();

        if (BossEngine.checkDebugParams() === '2') {
            this.igniteMetalPhase2(currentSession);
            return;
        }

        document.body.classList.add('combat-no-cursor', 'monochrome-drain', 'cinema-wide-bars');
        if (typeof AudioManager !== 'undefined') {
            AudioManager.pitchDownStopBgm(1500);
        }

        const core = document.getElementById('boss-core');
        if (core) {
            core.style.top = '30%';
            core.style.left = '50%';
        }

        DialogueSystem.show({
            text: "Levanté este lugar en silencio para tener adonde volver... no para ver cómo lo reducen a cenizas.",
            speaker: "SAPHYNIEL",
            tone: "low",
            autoHideTime: 2800,
            spriteMap: BOSS_SPRITES,
            callback: () => {
                if (this.activeSessionId !== currentSession || BossState.isDying) return;

                if (typeof AudioManager !== 'undefined') {
                    AudioManager.playAudio(BOSS_AUDIO_PATHS.ecoOrbital, 0.55);
                }
                BossAttacks.spawnSuctionParticles(36);
                const tAscend = setTimeout(() => {
                    if (this.activeSessionId !== currentSession || BossState.isDying) return;
                    BossAttacks.spawnSuctionParticles(36);
                }, 700);
                this.subTimers.push(tAscend);

                DialogueSystem.show({
                    text: "Si herir es la única forma en que sabes tocar algo... entonces no me pidas que baje las manos.",
                    speaker: "SAPHYNIEL // SERAFÍN",
                    tone: "angry",
                    autoHideTime: 2500,
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
        ScreenUtils.triggerShake();

        if (typeof AudioManager !== 'undefined') {
            AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom, 0.65);
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

    runChoreographedStateMachine(currentSession) {
        if (this.activeSessionId !== currentSession || BossState.playerHp <= 0 || BossState.isDying || BossState.damageLock) return;

        const stateType = this.currentStateIndex % 3;
        this.currentStateIndex++;

        if (stateType === 0) {
            BossAttacks.bullets = [];
            const core = document.getElementById('boss-core');
            if (core) { core.style.left = '50%'; core.style.top = '24%'; }

            BossAttacks.spawnPrismCageLasers(5);

            const t1 = setTimeout(() => {
                if (this.activeSessionId !== currentSession || BossState.damageLock || BossState.isDying) return;
                BossAttacks.spawnClockSweepLasers();
                BossAttacks.spawnSacredCorridorLasers();
            }, 3300);

            const t2 = setTimeout(() => {
                if (this.activeSessionId !== currentSession || BossState.damageLock || BossState.isDying) return;
                BossAttacks.spawnPrismCageLasers(7);
            }, 6200);

            this.subTimers.push(t1, t2);
            this.stateLoopTimer = setTimeout(() => this.runChoreographedStateMachine(currentSession), 10800);

        } else if (stateType === 1) {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartSpawn, 0.55);
            }
            BossAttacks.startWaterSanctuaryCycle();
            this.stateLoopTimer = setTimeout(() => this.runChoreographedStateMachine(currentSession), 7500);

        } else {
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
            DialogueSystem.show({ text: "Cuesta tanto construir un refugio... y tan poco dejarlo vacío.", speaker: "SAPHYNIEL // SERAFÍN", tone: "mid", autoHideTime: 2600, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 50 && !this.cinematicTriggered) {
            this.cinematicTriggered = true;
            ScreenUtils.triggerShake();
            AudioManager.playAudio(BOSS_AUDIO_PATHS.enrageAlarm);
            BossAttacks.spawnClones();
            DialogueSystem.show({
                text: "Aunque me rompas en mil sombras, ninguna va a entregarte lo que guardo aquí dentro.",
                speaker: "SAPHYNIEL // SERAFÍN",
                tone: "yandere",
                autoHideTime: 2800,
                spriteMap: BOSS_SPRITES
            });
        } else if (hpPercent <= 20 && !this.hit20) {
            this.hit20 = true;
            BossAttacks.spawnQteCross();
            DialogueSystem.show({ text: "¿Por qué sigues avanzando? Aquí adentro solo quedamos el frío y yo.", speaker: "SAPHYNIEL // SERAFÍN", tone: "low", autoHideTime: 2600, spriteMap: BOSS_SPRITES });
        }
        return true;
    },

    triggerIntermissionDialogue() {
        BossState.damageLock = true;
        this.clearSubTimers();
        BossAttacks.clearAll();
        if (typeof AudioManager !== 'undefined') AudioManager.pitchDownStopBgm(1200);

        // =====================================================================
        // RUTA PACIFISTA SECRETA [S]: NO DISPARASTE LA RAILGUN NI UNA SOLA VEZ
        // =====================================================================
        if (!BossState.railgunUsed) {
            BossState.unlockCombatAchievementOnce('silent_canon', 'VOTO DE SILENCIO BALÍSTICO');

            document.body.classList.remove('phase-2-active');
            document.body.classList.add('monochrome-drain', 'cinema-wide-bars');

            // El módulo del Railgun en el HUD se desarma en pétalos blancos
            const railBox = document.getElementById('hud-railgun-btn');
            const railLabel = document.getElementById('railgun-label');
            if (railLabel) railLabel.textContent = "ARMA DEPUESTA";
            if (railBox) {
                const r = railBox.getBoundingClientRect();
                ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#ffffff', 32);
            }
            ParticleEngine.startPetalRain(45);
            if (typeof AudioManager !== 'undefined') AudioManager.liturgicalChime();

            const core = document.getElementById('boss-core');
            if (core) {
                core.style.left = '50%';
                core.style.top = '34%';
                core.style.transform = 'translate(-50%, -50%) scale(1.25)';
            }

            const sIntroLines = [
                {
                    text: "...Espera. Tenías esa arma cargada todo este tiempo, y aun así preferiste sangrar antes que dispararme.",
                    speaker: "SAPHYNIEL",
                    tone: "low",
                    time: 3800
                },
                {
                    text: "Siempre creí que cualquiera que cruzara esta puerta vendría a terminar de romperme. No sé cómo hablar con alguien que decide quedarse.",
                    speaker: "SAPHYNIEL",
                    tone: "low",
                    time: 4100
                },
                {
                    text: "Ya no me quedan fuerzas para sostener este lugar yo sola... Si de verdad no viniste a herirme, acércate y no me dejes caer en este frío.",
                    speaker: "SAPHYNIEL",
                    tone: "mid",
                    time: 4200
                }
            ];

            let idx = 0;
            const playIntroS = () => {
                if (idx < sIntroLines.length) {
                    const line = sIntroLines[idx];
                    DialogueSystem.show({
                        text: line.text,
                        speaker: line.speaker,
                        tone: line.tone,
                        autoHideTime: line.time,
                        spriteMap: BOSS_SPRITES,
                        callback: () => {
                            idx++;
                            setTimeout(playIntroS, 320);
                        }
                    });
                } else {
                    document.body.classList.remove('monochrome-drain');
                    BossEngine.transitionTo('phaseS');
                }
            };

            setTimeout(playIntroS, 900);
            return;
        }

        // =====================================================================
        // RUTA NORMAL (USASTE EL CAÑÓN ORBITAL -> ELECCIÓN / FASE 3)
        // =====================================================================
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
                    text: "Dime la verdad... ¿Te sentiste menos solo al reducir mi único refugio a cenizas?",
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