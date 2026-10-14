const OrbitalModule = {
    hasRailgun: false,
    hasFiredFirstBombardment: false,
    avatarHoverAttempts: 0,
    isDragging: false,
    startX: 0,
    startY: 0,

    init() {
        if (localStorage.getItem('codex_railgun_unlocked') === 'true') {
            this.hasRailgun = true;
            this.hasFiredFirstBombardment = true;
            const cross = document.getElementById('orbital-crosshair');
            if (cross) cross.classList.add('unlocked');
        }

        const cross = document.getElementById('orbital-crosshair');
        const ghost = document.getElementById('ghost-target');
        if (!cross || !ghost) return;

        const onStart = (e) => {
            if (!this.hasRailgun || window._cinematicActive || window._bossActive) return;
            this.isDragging = true;
            ghost.classList.add('active');
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            this.startX = clientX - cross.offsetLeft;
            this.startY = clientY - cross.offsetTop;
        };

        const onMove = (e) => {
            if (!this.isDragging || !this.hasRailgun || window._cinematicActive || window._bossActive) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            cross.style.left = `${clientX - this.startX}px`;
            cross.style.top = `${clientY - this.startY}px`;
            cross.style.right = 'auto';

            const avR = document.getElementById('avatar-area').getBoundingClientRect();
            const distToAvatar = Math.hypot(clientX - (avR.left + avR.width / 2), clientY - (avR.top + avR.height / 2));
            const distToCenter = Math.hypot(clientX - (window.innerWidth / 2), clientY - (window.innerHeight / 2));

            if (distToAvatar < 75 || distToCenter < 90) {
                cross.style.borderColor = '#ff3333';
                cross.style.boxShadow = '0 0 20px #ff0000';
            } else {
                cross.style.borderColor = 'rgba(218, 212, 187, 0.75)';
                cross.style.boxShadow = 'none';
            }
        };

        const onEnd = () => {
            if (!this.isDragging || !this.hasRailgun) return;
            this.isDragging = false;
            ghost.classList.remove('active');
            if (window._cinematicActive || window._bossActive) return;

            const cr = cross.getBoundingClientRect();
            const cx = cr.left + cr.width / 2;
            const cy = cr.top + cr.height / 2;

            const avR = document.getElementById('avatar-area').getBoundingClientRect();
            const distToAvatar = Math.hypot(cx - (avR.left + avR.width / 2), cy - (avR.top + avR.height / 2));
            const distToCenter = Math.hypot(cx - (window.innerWidth / 2), cy - (window.innerHeight / 2));

            if (!this.hasFiredFirstBombardment && distToAvatar < 75) {
                cross.style.top = '25px';
                cross.style.right = '25px';
                cross.style.left = 'auto';
                DialogueSystem.show({
                    text: "Te pedí que apuntaras al centro, no hacia mí...",
                    speaker: "SAPHYNIEL",
                    tone: "low",
                    autoHideTime: 2600
                });
                AudioManager.beep(160, 0.25, 'sawtooth');
                ScreenUtils.triggerShake('main-hud');
                return;
            }

            if (distToAvatar < 70) {
                this.avatarHoverAttempts++;
                if (this.avatarHoverAttempts === 1) {
                    DialogueSystem.show({ text: CODEX_DATA.orbitalWarnings.attempt1, speaker: "SAPHYNIEL", tone: "mid", autoHideTime: 2600 });
                } else if (this.avatarHoverAttempts === 2) {
                    DialogueSystem.show({ text: CODEX_DATA.orbitalWarnings.attempt2, speaker: "SAPHYNIEL", tone: "low", autoHideTime: 2600 });
                } else {
                    DialogueSystem.show({
                        text: CODEX_DATA.orbitalWarnings.attempt3,
                        speaker: "SAPHYNIEL",
                        tone: "angry",
                        autoHideTime: 1400,
                        callback: () => this.startBossLaunchSequence()
                    });
                }
            } else if (distToCenter < 90) {
                this.startOrbitalBombardment();
            }
        };

        cross.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        cross.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    },

    unlockRailgun() {
        if (this.hasRailgun || window._bossActive || window._cinematicActive) return;
        this.hasRailgun = true;
        localStorage.setItem('codex_railgun_unlocked', 'true');

        window._cinematicActive = true;
        const dropEl = document.getElementById('railgun-drop');
        if (dropEl) dropEl.classList.add('dropping');

        AudioManager.playAudio(CODEX_DATA.sounds.angelCoro, 0.7);
        ParticleEngine.explode(window.innerWidth / 2, window.innerHeight * 0.35, '#ffffff', 50);

        setTimeout(() => {
            ScreenUtils.triggerShake('main-hud');
            setTimeout(() => {
                if (dropEl) dropEl.classList.remove('dropping');
                window._cinematicActive = false;
                document.getElementById('orbital-crosshair')?.classList.add('unlocked');
                document.getElementById('ghost-target')?.classList.add('guide-mode');
            }, 900);
        }, 1100);
    },

    startOrbitalBombardment() {
        if (window._cinematicActive || window._bossActive) return;
        document.getElementById('ghost-target')?.classList.remove('guide-mode');

        const countEl = document.getElementById('orbital-countdown');
        const beamEl = document.getElementById('orbital-beam');
        countEl.style.display = 'block';
        let count = 3;
        countEl.textContent = count;
        AudioManager.beep(800, 0.1, 'sawtooth');

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countEl.textContent = count;
                AudioManager.beep(800, 0.1, 'sawtooth');
            } else {
                clearInterval(timer);
                countEl.style.display = 'none';
                beamEl.classList.add('firing');
                ScreenUtils.triggerShake('main-hud');
                AudioManager.swordImpactSound();
                DestructionModule.triggerTotalDestruction();

                setTimeout(() => {
                    beamEl.classList.remove('firing');
                    this.hasFiredFirstBombardment = true;
                }, 350);
            }
        }, 700);
    },

    startBossLaunchSequence() {
        window._cinematicActive = true;
        DestructionModule.restoreAll();
        document.getElementById('orbital-crosshair').style.display = 'none';

        const countEl = document.getElementById('orbital-countdown');
        countEl.style.display = 'block';
        let count = 3;
        countEl.textContent = count;
        AudioManager.beep(800, 0.1, 'sawtooth');

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countEl.textContent = count;
                AudioManager.beep(800, 0.1, 'sawtooth');
            } else {
                clearInterval(timer);
                countEl.style.display = 'none';

                const flash = document.getElementById('flash-screen');
                flash.classList.add('active');
                AudioManager.playAudio(CODEX_DATA.sounds.vineBoom);

                setTimeout(() => {
                    flash.classList.remove('active');
                    const frame = document.getElementById('boss-frame');
                    frame.classList.add('active');
                    frame.focus();
                    if (frame.contentWindow) frame.contentWindow.focus();

                    ParticleEngine.pause();
                    if (typeof BalatroEngine !== 'undefined') BalatroEngine.pause();

                    frame.contentWindow.postMessage({ type: 'START_BOSS' }, '*');
                    window._bossActive = true;
                    window._cinematicActive = false;
                }, 120);
            }
        }, 700);
    }
};