// =========================================================
// SISTEMA DE CAÑÓN ORBITAL (RAILGUN)
// - Inicia bloqueado: solo tras desbloquearse permite destruir bloques.
// - Intentar destruir el PFP / Avatar 3 veces rompe el sello e inicia la Bossfight.
// =========================================================
const OrbitalModule = {
    hasRailgun: false,
    isDragging: false,
    clickFireMode: false,
    avatarHoverAttempts: 0,
    guideTimer: null,

    init() {
        this.hasRailgun = localStorage.getItem('codex_railgun_unlocked') === 'true';
        this.avatarHoverAttempts = 0;
        this.syncDockUI();
        this.bindCrosshairDrag();
        this.bindClickToFire();
    },

    syncDockUI() {
        const dock = document.getElementById('railgun-dock');
        const lockedHint = document.getElementById('railgun-locked-hint');
        const activeCtrls = document.getElementById('railgun-active-controls');
        const cross = document.getElementById('orbital-crosshair');

        if (this.hasRailgun) {
            dock?.classList.add('unlocked-dock');
            if (lockedHint) lockedHint.style.display = 'none';
            if (activeCtrls) activeCtrls.style.display = 'flex';
            if (cross) {
                cross.classList.add('unlocked');
                cross.style.display = 'flex';
            }
        } else {
            dock?.classList.remove('unlocked-dock');
            if (lockedHint) lockedHint.style.display = 'flex';
            if (activeCtrls) activeCtrls.style.display = 'none';
            if (cross) {
                cross.classList.remove('unlocked');
                cross.style.display = 'none';
            }
        }
    },

    showUnlockHint() {
        DialogueSystem.show({
            text: "El sello orbital permanece en reposo... (Toca el retrato de Saphyniel 6 veces o escribe 'RAILGUN' en la pestaña [MANDATOS] para despertarlo).",
            speaker: "CÓDICE",
            tone: "low",
            autoHideTime: 3400
        });
        if (typeof AudioManager !== 'undefined') AudioManager.beep(540, 0.06, 'sine');
    },

    unlockRailgun() {
        if (this.hasRailgun) return;
        this.hasRailgun = true;
        localStorage.setItem('codex_railgun_unlocked', 'true');

        const drop = document.getElementById('railgun-drop');
        if (drop) {
            drop.classList.add('dropping');
            if (typeof AudioManager !== 'undefined') AudioManager.playAudio('audio/sfx/ecoorbital.mp3', 0.55);
            setTimeout(() => drop.classList.remove('dropping'), 1500);
        }

        this.syncDockUI();
        this.resetCrosshairPosition();
        this.showSubtleTargetGuide();

        const d = (typeof CODEX_DATA !== 'undefined' && CODEX_DATA.railgunDialogues) ? CODEX_DATA.railgunDialogues : {};
        setTimeout(() => {
            DialogueSystem.show({
                text: d.unlocked || "Has despertado el Cañón Orbital. Ahora puedes arrastrar la mira hacia los bloques del códice... pero por favor, no apuntes hacia mí.",
                speaker: "SAPHYNIEL",
                tone: "low",
                autoHideTime: 4500
            });
        }, 900);
    },

    showSubtleTargetGuide() {
        const ghost = document.getElementById('ghost-target');
        const sample = document.getElementById('tutorial-sample-target');
        if (!ghost || !sample) return;

        const r = sample.getBoundingClientRect();
        ghost.style.left = `${r.left + r.width / 2}px`;
        ghost.style.top = `${r.top + r.height / 2}px`;
        ghost.classList.add('guide-mode');

        clearTimeout(this.guideTimer);
        this.guideTimer = setTimeout(() => {
            ghost.classList.remove('guide-mode');
        }, 4200);
    },

    resetCrosshairPosition() {
        const cross = document.getElementById('orbital-crosshair');
        if (!cross) return;
        cross.style.top = '48px';
        cross.style.right = '24px';
        cross.style.left = 'auto';
        const tel = document.getElementById('crosshair-telemetry');
        if (tel) tel.textContent = 'ACTIVO';
    },

    toggleClickFireMode(forceState = null) {
        if (!this.hasRailgun) return;
        this.clickFireMode = forceState !== null ? forceState : !this.clickFireMode;
        document.body.classList.toggle('click-fire-armed', this.clickFireMode);

        const dockBtn = document.getElementById('dock-arm-btn');
        const tel = document.getElementById('crosshair-telemetry');

        if (dockBtn) {
            dockBtn.classList.toggle('armed', this.clickFireMode);
            dockBtn.textContent = this.clickFireMode ? '[ MIRA ACTIVA ]' : '[ APUNTAR ]';
        }
        if (tel) {
            tel.textContent = this.clickFireMode ? 'SELECCIONA' : 'ACTIVO';
        }
        if (typeof AudioManager !== 'undefined') {
            AudioManager.beep(this.clickFireMode ? 760 : 440, 0.05, 'sine');
        }
    },

    bindClickToFire() {
        window.addEventListener('pointerdown', (e) => {
            if (!this.hasRailgun || !this.clickFireMode || window._bossActive || window._cinematicActive) return;
            if (e.target.closest('#railgun-dock') || e.target.closest('#orbital-crosshair')) return;

            e.preventDefault();
            e.stopPropagation();

            const x = e.clientX;
            const y = e.clientY;

            const cross = document.getElementById('orbital-crosshair');
            if (cross) {
                cross.style.left = `${x - 26}px`;
                cross.style.top = `${y - 26}px`;
                cross.style.right = 'auto';
            }

            this.executeOrbitalStrikeAt(x, y);
        }, true);
    },

    bindCrosshairDrag() {
        const cross = document.getElementById('orbital-crosshair');
        if (!cross) return;

        const updateLaserSight = (cx, cy) => {
            const dock = document.getElementById('railgun-dock');
            const svg = document.getElementById('orbital-laser-sight');
            const line = document.getElementById('orbital-sight-line');
            const dot = document.getElementById('orbital-sight-dot');
            if (!dock || !svg || !line || !dot) return;

            const dr = dock.getBoundingClientRect();
            svg.classList.add('active');
            line.setAttribute('x1', dr.left + dr.width / 2);
            line.setAttribute('y1', dr.top + dr.height / 2);
            line.setAttribute('x2', cx);
            line.setAttribute('y2', cy);
            dot.setAttribute('cx', cx);
            dot.setAttribute('cy', cy);
        };

        const hideLaserSight = () => {
            document.getElementById('orbital-laser-sight')?.classList.remove('active');
        };

        const onMove = (clientX, clientY) => {
            if (!this.isDragging || window._bossActive) return;
            cross.style.left = `${clientX - 26}px`;
            cross.style.top = `${clientY - 26}px`;
            cross.style.right = 'auto';
            updateLaserSight(clientX, clientY);

            const avatarArea = document.getElementById('avatar-area');
            const tel = document.getElementById('crosshair-telemetry');
            if (avatarArea && tel) {
                const ar = avatarArea.getBoundingClientRect();
                const onPfp = (clientX >= ar.left - 8 && clientX <= ar.right + 8 && clientY >= ar.top - 8 && clientY <= ar.bottom + 8);
                tel.textContent = onPfp ? `SELLO ${3 - this.avatarHoverAttempts}/3` : 'APUNTANDO';
            }
        };

        const onEnd = (clientX, clientY) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            hideLaserSight();

            if (typeof clientX === 'number' && typeof clientY === 'number') {
                this.executeOrbitalStrikeAt(clientX, clientY);
            }
        };

        cross.addEventListener('pointerdown', (e) => {
            if (!this.hasRailgun || window._bossActive) return;
            e.preventDefault();
            this.isDragging = true;
            document.getElementById('ghost-target')?.classList.remove('guide-mode');
            cross.setPointerCapture?.(e.pointerId);
            updateLaserSight(e.clientX, e.clientY);
        });

        window.addEventListener('pointermove', (e) => {
            if (this.isDragging) onMove(e.clientX, e.clientY);
        });

        window.addEventListener('pointerup', (e) => {
            if (this.isDragging) onEnd(e.clientX, e.clientY);
        });
    },

    fireBeamVisual(x, y) {
        const beam = document.getElementById('orbital-beam');
        const flash = document.getElementById('flash-screen');

        if (beam) {
            beam.style.left = `${x}px`;
            beam.classList.add('firing');
            setTimeout(() => beam.classList.remove('firing'), 240);
        }
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 110);
        }
        document.body.classList.add('shake-active');
        setTimeout(() => document.body.classList.remove('shake-active'), 200);

        if (typeof AudioManager !== 'undefined') {
            AudioManager.playAudio('audio/sfx/boom.mp3', 0.5);
        }
    },

    // =========================================================
    // DISPARO ORBITAL:
    // - Si apunta al PFP/Avatar: 3 intentos rompen el sello e inician la Bossfight.
    // - Si apunta a un bloque destructible: lo destruye.
    // =========================================================
    executeOrbitalStrikeAt(x, y) {
        if (!this.hasRailgun || window._bossActive) return;

        // 1. Verificar si el disparo fue sobre el Avatar / PFP (principal o de Discord)
        const avatarArea = document.getElementById('avatar-area');
        const dcPfp = document.getElementById('dc-live-pfp');
        let hitPfp = false;

        if (avatarArea) {
            const ar = avatarArea.getBoundingClientRect();
            if (x >= ar.left - 12 && x <= ar.right + 12 && y >= ar.top - 12 && y <= ar.bottom + 12) {
                hitPfp = true;
            }
        }
        if (!hitPfp && dcPfp) {
            const dr = dcPfp.getBoundingClientRect();
            if (x >= dr.left - 8 && x <= dr.right + 8 && y >= dr.top - 8 && y <= dr.bottom + 8) {
                hitPfp = true;
            }
        }

        if (hitPfp) {
            this.fireBeamVisual(x, y);
            this.avatarHoverAttempts++;

            const sealBadge = document.getElementById('avatar-seal-status');
            const d = (typeof CODEX_DATA !== 'undefined' && CODEX_DATA.railgunDialogues) ? CODEX_DATA.railgunDialogues : {};

            if (typeof ParticleEngine !== 'undefined') {
                ParticleEngine.explode(x, y, '#e5c158', 24);
            }

            if (this.avatarHoverAttempts === 1) {
                if (sealBadge) {
                    sealBadge.textContent = 'SELLO: 2/3';
                    sealBadge.classList.add('visible');
                }
                DialogueSystem.show({
                    text: d.avatarHit1 || "Ese disparo dio directo contra mi sello... Por favor, detente. No quiero tener que alzar mis armas contra ti.",
                    speaker: "SAPHYNIEL",
                    tone: "low",
                    autoHideTime: 3600
                });
            } else if (this.avatarHoverAttempts === 2) {
                if (sealBadge) {
                    sealBadge.textContent = 'SELLO: 1/3';
                    sealBadge.classList.add('visible');
                }
                DialogueSystem.show({
                    text: d.avatarHit2 || "El cristal que me protege se está agrietando... Un impacto más sobre mí y me obligarás a defender este refugio.",
                    speaker: "SAPHYNIEL",
                    tone: "mid",
                    autoHideTime: 3800
                });
            } else {
                if (sealBadge) {
                    sealBadge.textContent = 'SELLO ROTO';
                    sealBadge.classList.add('visible');
                }
                this.launchBossFightSequence();
            }
            return;
        }

        // 2. Si no fue en el PFP, buscar bloque destructible bajo (x, y)
        const cross = document.getElementById('orbital-crosshair');
        if (cross) cross.style.pointerEvents = 'none';
        const elemBelow = document.elementFromPoint(x, y);
        if (cross) cross.style.pointerEvents = 'auto';

        if (!elemBelow) return;

        const targetBlock = elemBelow.closest('.link-btn.destructible, .like-card.destructible, .dislike-card.destructible, .lol-stat-box, .faq-item.destructible, .rp-container.destructible, .lol-card.destructible');
        if (targetBlock) {
            this.fireBeamVisual(x, y);
            DestructionModule.destroyElement(targetBlock, x, y);
        }
    },

    launchBossFightSequence() {
        if (this.clickFireMode) this.toggleClickFireMode(false);
        window._bossActive = true;

        const cross = document.getElementById('orbital-crosshair');
        if (cross) cross.style.display = 'none';

        const d = (typeof CODEX_DATA !== 'undefined' && CODEX_DATA.railgunDialogues) ? CODEX_DATA.railgunDialogues : {};
        DialogueSystem.show({
            text: d.avatarHit3 || "Lo entiendo... ni siquiera aquí pude quedarme en paz. Si deseas reducirlo todo a silencio, ven conmigo.",
            speaker: "SAPHYNIEL",
            tone: "yandere",
            autoHideTime: 2400,
            callback: () => {
                const frame = document.getElementById('boss-frame');
                if (frame) {
                    frame.classList.add('active');
                    frame.contentWindow?.postMessage({ type: 'START_BOSS' }, '*');
                }
            }
        });
    }
};

window.OrbitalModule = OrbitalModule;