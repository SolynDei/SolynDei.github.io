// ==========================================
// SISTEMA DE LOGROS NIER / RETRO (INCLUYE FE FRÁGIL Y PERSEVERANCIA)
// ==========================================
const ACHIEVEMENTS_DATA = [
    { id: "init", title: "Unidad Activada", desc: "Inicia y carga la interfaz del Códice.", secret: false },
    { id: "audio_sync", title: "Frecuencia Resonante", desc: "Interactúa con los enlaces o frecuencias sonoras.", secret: false },
    { id: "insomnia", title: "Vigilia Nocturna", desc: "Accede al Códice entre la medianoche y las 5 AM.", secret: false },
    { id: "fragile_faith", title: "Fe Frágil", desc: "Sucumbe ante el colapso y ríndete tras escuchar la burla de Saphyniel.", secret: false },
    { id: "perseverance", title: "Perseverancia", desc: "Rechaza la derrota y vuelve a alzarte tras ver tu nave hecha pedazos.", secret: false },
    { id: "glitch_tap", title: "Anomalía de Memoria", desc: "Provoca la ira de Saphyniel insistiendo sobre su retrato.", secret: true },
    { id: "codex_deep", title: "Protocolo NieR", desc: "Inspecciona los archivos confidenciales de registro.", secret: true },
    { id: "boss_slayer", title: "Deicidio Trascendente", desc: "Quebranta la voluntad del Códice en combate.", secret: false },
    { id: "platinum", title: "Fin del Registro: [E]", desc: "Desbloquea todos los registros anteriores del Códice.", secret: false, isPlatinum: true }
];

const AchievementSystem = {
    storageKey: "saphyniel_codex_achievements_v1",
    unlocked: [],

    init() {
        this.unlocked = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        this.unlock("init");
        this.checkTimeCondition();
        if (window._bossBeaten) this.unlock("boss_slayer");
        this.render();
        this.updateCounter();
    },

    unlock(id) {
        if (this.unlocked.includes(id)) return;
        const ach = ACHIEVEMENTS_DATA.find(a => a.id === id);
        if (!ach) return;

        this.unlocked.push(id);
        localStorage.setItem(this.storageKey, JSON.stringify(this.unlocked));
        this.showToast(ach.title);
        this.render();
        this.updateCounter();

        const nonPlatinumCount = ACHIEVEMENTS_DATA.filter(a => !a.isPlatinum).length;
        const unlockedNonPlat = this.unlocked.filter(u => u !== "platinum").length;
        if (unlockedNonPlat >= nonPlatinumCount && !this.unlocked.includes("platinum")) {
            setTimeout(() => this.unlock("platinum"), 800);
        }
    },

    checkTimeCondition() {
        const hours = new Date().getHours();
        if (hours >= 0 && hours < 5) this.unlock("insomnia");
    },

    showToast(title) {
        const toast = document.getElementById("achievementToast");
        const titleEl = document.getElementById("toastTitle");
        if (!toast || !titleEl) return;

        titleEl.textContent = title;
        toast.classList.add("show");
        if (typeof AudioManager !== 'undefined') AudioManager.liturgicalChime();
        setTimeout(() => toast.classList.remove("show"), 3800);
    },

    updateCounter() {
        const counterEl = document.getElementById("ach-counter");
        if (counterEl) {
            counterEl.textContent = `${this.unlocked.length}/${ACHIEVEMENTS_DATA.length}`;
        }
    },

    render() {
        const container = document.getElementById("achievementsList");
        if (!container) return;

        container.innerHTML = ACHIEVEMENTS_DATA.map(ach => {
            const isUnlocked = this.unlocked.includes(ach.id);
            const isPlat = ach.isPlatinum;
            const title = !isUnlocked && ach.secret ? "???" : ach.title;
            const desc = !isUnlocked && ach.secret ? "Registro clasificado bajo directiva confidencial." : ach.desc;
            const icon = isUnlocked ? (isPlat ? "★" : "◈") : "◇";

            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : ''} ${isPlat && isUnlocked ? 'platinum-tier' : ''}">
                    <div class="achievement-icon">${icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-title">${title}</div>
                        <div class="achievement-desc">${desc}</div>
                    </div>
                </div>
            `;
        }).join("");
    }
};

function toggleAchievementsModal() {
    const modal = document.getElementById("achievementsModal");
    if (modal) {
        modal.classList.toggle("active");
        AchievementSystem.unlock("codex_deep");
    }
}