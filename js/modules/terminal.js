const TerminalModule = {
    lastCmd: "",

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