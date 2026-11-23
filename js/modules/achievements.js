// =========================================================
// SISTEMA DE LOGROS Y MEMORIAS DEL CÓDICE (COHERENTE CON LORE Y COMBATE)
// =========================================================
const AchievementSystem = {
    storageKey: "saphyniel_codex_achievements_v1",
    unlocked: [],

    catalog: [
        {
            id: "audio_sync",
            title: "ECOS EN LA PENUMBRA",
            desc: "Sintonizar las frecuencias de enlace de la bitácora.",
            icon: "❖"
        },
        {
            id: "railgun_unlock",
            title: "SELLO DE ARTILLERÍA ROTO",
            desc: "Despertar el Cañón Orbital tras insistir sobre el cristal del retrato.",
            icon: "◈"
        },
        {
            id: "ui_destroyer",
            title: "ARQUITECTURA FRACTURADA",
            desc: "Demoler 3 fragmentos del códice utilizando el Cañón Orbital.",
            icon: "✦"
        },
        {
            id: "glitch_tap",
            title: "FOLIO SELLADO // CLAVIS",
            desc: "Provocar el estado defensivo de clausura en el santuario.",
            icon: "†"
        },
        {
            id: "fragile_faith",
            title: "EL PESO DEL SILENCIO",
            desc: "Bajar los brazos durante el combate y regresar al códice en calma.",
            icon: "☽"
        },
        {
            id: "perseverance",
            title: "PERO SE NEGÓ A CAER",
            desc: "Reconstruir tu nave y perseverar tras haber caído en el encuentro.",
            icon: "❖"
        },
        {
            id: "boss_slayer",
            title: "CENIZAS DEL SANTUARIO",
            desc: "Permanecer hasta el último compás del encuentro contra Saphyniel.",
            icon: "◈"
        },
        {
            id: "silent_canon",
            title: "VOTO DE SILENCIO BALÍSTICO",
            desc: "Superar las primeras fases sin disparar jamás el Cañón Orbital.",
            icon: "✧"
        },
        {
            id: "golden_covenant",
            title: "NUNCA UNO SIN EL OTRO",
            desc: "Unir tu alma a la luz de Solyn durante el acto secreto.",
            icon: "✦"
        },
        {
            id: "lunar_sanctuary_s",
            title: "EL MUNDO ES UN ESCENARIO [S]",
            desc: "Completar la purificación en paz y abrir el jardín de Flores Lunares.",
            icon: "✿",
            platinum: true
        }
    ],

    init() {
        try {
            this.unlocked = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (e) {
            this.unlocked = [];
        }
        this.updateCounter();
        this.render();
    },

    unlock(id) {
        if (!id) return;
        const ach = this.catalog.find(a => a.id === id);
        if (!ach) return;

        if (!this.unlocked.includes(id)) {
            this.unlocked.push(id);
            localStorage.setItem(this.storageKey, JSON.stringify(this.unlocked));
            this.updateCounter();
            this.render();
            this.showToast(ach.title);
        }
    },

    updateCounter() {
        const counter = document.getElementById('ach-counter');
        if (counter) {
            counter.textContent = `${this.unlocked.length}/${this.catalog.length}`;
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
        const list = document.getElementById('achievementsList');
        if (!list) return;
        list.innerHTML = '';

        this.catalog.forEach(item => {
            const isUnlocked = this.unlocked.includes(item.id);
            const div = document.createElement('div');
            div.className = `achievement-item ${isUnlocked ? 'unlocked' : ''} ${isUnlocked && item.platinum ? 'platinum-tier' : ''}`;
            div.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? item.icon : '·'}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${isUnlocked ? item.title : 'MEMORIA SELLADA'}</div>
                    <div class="achievement-desc">${item.desc}</div>
                </div>
            `;
            list.appendChild(div);
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

window.AchievementSystem = AchievementSystem;
window.toggleAchievementsModal = toggleAchievementsModal;