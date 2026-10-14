// =========================================================
// SUBFASE SUPERVIVENCIA (164.0s - 186.5s):
// Las espadas salen automáticamente de los bordes y bajan la vida de Saphyniel
// hasta llegar a 0%, momento en el que estalla el efecto y la transición.
// =========================================================
const SubphaseSurvival = {
    climaxTriggered: false,

    enter() {
        this.climaxTriggered = false;
        BossState.damageLock = false;
        BossState.weaponLost = true;

        document.getElementById('plastic-horse-overlay')?.classList.remove('show');
        document.getElementById('carton-sword-overlay')?.classList.remove('show');

        BossState.impaledSwords = [];
        BossAttacks.startSurvivalMode();
        BossState.hpAtStart = BossState.currentHp;
    },

    update(currentTime) {
        if (this.climaxTriggered || BossState.isDying || BossState.playerHp <= 0) return;

        // Si el reloj musical llega a 186.5s y aún quedaba algún punto de vida, lanzar ráfaga final y detonar a 0%
        if (currentTime >= 186.5 || BossState.currentHp <= 0) {
            this.climaxTriggered = true;
            this.triggerClimax();
        }
    },

    triggerClimax() {
        BossAttacks.clearAll();
        BossState.tackleState = 'idle';
        BossState.damageLock = true;
        BossState.currentHp = 0;
        BossState.updateHpBar();

        document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b');
        document.body.classList.add('phase-3-tilt-reset', 'phase-3-shatter-zoom');

        const core = document.getElementById('boss-core');
        if (core) {
            core.classList.remove('tackle-mode');
            core.style.top = '45%';
            core.style.left = '50%';
            core.style.pointerEvents = 'none';
            core.classList.add('core-dying-tremble');
        }

        const corePos = BossState.getBossCoreCenter();
        BossState.impaledSwords.forEach(sw => {
            ParticleEngine.explode(corePos.x + sw.offsetX, corePos.y + sw.offsetY, '#f7f5ed', 10);
        });
        BossState.impaledSwords = [];
        ParticleEngine.startPetalRain(65);

        const uiElements = document.querySelectorAll('.boss-hud-floating, .player-hud');
        uiElements.forEach(el => el.style.opacity = '0');

        document.getElementById('boss-shield')?.classList.remove('active', 'divine');

        AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom);
        ScreenUtils.triggerShake();
        ParticleEngine.explode(window.innerWidth / 2, window.innerHeight / 2, '#f7f5ed', 160);

        const unoText = document.getElementById('uno-text');
        if (unoText) {
            unoText.classList.remove('show');
            void unoText.offsetWidth;
            unoText.classList.add('show');
            setTimeout(() => unoText.classList.remove('show'), 3500);
        }

        document.body.classList.add('glitch-flash');
        setTimeout(() => {
            document.body.classList.remove('glitch-flash');
            document.getElementById('boss-aura-farm')?.classList.remove('active', 'max-power');
        }, 400);
    },

    exit() {
        BossAttacks.clearAll();
        BossState.tackleState = 'idle';
    }
};