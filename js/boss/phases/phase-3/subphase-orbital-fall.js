const SubphaseOrbitalFall = {
    cameraInterval: null,
    assaultInterval: null,

    enter() {
        BossAttacks.clearAll();
        // Saphyniel destruye el Railgun y el cañón de tu nave; solo tienes tu Escudo
        BossState.weaponLost = true;
        BossState.damageLock = false; // Permite que los ataques de Saphyniel sigan activos al 100%
        BossState.playerBullets = [];
        BossState.railgunCharge = 0;
        BossState.currentHp = BossState.maxHp;
        BossState.updateHpBar();
        BossState.updateSkillHudBars();

        const shield = document.getElementById('boss-shield');
        if (shield) shield.classList.add('active', 'divine');

        document.body.classList.add('glitch-flash');
        setTimeout(() => document.body.classList.remove('glitch-flash'), 300);

        const cannon = document.getElementById('orbital-cannon-drop');
        if (cannon) cannon.classList.add('drop');

        const standupText = document.getElementById('standup-text');
        if (standupText) {
            standupText.classList.remove('show');
            void standupText.offsetWidth;
            standupText.classList.add('show');
            setTimeout(() => standupText.classList.remove('show'), 3000);
        }

        setTimeout(() => {
            if (BossState.isDying || BossState.playerHp <= 0) return;
            AudioManager.playAudio(BOSS_AUDIO_PATHS.ecoOrbital);
            ParticleEngine.explode(window.innerWidth / 2, window.innerHeight * 0.3, '#ffffff', 80);
            ScreenUtils.triggerShake();
            if (cannon) cannon.classList.remove('drop');

            const aura = document.getElementById('boss-aura-farm');
            if (aura) aura.classList.add('max-power');
            BossState.spawnDamagePopup(BossState.shipX, BossState.shipY - 30, "ARMAMENTO DESTRUIDO // USA TU ESCUDO", 'blocked');

            // Iniciar asalto agresivo de Saphyniel entre 145.8s y 164.0s (Embestidas + Espirales + Muros)
            let step = 0;
            BossState.startBossTackle();
            clearInterval(this.assaultInterval);
            this.assaultInterval = setInterval(() => {
                if (BossState.phase !== 3 || BossState.playerHp <= 0 || BossState.isDying) {
                    clearInterval(this.assaultInterval);
                    return;
                }
                step++;
                BossState.startBossTackle();
                BossAttacks.spawnSpiralVolley(4, 2, 3.5);
                if (step % 2 === 0) BossAttacks.spawnCurtainWall();
                if (step % 3 === 0) BossAttacks.spawnFaithOrb();
            }, 2100);
        }, 800);

        this.startCameraFX();
    },

    startCameraFX() {
        clearInterval(this.cameraInterval);
        let step = 0;
        this.cameraInterval = setInterval(() => {
            document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset');
            if (step === 0) { document.body.classList.add('phase-3-tilt-a'); step = 1; }
            else if (step === 1) { document.body.classList.add('phase-3-tilt-reset'); step = 2; }
            else if (step === 2) { document.body.classList.add('phase-3-tilt-b'); step = 3; }
            else { document.body.classList.add('phase-3-tilt-reset'); step = 0; }
        }, 1200);
    },

    exit() {
        clearInterval(this.cameraInterval);
        clearInterval(this.assaultInterval);
        document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset');
    }
};