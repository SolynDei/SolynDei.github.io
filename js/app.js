window._isFallen = false;
window._bossBeaten = false;
window._bossActive = false;
window._cinematicActive = false;

let _danmakuInterval = null;
let _clockInterval = null;

function decryptTextEffect(element, targetText = null, duration = 450) {
    if (!element) return;
    const finalTxt = targetText !== null ? targetText : (element.getAttribute('data-scramble') || element.textContent.trim());
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>[]{}";
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

function adaptWidescreenLayout() {
    const rpWidget = document.getElementById('rp-widget');
    const profileHeader = document.getElementById('frag-header');
    const tabLinks = document.getElementById('tab-links');
    if (!rpWidget || !profileHeader || !tabLinks) return;

    if (window.innerWidth >= 960) {
        if (rpWidget.parentElement !== profileHeader) profileHeader.appendChild(rpWidget);
    } else {
        if (rpWidget.parentElement !== tabLinks) tabLinks.appendChild(rpWidget);
    }
}
window.addEventListener('resize', adaptWidescreenLayout);

function syncSanctuaryThemeUI() {
    const unlocked = localStorage.getItem('codex_reborn_sanctuary') === 'true';
    const active = localStorage.getItem('codex_sanctuary_theme_active') !== 'false';
    const telemetryRight = document.querySelector('.telemetry-bar > div');

    if (unlocked) {
        document.body.classList.toggle('sanctuary-e-theme', active);
        if (telemetryRight && !document.getElementById('sanctuary-theme-btn')) {
            const btn = document.createElement('button');
            btn.id = 'sanctuary-theme-btn';
            btn.className = 'sanctuary-toggle-btn';
            btn.textContent = active ? '[ ❖ SANTUARIO E: ON ]' : '[ ❖ SANTUARIO E: OFF ]';
            btn.onclick = () => {
                const nowActive = !document.body.classList.contains('sanctuary-e-theme');
                document.body.classList.toggle('sanctuary-e-theme', nowActive);
                localStorage.setItem('codex_sanctuary_theme_active', nowActive ? 'true' : 'false');
                btn.textContent = nowActive ? '[ ❖ SANTUARIO E: ON ]' : '[ ❖ SANTUARIO E: OFF ]';
                AudioManager.liturgicalChime();
            };
            telemetryRight.insertBefore(btn, telemetryRight.firstChild);
        }
    }
}

function initPixelCards() {
    document.querySelectorAll('.pixel-card').forEach(card => {
        const canvas = card.querySelector('.pixel-card-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cellSize = 16;
        let activePixels = [];

        const resize = () => {
            canvas.width = card.offsetWidth;
            canvas.height = card.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const gridX = Math.floor((e.clientX - rect.left) / cellSize);
            const gridY = Math.floor((e.clientY - rect.top) / cellSize);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (Math.random() > 0.4) {
                        activePixels.push({
                            x: (gridX + dx) * cellSize,
                            y: (gridY + dy) * cellSize,
                            alpha: 1.0
                        });
                    }
                }
            }
        });

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = activePixels.length - 1; i >= 0; i--) {
                const p = activePixels[i];
                ctx.fillStyle = `rgba(218, 212, 187, ${p.alpha * 0.35})`;
                ctx.fillRect(p.x, p.y, cellSize - 1, cellSize - 1);
                p.alpha -= 0.035;
                if (p.alpha <= 0) activePixels.splice(i, 1);
            }
            requestAnimationFrame(draw);
        };
        draw();
    });
}

function initReactBitsEffects() {
    document.querySelectorAll('.spotlight-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    const hud = document.getElementById('main-hud');
    if (hud && window.innerWidth > 680) {
        window.addEventListener('mousemove', (e) => {
            if (window._cinematicActive || window._bossActive) {
                hud.style.transform = 'none';
                return;
            }
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dx = (e.clientX - cx) / cx;
            const dy = (e.clientY - cy) / cy;
            const rotX = (-dy * 2.5).toFixed(2);
            const rotY = (dx * 2.5).toFixed(2);
            hud.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        });

        window.addEventListener('mouseleave', () => {
            hud.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    }

    window.addEventListener('pointerdown', (e) => {
        if (window._bossActive) return;
        if (typeof ParticleEngine !== 'undefined') ParticleEngine.explode(e.clientX, e.clientY, '#dad4bb', 6);
        if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(e.clientX, e.clientY, 0.45);
    });

    initPixelCards();
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
            decryptTextEffect(activeBtn, null, 250);
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
        decryptTextEffect(titleEl, c.title, 400);

        document.getElementById('lol-champ-meta').textContent = c.meta;
        document.getElementById('lol-stat-role').textContent = c.role;
        document.getElementById('lol-stat-pts').textContent = c.pts;

        document.querySelectorAll('.champ-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase() === champKey);
        });

        if (c.sound) c.sound((...args) => AudioManager.beep(...args));
        const r = document.getElementById('lol-card-trigger').getBoundingClientRect();
        ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#dad4bb', 16);
    },

    interact(e) {
        if (window._cinematicActive || window._bossActive) return;
        const c = CODEX_DATA.champions[this.current];
        if (this.current === 'kayle') {
            AvatarController.triggerFallen();
            DialogueSystem.show({ text: "¡Hereje!", speaker: "SAPHYNIEL", tone: "angry", autoHideTime: 2500 });
            const r = e.currentTarget.getBoundingClientRect();
            ParticleEngine.spawnSword(e.clientX || (r.left + r.width / 2));
        } else {
            DialogueSystem.show({ text: c.quote, speaker: "SAPHYNIEL", tone: "mid", autoHideTime: 2400 });
            if (c.sound) c.sound((...args) => AudioManager.beep(...args));
            const r = e.currentTarget.getBoundingClientRect();
            ParticleEngine.explode(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#dad4bb', 16);
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
            ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#dad4bb', 14);

            if (document.body.classList.contains('sanctuary-e-theme')) {
                const peacefulQuotes = [
                    "La luz del Santuario es cálida gracias a lo que entregaste por mí.",
                    "Ya no necesitamos más espadas ni cañones entre nosotros.",
                    "Quédate el tiempo que quieras. Este espacio también es tuyo."
                ];
                const q = peacefulQuotes[this.clickCount % peacefulQuotes.length];
                this.clickCount++;
                DialogueSystem.show({ text: q, speaker: "SAPHYNIEL // EN PAZ", tone: "mid", autoHideTime: 2600 });
                return;
            }

            this.clickCount++;
            clearTimeout(this.clickTimer);
            this.clickTimer = setTimeout(() => {
                this.clickCount = 0;
                angerIcon.style.display = 'none';
            }, 3000);

            trigger.style.transform = `scale(${Math.max(0.82, 1 - (this.clickCount * 0.035))})`;
            setTimeout(() => { trigger.style.transform = 'scale(1)'; }, 100);

            if (this.clickCount >= 3) {
                angerIcon.style.display = 'block';
                angerIcon.style.transform = `scale(${1 + (this.clickCount * 0.08)}) rotate(${15 + (this.clickCount * 3)}deg)`;
            }

            if (this.clickCount >= 2 && this.clickCount <= 6) {
                const dIdx = Math.min(CODEX_DATA.avatarDialogues.length - 1, this.clickCount - 2);
                const item = CODEX_DATA.avatarDialogues[dIdx];
                DialogueSystem.show({ text: item.text, speaker: "SAPHYNIEL", tone: item.tone, autoHideTime: 2000 });
            }

            if (this.clickCount >= 6 && typeof OrbitalModule !== 'undefined' && !OrbitalModule.hasRailgun) {
                OrbitalModule.unlockRailgun('avatar');
            }

            if (this.clickCount >= 7) {
                AchievementSystem.unlock("glitch_tap");
            }

            if (this.clickCount >= 7 && !window._isFallen) {
                this.triggerFallen();
                DialogueSystem.show({ text: "¡¡NO HABRÁ MISERICORDIA!!", speaker: "SAPHYNIEL", tone: "yandere", autoHideTime: 2600 });
                this.clickCount = 0;
            }
        });
    },

    triggerFallen() {
        window._isFallen = true;
        document.body.classList.add('fallen-mode');
        const nameEl = document.getElementById('display-name');
        nameEl.innerText = "CLAVIS";
        decryptTextEffect(nameEl, "CLAVIS", 400);

        const bio = document.getElementById('typewriter-text');
        if (bio) bio.innerHTML = "FOLIO SELLADO. <br>Vanitas vanitatum et omnia vanitas.";
        AudioManager.beep(140, 0.4, 'sawtooth');

        clearTimeout(this.fallenTimer);
        this.fallenTimer = setTimeout(() => { this.restoreAngelState(); }, 6000);
    },

    restoreAngelState() {
        window._isFallen = false;
        document.body.classList.remove('fallen-mode');
        const nameEl = document.getElementById('display-name');
        nameEl.innerText = "SAPHYNIEL";
        decryptTextEffect(nameEl, "SAPHYNIEL", 400);

        const bio = document.getElementById('typewriter-text');
        if (bio) bio.innerHTML = "Lucerna pedibus meis verbum tuum et lumen semitis meis. <br>In silentio et in spe erit fortitudo vestra.";
        const angerIcon = document.getElementById('anger-icon');
        if (angerIcon) angerIcon.style.display = 'none';
        this.clickCount = 0;
        AudioManager.beep(900, 0.25, 'sine');
    }
};

function _sndTgl() { AudioManager.toggleSound('sound-btn'); }
function _mShow(t, m) {
    if (window._cinematicActive || window._bossActive) return;
    document.getElementById('modal-title').textContent = t;
    document.getElementById('modal-body').innerHTML = m;
    document.getElementById('hud-modal-overlay').classList.add('active');
    AudioManager.beep(650, 0.15, 'sawtooth');
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

function _renderFaq() {
    const list = document.getElementById('faq-container-list');
    if (!list) return;
    list.innerHTML = '';
    CODEX_DATA.faq.forEach(item => {
        const details = document.createElement('details');
        details.className = 'faq-item destructible spotlight-card';
        details.innerHTML = `<summary>${item.q}</summary><div class="faq-content">${item.a}</div>`;
        list.appendChild(details);
    });
}

function _initDanmaku() {
    const box = document.getElementById('danmaku-box');
    if (!box) return;
    if (_danmakuInterval) clearInterval(_danmakuInterval);
    _danmakuInterval = setInterval(() => {
        if (window._bossActive) return;
        const el = document.createElement('div');
        el.className = 'danmaku-item';
        el.textContent = CODEX_DATA.danmaku[Math.floor(Math.random() * CODEX_DATA.danmaku.length)];
        el.style.top = `${Math.random() * 85 + 5}vh`;
        el.style.animationDuration = `${Math.random() * 12 + 14}s`;
        box.appendChild(el);
        setTimeout(() => el.remove(), 26000);
    }, 2500);
}

function _upClk() {
    if (window._bossActive) return;
    const n = new Date();
    const h = String(n.getUTCHours()).padStart(2, '0');
    const m = String(n.getUTCMinutes()).padStart(2, '0');
    const s = String(n.getUTCSeconds()).padStart(2, '0');
    const ms = String(n.getUTCMilliseconds()).padStart(3, '0');
    const el = document.getElementById('utc-clock');
    if (el) el.textContent = `HORA CANÓNICA // ${h}:${m}:${s}:${ms} UTC`;
}

const _bEl = document.getElementById('typewriter-text');
const _bTx = _bEl ? _bEl.getAttribute('data-bio') : "";
let _bI = 0;
function _tpW() {
    if (!_bEl) return;
    if (_bI < _bTx.length) {
        if (_bTx.substr(_bI, 2) === '\\n') { _bEl.innerHTML += '<br>'; _bI += 2; }
        else { _bEl.innerHTML += _bTx.charAt(_bI); _bI++; }
        setTimeout(_tpW, Math.random() * 35 + 20);
    } else {
        _bEl.innerHTML += '<span style="animation: blink 1s infinite;">_</span>';
    }
}

const _platformSounds = {
    yt: () => { AudioManager.beep(440, 0.15, 'sine'); setTimeout(() => AudioManager.beep(880, 0.2, 'sine'), 60); },
    sp: () => { AudioManager.beep(180, 0.2, 'sawtooth'); setTimeout(() => AudioManager.beep(360, 0.25, 'triangle'), 80); },
    st: () => { AudioManager.beep(550, 0.1, 'square'); setTimeout(() => AudioManager.beep(733, 0.2, 'square'), 70); },
    tk: () => { AudioManager.beep(700, 0.08, 'triangle'); setTimeout(() => AudioManager.beep(1050, 0.15, 'triangle'), 50); },
    ds: () => { AudioManager.beep(300, 0.1, 'sine'); setTimeout(() => AudioManager.beep(600, 0.15, 'sine'), 50); }
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

    // 1. Desbloqueo de logros desde el iframe (ej: "Perseverancia" al dar clic en Reintentar)
    if (e.data.type === 'UNLOCK_ACHIEVEMENT' && e.data.id) {
        if (typeof AchievementSystem !== 'undefined') {
            AchievementSystem.unlock(e.data.id);
        }
    }

    // 2. Desbloqueo de barajado de Salmos tras pelear
    if (e.data.type === 'UNLOCK_PSALMS_REROLL') {
        if (typeof DeckController !== 'undefined') DeckController.unlockAfterCombat();
    }

    // 3. Botón RENDIRSE desde la pantalla de muerte -> Otorga "Fe Frágil" y regresa a la Bio
    if (e.data.type === 'BOSS_SURRENDERED') {
        const frame = document.getElementById('boss-frame');
        if (frame) frame.classList.remove('active');
        window._bossActive = false;

        if (typeof OrbitalModule !== 'undefined') OrbitalModule.avatarHoverAttempts = 0;
        if (typeof DeckController !== 'undefined') DeckController.unlockAfterCombat();

        const cross = document.getElementById('orbital-crosshair');
        if (cross && OrbitalModule.hasRailgun) {
            cross.style.display = 'flex';
            cross.style.top = '25px';
            cross.style.right = '25px';
            cross.style.left = 'auto';
        }

        ParticleEngine.resume();
        if (typeof BalatroEngine !== 'undefined' && !BalatroEngine.animId) BalatroEngine.render();
        _initDanmaku();

        if (typeof AchievementSystem !== 'undefined') {
            AchievementSystem.unlock(e.data.achievementId || 'fragile_faith');
        }

        setTimeout(() => {
            DialogueSystem.show({
                text: "Elegiste rendirte y volver aquí... Supongo que tu fe era más frágil de lo que aparentabas.",
                speaker: "SAPHYNIEL",
                tone: "low",
                autoHideTime: 4200
            });
        }, 450);
    }

    // 4. Derrota completa del Boss (Final [E] o Final [Y])
    if (e.data.type === 'BOSS_DEFEATED') {
        const frame = document.getElementById('boss-frame');
        if (frame) frame.classList.remove('active');
        
        window._bossActive = false;
        window._bossBeaten = true;
        AvatarController.clickCount = 0;
        if (typeof OrbitalModule !== 'undefined') OrbitalModule.avatarHoverAttempts = 0;

        const endingType = e.data.ending || 'SACRIFICE';
        const cross = document.getElementById('orbital-crosshair');

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
            }
            if (typeof OrbitalModule !== 'undefined') OrbitalModule.hasRailgun = false;
            if (cross) {
                cross.classList.remove('unlocked');
                cross.style.display = 'none';
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
            if (cross) {
                cross.style.display = 'flex';
                cross.style.top = '25px';
                cross.style.right = '25px';
                cross.style.left = 'auto';
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
                ? "Entregaste todos tus logros, salmos y armas para reconstruir mi Santuario... Bienvenido al Registro Renacido [E]."
                : "Supongo que al final conseguiste lo que querías... Los sellos de Salmos pueden volver a barajarse.";
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

    adaptWidescreenLayout();
    syncSanctuaryThemeUI();
    BalatroEngine.init('balatro-canvas');
    ParticleEngine.init('particle-canvas');
    if (window._bossBeaten) ParticleEngine.startPetalRain(45);

    DestructionModule.init();
    OrbitalModule.init();
    TerminalModule.init();
    AvatarController.init();
    LanyardModule.init();
    AchievementSystem.init();
    initReactBitsEffects();

    _renderVerses();
    _renderFaq();
    _initDanmaku();
    _clockInterval = setInterval(_upClk, 35);
    setTimeout(_tpW, 500);

    const mainTitle = document.getElementById('display-name');
    if (mainTitle) decryptTextEffect(mainTitle, "SAPHYNIEL", 700);
});
document.head.insertAdjacentHTML("beforeend", `<style>@keyframes blink { 50% { opacity: 0; } }</style>`);