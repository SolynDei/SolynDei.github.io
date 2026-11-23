const CODEX_DATA = {
    discordId: "409107659153735680",
    discordUserCopy: "laska.com.tv",
    uniqueVisitsKey: "saphyniel-codex",

    sprites: {
        normalBody: "img/portraits/saphyniel_normal.png",
        angryBody: "img/portraits/saphyniel_angry.png",
        yandereBody: "img/portraits/Risayandere.png",
        divineBossPhase2: "img/boss/ddddboss_fase2.png",
        bossPhase3: "img/boss/boos_fase3.gif",
        iconDefault: "img/icons/icon.png",
        eye: "img/icons/eye.png"
    },

    sounds: {
        legoPop: "audio/sfx/lego.mp3",
        vineBoom: "audio/sfx/boom.mp3",
        defeatLaugh: "audio/sfx/defeatlaught.mp3",
        bossMusicFase1: "audio/bgm/boss-music-fase1.mp3",
        bossMusicFase2: "audio/bgm/boss-music-fase2.mp3",
        bossMusicFase3: "audio/bgm/boss-music-fase3.mp3",
        superAttack: "audio/sfx/superattack.mp3",
        victory: "audio/bgm/ending.mp3",
        bell: "audio/sfx/bell.mp3",
        rewind: "audio/sfx/rewind.mp3",
        angelCoro: "audio/sfx/angelcoro.mp3"
    },

    danmaku: [
        "祈り (Pray)", "天使降臨", "SOLI DEO GLORIA", "+++ GLORIA IN EXCELSIS +++",
        "KINDRED CARRY 1v9", "神の恵み (Gracia Divina)", "ESMERALDA ELO HELL REAL",
        "NUNCA UNO SIN EL OTRO", "CANON_INDEX_ACTIVE", "ARCHIVE_SYNC_OK"
    ],

    avatarDialogues: [
        { text: "¿Qué estás buscando exactamente?", tone: "mid" },
        { text: "No se siente bien que sigas presionando ahí.", tone: "mid" },
        { text: "Cada vez que insistes, solo esperas una reacción que no quiero darte.", tone: "low" },
        { text: "Hay un límite entre la curiosidad y la falta de respeto.", tone: "low" },
        { text: "Entiendo. Para ti esto es solo una pantalla que responde.", tone: "low" },
        { text: "Si tanto querías romper esto... quédate con las ruinas.", tone: "angry" }
    ],

    orbitalWarnings: {
        attempt1: "Apuntar hacia aquí no demuestra nada. Ya sé que puedes borrarme si quieres.",
        attempt2: "En serio... no necesitas forzar una confrontación.",
        attempt3: "Si tanto te urge destruir este espacio, adelante.",
        repeatFight: [
            { text: "¿Otra vez? ¿Realmente no te quedó nada claro la primera vez?", tone: "mid" },
            { text: "Parece que necesitas ver esto derrumbarse una y otra vez para sentir algo.", tone: "low" },
            { text: "Está bien. Si necesitas repetirlo hasta desgastarlo, hazlo.", tone: "angry" }
        ]
    },

    champions: {
        kindred: {
            title: "KINDRED // LOS CAZADORES ETERNOS",
            meta: "CAMPEÓN PRINCIPAL • MAESTRÍA 38 (385K PTS)",
            splash: "img/champions/kindred.jpg",
            role: "JUNGLA / HIPERCARGADOR",
            pts: "385,000 PTS (NVL 38)",
            quote: "«Cordero, ¿es hora? — Es hora.»",
            sound: (_beep) => {
                _beep(220, 0.4, 'sine', 0.06);
                setTimeout(() => _beep(440, 0.5, 'triangle', 0.05), 80);
            }
        },
        shyvana: {
            title: "SHYVANA // LA HIJA DEL DRAGÓN",
            meta: "SEGUNDO CAMPEÓN • MAESTRÍA 22 (216K PTS)",
            splash: "img/champions/shyvana.jpg",
            role: "JUNGLA / COLOSO",
            pts: "216,000 PTS (NVL 22)",
            quote: "«Furia en mis venas, fuego en el corazón.»",
            sound: (_beep) => {
                _beep(130, 0.5, 'sawtooth', 0.07);
                setTimeout(() => _beep(260, 0.3, 'square', 0.05), 100);
            }
        },
        kayle: {
            title: "KAYLE // LA JUSTICIERA",
            meta: "SEGUNDO CAMPEÓN COMPARTIDO • MAESTRÍA 15 (138K PTS)",
            splash: "img/champions/kayle.jpg",
            role: "SUPERIOR / CENTRAL • ESCALADO DIVINO",
            pts: "138,000 PTS (NVL 15)",
            quote: "«El juicio no conoce la piedad.»",
            sound: (_beep) => {
                _beep(587, 0.4, 'triangle', 0.05);
                setTimeout(() => _beep(880, 0.4, 'sine', 0.04), 100);
            }
        }
    },

    verses: [
        { tag: "SALMOS // 119:105", body: '"Lámpara es a mis pies tu palabra, y lumbrera a mi camino."', tier: "silver", title: "LUMEN SACRUM" },
        { tag: "ECLESIASTÉS // 3:1", body: '"Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora."', tier: "silver", title: "TEMPUS OMNIA" },
        { tag: "ISAÍAS // 30:15", body: '"En quietud y en confianza estará vuestra fortaleza."', tier: "silver", title: "SILENTIUM" },
        { tag: "PROVERBIOS // 4:23", body: '"Sobre toda cosa guardada, guarda tu corazón; porque de él mana la vida."', tier: "gold", title: "COR SANCTUM" },
        { tag: "SALMOS // 27:1", body: '"El Señor es mi luz y mi salvación; ¿de quién temeré?"', tier: "gold", title: "DOMINUS LUX" },
        { tag: "APOCALIPSIS // 21:6", body: '"Yo soy el Alfa y la Omega, el principio y el fin."', tier: "crimson", title: "ALPHA ET OMEGA" },
        { tag: "JUAN // 1:5", body: '"La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella."', tier: "gold", title: "LUX IN TENEBRIS" },
        { tag: "ROMANOS // 8:31", body: '"Si Dios con nosotros, ¿quién contra nosotros?"', tier: "crimson", title: "IMPERIUM DEI" },
        { tag: "GÉNESIS // 1:3", body: '"Y dijo Dios: Sea la luz; y fue la luz."', tier: "gold", title: "FIAT LUX" }
    ],

    faq: [
        {
            q: "¿QUÉ TIPO DE JUEGOS SUELO JUGAR?",
            a: "Juegos de rol tácticos, MOBAs competitivos (League of Legends con Kindred, Shyvana y Kayle), títulos de supervivencia con modificaciones y estrategia."
        },
        {
            q: "¿CUÁL ES EL PROPÓSITO DE ESTA PÁGINA?",
            a: "Un espacio personal sobrio para centralizar enlaces directos, presencia en línea y perfiles."
        },
        {
            q: "¿CÓMO CONTACTARME?",
            a: "A través de Discord. Los mensajes directos están habilitados para consultas o juego en equipo."
        }
    ]
};

// === [CONFIGURACION DE MI BLOG PERSONAL] ===
// En esta sección puedes agregar, editar o borrar libremente tus diálogos,
// tus Gustos (con foto, categoría, título y descripción), tus Disgustos y tus Preguntas (FAQ).

CODEX_DATA.avatarDialogues = [
    { text: "¿Hay alguien ahí afuera...? Hace mucho que nadie se detiene a mirar este lugar en silencio.", tone: "low" },
    { text: "Construí este refugio con fragmentos de lo que amo para tener adónde volver cuando todo pesa.", tone: "low" },
    { text: "Por favor, toca el cristal con suavidad... mis recuerdos están tejidos en estas líneas.", tone: "mid" },
    { text: "¿Por qué insistes tanto en golpear la barrera? ¿Acaso buscas quebrar mi calma?", tone: "mid" },
    { text: "Has roto el sello de la artillería orbital... Ahora tienes con qué demoler mi refugio, o dejarlo en paz.", tone: "low" }
];

CODEX_DATA.railgunDialogues = {
    unlocked: "El sello del Cañón Orbital ha caído. Si arrastras la mira hacia cualquier bloque —o usas [APUNTAR]— lo reducirás a cenizas... pero por favor, no apuntes hacia mí.",
    firstDestroy: "Ese fragmento guardaba parte de mi calma... Puedes reconstruirlo con [RESTAURAR] cuando quieras.",
    comboDestroy: "Cada espacio que borras deja un eco más frío en este santuario...",
    restored: "Gracias por devolver las piezas a su lugar. El silencio vuelve a ser amable.",
    avatarHit1: "Ese disparo dio directo contra mi sello... Por favor, detente. No quiero tener que alzar mis armas contra ti.",
    avatarHit2: "El cristal que me protege se está agrietando... Un impacto más sobre mí y me obligarás a defender este refugio.",
    avatarHit3: "Lo entiendo... ni siquiera aquí pude quedarme en paz. Si deseas reducirlo todo a silencio, ven conmigo."
};

// ---------------------------------------------------------
// 1. COSAS QUE ME GUSTAN (AFINIDADES)
// Puedes cambiar "img" por cualquier foto en tu carpeta (ej: "img/gustos/foto.jpg") o un link https://
// ---------------------------------------------------------
CODEX_DATA.likes = [
    {
        img: "img/champions/kindred.jpg",
        tag: "PERSONAJE",
        title: "Kindred // La Cordera y el Lobo",
        desc: "La dualidad poética de la muerte en calma y la cacería inevitable; su estética, sus diálogos y su música son de mis cosas favoritas."
    },
    {
        img: "img/portraits/saphyniel_normal.png",
        tag: "ESTÉTICA & MUNDOS",
        title: "NieR & Atmósferas Melancólicas",
        desc: "Las historias que mezclan arquitectura sacra, interfaces limpias, pianos tristes y personajes que buscan sentido en medio del silencio."
    },
    {
        img: "img/champions/shyvana.jpg",
        tag: "VIDEOJUEGOS",
        title: "Noches de Partidas y Música",
        desc: "Perderse horas jugando con buena música de fondo, perfeccionando mecánicas o simplemente compartiendo el rato en Discord."
    },
    {
        img: "img/champions/kayle.jpg",
        tag: "ARTE & SONIDO",
        title: "Coros Solemnes y Violines",
        desc: "Las bandas sonoras orquestales que empiezan como un susurro y terminan rompiendo el escenario en el clímax."
    }
];

// ---------------------------------------------------------
// 2. COSAS QUE NO ME GUSTAN (DISONANCIAS)
// ---------------------------------------------------------
CODEX_DATA.dislikes = [
    {
        title: "El Ruido Sin Sentido",
        desc: "Los lugares o conversaciones saturadas donde nadie escucha de verdad y todo se siente forzado."
    },
    {
        title: "La Indiferencia Disfrazada",
        desc: "Las promesas a medias y la gente que finge cercanía solo por costumbre o conveniencia."
    },
    {
        title: "La Prisa Constante",
        desc: "Tener que correr todo el tiempo sin poder detenerse a apreciar los detalles pequeños o una buena canción."
    },
    {
        title: "Lo Superficial",
        desc: "Cuando las cosas se hacen sin alma, sin cuidado estético y sin cariño por los detalles."
    }
];

// ---------------------------------------------------------
// 3. PREGUNTAS SOBRE MÍ (EPÍSTOLAS / FAQ)
// ---------------------------------------------------------
CODEX_DATA.faq = [
    {
        q: "01 // ¿Quién es Saphyniel y qué es este espacio?",
        a: "Este códice es mi bitácora personal y mi refugio digital. Es un espacio donde reúno mi música, lo que juego en vivo, las estéticas que me inspiran y pequeños fragmentos de mi mundo."
    },
    {
        q: "02 // ¿Qué tipo de música suelo escuchar?",
        a: "Me encantan las bandas sonoras con carga emocional (como NieR, Persona o temas instrumentales con piano y coros), además de playlists tranquilas para acompañar las noches de lluvia o estudio."
    },
    {
        q: "03 // ¿Qué juegos disfruto más?",
        a: "Disfruto tanto los juegos competitivos como League of Legends (especialmente en la jungla con Kindred o Shyvana) como los juegos de historia profunda, dirección artística única y jefes memorables."
    },
    {
        q: "04 // ¿Qué valoro más en una persona o amistad?",
        a: "La lealtad silenciosa, la honestidad sin rodeos y la capacidad de compartir tanto una charla profunda de madrugada como un momento de silencio cómodo."
    },
    {
        q: "05 // ¿Por qué hay elementos interactivos ocultos en la página?",
        a: "Porque quería que mi biografía no fuera solo una lista estática de enlaces, sino un pequeño mundo vivo que premie la curiosidad de quienes se toman el tiempo de explorarlo."
    },
    {
        q: "06 // ¿Cómo puedo ponerme en contacto?",
        a: "Discord es mi canal principal. Puedes copiar mi usuario directamente desde el panel izquierdo o en la sección de Lecturas."
    }
];