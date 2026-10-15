const TerminalModule = {
    lastCmd: "",

    launchSecretPhase(phaseParam) {
        const frame = document.getElementById('boss-frame');
        if (!frame) return;
        if (typeof ParticleEngine !== 'undefined') ParticleEngine.pause();
        if (typeof BalatroEngine !== 'undefined') BalatroEngine.pause();

        frame.src = `boss.html?phase=${phaseParam}`;
        frame.classList.add('active');
        frame.focus();
        window._bossActive = true;
    },

    init() {
        const input = document.getElementById('terminal-cmd');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            if (window._cinematicActive || window._bossActive) return;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.lastCmd) input.value = this.lastCmd;
                return;
            }
            if (e.key === 'Enter') {
                const v = input.value.trim().toUpperCase();
                input.value = '';
                if (!v) return;
                this.lastCmd = v;
                this.log(`> ${v}`, 'sys');

                // ============================================================
                // COMANDOS PÚBLICOS (VISIBLES EN HELP)
                // ============================================================
                if (v === 'RAILGUN' || v === 'CANNON' || v === 'WEAPON') {
                    if (typeof OrbitalModule !== 'undefined') {
                        if (!OrbitalModule.hasRailgun) {
                            OrbitalModule.unlockRailgun('terminal');
                            this.log("[SISTEMA] CAÑÓN ORBITAL DESBLOQUEADO DESDE EL PROTOCOLO SAGRADO.", "success");
                        } else {
                            this.log("[AVISO] EL ARMAMENTO DIVINO YA ESTÁ EN TU POSESIÓN.", "err");
                            AudioManager.beep(300, 0.1, 'sawtooth');
                        }
                    }
                } else if (v === 'RESET') {
                    localStorage.clear();
                    sessionStorage.clear();
                    this.log("[SISTEMA] MEMORIA PURGADA POR COMPLETO. RECARGANDO...", "err");
                    setTimeout(() => window.location.reload(), 1000);
                } else if (v === 'BLESS') {
                    ParticleEngine.rainBlessing();
                    AudioManager.liturgicalChime();
                    this.log("[SACRO] LLUVIA DE BENDICIONES DERRAMADA.", "success");
                } else if (v === 'JUDGMENT') {
                    ScreenUtils.triggerShake('main-hud');
                    AudioManager.swordImpactSound();
                    ParticleEngine.spawnSword(window.innerWidth / 2);
                    this.log("[JUICIO] ESPADA CELESTIAL DESCENDIDA.", "err");
                } else if (v === 'KINDRED') {
                    TabManager.switchTab('tab-lol');
                    ChampSelector.select('kindred');
                    this.log("[REGISTRO] CAZADORES ETERNOS EN POSICIÓN.", "success");
                } else if (v === 'SHYVANA') {
                    TabManager.switchTab('tab-lol');
                    ChampSelector.select('shyvana');
                    this.log("[REGISTRO] DRAGÓN DESPERTADO.", "success");
                } else if (v === 'KAYLE') {
                    TabManager.switchTab('tab-lol');
                    ChampSelector.select('kayle');
                    this.log("[REGISTRO] ASCENSIÓN DIVINA.", "success");
                } else if (v === 'FALLEN') {
                    AvatarController.triggerFallen();
                    this.log("[AVISO] SECCIÓN CLAUSURADA.", "err");
                } else if (v === 'ANGEL') {
                    AvatarController.restoreAngelState();
                    this.log("[OK] LECTURA RESTAURADA.", "success");
                    AudioManager.beep(1200, 0.3, 'sine');
                } else if (v === 'HELP') {
                    this.log("MANDATOS: RAILGUN, BLESS, JUDGMENT, KINDRED, SHYVANA, KAYLE, FALLEN, ANGEL, CLEAR, STATUS, RESET", "sys");
                } else if (v === 'STATUS') {
                    this.log("REGISTRO: EN LÍNEA // ENCRIPTACIÓN SAGRADA ACTIVA", "success");
                } else if (v === 'CLEAR') {
                    const logBox = document.getElementById('terminal-log');
                    if (logBox) logBox.innerHTML = '<div class="terminal-log-entry sys">[CÓDICE] Registro limpiado.</div>';
                    AudioManager.beep(300, 0.08, 'sine');
                }

                // ============================================================
                // COMANDOS DE DEBUG / HACKS SECRETOS (NO SALEN EN HELP)
                // ============================================================
                else if (v === 'GOD' || v === 'GODMODE') {
                    const next = localStorage.getItem('codex_debug_godmode') !== 'true';
                    localStorage.setItem('codex_debug_godmode', next.toString());
                    this.log(`[HACK // GODMODE] INVULNERABILIDAD DE NAVE: ${next ? 'ACTIVADA' : 'DESACTIVADA'}.`, "success");
                    AudioManager.liturgicalChime();
                } else if (v === 'ONESHOT' || v === 'INSTAKILL') {
                    const next = localStorage.getItem('codex_debug_oneshot') !== 'true';
                    localStorage.setItem('codex_debug_oneshot', next.toString());
                    this.log(`[HACK // ONESHOT] DAÑO LETAL INSTANTÁNEO (9999 DMG): ${next ? 'ACTIVADO' : 'DESACTIVADO'}.`, "success");
                    AudioManager.swordImpactSound();
                } else if (v === 'INFRAIL' || v === 'INFINITE') {
                    const next = localStorage.getItem('codex_debug_infrail') !== 'true';
                    localStorage.setItem('codex_debug_infrail', next.toString());
                    this.log(`[HACK // OVERDRIVE] RAILGUN INFINITO Y ESCUDO SIN CD: ${next ? 'ACTIVADO' : 'DESACTIVADO'}.`, "success");
                    AudioManager.liturgicalChime();
                } else if (v === 'BOSS1' || v === 'PHASE1') {
                    this.log("[DEBUG] INICIANDO DIRECTAMENTE FASE 1...", "success");
                    setTimeout(() => this.launchSecretPhase('1'), 400);
                } else if (v === 'BOSS2' || v === 'PHASE2') {
                    this.log("[DEBUG] INICIANDO DIRECTAMENTE FASE 2...", "success");
                    setTimeout(() => this.launchSecretPhase('2'), 400);
                } else if (v === 'BOSS3' || v === 'PHASE3') {
                    this.log("[DEBUG] INICIANDO DIRECTAMENTE FASE 3...", "success");
                    setTimeout(() => this.launchSecretPhase('3'), 400);
                } else if (v === 'BOSSS' || v === 'PHASES' || v === 'FURINA') {
                    this.log("[DEBUG] INICIANDO FASE ALTERNATIVA SECRETA [S]...", "success");
                    setTimeout(() => this.launchSecretPhase('s'), 400);
                } else if (v === 'SOLYN' || v === 'GOLDEN10') {
                    localStorage.setItem('codex_phase_s_saved_pct', '55');
                    localStorage.setItem('codex_phase_s_died_after_50', 'true');
                    this.log("[HACK // SOLYN] 55% PURIFICACIÓN + VÍNCULO DE 10 CORAZONES DORADOS ACTIVADO. LANZANDO FASE S...", "success");
                    setTimeout(() => this.launchSecretPhase('s'), 500);
                } else if (v === 'REROLL99' || v === 'MAXSALMOS') {
                    localStorage.setItem('codex_psalms_rerolls_left', '99');
                    if (typeof DeckController !== 'undefined') {
                        DeckController.rerollsLeft = 99;
                        DeckController.renderVerses();
                    }
                    this.log("[HACK // SALMOS] 99 REROLLS OTORGADOS EN LA PESTAÑA SALMOS.", "success");
                    AudioManager.liturgicalChime();
                } else if (v === 'THEMES' || v === 'UNLOCKALL') {
                    localStorage.setItem('codex_reborn_sanctuary', 'true');
                    localStorage.setItem('codex_ending_s_sanctuary', 'true');
                    localStorage.setItem('codex_sanctuary_theme_mode', 'S');
                    localStorage.setItem('codex_railgun_unlocked', 'true');
                    localStorage.setItem('codex_psalms_rerolls_left', '99');
                    if (typeof ACHIEVEMENTS_DATA !== 'undefined' && typeof AchievementSystem !== 'undefined') {
                        ACHIEVEMENTS_DATA.forEach(a => AchievementSystem.unlock(a.id));
                    }
                    if (typeof syncSanctuaryThemeUI === 'function') syncSanctuaryThemeUI();
                    this.log("[HACK // MASTER] TODOS LOS LOGROS, TEMAS (E/S), RAILGUN Y REROLLS DESBLOQUEADOS.", "success");
                    AudioManager.liturgicalChime();
                } else {
                    this.log(`[ERROR] MANDATO '${v}' NO RECONOCIDO.`, "err");
                    AudioManager.beep(200, 0.1, 'sawtooth');
                }
            }
        });
    },

    log(message, type = '') {
        const logBox = document.getElementById('terminal-log');
        if (!logBox) return;
        const d = document.createElement('div');
        d.className = `terminal-log-entry ${type}`;
        d.textContent = message;
        logBox.appendChild(d);
        logBox.scrollTop = logBox.scrollHeight;
    }
};