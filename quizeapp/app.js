/**
 * QuizSphere Pro Enterprise v2.0
 * Optimized for Resume Portfolio - High Code Quality
 * Integrated Audio Feedback System
 */

// Sound Registry
const SFX = {
    correct: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-reward-952.mp3'),
    wrong: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'),
    start: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-start-613.mp3'),
    finish: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chime-2064.mp3')
};

let soundContextActive = false;
let soundEnabled = true;

function playSFX(key) {
    if (soundEnabled && SFX[key]) {
        SFX[key].currentTime = 0;
        SFX[key].play().catch(() => {
            console.log("Audio interlock: Interaction required or muted.");
        });
    }
}

const KNOWLEDGE_BASE = {
    frontend: [
        { q: "Analyze the primary function of the 'useEffect' dependency array in a React lifecycle.", options: ["Global state tracking", "Optimizing effect execution triggers", "Managing component prop types", "Direct DOM manipulation"], a: 1, d: "Intermediate" },
        { q: "Identify the CSS property required to implement high-fidelity Backdrop Filter effects.", options: ["filter: blur()", "backdrop-filter: blur()", "mask-image-blur", "layer-opacity"], a: 1, d: "Advanced" },
        { q: "What is the computational impact of the 'defer' attribute in modern script loading?", options: ["Parallelizing CPU execution", "Non-blocking HTML parsing with deferred execution", "Immediate script injection", "Asynchronous memory allocation"], a: 1, d: "Advanced" },
        { q: "In Big O notation, which complexity represents optimal constant-time access?", options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"], a: 2, d: "Expert" }
    ],
    backend: [
        { q: "Which HTTP status code is reserved for an 'Unauthorized' access attempt?", options: ["401", "403", "404", "500"], a: 0, d: "Basic" },
        { q: "Evaluate the primary benefit of horizontal scaling in NoSQL distributed systems.", options: ["Schema rigidity", "Elastic scalability across nodes", "Transactional ACID compliance", "Fixed table structures"], a: 1, d: "Intermediate" },
        { q: "Describe the role of the Node.js 'Event Loop' in high-concurrency environments.", options: ["Heavy computing prioritization", "Single-threaded non-blocking I/O orchestration", "Multi-threaded process spawning", "UI rendering pipeline management"], a: 1, d: "Advanced" }
    ],
    logic: [
        { q: "Given: If All A are B, and Some B are C. Does it follow that some A are C?", options: ["Yes", "No", "Insufficient Data", "Always"], a: 2, d: "Logical Reasoning" },
        { q: "Computational Pattern: 1, 4, 9, 16, 25. Determine the n+1 value.", options: ["30", "34", "36", "41"], a: 2, d: "Pattern Analysis" }
    ]
};

// Application State Controller
const State = {
    cat: null,
    stack: [],
    ptr: 0,
    metrics: 0,
    timer: 15,
    clockId: null,
    isProcessing: false,
    correctHits: 0,
    auditLog: []
};

// UI DOM Registry
const UI = {
    screens: {
        home: document.getElementById('home-screen'),
        quiz: document.getElementById('quiz-screen'),
        result: document.getElementById('result-screen')
    },
    timer: {
        text: document.getElementById('time-left'),
        bar: document.getElementById('timer-progress')
    },
    display: {
        ptr: document.getElementById('question-counter'),
        text: document.getElementById('question-text'),
        options: document.getElementById('options-stack'),
        score: document.getElementById('live-score'),
        accent: document.getElementById('difficulty-badge'),
        feedback: document.getElementById('feedback-text')
    },
    analytics: {
        acc: document.getElementById('accuracy-val'),
        total: document.getElementById('final-score'),
        summary: document.getElementById('result-sentiment'),
        review: document.getElementById('review-section'),
        highScore: document.getElementById('high-score-entry')
    },
    actions: {
        start: document.getElementById('start-btn'),
        next: document.getElementById('next-btn'),
        leaderboard: document.getElementById('view-leaderboard'),
        closeLBoard: document.getElementById('close-leaderboard'),
        saveScore: document.getElementById('save-score-btn'),
        restart: document.getElementById('restart-btn'),
        review: document.getElementById('review-btn'),
        toggleSound: document.getElementById('toggle-sound')
    }
};

// UI Interactions
if (UI.actions.toggleSound) {
    UI.actions.toggleSound.onclick = () => {
        soundEnabled = !soundEnabled;
        const icon = document.getElementById('sound-icon');
        icon.setAttribute('data-lucide', soundEnabled ? 'volume-2' : 'volume-x');
        lucide.createIcons();
    };
}

function selectCategory(key) {
    State.cat = key;
    State.stack = [...KNOWLEDGE_BASE[key]];
    document.querySelectorAll('.category-card').forEach(c => {
        c.classList.toggle('active', c.innerText.toLowerCase().includes(key));
    });
    UI.actions.start.classList.remove('hidden');
}

UI.actions.start.onclick = () => {
    Object.values(UI.screens).forEach(s => s.classList.add('hidden'));
    UI.screens.quiz.classList.remove('hidden');
    playSFX('start');
    resetSession();
    renderNextChallenge();
};

function resetSession() {
    State.ptr = 0;
    State.metrics = 0;
    State.correctHits = 0;
    State.auditLog = [];
    UI.display.score.innerText = "000";
}

function renderNextChallenge() {
    State.isProcessing = true;
    State.timer = 15;
    UI.actions.next.classList.add('hidden');
    UI.display.feedback.innerText = "";
    
    const data = State.stack[State.ptr];
    UI.display.text.innerText = data.q;
    UI.display.accent.innerText = data.d.toUpperCase();
    UI.display.ptr.innerText = `${String(State.ptr + 1).padStart(2, '0')}/${String(State.stack.length).padStart(2, '0')}`;
    
    UI.display.options.innerHTML = "";
    data.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerHTML = `<span>${opt}</span> <i data-lucide="chevron-right" style="width: 16px;"></i>`;
        btn.onclick = () => processEvaluation(i, btn);
        UI.display.options.appendChild(btn);
    });
    
    lucide.createIcons();
    initializeClock();
}

function initializeClock() {
    clearInterval(State.clockId);
    syncClockUI();
    State.clockId = setInterval(() => {
        State.timer--;
        syncClockUI();
        if (State.timer <= 0) processEvaluation(-1);
    }, 1000);
}

function syncClockUI() {
    UI.timer.text.innerText = State.timer;
    const offset = 176 - (State.timer * (176 / 15));
    UI.timer.bar.style.strokeDashoffset = offset;
    UI.timer.bar.style.stroke = State.timer < 5 ? "var(--accent)" : "var(--primary)";
}

function processEvaluation(idx, trigger) {
    if (!State.isProcessing) return;
    State.isProcessing = false;
    clearInterval(State.clockId);

    const ref = State.stack[State.ptr];
    const hit = idx === ref.a;

    State.auditLog.push({ q: ref.q, opts: ref.options, ref: ref.a, usr: idx, hit });

    if (hit) {
        State.metrics += (10 + State.timer);
        State.correctHits++;
        trigger.classList.add('correct');
        UI.display.feedback.innerText = "COGNITIVE HIT: Speed Bonus applied.";
        playSFX('correct');
    } else {
        if (trigger) trigger.classList.add('wrong');
        const btns = UI.display.options.querySelectorAll('.option-btn');
        btns[ref.a].classList.add('correct');
        UI.display.feedback.innerText = idx === -1 ? "TIME DEPLETION: Protocol Interrupted." : "COGNITIVE MISS: Analysis Inaccurate.";
        playSFX('wrong');
    }

    UI.display.score.innerText = String(State.metrics).padStart(3, '0');
    UI.actions.next.classList.remove('hidden');
    lucide.createIcons();
}

UI.actions.next.onclick = () => {
    State.ptr++;
    if (State.ptr < State.stack.length) renderNextChallenge();
    else compileFinalAudit();
};

function compileFinalAudit() {
    UI.screens.quiz.classList.add('hidden');
    UI.screens.result.classList.remove('hidden');
    UI.analytics.review.classList.add('hidden');
    
    const acc = Math.round((State.correctHits / State.stack.length) * 100);
    UI.analytics.acc.innerText = `${acc}%`;
    UI.analytics.total.innerText = State.metrics;

    const records = getStoredRegistry();
    const floor = records.length < 5 ? 0 : records[4].score;
    
    if (State.metrics > floor && State.metrics > 0) {
        UI.analytics.highScore.classList.remove('hidden');
    } else {
        UI.analytics.highScore.classList.add('hidden');
    }

    if (acc === 100) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        playSFX('finish');
    }
}

// Persistence Management
function getStoredRegistry() {
    return JSON.parse(localStorage.getItem('qs_registry')) || [];
}

UI.actions.saveScore.onclick = () => {
    const val = document.getElementById('player-name').value.trim() || "Anonymous Tech";
    let db = getStoredRegistry();
    db.push({ name: val, score: State.metrics, track: State.cat });
    db.sort((a,b) => b.score - a.score);
    localStorage.setItem('qs_registry', JSON.stringify(db.slice(0, 5)));
    UI.analytics.highScore.classList.add('hidden');
    alert("Metric Synchronized with Registry.");
};

UI.actions.leaderboard.onclick = () => {
    const data = getStoredRegistry();
    document.getElementById('leaderboard-list').innerHTML = data.length ? data.map((s, i) => `
        <div class="leader-row">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <span class="stat-value" style="font-size: 0.9rem; width: 25px; height: 25px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border-radius: 50%;">${i+1}</span>
                <div>
                    <div style="font-weight: 700; color: white;">${s.name}</div>
                    <small style="text-transform: capitalize; color: var(--text-dim);">${s.track} Track</small>
                </div>
            </div>
            <div class="stat-value" style="color: var(--primary-light);">${s.score}</div>
        </div>
    `).join('') : '<p style="text-align: center; color: var(--text-dim);">Registry empty. Pending evaluations.</p>';
    document.getElementById('leaderboard-modal').classList.remove('hidden');
};

UI.actions.closeLBoard.onclick = () => document.getElementById('leaderboard-modal').classList.add('hidden');

UI.actions.review.onclick = () => {
    UI.analytics.review.classList.toggle('hidden');
    if (!UI.analytics.review.classList.contains('hidden')) {
        UI.analytics.review.innerHTML = State.auditLog.map((l, i) => `
            <div class="category-card" style="margin-bottom: 1rem; cursor: default; padding: 1.5rem; ${l.hit ? 'border-left: 4px solid var(--success)' : 'border-left: 4px solid var(--accent)'}">
                <div style="font-weight: 700; color: white; margin-bottom: 8px;">AUDIT Q${i+1}: ${l.q}</div>
                <div style="font-size: 0.9rem;">
                    <span style="color: ${l.hit ? 'var(--success)' : 'var(--accent)'}">
                        Input: ${l.usr === -1 ? 'Clock Depletion' : l.opts[l.usr]}
                    </span>
                    ${!l.hit ? `<br><span style="color: var(--success)">Reference: ${l.opts[l.ref]}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
};

UI.actions.restart.onclick = () => location.reload();
