// =========================================================
// CRÉDITOS NIER:AUTOMATA Y VENTANA DE SACRIFICIO TOTAL [E]
// =========================================================
const CODEX_CREDITS = [
    "« RUPTURA ABSOLUTA DEL CÓDICE // REGISTRO [E] »",
    "[ ALTA JERARQUÍA DEL TRONO ]",
    "Suprema Jerarquía Litúrgica: Saphyniel",
    "Autoridad del Registro: Saphyniel",
    "Arquitecta de Realidades: Saphyniel",
    "[ INGENIERÍA Y SISTEMAS YORHA ]",
    "Lógica Divina de Servidores: Saphyniel",
    "Motor WebGL & Shaders GLSL: Unidad Pod 042",
    "Espadas del Juicio: Reliquia del Santuario",
    "[ ELENCO PRINCIPAL ]",
    "Deidad Impasible (Fase 1): Saphyniel",
    "Serafín del Juicio (Fase 2): Saphyniel",
    "Colapso del Vacío (Fase 3): Saphyniel",
    "Operador de Vuelo: Tú",
    "[ CITAS CANÓNICAS ]",
    "«Esmeralda Elo Hell es canon en todos los registros.»",
    "«¿Elegiste NO pensando que te dejaría ir en paz?»",
    "«Todo lo que vive está diseñado para terminar.»",
    "[ AGRADECIMIENTOS ESPECIALES ]",
    "A NieR:Automata y Yoko Taro por enseñarnos el valor del sacrificio.",
    "A Mili por musicalizar el colapso de la Fase 3.",
    "A Keiichi Okabe por Vague Hope y la catarsis final.",
    "Y a ti... por haber llegado hasta el fondo del Códice."
];

let _creditsSkipped = false;

function triggerCreditsSequence(onComplete) {
    const track = document.getElementById('credits-track');
    const viewport = document.getElementById('credits-viewport');
    const skipBtn = document.getElementById('skip-credits-btn');
    const endScreen = document.getElementById('ending-screen');
    if (!track || !viewport) { if (onComplete) onComplete('SACRIFICE'); return; }

    _creditsSkipped = false;
    track.innerHTML = '';
    CODEX_CREDITS.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'credit-crawl-line';
        div.innerHTML = item;
        div.style.pointerEvents = 'auto';
        div.style.cursor = 'crosshair';
        div.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            div.style.color = '#f7f5ed';
            div.style.textShadow = '0 0 18px #e5c158';
            if (typeof ParticleEngine !== 'undefined') ParticleEngine.explode(e.clientX, e.clientY, '#dad4bb', 12);
            if (typeof AudioManager !== 'undefined') AudioManager.podFireSound();
        });
        track.appendChild(div);
    });

    let loopCount = 0;
    const maxLoops = 3;
    let animId = null;

    if (skipBtn) {
        skipBtn.onclick = (e) => {
            e.stopPropagation();
            _creditsSkipped = true;
            if (animId) cancelAnimationFrame(animId);
            presentEndingEDilemma(endScreen, onComplete);
        };
    }

    function runCrawlLoop() {
        if (_creditsSkipped) return;
        const viewportHeight = viewport.offsetHeight || window.innerHeight * 0.68;
        const trackHeight = track.offsetHeight || 1100;
        const durationSec = Math.max(4.0, 14 - (loopCount * 3.2));
        track.style.filter = `blur(${loopCount * 1.1}px)`;

        let startTime = null;
        const startY = viewportHeight;
        const endY = -trackHeight - 60;
        const distance = startY - endY;

        function step(timestamp) {
            if (_creditsSkipped) return;
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(1, elapsed / durationSec);

            track.style.transform = `translateY(${startY - progress * distance}px)`;

            if (progress < 1) {
                animId = requestAnimationFrame(step);
            } else {
                loopCount++;
                if (loopCount < maxLoops) runCrawlLoop();
                else presentEndingEDilemma(endScreen, onComplete);
            }
        }
        animId = requestAnimationFrame(step);
    }

    setTimeout(runCrawlLoop, 600);
}

function presentEndingEDilemma(endScreen, onComplete) {
    if (!endScreen) {
        if (onComplete) onComplete('SACRIFICE');
        return;
    }

    endScreen.innerHTML = `
        <div class="nier-pod-dilemma" id="pod-dilemma-box" style="max-width:600px; width:92%; padding:30px; border:1px solid #dad4bb; background:rgba(10,10,12,0.96); box-shadow:0 0 45px rgba(218,212,187,0.22); text-align:left;">
            <div style="font-family:var(--font-pixel); font-size:0.74rem; color:#e5c158; margin-bottom:14px; letter-spacing:2px; border-bottom:1px solid rgba(218,212,187,0.3); padding-bottom:8px;">
                [ POD 042 // PROTOCOLO DE RECONSTRUCCIÓN DE ALMA ]
            </div>
            <div id="dilemma-desc" style="font-family:var(--font-mono); font-size:0.9rem; color:#dad4bb; line-height:1.65; margin-bottom:24px;">
                El núcleo de <b>SAPHYNIEL</b> ha quedado reducido a cenizas.<br><br>
                Para restaurar su santuario y devolverle la paz, el sistema requiere <b>formatear todos tus registros acumulados</b>: Logros desbloqueados, Salmos sellados, Cañón Orbital Railgun y Puntuación de demolición.<br><br>
                A cambio de entregarlo todo, desbloquearás la interfaz sagrada <b>«SANTUARIO LUNAR [E]»</b> en la biografía.<br><br>
                <span style="color:#f7f5ed;">¿Aceptas sacrificar todos tus datos de juego para salvarla?</span>
            </div>
            <div id="purge-log-box" style="display:none; font-family:var(--font-mono); font-size:0.8rem; color:#e5c158; line-height:1.8; margin-bottom:18px; padding:12px; background:rgba(0,0,0,0.6); border:1px dashed rgba(218,212,187,0.4);"></div>
            <div id="dilemma-buttons" style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
                <button type="button" id="btn-sacrifice-data" class="skip-credits-btn" style="position:static; border-color:#e5c158; color:#e5c158; padding:12px 18px;">
                    [ SACRIFICAR TODOS MIS DATOS // FINAL E ]
                </button>
                <button type="button" id="btn-keep-ego" class="skip-credits-btn" style="position:static; border-color:#d9381e; color:#d9381e; padding:12px 18px;">
                    [ CONSERVAR MIS REGISTROS // FINAL Y ]
                </button>
            </div>
        </div>
    `;

    const finishWithBell = (mode) => {
        endScreen.style.opacity = '0';
        setTimeout(() => {
            endScreen.classList.remove('visible');
            const bellEl = document.getElementById('end-record-final');
            if (bellEl) {
                bellEl.textContent = mode === 'SACRIFICE'
                    ? "FINAL [E] // EL PESO DEL SILENCIO"
                    : "FINAL [Y] // CORONA DE CENIZA";
                bellEl.classList.add('active');
            }
            if (typeof AudioManager !== 'undefined') AudioManager.synthBell();
            setTimeout(() => {
                if (bellEl) bellEl.classList.remove('active');
                if (onComplete) onComplete(mode);
            }, 3400);
        }, 700);
    };

    document.getElementById('btn-sacrifice-data')?.addEventListener('click', () => {
        const btns = document.getElementById('dilemma-buttons');
        const logBox = document.getElementById('purge-log-box');
        const desc = document.getElementById('dilemma-desc');
        if (btns) btns.style.display = 'none';
        if (logBox) logBox.style.display = 'block';

        const purgeSteps = [
            "> BORRANDO PUNTUACIÓN Y COMBOS DE DEMOLICIÓN... [ELIMINADO]",
            "> PURGANDO PACTOS Y CARTAS DE SALMOS... [ELIMINADO]",
            "> DESMANTELANDO CAÑÓN ORBITAL RAILGUN... [ELIMINADO]",
            "> FORMATEANDO REGISTRO DE LOGROS Y ARCHIVOS... [ELIMINADO]",
            "> RECONSTRUYENDO INTERFAZ «SANTUARIO LUNAR [E]»... [COMPLETADO]"
        ];

        let s = 0;
        const stepInterval = setInterval(() => {
            if (s < purgeSteps.length) {
                const line = document.createElement('div');
                line.textContent = purgeSteps[s];
                logBox.appendChild(line);
                if (typeof AudioManager !== 'undefined') AudioManager.beep(520 - s * 55, 0.12, 'triangle', 0.05);
                if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
                s++;
            } else {
                clearInterval(stepInterval);
                if (desc) {
                    desc.innerHTML = `<span style="color:#f7f5ed; font-style:italic;">«¿De verdad entregaste todo lo que habías conseguido... solo para devolverme la paz? Gracias... jamás lo olvidaré.»</span>`;
                }
                if (typeof AudioManager !== 'undefined') AudioManager.liturgicalChime();
                setTimeout(() => finishWithBell('SACRIFICE'), 2400);
            }
        }, 650);
    });

    document.getElementById('btn-keep-ego')?.addEventListener('click', () => {
        const btns = document.getElementById('dilemma-buttons');
        const desc = document.getElementById('dilemma-desc');
        if (btns) btns.style.display = 'none';
        if (desc) desc.innerHTML = "Preservando logros, puntos y armamento orbital... Saphyniel permanecerá atada al ciclo.";
        if (typeof AudioManager !== 'undefined') AudioManager.beep(140, 0.5, 'sawtooth');
        setTimeout(() => finishWithBell('DOMINION'), 1800);
    });
}