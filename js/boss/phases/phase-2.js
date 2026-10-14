const Phase2 = {
    hit75: false,
    cinematicTriggered: false,
    hit20: false,
    healInterval: null,
    activeSessionId: 0,

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

        clearInterval(this.healInterval);
        BossAttacks.clearAll();
        document.body.classList.add('combat-no-cursor', 'phase-2-active');

        const startPhase2Timers = () => {
            if (this.activeSessionId !== currentSession || BossState.playerHp <= 0 || BossState.isDying) return;
            BossAttacks.clearAll();
            BossState.damageLock = false;

            BossAttacks.bombSpawnerTimer = setInterval(() => {
                if (!BossState.damageLock && BossState.playerHp > 0) BossAttacks.spawnBomb();
            }, 3400);

            BossAttacks.qteSpawnerTimer = setInterval(() => {
                if (!BossState.damageLock && BossState.playerHp > 0) BossAttacks.spawnQteCross();
            }, 5800);

            BossAttacks.laserSpawnerTimer = setInterval(() => {
                if (!BossState.damageLock && BossState.playerHp > 0) BossAttacks.spawnLaserGrid(2);
            }, 4500);

            BossAttacks.danmakuSpawnerTimer = setInterval(() => {
                if (!BossState.damageLock && BossState.playerHp > 0) {
                    const core = BossState.getBossCoreCenter();
                    BossAttacks.spawnDanmakuRing(core.x, core.y, 12, 3.4, 'ring');
                }
            }, 2800);

            let step = 0;
            BossAttacks.patternSpawnerTimer = setInterval(() => {
                if (BossState.damageLock || BossState.playerHp <= 0) return;
                step++;
                if (step % 2 === 0) BossAttacks.spawnCurtainWall();
                else BossAttacks.spawnSpiralVolley(4, 2, 3.4);
            }, 2600);
        };

        const bossTitle = document.getElementById('boss-title-name');
        if (bossTitle) bossTitle.textContent = "SAPHYNIEL // SERAFÍN DEL JUICIO";
        ScreenUtils.triggerShake();
        AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom);
        if (typeof BalatroEngine !== 'undefined') {
            BalatroEngine.triggerHit(window.innerWidth / 2, window.innerHeight * 0.3, 1.8);
        }

        BossState.updateCoreSprite();
        AudioManager.playBgm(BOSS_AUDIO_PATHS.bgmPhase2, 0.52, true);
        DialogueSystem.show({ text: "Si la fuerza es el único idioma que respetas, te responderé sin adornos.", speaker: "SAPHYNIEL // DIVINO", tone: "angry", autoHideTime: 2600, spriteMap: BOSS_SPRITES });

        this.healInterval = setInterval(() => {
            if (this.activeSessionId !== currentSession || BossState.playerHp <= 0 || BossState.isDying) {
                clearInterval(this.healInterval);
                return;
            }
            BossState.currentHp += 28;
            BossState.shipY = Math.min(window.innerHeight - 50, BossState.shipY + 5);
            ScreenUtils.triggerShake();
            ParticleEngine.explode(window.innerWidth / 2, window.innerHeight * 0.30, '#d9381e', 6);
            if (BossState.currentHp >= BossState.maxHp) {
                BossState.currentHp = BossState.maxHp;
                clearInterval(this.healInterval);
                startPhase2Timers();
            }
            BossState.updateHpBar();
        }, 45);
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
            BossAttacks.spawnAimedBurst();
            DialogueSystem.show({ text: "Duele ver con qué facilidad desmontas años de silencio.", speaker: "SAPHYNIEL // DIVINO", tone: "mid", autoHideTime: 2600, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 50 && !this.cinematicTriggered) {
            this.cinematicTriggered = true;
            ScreenUtils.triggerShake();
            AudioManager.playAudio(BOSS_AUDIO_PATHS.enrageAlarm);
            BossAttacks.spawnClones();
            BossAttacks.spawnLaserGrid(3);
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
            BossAttacks.spawnCurtainWall();
            DialogueSystem.show({ text: "No eres un error del sistema. Eres alguien que disfruta ver cómo se apaga.", speaker: "SAPHYNIEL // DIVINO", tone: "angry", autoHideTime: 2600, spriteMap: BOSS_SPRITES });
        }
        return true;
    },

    triggerIntermissionDialogue() {
        BossState.damageLock = true;
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
        clearInterval(this.healInterval);
        BossAttacks.clearAll();
    }
};
BossEngine.register('phase2', Phase2);