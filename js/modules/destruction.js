// =========================================================
// SISTEMA DE FRACTURA Y RESTAURACIÓN DEL CÓDICE
// =========================================================
const DestructionModule = {
    score: 0,
    combo: 0,
    comboTimer: null,
    destroyedElements: new Set(),

    init() {
        const savedScore = parseInt(localStorage.getItem('codex_score') || '0', 10);
        this.score = isNaN(savedScore) ? 0 : savedScore;
        this.combo = 0;
        this.updateComboHud();
    },

    destroyElement(el, impactX = null, impactY = null) {
        // Regla estricta: solo se puede destruir cuando la Railgun ha sido desbloqueada
        if (typeof OrbitalModule === 'undefined' || !OrbitalModule.hasRailgun) return false;
        if (!el || el.classList.contains('destroyed-block')) return false;

        const r = el.getBoundingClientRect();
        const cx = impactX !== null ? impactX : (r.left + r.width / 2);
        const cy = impactY !== null ? impactY : (r.top + r.height / 2);

        el.style.setProperty('--rx', Math.random().toFixed(2));
        el.style.setProperty('--ry', Math.random().toFixed(2));
        el.style.setProperty('--rr', Math.random().toFixed(2));
        el.classList.remove('restoring-block');
        el.classList.add('destroyed-block');

        this.destroyedElements.add(el);
        this.combo++;
        const pts = 100 * this.combo;
        this.score += pts;
        localStorage.setItem('codex_score', String(this.score));

        this.updateComboHud();
        this.spawnComboPopup(cx, cy, `FRAGMENTO -${pts}`);

        if (typeof ParticleEngine !== 'undefined') {
            ParticleEngine.explode(cx, cy, '#dad4bb', 18);
        }
        if (typeof BalatroEngine !== 'undefined') {
            BalatroEngine.triggerHit(cx, cy, 0.75);
        }

        // Diálogos conmovedores de Saphyniel al ver su bitácora fracturarse
        const d = (typeof CODEX_DATA !== 'undefined' && CODEX_DATA.railgunDialogues) ? CODEX_DATA.railgunDialogues : {};
        if (this.destroyedElements.size === 1 && d.firstDestroy) {
            DialogueSystem.show({
                text: d.firstDestroy,
                speaker: "SAPHYNIEL",
                tone: "low",
                autoHideTime: 3400
            });
        } else if (this.combo === 3 && d.comboDestroy) {
            DialogueSystem.show({
                text: d.comboDestroy,
                speaker: "SAPHYNIEL",
                tone: "low",
                autoHideTime: 3200
            });
        }

        if (typeof AchievementSystem !== 'undefined' && this.combo >= 3) {
            AchievementSystem.unlock('ui_destroyer');
        }

        clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            this.combo = 0;
            this.updateComboHud();
        }, 5000);

        return true;
    },

    restoreAll() {
        const blocks = document.querySelectorAll('.destroyed-block');
        if (blocks.length === 0) {
            if (typeof AudioManager !== 'undefined') AudioManager.beep(520, 0.06, 'sine');
            return;
        }
        blocks.forEach((el, idx) => {
            setTimeout(() => {
                el.classList.remove('destroyed-block');
                el.classList.add('restoring-block');
                setTimeout(() => el.classList.remove('restoring-block'), 550);
            }, idx * 40);
        });
        this.destroyedElements.clear();
        if (typeof AudioManager !== 'undefined') AudioManager.liturgicalChime();

        const d = (typeof CODEX_DATA !== 'undefined' && CODEX_DATA.railgunDialogues) ? CODEX_DATA.railgunDialogues : {};
        if (d.restored) {
            DialogueSystem.show({
                text: d.restored,
                speaker: "SAPHYNIEL",
                tone: "mid",
                autoHideTime: 2800
            });
        }
    },

    spawnComboPopup(x, y, text) {
        const pop = document.createElement('div');
        pop.className = 'combo-popup';
        pop.style.left = `${x}px`;
        pop.style.top = `${y}px`;
        pop.style.color = '#dad4bb';
        pop.style.fontSize = '0.68rem';
        pop.style.textShadow = '0 0 8px #000';
        pop.textContent = text;
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 800);
    },

    updateComboHud() {
        const hud = document.getElementById('combo-hud');
        if (!hud) return;
        if (this.combo > 0) {
            hud.textContent = `FRAGMENTOS x${this.combo}`;
            hud.classList.add('active');
        } else {
            hud.classList.remove('active');
        }
    }
};

window.DestructionModule = DestructionModule;