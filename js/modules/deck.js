// ============================================================================
// CONTROLADOR DE SALMOS ACUMULABLES (LOS 3 SE CONSERVAN + 3 REROLLS INDIVIDUALES)
// ============================================================================
const DeckController = {
    currentCards: [],
    rerollsLeft: 3,

    getBuffDescription(tier) {
        if (tier === 'crimson') return '+22% CADENCIA DE FUEGO';
        if (tier === 'gold') return '+1 CORAZÓN MÁXIMO';
        return '+28% CARGA ESCUDO/RAILGUN';
    },

    initHandState() {
        const savedRerolls = localStorage.getItem('codex_psalms_rerolls_left');
        if (savedRerolls !== null) {
            this.rerollsLeft = parseInt(savedRerolls, 10);
            if (isNaN(this.rerollsLeft)) this.rerollsLeft = 3;
        } else {
            this.rerollsLeft = 3;
            localStorage.setItem('codex_psalms_rerolls_left', '3');
        }

        const savedHand = localStorage.getItem('codex_psalms_hand');
        if (savedHand) {
            try { this.currentCards = JSON.parse(savedHand); } catch (e) { this.currentCards = []; }
        }

        if (!this.currentCards || this.currentCards.length !== 3) {
            const shuffled = [...CODEX_DATA.verses].sort(() => 0.5 - Math.random()).slice(0, 3);
            this.currentCards = shuffled.map(v => ({ ...v, state: 'facedown' })); // 'facedown' o 'kept'
            localStorage.setItem('codex_psalms_hand', JSON.stringify(this.currentCards));
        }

        this.syncAccumulatedBuffs();
    },

    syncAccumulatedBuffs() {
        const keptCards = this.currentCards.filter(c => c.state === 'kept');
        const tiers = keptCards.map(c => c.tier);
        localStorage.setItem('codex_active_blessings_list', JSON.stringify(tiers));
        if (tiers.length > 0) {
            localStorage.setItem('codex_active_blessing', tiers[0]);
        } else {
            localStorage.removeItem('codex_active_blessing');
        }
    },

    renderVerses() {
        const deck = document.getElementById('quotes-deck');
        const quotesContainer = document.querySelector('.quotes-container');
        if (!deck || !quotesContainer) return;

        this.initHandState();

        let banner = document.getElementById('psalms-status-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'psalms-status-banner';
            banner.className = 'psalms-status-banner';
            quotesContainer.insertBefore(banner, quotesContainer.firstChild);
        }

        // Eliminar barra vieja de descartar si existía
        document.getElementById('psalm-decision-bar')?.remove();

        deck.innerHTML = '';
        const numerals = ['SELLO I', 'SELLO II', 'SELLO III'];

        this.currentCards.forEach((v, idx) => {
            const col = document.createElement('div');
            col.className = 'tarot-column destructible';

            const isKept = v.state === 'kept';
            const glyph = v.tier === 'crimson' ? '⚔' : (v.tier === 'gold' ? '✦' : '❖');

            col.innerHTML = `
                <div class="tarot-card-slot" id="tarot-slot-${idx}">
                    <div class="tarot-card-inner ${isKept ? 'is-flipped' : ''}" id="tarot-inner-${idx}">
                        <div class="tarot-face tarot-back">
                            <div style="font-size:0.55rem; color:var(--text-dim);">[ TOCAR PARA REVELAR ]</div>
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
                </div>
                <button type="button" class="single-reroll-btn" id="reroll-single-${idx}" ${this.rerollsLeft <= 0 ? 'disabled' : ''}>
                    [ ↻ REROLL SALMO (${this.rerollsLeft}) ]
                </button>
            `;

            col.querySelector(`#tarot-slot-${idx}`).addEventListener('click', () => {
                if (window._cinematicActive || window._bossActive) return;
                this.revealAndKeepCard(idx);
            });

            col.querySelector(`#reroll-single-${idx}`).addEventListener('click', (e) => {
                e.stopPropagation();
                if (window._cinematicActive || window._bossActive) return;
                this.rerollSingleCard(idx);
            });

            deck.appendChild(col);
        });

        this.updateStatusUI();
    },

    // REGLA 8: Al sacar una carta te quedas con ella y se acumulan las 3 sin descartarse
    revealAndKeepCard(idx) {
        const card = this.currentCards[idx];
        if (!card || card.state === 'kept') return;

        card.state = 'kept';
        localStorage.setItem('codex_psalms_hand', JSON.stringify(this.currentCards));
        this.syncAccumulatedBuffs();

        const inner = document.getElementById(`tarot-inner-${idx}`);
        if (inner) inner.classList.add('is-flipped');

        AudioManager.playCardJingle(card.tier);
        this.updateStatusUI();
    },

    // REGLA 9: Rerollear 1 Salmo específico por otro (Tienes 3 rerolls después de cada bossfight)
    rerollSingleCard(idx) {
        if (this.rerollsLeft <= 0) {
            AudioManager.beep(180, 0.15, 'sawtooth');
            return;
        }

        const currentTitles = this.currentCards.map(c => c.title);
        const pool = CODEX_DATA.verses.filter(v => !currentTitles.includes(v.title));
        const replacementPool = pool.length > 0 ? pool : CODEX_DATA.verses;
        const newVerse = replacementPool[Math.floor(Math.random() * replacementPool.length)];

        this.rerollsLeft = Math.max(0, this.rerollsLeft - 1);
        localStorage.setItem('codex_psalms_rerolls_left', this.rerollsLeft.toString());

        // La nueva carta entra ya revelada y acumulada
        this.currentCards[idx] = { ...newVerse, state: 'kept' };
        localStorage.setItem('codex_psalms_hand', JSON.stringify(this.currentCards));
        this.syncAccumulatedBuffs();

        AudioManager.cardSlideSound();
        AudioManager.playCardJingle(newVerse.tier);
        this.renderVerses();
    },

    updateStatusUI() {
        const banner = document.getElementById('psalms-status-banner');
        const mainBtn = document.querySelector('.reroll-btn');
        const kept = this.currentCards.filter(c => c.state === 'kept');

        if (banner) {
            if (kept.length === 0) {
                banner.innerHTML = `REVELA TUS 3 CARTAS PARA ACUMULAR SUS BENDICIONES // REROLLS DISPONIBLES: <b>${this.rerollsLeft}/3</b>`;
            } else {
                const summary = kept.map(k => `<b>${k.title}</b> (${this.getBuffDescription(k.tier)})`).join(' + ');
                banner.innerHTML = `SALMOS ACUMULADOS [${kept.length}/3]: ${summary}`;
            }
        }

        if (mainBtn) {
            const allKept = kept.length === 3;
            if (!allKept) {
                mainBtn.disabled = false;
                mainBtn.textContent = `[ ❖ REVELAR Y EQUIPAR LOS 3 SALMOS (${this.rerollsLeft} REROLLS DISP.) ]`;
            } else {
                mainBtn.disabled = true;
                mainBtn.textContent = `[ ✦ 3/3 SALMOS EQUIPADOS // REROLLS INDIVIDUALES: ${this.rerollsLeft}/3 ]`;
            }
        }
    },

    // Se llama automáticamente al terminar o salir de una bossfight: recarga los 3 rerolls
    unlockAfterCombat() {
        this.rerollsLeft = 3;
        localStorage.setItem('codex_psalms_rerolls_left', '3');
        this.renderVerses();
    },

    rerollVerses() {
        if (window._cinematicActive || window._bossActive) return;
        // Si aún hay cartas boca abajo, el botón inferior las revela todas de golpe para mayor comodidad
        const hasFacedown = this.currentCards.some(c => c.state !== 'kept');
        if (hasFacedown) {
            this.currentCards.forEach(c => { c.state = 'kept'; });
            localStorage.setItem('codex_psalms_hand', JSON.stringify(this.currentCards));
            this.syncAccumulatedBuffs();
            AudioManager.playCardJingle('gold');
            this.renderVerses();
        }
    }
};

function _renderVerses() { DeckController.renderVerses(); }
function _rerollVerses() { DeckController.rerollVerses(); }