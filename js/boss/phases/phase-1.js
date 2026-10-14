const Phase1 = {
    hit75: false,
    hit50: false,
    hit20: false,
    alertBannerTimer: 0,
    activeSessionId: 0,

    enter() {
        this.activeSessionId++;
        const currentSession = this.activeSessionId;

        BossState.phase = 1;
        BossState.maxHp = 480;
        BossState.currentHp = 480;
        BossState.damageLock = true;
        BossState.isInvulnerable = false;
        BossState.weaponLost = false;

        this.hit75 = false;
        this.hit50 = false;
        this.hit20 = false;
        this.alertBannerTimer = 2.6;

        BossState.updateHpBar();
        BossState.updateCoreSprite();

        const title = document.getElementById('boss-title-name');
        if (title) title.textContent = "SAPHYNIEL // DEIDAD TRANSCENDENTE";

        document.body.className = 'combat-no-cursor';
        document.getElementById('cinematic-darkness')?.classList.remove('active');

        if (typeof AudioManager !== 'undefined') {
            AudioManager.init();
            AudioManager.playBgm(BOSS_AUDIO_PATHS.bgmPhase1, 0.48, true);
            AudioManager.playAudio(BOSS_AUDIO_PATHS.enrageAlarm, 0.35);
        }

        const startCombatTimers = () => {
            if (this.activeSessionId !== currentSession || BossState.playerHp <= 0 || BossState.isDying) return;
            BossAttacks.clearAll();
            BossState.damageLock = false;

            BossAttacks.qteSpawnerTimer = setInterval(() => {
                if (!BossState.damageLock && BossState.playerHp > 0) BossAttacks.spawnQteCross();
            }, 6400);

            BossAttacks.danmakuSpawnerTimer = setInterval(() => {
                if (!BossState.damageLock && BossState.playerHp > 0) {
                    const core = BossState.getBossCoreCenter();
                    BossAttacks.spawnDanmakuRing(core.x, core.y, 10, 3.2, 'aimed');
                }
            }, 3100);

            let pStep = 0;
            BossAttacks.patternSpawnerTimer = setInterval(() => {
                if (BossState.damageLock || BossState.playerHp <= 0) return;
                pStep++;
                if (pStep % 3 === 0) BossAttacks.spawnAimedBurst();
                else BossAttacks.spawnSpiralVolley(3, 2, 3.1);
            }, 1300);
        };

        if (BossEngine.checkDebugParams() === '1') {
            startCombatTimers();
            return;
        }

        DialogueSystem.show({
            text: "Has forzado la puerta de mi santuario. [WASD: MOVER | ESPACIO: ESCUDO | E: RAILGUN]",
            speaker: "SAPHYNIEL // DEIDAD",
            tone: "angry",
            autoHideTime: 2500,
            spriteMap: BOSS_SPRITES,
            callback: () => {
                if (this.activeSessionId !== currentSession || BossState.playerHp <= 0 || BossState.isDying) return;
                if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.bossIntro);
                startCombatTimers();
            }
        });
    },

    update(dt) {
        if (this.alertBannerTimer > 0 && typeof ParticleEngine !== 'undefined' && ParticleEngine.ctx) {
            this.alertBannerTimer -= dt;
            const ctx = ParticleEngine.ctx;
            const w = window.innerWidth;
            const h = window.innerHeight;
            ctx.save();
            ctx.fillStyle = `rgba(217, 56, 30, ${Math.min(0.85, this.alertBannerTimer * 0.6)})`;
            ctx.fillRect(0, h * 0.44, w, 46);
            ctx.fillStyle = '#f7f5ed';
            ctx.font = 'bold 14px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ ALERTA YORHA // ENTIDAD DIVINA HOSTIL DETECTADA ⚠️', w / 2, h * 0.44 + 29);
            ctx.restore();
        }
    },

    onHit(dmg, coords) {
        if (BossState.currentHp <= 1) {
            BossState.currentHp = 1;
            BossState.updateHpBar();
            BossEngine.transitionTo('phase2');
            return false;
        }

        const hpPercent = (BossState.currentHp / BossState.maxHp) * 100;
        if (hpPercent <= 75 && !this.hit75) {
            this.hit75 = true;
            BossAttacks.spawnTelegraphLaser();
            DialogueSystem.show({ text: "No es un juego para mí. Es el único refugio que tengo en pie.", speaker: "SAPHYNIEL // DEIDAD", tone: "mid", autoHideTime: 2500, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 50 && !this.hit50) {
            this.hit50 = true;
            BossAttacks.spawnBomb();
            BossAttacks.spawnQteCross();
            DialogueSystem.show({ text: "Persistes tanto... como si vencer aquí fuera a llenar el vacío fuera de la pantalla.", speaker: "SAPHYNIEL // DEIDAD", tone: "low", autoHideTime: 2800, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 20 && !this.hit20) {
            this.hit20 = true;
            BossAttacks.spawnLaserGrid(2);
            DialogueSystem.show({ text: "¿Qué esperas encontrar cuando este registro llegue a cero?", speaker: "SAPHYNIEL // DEIDAD", tone: "angry", autoHideTime: 2500, spriteMap: BOSS_SPRITES });
        }
        return true;
    },

    exit() {
        this.activeSessionId++;
        BossAttacks.clearAll();
    }
};
BossEngine.register('phase1', Phase1);