// ============================================================================
// SISTEMA DE LOGROS NIER / REGISTRO DE OPERACIÓN
// Incluye los 6 logros base + los 5 logros secretos de la Ruta Pacifista [S]
// ============================================================================
const AchievementSystem = {
    STORAGE_KEY: "saphyniel_codex_achievements_v1",
    unlocked: [],

    catalog: [
        {
            id: "audio_sync",
            title: "RESONANCIA INICIAL",
            desc: "Sintonizaste las frecuencias del Códice al explorar sus enlaces.",
            icon: "◈",
            tier: "normal"
        },
        {
            id: "glitch_tap",
            title: "INSISTENCIA EN EL UMBRAL",
            desc: "Perturbaste la calma de Saphyniel hasta despertar su estado caído.",
            icon: "💢",
            tier: "normal"
        },
        {
            id: "railgun_unlock",
            title: "ARTILLERÍA ORBITAL",
            desc: "Desbloqueaste el Cañón Orbital profanando la estructura del Códice.",
            icon: "⌖",
            tier: "normal"
        },
        {
            id: "fragile_faith",
            title: "FE FRÁGIL",
            desc: "Elegiste rendirte y abandonar el combate cuando el silencio pesó demasiado.",
            icon: "🏳",
            tier: "normal"
        },
        {
            id: "perseverance",
            title: "PERSEVERANCIA",
            desc: "Te negaste a desaparecer y reensamblaste tu nave tras caer en combate.",
            icon: "↻",
            tier: "normal"
        },
        {
            id: "boss_slayer",
            title: "TESTIGO DEL COLAPSO",
            desc: "Llegaste hasta el final del encuentro contra Saphyniel.",
            icon: "⚔",
            tier: "normal"
        },
        // --- SET DE LOGROS SECRETOS EXCLUSIVOS DE LA FASE [S] ---
        {
            id: "silent_canon",
            title: "VOTO DE SILENCIO BALÍSTICO",
            desc: "[SECRETO S] Superaste las Fases 1 y 2 sin disparar la Railgun ni una sola vez.",
            icon: "🕊",
            tier: "secret"
        },
        {
            id: "golden_covenant",
            title: "NUNCA UNO SIN EL OTRO",
            desc: "[SECRETO S] Uniste tu alma con Solyn y forjaste los 10 Corazones Dorados.",
            icon: "❤",
            tier: "secret"
        },
        {
            id: "stage_critic",
            title: "CRÍTICA DE LA PROPIA MEMORIA",
            desc: "[SECRETO S] Sanaste los 6 recuerdos desprendidos sin destruir ninguno.",
            icon: "✦",
            tier: "secret"
        },
        {
            id: "curtain_call_e",
            title: "EL PESO DEL TELÓN [E]",
            desc: "[SECRETO S] Entregaste tus Corazones Dorados en el clímax para sostener su vida.",
            icon: "❖",
            tier: "secret"
        },
        {
            id: "lunar_sanctuary_s",
            title: "EL MUNDO ES UN ESCENARIO [S]",
            desc: "[PLATINO S] Completaste la Fase Secreta [S] y abriste el Jardín de Flores Lunares.",
            icon: "✿",
            tier: "platinum"
        }
    ],

    init() {
        try {
            this.unlocked = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch (e) {
            this.unlocked = [];
        }
        this.updateCounter();
        this.render();
    },

    unlock(id) {
        try {
            const stored = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
            if (stored.length > this.unlocked.length) {
                this.unlocked = stored;
            }
        } catch (e) {}

        const item = this.catalog.find(a => a.id === id);
        if (!item) return false;

        if (!this.unlocked.includes(id)) {
            this.unlocked.push(id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.unlocked));
            this.showToast(item.title);
        }
        this.updateCounter();
        this.render();
        return true;
    },

    updateCounter() {
        const counterEl = document.getElementById('ach-counter');
        if (counterEl) {
            counterEl.textContent = `${this.unlocked.length}/${this.catalog.length}`;
        }
    },

    showToast(title) {
        const toast = document.getElementById('achievementToast');
        const titleEl = document.getElementById('toastTitle');
        if (!toast || !titleEl) return;
        titleEl.textContent = title;
        toast.classList.add('show');
        if (typeof AudioManager !== 'undefined') AudioManager.liturgicalChime();
        setTimeout(() => toast.classList.remove('show'), 3600);
    },

    render() {
        const listEl = document.getElementById('achievementsList');
        if (!listEl) return;
        listEl.innerHTML = '';

        this.catalog.forEach(ach => {
            const isUnlocked = this.unlocked.includes(ach.id);
            const div = document.createElement('div');
            const isPlat = isUnlocked && (ach.tier === 'platinum' || ach.tier === 'secret');
            div.className = `achievement-item ${isUnlocked ? 'unlocked' : ''} ${isPlat ? 'platinum-tier' : ''}`;

            const displayTitle = isUnlocked ? ach.title : (ach.tier === 'normal' ? ach.title : 'REGISTRO SELLADO // [S]');
            const displayDesc = isUnlocked
                ? ach.desc
                : (ach.tier === 'normal' ? ach.desc : 'Condición oculta: Calla tu arma durante el juicio para descubrir esta memoria.');

            div.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? ach.icon : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${displayTitle}</div>
                    <div class="achievement-desc">${displayDesc}</div>
                </div>
            `;
            listEl.appendChild(div);
        });
    }
};

function toggleAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    if (!modal) return;
    AchievementSystem.init();
    modal.classList.toggle('active');
    if (typeof AudioManager !== 'undefined') AudioManager.beep(520, 0.05, 'sine');
}