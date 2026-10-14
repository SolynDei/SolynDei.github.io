// =========================================================
// CONTROLADOR DE SALMOS BOCA ABAJO (SELECCIÓN Y BLOQUEO POR COMBATE)
// =========================================================
const DeckController = {
    currentCards: [],
    flippedIndex: null,

    getBuffDescription(tier) {
        if (tier === 'crimson') return 'CADENCIA DE FUEGO +35%';
        if (tier === 'gold') return '+1 CORAZÓN MÁXIMO EN COMBATE';
        return 'RECARGA DE ESCUDO Y RAILGUN +30%';
    },

    renderVerses() {
        const deck = document.getElementById('quotes-deck');
        const quotesContainer = document.querySelector('.quotes-container');
        if (!deck || !quotesContainer) return;

        // Crear banner de estado y barra de decisión si no existen
        let banner = document.getElementById('psalms-status-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'psalms-status-banner';
            banner.className = 'psalms-status-banner';
            quotesContainer.insertBefore(banner, quotesContainer.firstChild);
        }

        let decisionBar = document.getElementById('psalm-decision-bar');
        if (!decisionBar) {
            decisionBar = document.createElement('div');
            decisionBar.id = 'psalm-decision-bar';
            decisionBar.className = 'psalm-decision-bar';
            decisionBar.innerHTML = `
                <button type="button" class="psalm-action-btn keep" id="btn-keep-psalm">[ ✦ CONSERVAR SALMO ]</button>
                <button type="button" class="psalm-action-btn discard" id="btn-discard-psalm">[ ✕ DESCARTAR ]</button>
            `;
            quotesContainer.insertBefore(decisionBar, quotesContainer.querySelector('.deck-controls'));

            document.getElementById('btn-keep-psalm').onclick = () => this.keepCurrentCard();
            document.getElementById('btn-discard-psalm').onclick = () => this.discardCurrentCard();
        }
        decisionBar.classList.remove('active');

        const savedHand = localStorage.getItem('codex_psalms_hand');
        if (savedHand) {
            try { this.currentCards = JSON.parse(savedHand); } catch (e) { this.currentCards = []; }
        }

        if (!this.currentCards || this.currentCards.length !== 3) {
            const shuffled = [...CODEX_DATA.verses].sort(() => 0.5 - Math.random()).slice(0, 3);
            this.currentCards = shuffled.map(v => ({ ...v, state: 'facedown' })); // 'facedown', 'kept', 'discarded'
            localStorage.setItem('codex_psalms_hand', JSON.stringify(this.currentCards));
        }

        this.flippedIndex = null;
        deck.innerHTML = '';

        const numerals = ['SELLO I', 'SELLO II', 'SELLO III'];
        const hasKeptCard = this.currentCards.some(c => c.state === 'kept');
        const allResolved = this.currentCards.every(c => c.state !== 'facedown');

        if (hasKeptCard || allResolved) {
            localStorage.setItem('codex_psalms_locked', 'true');
        }

        this.currentCards.forEach((v, idx) => {
            const slot = document.createElement('div');
            slot.className = `tarot-card-slot destructible ${v.state === 'discarded' ? 'discarded' : ''} ${(hasKeptCard || v.state !== 'facedown') ? 'locked' : ''}`;
            const glyph = v.tier === 'crimson' ? '⚔' : (v.tier === 'gold' ? '✦' : '❖');
            const isFlipped = v.state === 'kept';

            slot.innerHTML = `
                <div class="tarot-card-inner ${isFlipped ? 'is-flipped' : ''}" id="tarot-inner-${idx}">
                    <div class="tarot-face tarot-back">
                        <div style="font-size:0.55rem; color:var(--text-dim);">[ ARCANO SACRO ]</div>
                        <div class="tarot-back-ring">❖</div>
                        <div class="tarot-back-label">${numerals[idx]}</div>
                    </div>
                    <div class="tarot-face tarot-front tier-${v.tier}">
                        <div class="card-top-glyph">${glyph}</div>
                        <div class="card-title">${v.title}</div>
                        <div class="card-tag">${v.tag}</div>
                        <div class="card-body">${v.body}</div>
                        <div class="card-buff-badge">${this.getBuffDescription(v.tier)}</div>
                    </div>
                </div>
            `;

            slot.addEventListener('click', () => {
                if (window._cinematicActive || window._bossActive) return;
                this.flipCard(idx);
            });

            deck.appendChild(slot);
        });

        this.updateStatusUI();
    },

    flipCard(idx) {
        const card = this.currentCards[idx];
        if (!card || card.state !== 'facedown') return;
        if (this.currentCards.some(c => c.state === 'kept')) return;
        if (this.flippedIndex !== null && this.flippedIndex !== idx) return;

        this.flippedIndex = idx;
        const inner = document.getElementById(`tarot-inner-${idx}`);
        if (inner) inner.classList.add('is-flipped');

        AudioManager.cardSlideSound();
        document.getElementById('psalm-decision-bar')?.classList.add('active');

        const banner = document.getElementById('psalms-status-banner');
        if (banner) {
            banner.innerHTML = `REVELADO: <b>${card.title}</b> (${this.getBuffDescription(card.tier)}) — ¿Conservar o descartar?`;
        }
    },

    keepCurrentCard() {
        if (this.flippedIndex === null) return;
        const idx = this.flippedIndex;
        const card = this.currentCards[idx];
        card.state = 'kept';

        localStorage.setItem('codex_active_blessing', card.tier);
        localStorage.setItem('codex_active_blessing_title', card.title);
        localStorage.setItem('codex_psalms_hand', JSON.stringify(this.currentCards));
        localStorage.setItem('codex_psalms_locked', 'true');

        AudioManager.playCardJingle(card.tier);
        document.getElementById('psalm-decision-bar')?.classList.remove('active');

        DialogueSystem.show({
            text: `Has sellado el pacto con ${card.title}: [${this.getBuffDescription(card.tier)}]. Te acompañará en el próximo combate.`,
            speaker: "SACRO // REGISTRO",
            tone: card.tier === 'crimson' ? 'angry' : 'mid',
            autoHideTime: 3200
        });

        this.flippedIndex = null;
        this.renderVerses();
    },

    discardCurrentCard() {
        if (this.flippedIndex === null) return;
        const idx = this.flippedIndex;
        const card = this.currentCards[idx];
        card.state = 'discarded';

        localStorage.setItem('codex_psalms_hand', JSON.stringify(this.currentCards));
        AudioManager.beep(220, 0.12, 'sawtooth');
        document.getElementById('psalm-decision-bar')?.classList.remove('active');

        this.flippedIndex = null;
        this.renderVerses();
    },

    updateStatusUI() {
        const banner = document.getElementById('psalms-status-banner');
        const rerollBtn = document.querySelector('.reroll-btn');
        const isLocked = localStorage.getItem('codex_psalms_locked') === 'true';
        const activeTier = localStorage.getItem('codex_active_blessing');
        const activeTitle = localStorage.getItem('codex_active_blessing_title');

        if (banner) {
            if (activeTier && activeTitle) {
                banner.innerHTML = `BENDICIÓN ACTIVA: <b>${activeTitle}</b> [${this.getBuffDescription(activeTier)}]`;
            } else if (isLocked) {
                banner.textContent = "MAZO AGOTADO // ENFRENTA A SAPHYNIEL PARA RENOVAR LOS SELLOS";
            } else {
                banner.textContent = "ELIGE UNA CARTA SELLADA BOCA ABAJO PARA REVELAR TU SALMO";
            }
        }

        if (rerollBtn) {
            if (isLocked) {
                rerollBtn.disabled = true;
                rerollBtn.textContent = "[ 🔒 BLOQUEADO HASTA DESPUÉS DEL COMBATE ]";
            } else {
                rerollBtn.disabled = false;
                rerollBtn.textContent = "[ ❖ BARAJAR NUEVOS SELLOS ]";
            }
        }
    },

    unlockAfterCombat() {
        localStorage.removeItem('codex_psalms_locked');
        localStorage.removeItem('codex_psalms_hand');
        this.currentCards = [];
        this.renderVerses();
    },

    rerollVerses() {
        if (window._cinematicActive || window._bossActive) return;
        if (localStorage.getItem('codex_psalms_locked') === 'true') {
            AudioManager.beep(180, 0.15, 'sawtooth');
            DialogueSystem.show({
                text: "Los Salmos han sido sellados. Debes enfrentar el combate antes de invocar una nueva tirada.",
                speaker: "SAPHYNIEL",
                tone: "low",
                autoHideTime: 2600
            });
            return;
        }
        localStorage.removeItem('codex_psalms_hand');
        this.currentCards = [];
        AudioManager.cardSlideSound();
        this.renderVerses();
    }
};

function _renderVerses() { DeckController.renderVerses(); }
function _rerollVerses() { DeckController.rerollVerses(); }