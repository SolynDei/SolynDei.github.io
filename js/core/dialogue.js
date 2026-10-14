const DialogueSystem = {
    timer: null,
    typewriterTimer: null,
    glitchTimer: null,

    show(options = {}) {
        const {
            text = "",
            speaker = "SAPHYNIEL",
            tone = "mid",
            autoHideTime = 2800,
            spriteMap = null,
            isBossPhase3 = false,
            callback = null
        } = options;

        const box = document.getElementById('p5-box');
        const nameEl = document.getElementById('p5-name');
        const textEl = document.getElementById('p5-text');
        const cutinImg = document.getElementById('p5-cutin-img');
        const choices = document.getElementById('p5-choices');

        if (!box || !nameEl || !textEl || !cutinImg) return;

        clearTimeout(this.timer);
        clearTimeout(this.typewriterTimer);
        clearInterval(this.glitchTimer);
        document.body.classList.add('dialogue-locked');
        if (choices) choices.classList.remove('active');

        box.classList.remove('angry-theme', 'glitch-theme', 'yandere-theme');

        const sprites = spriteMap || (typeof CODEX_DATA !== 'undefined' ? {
            normal: CODEX_DATA.sprites.normalBody,
            angry: CODEX_DATA.sprites.angryBody,
            yandere: CODEX_DATA.sprites.yandereBody
        } : {
            normal: "img/portraits/saphyniel_normal.png",
            angry: "img/portraits/saphyniel_angry.png",
            yandere: "img/portraits/Risayandere.png"
        });

        if (isBossPhase3) {
            box.classList.add('glitch-theme');
            cutinImg.src = sprites.yandere;
        } else if (tone === 'angry') {
            box.classList.add('angry-theme');
            cutinImg.src = sprites.angry;
        } else if (tone === 'yandere') {
            box.classList.add(box.id === 'p5-box' && choices ? 'yandere-theme' : 'angry-theme');
            cutinImg.src = sprites.yandere;
        } else {
            cutinImg.src = sprites.normal;
        }

        nameEl.textContent = speaker;
        textEl.innerHTML = '';
        
        let promptGlyph = box.querySelector('.p5-prompt-glyph');
        if (!promptGlyph) {
            promptGlyph = document.createElement('div');
            promptGlyph.className = 'p5-prompt-glyph';
            promptGlyph.textContent = '❖';
            box.querySelector('.p5-speech-bubble')?.appendChild(promptGlyph);
        }
        promptGlyph.classList.remove('show');

        box.classList.add('active');
        cutinImg.classList.add('mouth-talk');

        if (typeof AudioManager !== 'undefined') {
            AudioManager.balatroVoice(tone);
        }

        // Resaltado de palabras clave dinámico
        const processedText = text
            .replace(/\b(Códice|Codex|relic|divinidad|Dios|Saphyniel)\b/gi, '<span class="kw-highlight">$1</span>')
            .replace(/\b(Hereje|destruir|error|juicio|morir|colapso)\b/gi, '<span class="kw-danger">$1</span>');

        // Renderizado letra a letra respetando tags HTML
        let idx = 0;
        let isTag = false;
        let currentHTML = "";
        const self = this;

        function typeChar() {
            if (idx < processedText.length) {
                const char = processedText.charAt(idx);
                if (char === '<') isTag = true;
                currentHTML += char;
                if (char === '>') isTag = false;
                idx++;

                if (isTag) {
                    typeChar();
                    return;
                }

                textEl.innerHTML = currentHTML;
                self.typewriterTimer = setTimeout(typeChar, 18);
            } else {
                cutinImg.classList.remove('mouth-talk');
                promptGlyph.classList.add('show');
                if (autoHideTime > 0) {
                    self.timer = setTimeout(() => {
                        box.classList.remove('active');
                        promptGlyph.classList.remove('show');
                        document.body.classList.remove('dialogue-locked');
                        if (callback) callback();
                    }, autoHideTime);
                } else {
                    document.body.classList.remove('dialogue-locked');
                    if (callback) callback();
                }
            }
        }
        typeChar();
    },

    hide() {
        const box = document.getElementById('p5-box');
        if (box) {
            box.classList.remove('active');
            const promptGlyph = box.querySelector('.p5-prompt-glyph');
            if (promptGlyph) promptGlyph.classList.remove('show');
            const cutinImg = document.getElementById('p5-cutin-img');
            if (cutinImg) cutinImg.classList.remove('mouth-talk');
        }
        document.body.classList.remove('dialogue-locked');
        clearTimeout(this.timer);
        clearTimeout(this.typewriterTimer);
        clearInterval(this.glitchTimer);
    }
};
