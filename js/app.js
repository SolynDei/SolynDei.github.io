window._isFallen = false;
window._bossBeaten = false;
window._bossActive = false;
window._cinematicActive = false;

let _danmakuInterval = null;
let _clockInterval = null;

function decryptTextEffect(element, targetText = null, duration = 420) {
    if (!element) return;
    const finalTxt = targetText !== null ? targetText : (element.getAttribute('data-scramble') || element.textContent.trim());
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789❖◈✦";
    let start = performance.now();

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const resolvedCount = Math.floor(progress * finalTxt.length);

        let out = "";
        for (let i = 0; i < finalTxt.length; i++) {
            if (i < resolvedCount) out += finalTxt[i];
            else if (finalTxt[i] === " " || finalTxt[i] === "\n") out += finalTxt[i];
            else out += chars[Math.floor(Math.random() * chars.length)];
        }
        element.textContent = out;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function syncSanctuaryThemeUI() {
    const unlockedE = localStorage.getItem('codex_reborn_sanctuary') === 'true';
    const unlockedS = localStorage.getItem('codex_ending_s_sanctuary') === 'true';
    const mode = localStorage.getItem('codex_sanctuary_theme_mode') || (unlockedS ? 'S' : (unlockedE ? 'E' : 'OFF'));
    const telemetryRight = document.querySelector('.telemetry-actions');

    document.body.classList.toggle('sanctuary-e-theme', mode === 'E');
    document.body.classList.toggle('sanctuary-s-theme', mode === 'S');

    if (mode === 'S' && typeof ParticleEngine !== 'undefined' && typeof ParticleEngine.startLunarFlowerField === 'function') {
        ParticleEngine.startLunarFlowerField(26);
    }

    if ((unlockedE || unlockedS) && telemetryRight) {
        let btn = document.getElementById('sanctuary-theme-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'sanctuary-theme-btn';
            btn.className = 'sanctuary-toggle-btn';
            telemetryRight.insertBefore(btn, telemetryRight.firstChild);
        }
        btn.textContent = mode === 'S' ? '[ ✿ SANTUARIO S ]' : (mode === 'E' ? '[ ❖ SANTUARIO E ]' : '[ ❖ TEMA: ORIGINAL ]');
        btn.onclick = () => {
            const next = mode === 'S' ? 'OFF' : (unlockedS ? 'S' : (mode === 'E' ? 'OFF' : 'E'));
            localStorage.setItem('codex_sanctuary_theme_mode', next);
            syncSanctuaryThemeUI();
            AudioManager.liturgicalChime();
        };
    }
}

function openImageLightbox(src, title, desc = "") {
    const modal = document.getElementById('splash-lightbox');
    const img = document.getElementById('lightbox-champ-img');
    const titleEl = document.getElementById('lightbox-champ-title');
    const descEl = document.getElementById('lightbox-champ-desc');

    if (img) img.src = src;
    if (titleEl) titleEl.textContent = title || 'ARCHIVO VISUAL';
    if (descEl) {
        descEl.textContent = desc || '';
        descEl.style.display = desc ? 'block' : 'none';
    }
    if (modal) modal.classList.add('active');
    if (typeof AudioManager !== 'undefined') AudioManager.beep(660, 0.05, 'sine');
}

function openSplashLightbox(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const currentSplash = document.getElementById('lol-splash-img')?.src || 'img/champions/kindred.jpg';
    const currentTitle = document.getElementById('lol-champ-title')?.textContent || 'SPLASH ART';
    const currentMeta = document.getElementById('lol-champ-meta')?.textContent || '';
    openImageLightbox(currentSplash, currentTitle, currentMeta);
}

function closeSplashLightbox() {
    document.getElementById('splash-lightbox')?.classList.remove('active');
}

// Navegación suave dentro del Scroll Unificado de la Bitácora
function scrollToBlogSection(sectionId, pillBtn = null) {
    const target = document.getElementById(sectionId);
    const viewport = document.getElementById('blog-scroll-content');
    if (!target) return;

    document.querySelectorAll('.blog-pill').forEach(p => p.classList.remove('active'));
    if (pillBtn) pillBtn.classList.add('active');

    if (window.innerWidth >= 980 && viewport) {
        const topPos = target.offsetTop - 6;
        viewport.scrollTo({ top: topPos, behavior: 'smooth' });
    } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (typeof AudioManager !== 'undefined') AudioManager.beep(640, 0.03, 'sine');
}

function initBlogScrollProgress() {
    const content = document.getElementById('blog-scroll-content');
    const bar = document.getElementById('blog-scroll-bar');
    if (!content) return;

    content.addEventListener('scroll', () => {
        const maxScroll = Math.max(1, content.scrollHeight - content.clientHeight);
        const pct = Math.min(100, Math.max(12, (content.scrollTop / maxScroll) * 100));
        if (bar) bar.style.height = `${pct}%`;

        // Actualizar píldora activa según la sección visible
        const sections = ['sec-lecturas', 'sec-gustos', 'sec-disgustos', 'sec-registro', 'sec-epistolas'];
        let currentSec = sections[0];
        for (const id of sections) {
            const el = document.getElementById(id);
            if (el && el.offsetTop - 90 <= content.scrollTop) {
                currentSec = id;
            }
        }
        document.querySelectorAll('.blog-pill').forEach(p => {
            p.classList.toggle('active', p.getAttribute('data-target') === currentSec);
        });
    }, { passive: true });
}

const TabManager = {
    switchTab(tabId, btnEl = null) {
        if (window._cinematicActive || window._bossActive) return;
        document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.classList.add('active');

        const activeBtn = btnEl || Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
        if (activeBtn) {
            activeBtn.classList.add('active');
            decryptTextEffect(activeBtn, null, 200);
        }
        AudioManager.beep(700, 0.03, 'sine');
    }
};

const ChampSelector = {
    current: 'kindred',

    select(champKey) {
        if (window._cinematicActive || window._bossActive) return;
        this.current = champKey;
        const c = CODEX_DATA.champions[champKey];
        if (!c) return;

        document.getElementById('lol-splash-img').src = c.splash;
        const titleEl = document.getElementById('lol-champ-title');
        titleEl.textContent = c.title;
        decryptTextEffect(titleEl, c.title, 360);

        document.getElementById('lol-champ-meta').textContent = c.meta;
        document.getElementById('lol-stat-role').textContent = c.role;
        document.getElementById('lol-stat-pts').textContent = c.pts;

        document.querySelectorAll('.champ-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(champKey));
        });

        if (c.sound) c.sound((...args) => AudioManager.beep(...args));
        const r = document.getElementById('lol-card-trigger').getBoundingClientRect();
        ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#dad4bb', 12);
    },

    interact(e) {
        if (window._cinematicActive || window._bossActive) return;
        if (e && e.target && e.target.closest('.lol-expand-btn')) return;

        const c = CODEX_DATA.champions[this.current];
        if (this.current === 'kayle') {
            AvatarController.triggerFallen();
            DialogueSystem.show({ text: "Incluso la luz más alta proyecta sombras cuando juzga sin compasión...", speaker: "SAPHYNIEL", tone: "angry", autoHideTime: 2800 });
            const r = e.currentTarget.getBoundingClientRect();
            ParticleEngine.spawnSword(e.clientX || (r.left + r.width / 2));
        } else {
            DialogueSystem.show({ text: c.quote, speaker: "SAPHYNIEL", tone: "mid", autoHideTime: 2600 });
            if (c.sound) c.sound((...args) => AudioManager.beep(...args));
            const r = e.currentTarget.getBoundingClientRect();
            ParticleEngine.explode(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#dad4bb', 12);
        }
    }
};

const AvatarController = {
    clickCount: 0,
    clickTimer: null,
    fallenTimer: null,

    init() {
        const trigger = document.getElementById('avatar-trigger');
        const angerIcon = document.getElementById('anger-icon');
        if (!trigger || !angerIcon) return;

        trigger.addEventListener('pointerdown', () => {
            if (window._cinematicActive || window._bossActive || window._isFallen) return;

            const r = trigger.getBoundingClientRect();
            ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#dad4bb', 10);

            if (document.body.classList.contains('sanctuary-s-theme')) {
                const lunarQuotes = [
                    "Dejaste caer tu arma cuando más miedo tenía... Nunca voy a olvidar ese gesto.",
                    "Las Flores Lunares solo crecen donde dos almas prometieron no volver a herirse.",
                    "Ya no tienes que pelear por mí. Descansa aquí conmigo todo el tiempo que quieras."
                ];
                const q = lunarQuotes[this.clickCount % lunarQuotes.length];
                this.clickCount++;
                DialogueSystem.show({ text: q, speaker: "SAPHYNIEL & SOLYN // EN PAZ", tone: "mid", autoHideTime: 3400 });
                return;
            }

            if (document.body.classList.contains('sanctuary-e-theme')) {
                const peacefulQuotes = [
                    "La luz del Santuario es cálida gracias a lo que entregaste por mí.",
                    "Ya no necesitamos más espadas ni cañones entre nosotros.",
                    "Quédate el tiempo que quieras. Este espacio también es tuyo."
                ];
                const q = peacefulQuotes[this.clickCount % peacefulQuotes.length];
                this.clickCount++;
                DialogueSystem.show({ text: q, speaker: "SAPHYNIEL // EN PAZ", tone: "mid", autoHideTime: 2800 });
                return;
            }

            this.clickCount++;
            clearTimeout(this.clickTimer);
            this.clickTimer = setTimeout(() => {
                this.clickCount = 0;
                angerIcon.style.display = 'none';
            }, 3400);

            trigger.style.transform = `scale(${Math.max(0.86, 1 - (this.clickCount * 0.025))})`;
            setTimeout(() => { trigger.style.transform = 'scale(1)'; }, 120);

            if (this.clickCount >= 4) {
                angerIcon.style.display = 'block';
            }

            if (this.clickCount >= 2 && this.clickCount <= 6) {
                const dIdx = Math.min(CODEX_DATA.avatarDialogues.length - 1, this.clickCount - 2);
                const item = CODEX_DATA.avatarDialogues[dIdx];
                DialogueSystem.show({ text: item.text, speaker: "SAPHYNIEL", tone: item.tone, autoHideTime: 2800 });
            }

            if (this.clickCount >= 6 && typeof OrbitalModule !== 'undefined' && !OrbitalModule.hasRailgun) {
                OrbitalModule.unlockRailgun();
                if (typeof AchievementSystem !== 'undefined') AchievementSystem.unlock("railgun_unlock");
            }

            if (this.clickCount >= 7) {
                AchievementSystem.unlock("glitch_tap");
                if (!window._isFallen) {
                    this.triggerFallen();
                    DialogueSystem.show({
                        text: "Si solo vienes a quebrar la calma de este lugar... entonces el archivo cerrará sus puertas.",
                        speaker: "SAPHYNIEL",
                        tone: "angry",
                        autoHideTime: 3000
                    });
                    this.clickCount = 0;
                }
            }
        });
    },

    triggerFallen() {
        window._isFallen = true;
        document.body.classList.add('fallen-mode');
        const nameEl = document.getElementById('display-name');
        if (nameEl) {
            nameEl.innerText = "CLAVIS";
            decryptTextEffect(nameEl, "CLAVIS", 400);
        }
        if (typeof AsciiTextEngine !== 'undefined') {
            AsciiTextEngine.setText("CLAVIS", true);
        }

        const bio = document.getElementById('typewriter-text');
        if (bio) bio.innerHTML = "FOLIO SELLADO. <br>Vanitas vanitatum et omnia vanitas.";
        AudioManager.beep(140, 0.35, 'sawtooth');

        clearTimeout(this.fallenTimer);
        this.fallenTimer = setTimeout(() => { this.restoreAngelState(); }, 6000);
    },

    restoreAngelState() {
        window._isFallen = false;
        document.body.classList.remove('fallen-mode');
        const nameEl = document.getElementById('display-name');
        if (nameEl) {
            nameEl.innerText = "SAPHYNIEL";
            decryptTextEffect(nameEl, "SAPHYNIEL", 400);
        }
        if (typeof AsciiTextEngine !== 'undefined') {
            AsciiTextEngine.setText("SAPHYNIEL", false);
        }

        const bio = document.getElementById('typewriter-text');
        if (bio) bio.innerHTML = "Lucerna pedibus meis verbum tuum et lumen semitis meis. <br>In silentio et in spe erit fortitudo vestra.";
        const angerIcon = document.getElementById('anger-icon');
        if (angerIcon) angerIcon.style.display = 'none';
        this.clickCount = 0;
        AudioManager.beep(880, 0.2, 'sine');
    }
};

function _sndTgl() { AudioManager.toggleSound('sound-btn'); }
function _mShow(t, m) {
    if (window._cinematicActive || window._bossActive) return;
    document.getElementById('modal-title').textContent = t;
    document.getElementById('modal-body').innerHTML = m;
    document.getElementById('hud-modal-overlay').classList.add('active');
    AudioManager.beep(650, 0.12, 'sine');
}
function _mCls(e) {
    if (!e || e.target.id === 'hud-modal-overlay' || e.target.classList.contains('hud-modal-btn')) {
        document.getElementById('hud-modal-overlay').classList.remove('active');
        AudioManager.beep(350, 0.05, 'sine');
    }
}
function _tSw(tabId) {
    const btnEl = (typeof event !== 'undefined' && event && event.currentTarget) ? event.currentTarget : null;
    TabManager.switchTab(tabId, btnEl);
}
function _selectChamp(key) { ChampSelector.select(key); }
function _triggerChampInteraction(e) { ChampSelector.interact(e); }
function _liturgicalChime() { AudioManager.liturgicalChime(); }

function _renderLikesAndDislikes() {
    const likesGrid = document.getElementById('likes-container-grid');
    if (likesGrid && Array.isArray(CODEX_DATA.likes)) {
        likesGrid.innerHTML = '';
        CODEX_DATA.likes.forEach(item => {
            const card = document.createElement('article');
            card.className = 'like-card destructible spotlight-card';
            card.innerHTML = `
                <div class="like-thumb-wrap">
                    <img src="${item.img}" alt="${item.title}" class="like-thumb" onerror="this.src='img/icons/icon.png';">
                </div>
                <div class="like-body">
                    <div class="like-tag">❖ ${item.tag || 'AFINIDAD'}</div>
                    <h3 class="like-title">${item.title}</h3>
                    <p class="like-desc">${item.desc}</p>
                </div>
            `;
            card.addEventListener('click', () => {
                if (typeof OrbitalModule !== 'undefined' && OrbitalModule.clickFireMode) return;
                openImageLightbox(item.img, item.title, item.desc);
            });
            likesGrid.appendChild(card);
        });
    }

    const dislikesGrid = document.getElementById('dislikes-container-grid');
    if (dislikesGrid && Array.isArray(CODEX_DATA.dislikes)) {
        dislikesGrid.innerHTML = '';
        CODEX_DATA.dislikes.forEach(item => {
            const card = document.createElement('article');
            card.className = 'dislike-card destructible spotlight-card';
            card.innerHTML = `
                <h3 class="dislike-title">${item.title}</h3>
                <p class="dislike-desc">${item.desc}</p>
            `;
            dislikesGrid.appendChild(card);
        });
    }
}

function _renderFaq() {
    const list = document.getElementById('faq-container-list');
    if (!list || !Array.isArray(CODEX_DATA.faq)) return;
    list.innerHTML = '';
    CODEX_DATA.faq.forEach(item => {
        const card = document.createElement('article');
        card.className = 'faq-item destructible spotlight-card';
        card.innerHTML = `
            <div class="faq-q">${item.q}</div>
            <div class="faq-a">${item.a}</div>
        `;
        list.appendChild(card);
    });
}

function _initDanmaku() {
    const box = document.getElementById('danmaku-box');
    if (!box) return;
    if (_danmakuInterval) clearInterval(_danmakuInterval);
    _danmakuInterval = setInterval(() => {
        if (window._bossActive || window.innerWidth < 980) return;
        const el = document.createElement('div');
        el.className = 'danmaku-item';
        el.textContent = CODEX_DATA.danmaku[Math.floor(Math.random() * CODEX_DATA.danmaku.length)];
        el.style.top = `${Math.random() * 85 + 5}vh`;
        el.style.animationDuration = `${Math.random() * 14 + 16}s`;
        box.appendChild(el);
        setTimeout(() => el.remove(), 28000);
    }, 3500);
}

function _upClk() {
    if (window._bossActive) return;
    const n = new Date();
    const h = String(n.getUTCHours()).padStart(2, '0');
    const m = String(n.getUTCMinutes()).padStart(2, '0');
    const s = String(n.getUTCSeconds()).padStart(2, '0');
    const el = document.getElementById('utc-clock');
    if (el) el.textContent = `${h}:${m}:${s} UTC`;
}

const _bEl = document.getElementById('typewriter-text');
const _bTx = _bEl ? _bEl.getAttribute('data-bio') : "";
let _bI = 0;
function _tpW() {
    if (!_bEl) return;
    if (_bI < _bTx.length) {
        if (_bTx.substr(_bI, 2) === '\\n') { _bEl.innerHTML += '<br>'; _bI += 2; }
        else { _bEl.innerHTML += _bTx.charAt(_bI); _bI++; }
        setTimeout(_tpW, Math.random() * 26 + 15);
    } else {
        _bEl.innerHTML += '<span style="animation: blink 1s infinite;">_</span>';
    }
}

const _platformSounds = {
    yt: () => { AudioManager.beep(440, 0.1, 'sine'); setTimeout(() => AudioManager.beep(880, 0.14, 'sine'), 60); },
    sp: () => { AudioManager.beep(180, 0.12, 'sawtooth'); setTimeout(() => AudioManager.beep(360, 0.18, 'triangle'), 80); },
    st: () => { AudioManager.beep(550, 0.08, 'square'); setTimeout(() => AudioManager.beep(733, 0.14, 'square'), 70); },
    tk: () => { AudioManager.beep(700, 0.07, 'triangle'); setTimeout(() => AudioManager.beep(1050, 0.11, 'triangle'), 50); },
    ds: () => { AudioManager.beep(300, 0.09, 'sine'); setTimeout(() => AudioManager.beep(600, 0.12, 'sine'), 50); }
};

document.querySelectorAll('.link-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (window._cinematicActive || window._bossActive) return;
        const p = btn.getAttribute('data-platform');
        if (_platformSounds[p]) _platformSounds[p]();
        AchievementSystem.unlock("audio_sync");
    });
});

window.addEventListener('message', (e) => {
    if (!e.data) return;

    if (e.data.type === 'UNLOCK_ACHIEVEMENT' && e.data.id) {
        if (typeof AchievementSystem !== 'undefined') {
            AchievementSystem.unlock(e.data.id);
        }
    }

    if (e.data.type === 'UNLOCK_PSALMS_REROLL') {
        if (typeof DeckController !== 'undefined') DeckController.unlockAfterCombat();
    }

    if (e.data.type === 'BOSS_SURRENDERED') {
        const frame = document.getElementById('boss-frame');
        if (frame) frame.classList.remove('active');
        window._bossActive = false;

        const sealBadge = document.getElementById('avatar-seal-status');
        if (sealBadge) sealBadge.classList.remove('visible');

        if (typeof OrbitalModule !== 'undefined') {
            OrbitalModule.avatarHoverAttempts = 0;
            OrbitalModule.syncDockUI();
            OrbitalModule.resetCrosshairPosition();
        }
        if (typeof DeckController !== 'undefined') DeckController.unlockAfterCombat();

        ParticleEngine.resume();
        if (typeof BalatroEngine !== 'undefined' && !BalatroEngine.animId) BalatroEngine.render();
        _initDanmaku();

        if (typeof AchievementSystem !== 'undefined') {
            AchievementSystem.unlock(e.data.achievementId || 'fragile_faith');
        }

        setTimeout(() => {
            DialogueSystem.show({
                text: "Elegiste bajar los brazos y volver aquí... A veces el silencio pesa más de lo que uno cree.",
                speaker: "SAPHYNIEL",
                tone: "low",
                autoHideTime: 4200
            });
        }, 450);
    }

    if (e.data.type === 'BOSS_DEFEATED') {
        const frame = document.getElementById('boss-frame');
        if (frame) frame.classList.remove('active');

        window._bossActive = false;
        window._bossBeaten = true;
        AvatarController.clickCount = 0;
        const sealBadge = document.getElementById('avatar-seal-status');
        if (sealBadge) sealBadge.classList.remove('visible');

        if (typeof OrbitalModule !== 'undefined') OrbitalModule.avatarHoverAttempts = 0;

        const endingType = e.data.ending || 'SACRIFICE';

        if (endingType === 'ENDING_S') {
            localStorage.setItem('codex_boss_beaten', 'true');
            localStorage.setItem('codex_ending_s_sanctuary', 'true');
            localStorage.setItem('codex_sanctuary_theme_mode', 'S');

            localStorage.removeItem('codex_railgun_unlocked');
            if (typeof OrbitalModule !== 'undefined') {
                OrbitalModule.hasRailgun = false;
                OrbitalModule.syncDockUI();
            }

            if (typeof AchievementSystem !== 'undefined') {
                AchievementSystem.unlock("boss_slayer");
                AchievementSystem.unlock("lunar_sanctuary_s");
            }
            if (typeof DeckController !== 'undefined') DeckController.unlockAfterCombat();

            document.body.classList.remove('fallen-mode', 'sanctuary-e-theme');
            document.body.classList.add('transcended-world', 'sanctuary-s-theme');
            syncSanctuaryThemeUI();
            ParticleEngine.resume();
            ParticleEngine.startLunarFlowerField(32);
            if (typeof BalatroEngine !== 'undefined' && !BalatroEngine.animId) BalatroEngine.render();

            setTimeout(() => {
                DialogueSystem.show({
                    text: "Dejaste caer tu arma para tomar mi mano cuando más frío hacía. Mientras estas flores blancas sigan abiertas, ninguno de los dos volverá a estar solo.",
                    speaker: "SAPHYNIEL & SOLYN // FINAL [S]",
                    tone: "mid",
                    autoHideTime: 5600
                });
                AudioManager.liturgicalChime();
            }, 450);
            return;
        }

        if (endingType === 'SACRIFICE') {
            localStorage.removeItem('codex_score');
            localStorage.removeItem('codex_railgun_unlocked');
            localStorage.removeItem('codex_psalms_hand');
            localStorage.removeItem('codex_psalms_locked');
            localStorage.removeItem('codex_active_blessing');
            localStorage.removeItem('codex_active_blessing_title');
            localStorage.removeItem('saphyniel_codex_achievements_v1');

            localStorage.setItem('codex_reborn_sanctuary', 'true');
            localStorage.setItem('codex_sanctuary_theme_active', 'true');

            if (typeof DestructionModule !== 'undefined') {
                DestructionModule.score = 0;
                DestructionModule.combo = 0;
                DestructionModule.updateComboHud();
                DestructionModule.restoreAll();
            }
            if (typeof OrbitalModule !== 'undefined') {
                OrbitalModule.hasRailgun = false;
                OrbitalModule.syncDockUI();
            }
            if (typeof AchievementSystem !== 'undefined') {
                AchievementSystem.unlocked = [];
                AchievementSystem.render();
                AchievementSystem.updateCounter();
            }
            if (typeof DeckController !== 'undefined') {
                DeckController.unlockAfterCombat();
            }

            document.body.classList.remove('fallen-mode');
            document.body.classList.add('transcended-world', 'sanctuary-e-theme');
            syncSanctuaryThemeUI();
        } else {
            localStorage.setItem('codex_boss_beaten', 'true');
            if (typeof AchievementSystem !== 'undefined') AchievementSystem.unlock("boss_slayer");
            if (typeof DeckController !== 'undefined') DeckController.unlockAfterCombat();

            document.body.classList.add('transcended-world');
            if (typeof OrbitalModule !== 'undefined') {
                OrbitalModule.syncDockUI();
                OrbitalModule.resetCrosshairPosition();
            }
        }

        ParticleEngine.resume();
        ParticleEngine.startPetalRain(50);
        if (typeof BalatroEngine !== 'undefined' && !BalatroEngine.animId) BalatroEngine.render();
        _initDanmaku();

        const avatarImg = document.getElementById('avatar-img');
        if (avatarImg && typeof LanyardModule !== 'undefined') avatarImg.src = LanyardModule.discordAvatarUrl;

        setTimeout(() => {
            const finalQuote = endingType === 'SACRIFICE'
                ? "Entregaste todos tus registros, tus salmos y tus armas para devolverme la paz... Bienvenido al Santuario Renacido [E]."
                : "Todo terminó por ahora... Los sellos de Salmos han vuelto a abrirse para ti.";
            DialogueSystem.show({
                text: finalQuote,
                speaker: endingType === 'SACRIFICE' ? "SAPHYNIEL // RENACIDA" : "SAPHYNIEL",
                tone: endingType === 'SACRIFICE' ? "mid" : "low",
                autoHideTime: 4800
            });
            AudioManager.liturgicalChime();
        }, 450);
    }
});

(function initFullscreenToggle() {
    const btn = document.getElementById('fullscreen-toggle');
    if (!btn) return;
    function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement); }
    function enterFs() {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (req) req.call(el).catch(() => {});
    }
    function exitFs() {
        const ext = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (ext) ext.call(document).catch(() => {});
    }
    function syncIcon() {
        const active = isFs();
        btn.classList.toggle('is-fullscreen', active);
        btn.textContent = '⛶';
    }
    btn.addEventListener('click', () => { isFs() ? exitFs() : enterFs(); });
    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(evt => document.addEventListener(evt, syncIcon));
})();

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('codex_boss_beaten') === 'true' || localStorage.getItem('codex_reborn_sanctuary') === 'true') {
        window._bossBeaten = true;
        document.body.classList.add('transcended-world');
    }

    syncSanctuaryThemeUI();
    BalatroEngine.init('balatro-canvas');
    ParticleEngine.init('particle-canvas');
    if (window._bossBeaten) ParticleEngine.startPetalRain(45);

    _renderLikesAndDislikes();
    _renderFaq();
    _renderVerses();
    initBlogScrollProgress();

    DestructionModule.init();
    OrbitalModule.init();
    TerminalModule.init();
    AvatarController.init();
    LanyardModule.init();
    AchievementSystem.init();

    if (typeof ReactBitsUI !== 'undefined') {
        ReactBitsUI.init();
    }

    _initDanmaku();
    _clockInterval = setInterval(_upClk, 500);
    _upClk();
    setTimeout(_tpW, 400);

    const mainTitle = document.getElementById('display-name');
    if (mainTitle) decryptTextEffect(mainTitle, "SAPHYNIEL", 650);
});
document.head.insertAdjacentHTML("beforeend", `<style>@keyframes blink { 50% { opacity: 0; } }</style>`);