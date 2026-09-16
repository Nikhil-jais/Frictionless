const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const comboEl = document.getElementById("combo");
const speedEl = document.getElementById("speed");
const energyFill = document.getElementById("energyFill");
const progressFill = document.getElementById("progressFill");
const worldName = document.getElementById("worldName");
const shieldIndicator = document.getElementById("shieldIndicator");
const dashReady = document.getElementById("dashReady");

const startOverlay = document.getElementById("startOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const startButton = document.getElementById("startButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");
const restartFromPause = document.getElementById("restartFromPause");
const pauseButton = document.getElementById("pauseButton");

const finalScore = document.getElementById("finalScore");
const finalBest = document.getElementById("finalBest");
const finalCombo = document.getElementById("finalCombo");
const finalWorld = document.getElementById("finalWorld");
const endEyebrow = document.getElementById("endEyebrow");
const endTitle = document.getElementById("endTitle");

let W = 0;
let H = 0;
let DPR = Math.min(window.devicePixelRatio || 1, 2);

let state = "menu";
let lastTime = 0;
let elapsed = 0;

let score = 0;
let bestScore = Number(localStorage.getItem("frictionless_best") || 0);
let combo = 1;
let maxCombo = 1;
let comboTimer = 0;

let worldProgress = 0;
let world = "ocean";

let gameSpeed = 1;
let spawnTimer = 0;
let collectibleTimer = 0;
let powerTimer = 0;

let shake = 0;
let flash = 0;
let transitionPulse = 0;

let keys = {};
let pointer = {
    active: false,
    x: 0,
    y: 0
};

let particles = [];
let obstacles = [];
let collectibles = [];
let powerups = [];
let backgroundObjects = [];
let stars = [];

let audioContext = null;

const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 17,
    angle: 0,
    energy: 100,
    shield: false,
    invulnerable: 0,
    dash: 100,
    trail: []
};

const colors = {
    ocean: {
        primary: "#4deaff",
        secondary: "#4385ff",
        glow: "#5cf3ff"
    },
    space: {
        primary: "#b47cff",
        secondary: "#ff65d8",
        glow: "#d19cff"
    }
};

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (state === "menu") {
        player.x = W * 0.5;
        player.y = H * 0.55;
    }
}

window.addEventListener("resize", resize);
resize();

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatScore(value) {
    return Math.floor(value).toString().padStart(6, "0");
}

function initAudio() {
    if (audioContext) return;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        audioContext = null;
    }
}

function sound(type) {
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    const now = audioContext.currentTime;

    if (type === "collect") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(500, now);
        oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.12);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        oscillator.start(now);
        oscillator.stop(now + 0.16);
    }

    if (type === "dash") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(120, now);
        oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.18);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    if (type === "hit") {
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(45, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        oscillator.start(now);
        oscillator.stop(now + 0.22);
    }

    if (type === "power") {
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(1100, now + 0.3);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        oscillator.start(now);
        oscillator.stop(now + 0.35);
    }
}

function resetGame() {
    score = 0;
    combo = 1;
    maxCombo = 1;
    comboTimer = 0;

    worldProgress = 0;
    world = "ocean";

    gameSpeed = 1;
    spawnTimer = 0;
    collectibleTimer = 0;
    powerTimer = 0;

    shake = 0;
    flash = 0;
    transitionPulse = 0;

    obstacles = [];
    collectibles = [];
    powerups = [];
    particles = [];
    backgroundObjects = [];
    stars = [];

    player.x = W * 0.5;
    player.y = H * 0.55;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    player.energy = 100;
    player.shield = false;
    player.invulnerable = 0;
    player.dash = 100;
    player.trail = [];

    createBackground();

    updateHUD();
}

function startGame() {
    initAudio();
    resetGame();
    state = "playing";
    startOverlay.classList.remove("active");
    pauseOverlay.classList.remove("active");
    gameOverOverlay.classList.remove("active");
    pauseButton.style.display = "flex";
    lastTime = performance.now();
    sound("dash");
}

function pauseGame() {
    if (state !== "playing") return;

    state = "paused";
    pauseOverlay.classList.add("active");
}

function resumeGame() {
    if (state !== "paused") return;

    state = "playing";
    pauseOverlay.classList.remove("active");
    lastTime = performance.now();
}

function endGame() {
    state = "gameover";

    if (score > bestScore) {
        bestScore = Math.floor(score);
        localStorage.setItem("frictionless_best", bestScore);
    }

    finalScore.textContent = formatScore(score);
    finalBest.textContent = formatScore(bestScore);
    finalCombo.textContent = "x" + maxCombo;
    finalWorld.textContent = world.toUpperCase();

    if (world === "space") {
        endEyebrow.textContent = "DEEP SPACE SIGNAL";
        endTitle.textContent = "THE STARS GO SILENT";
    } else {
        endEyebrow.textContent = "SIGNAL LOST";
        endTitle.textContent = "THE CURRENT ENDS";
    }

    gameOverOverlay.classList.add("active");
    pauseButton.style.display = "none";

    createBurst(player.x, player.y, world === "ocean" ? "#4deaff" : "#c48cff", 40);
    shake = 18;
    sound("hit");

    updateHUD();
}

function createBackground() {
    backgroundObjects = [];
    stars = [];

    const count = Math.floor(W / 35);

    for (let i = 0; i < count; i++) {
        backgroundObjects.push({
            x: random(0, W),
            y: random(0, H),
            size: random(1, 4),
            speed: random(0.15, 0.7),
            alpha: random(0.08, 0.35),
            phase: random(0, Math.PI * 2)
        });
    }

    for (let i = 0; i < 150; i++) {
        stars.push({
            x: random(0, W),
            y: random(0, H),
            size: random(0.4, 2),
            speed: random(0.2, 1.4),
            alpha: random(0.15, 0.9)
        });
    }
}

function spawnObstacle() {
    const edge = random(0, 1);

    let x;
    let y;

    if (edge < 0.5) {
        x = random(30, W - 30);
        y = -60;
    } else {
        x = random(30, W - 30);
        y = H + 60;
    }

    const difficulty = Math.min(1.8, 1 + elapsed / 75);

    if (world === "ocean") {
        const types = ["rock", "mine", "rock"];
        const type = types[Math.floor(Math.random() * types.length)];

        obstacles.push({
            type,
            x,
            y,
            radius: random(15, 30) * difficulty,
            vx: random(-25, 25),
            vy: random(30, 75) * difficulty,
            rotation: random(0, Math.PI * 2),
            spin: random(-1.5, 1.5),
            wobble: random(0, Math.PI * 2)
        });
    } else {
        obstacles.push({
            type: Math.random() > 0.35 ? "asteroid" : "comet",
            x,
            y,
            radius: random(14, 32) * difficulty,
            vx: random(-45, 45),
            vy: random(35, 90) * difficulty,
            rotation: random(0, Math.PI * 2),
            spin: random(-1.8, 1.8),
            wobble: random(0, Math.PI * 2)
        });
    }
}

function spawnCollectible() {
    collectibles.push({
        x: random(50, W - 50),
        y: random(50, H - 80),
        radius: 9,
        pulse: random(0, Math.PI * 2),
        rotation: random(0, Math.PI * 2),
        type: world === "ocean" ? "pearl" : "energy"
    });
}

function spawnPowerup() {
    powerups.push({
        x: random(70, W - 70),
        y: random(90, H - 100),
        radius: 13,
        rotation: 0,
        pulse: random(0, Math.PI * 2),
        type: Math.random() > 0.45 ? "shield" : "energy"
    });
}

function createParticle(x, y, color, options = {}) {
    particles.push({
        x,
        y,
        vx: options.vx ?? random(-30, 30),
        vy: options.vy ?? random(-30, 30),
        size: options.size ?? random(1, 3),
        life: options.life ?? random(0.4, 1),
        maxLife: options.life ?? 1,
        color,
        gravity: options.gravity ?? 0,
        glow: options.glow ?? 10
    });
}

function createBurst(x, y, color, amount = 20) {
    for (let i = 0; i < amount; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(50, 240);

        createParticle(x, y, color, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: random(1, 4),
            life: random(0.3, 0.9),
            glow: 18
        });
    }
}

function updateBackground(dt) {
    for (const obj of backgroundObjects) {
        obj.phase += dt;

        if (world === "ocean") {
            obj.y += obj.speed * 12 * dt;
            obj.x += Math.sin(obj.phase) * 3 * dt;

            if (obj.y > H + 10) {
                obj.y = -10;
                obj.x = random(0, W);
            }
        } else {
            obj.y += obj.speed * 20 * dt;

            if (obj.y > H + 10) {
                obj.y = -10;
                obj.x = random(0, W);
            }
        }
    }

    for (const star of stars) {
        star.y += star.speed * (world === "space" ? 40 : 8) * dt;

        if (star.y > H + 5) {
            star.y = -5;
            star.x = random(0, W);
        }
    }
}

function updatePlayer(dt) {
    let ax = 0;
    let ay = 0;

    if (keys["ArrowLeft"] || keys["a"]) ax -= 1;
    if (keys["ArrowRight"] || keys["d"]) ax += 1;
    if (keys["ArrowUp"] || keys["w"]) ay -= 1;
    if (keys["ArrowDown"] || keys["s"]) ay += 1;

    if (pointer.active) {
        const dx = pointer.x - player.x;
        const dy = pointer.y - player.y;
        const d = Math.hypot(dx, dy);

        if (d > 20) {
            ax += dx / d;
            ay += dy / d;
        }
    }

    const length = Math.hypot(ax, ay);

    if (length > 0) {
        ax /= length;
        ay /= length;

        player.vx += ax * 620 * dt;
        player.vy += ay * 620 * dt;
    }

    player.vx *= Math.pow(0.001, dt);
    player.vy *= Math.pow(0.001, dt);

    const maxVelocity = 330 + gameSpeed * 35;

    const velocity = Math.hypot(player.vx, player.vy);

    if (velocity > maxVelocity) {
        player.vx = (player.vx / velocity) * maxVelocity;
        player.vy = (player.vy / velocity) * maxVelocity;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    const margin = 24;

    if (player.x < margin) {
        player.x = margin;
        player.vx *= -0.3;
    }

    if (player.x > W - margin) {
        player.x = W - margin;
        player.vx *= -0.3;
    }

    if (player.y < 75) {
        player.y = 75;
        player.vy *= -0.3;
    }

    if (player.y > H - 45) {
        player.y = H - 45;
        player.vy *= -0.3;
    }

    if (velocity > 8) {
        player.angle = Math.atan2(player.vy, player.vx);
    }

    player.trail.push({
        x: player.x,
        y: player.y,
        life: 1
    });

    if (player.trail.length > 18) {
        player.trail.shift();
    }

    for (const trail of player.trail) {
        trail.life -= dt * 2.8;
    }

    player.energy = clamp(player.energy + dt * 4, 0, 100);
    player.dash = clamp(player.dash + dt * 12, 0, 100);

    if (player.invulnerable > 0) {
        player.invulnerable -= dt;
    }
}

function dash() {
    if (state !== "playing" || player.dash < 70) return;

    let dx = player.vx;
    let dy = player.vy;

    if (Math.hypot(dx, dy) < 20) {
        dx = 0;
        dy = -1;
    }

    const d = Math.hypot(dx, dy);

    player.vx += (dx / d) * 520;
    player.vy += (dy / d) * 520;

    player.dash -= 70;
    player.invulnerable = 0.38;

    createBurst(player.x, player.y, colors[world].primary, 18);
    shake = 7;
    sound("dash");
}

function updateObjects(dt) {
    gameSpeed = 1 + Math.min(3.2, elapsed / 38);

    spawnTimer -= dt;
    collectibleTimer -= dt;
    powerTimer -= dt;

    const obstacleInterval = Math.max(0.28, 0.82 - elapsed * 0.006);

    if (spawnTimer <= 0) {
        spawnObstacle();

        if (Math.random() < Math.min(0.22, elapsed / 180)) {
            setTimeout(() => {
                if (state === "playing") spawnObstacle();
            }, 120);
        }

        spawnTimer = obstacleInterval / gameSpeed;
    }

    if (collectibleTimer <= 0) {
        spawnCollectible();
        collectibleTimer = random(0.55, 1.15);
    }

    if (powerTimer <= 0 && elapsed > 8) {
        spawnPowerup();
        powerTimer = random(12, 19);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];

        o.x += o.vx * dt;
        o.y += o.vy * gameSpeed * dt;
        o.rotation += o.spin * dt;
        o.wobble += dt * 2;

        if (o.type === "mine") {
            o.x += Math.sin(o.wobble) * 18 * dt;
        }

        if (o.y > H + 100 || o.y < -100 || o.x < -100 || o.x > W + 100) {
            obstacles.splice(i, 1);
            continue;
        }

        if (
            distance(player, o) <
            player.radius + o.radius * 0.7
        ) {
            hitObstacle(i);
        }
    }

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];

        item.pulse += dt * 4;
        item.rotation += dt * 2;

        if (distance(player, item) < player.radius + item.radius + 5) {
            collectItem(i);
        }
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
        const item = powerups[i];

        item.rotation += dt;
        item.pulse += dt * 3;

        if (distance(player, item) < player.radius + item.radius + 5) {
            collectPowerup(i);
        }
    }
}

function hitObstacle(index) {
    const obstacle = obstacles[index];

    if (player.invulnerable > 0) return;

    if (player.shield) {
        player.shield = false;
        player.invulnerable = 0.8;

        createBurst(obstacle.x, obstacle.y, "#58ffbf", 30);
        obstacles.splice(index, 1);

        shake = 10;
        flash = 0.15;
        sound("power");

        updateHUD();
        return;
    }

    player.energy -= 35;
    combo = 1;
    comboTimer = 0;

    player.invulnerable = 1.0;

    createBurst(player.x, player.y, "#ff557c", 32);

    shake = 13;
    flash = 0.24;
    sound("hit");

    obstacles.splice(index, 1);

    if (player.energy <= 0) {
        endGame();
    }
}

function collectItem(index) {
    const item = collectibles[index];

    const points = 100 * combo;
    score += points;

    combo = Math.min(12, combo + 1);
    maxCombo = Math.max(maxCombo, combo);
    comboTimer = 3.2;

    player.energy = clamp(player.energy + 7, 0, 100);

    createBurst(
        item.x,
        item.y,
        item.type === "pearl" ? "#4deaff" : "#c084ff",
        15
    );

    collectibles.splice(index, 1);

    sound("collect");
    updateHUD();
}

function collectPowerup(index) {
    const item = powerups[index];

    if (item.type === "shield") {
        player.shield = true;
        player.energy = clamp(player.energy + 20, 0, 100);
    } else {
        player.energy = 100;
        player.dash = 100;
    }

    score += 300;

    createBurst(item.x, item.y, "#58ffbf", 28);

    powerups.splice(index, 1);

    sound("power");
    updateHUD();
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    if (state === "playing" && Math.random() < 0.65) {
        const color = colors[world].primary;

        createParticle(
            player.x - Math.cos(player.angle) * 15,
            player.y - Math.sin(player.angle) * 15,
            color,
            {
                vx: random(-20, 20) - player.vx * 0.08,
                vy: random(-20, 20) - player.vy * 0.08,
                size: random(1, 2.5),
                life: random(0.2, 0.6),
                glow: 14
            }
        );
    }
}

function updateGame(dt) {
    elapsed += dt;

    updateBackground(dt);
    updatePlayer(dt);
    updateObjects(dt);
    updateParticles(dt);

    score += dt * (12 + gameSpeed * 5);

    if (comboTimer > 0) {
        comboTimer -= dt;

        if (comboTimer <= 0) {
            combo = 1;
        }
    }

    const oldWorld = world;

    worldProgress += dt * (0.55 + gameSpeed * 0.1);

    if (worldProgress >= 100) {
        worldProgress = 0;
        world = world === "ocean" ? "space" : "ocean";
        transitionPulse = 1;

        createBurst(W * 0.5, H * 0.5, colors[world].primary, 90);
        shake = 15;
        flash = 0.3;
        sound("power");

        obstacles = [];
        collectibles = [];
        powerups = [];
    }

    if (oldWorld !== world) {
        updateHUD();
    }

    transitionPulse = Math.max(0, transitionPulse - dt * 0.55);
    shake = Math.max(0, shake - dt * 22);
    flash = Math.max(0, flash - dt * 0.8);
}

function drawBackground() {
    const oceanT = world === "ocean" ? 1 : 0;
    const spaceT = world === "space" ? 1 : 0;

    const gradient = ctx.createLinearGradient(0, 0, 0, H);

    if (world === "ocean") {
        gradient.addColorStop(0, "#061b36");
        gradient.addColorStop(0.45, "#052d49");
        gradient.addColorStop(1, "#020d24");
    } else {
        gradient.addColorStop(0, "#07051c");
        gradient.addColorStop(0.45, "#12062c");
        gradient.addColorStop(1, "#02020d");
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    if (world === "ocean") {
        drawOceanLight();
        drawOceanBackground();
    } else {
        drawNebula();
        drawSpaceBackground();
    }
}

function drawOceanLight() {
    const glow = ctx.createRadialGradient(
        W * 0.5,
        -100,
        20,
        W * 0.5,
        -100,
        H * 0.8
    );

    glow.addColorStop(0, "rgba(55,220,255,0.18)");
    glow.addColorStop(0.4, "rgba(35,130,210,0.06)");
    glow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
}

function drawOceanBackground() {
    ctx.save();

    for (let i = 0; i < 9; i++) {
        const y = ((elapsed * (18 + i * 3)) + i * 130) % (H + 200) - 100;

        ctx.beginPath();
        ctx.moveTo(0, y);

        for (let x = 0; x <= W; x += 50) {
            ctx.lineTo(
                x,
                y + Math.sin(x * 0.009 + elapsed * 0.5 + i) * 12
            );
        }

        ctx.strokeStyle = `rgba(65,210,245,${0.025 + i * 0.004})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    for (const obj of backgroundObjects) {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,225,255,${obj.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#4deaff";
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

function drawNebula() {
    const g1 = ctx.createRadialGradient(
        W * 0.25,
        H * 0.3,
        0,
        W * 0.25,
        H * 0.3,
        W * 0.55
    );

    g1.addColorStop(0, "rgba(126,67,255,0.17)");
    g1.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(
        W * 0.82,
        H * 0.72,
        0,
        W * 0.82,
        H * 0.72,
        W * 0.45
    );

    g2.addColorStop(0, "rgba(255,70,200,0.1)");
    g2.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
}

function drawSpaceBackground() {
    ctx.save();

    for (const star of stars) {
        ctx.globalAlpha = star.alpha * (0.65 + Math.sin(elapsed * 2 + star.x) * 0.35);
        ctx.fillStyle = "#dcecff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    const planets = [
        {
            x: W * 0.12,
            y: H * 0.24,
            r: 52,
            color: "rgba(88,83,190,0.25)"
        },
        {
            x: W * 0.88,
            y: H * 0.7,
            r: 35,
            color: "rgba(220,90,180,0.2)"
        }
    ];

    for (const planet of planets) {
        const g = ctx.createRadialGradient(
            planet.x - planet.r * 0.35,
            planet.y - planet.r * 0.35,
            2,
            planet.x,
            planet.y,
            planet.r
        );

        g.addColorStop(0, "rgba(230,220,255,0.35)");
        g.addColorStop(0.2, planet.color);
        g.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawObstacles() {
    for (const o of obstacles) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rotation);

        if (o.type === "rock") {
            drawRock(o);
        }

        if (o.type === "mine") {
            drawMine(o);
        }

        if (o.type === "asteroid") {
            drawAsteroid(o);
        }

        if (o.type === "comet") {
            drawComet(o);
        }

        ctx.restore();
    }
}

function drawRock(o) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(20,170,210,0.35)";

    ctx.fillStyle = "#123a52";
    ctx.strokeStyle = "#34738b";
    ctx.lineWidth = 1.5;

    ctx.beginPath();

    const points = 9;

    for (let i = 0; i < points; i++) {
        const angle = i / points * Math.PI * 2;
        const radius = o.radius * random(0.78, 1.15);

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(75,200,230,0.2)";
    ctx.beginPath();
    ctx.arc(-o.radius * 0.25, -o.radius * 0.25, o.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
}

function drawMine(o) {
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ff4f83";

    ctx.strokeStyle = "rgba(255,100,145,0.55)";
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(
            Math.cos(a) * o.radius * 0.65,
            Math.sin(a) * o.radius * 0.65
        );
        ctx.lineTo(
            Math.cos(a) * o.radius * 1.35,
            Math.sin(a) * o.radius * 1.35
        );
        ctx.stroke();
    }

    ctx.fillStyle = "#32192f";
    ctx.strokeStyle = "#ff648d";

    ctx.beginPath();
    ctx.arc(0, 0, o.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ff547f";
    ctx.beginPath();
    ctx.arc(0, 0, o.radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawAsteroid(o) {
    ctx.shadowBlur = 22;
    ctx.shadowColor = "rgba(180,120,255,0.45)";

    ctx.fillStyle = "#302342";
    ctx.strokeStyle = "#9b70bf";
    ctx.lineWidth = 1.5;

    ctx.beginPath();

    const points = 10;

    for (let i = 0; i < points; i++) {
        const a = i / points * Math.PI * 2;
        const r = o.radius * random(0.72, 1.2);

        if (i === 0) {
            ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        } else {
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(200,150,255,0.16)";

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
            random(-o.radius * 0.4, o.radius * 0.4),
            random(-o.radius * 0.4, o.radius * 0.4),
            random(2, 5),
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

function drawComet(o) {
    const gradient = ctx.createLinearGradient(
        -o.radius * 4,
        0,
        o.radius,
        0
    );

    gradient.addColorStop(0, "rgba(255,90,220,0)");
    gradient.addColorStop(0.6, "rgba(255,130,240,0.18)");
    gradient.addColorStop(1, "#c487ff");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-o.radius * 4, 0);
    ctx.lineTo(o.radius, -o.radius * 0.45);
    ctx.lineTo(o.radius, o.radius * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 25;
    ctx.shadowColor = "#d694ff";
    ctx.fillStyle = "#e9c8ff";

    ctx.beginPath();
    ctx.arc(0, 0, o.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawCollectibles() {
    for (const item of collectibles) {
        const pulse = 1 + Math.sin(item.pulse) * 0.16;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.scale(pulse, pulse);

        const color = item.type === "pearl" ? "#4deaff" : "#c487ff";

        ctx.shadowBlur = 25;
        ctx.shadowColor = color;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -item.radius);
        ctx.lineTo(item.radius, 0);
        ctx.lineTo(0, item.radius);
        ctx.lineTo(-item.radius, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

function drawPowerups() {
    for (const item of powerups) {
        const pulse = 1 + Math.sin(item.pulse) * 0.1;
        const color = item.type === "shield" ? "#58ffbf" : "#ffe66d";

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.scale(pulse, pulse);

        ctx.shadowBlur = 25;
        ctx.shadowColor = color;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();

        for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2 - Math.PI / 2;
            const r = item.radius;

            if (i === 0) {
                ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            } else {
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
        }

        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Orbitron";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.type === "shield" ? "◈" : "+", 0, 0);

        ctx.restore();
    }
}

function drawPlayer() {
    for (let i = 0; i < player.trail.length; i++) {
        const t = player.trail[i];

        if (t.life <= 0) continue;

        const alpha = t.life * 0.25;
        const radius = 2 + t.life * 5;

        ctx.beginPath();
        ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = world === "ocean"
            ? `rgba(77,234,255,${alpha})`
            : `rgba(190,125,255,${alpha})`;
        ctx.fill();
    }

    ctx.save();

    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI / 2);

    if (player.shield) {
        ctx.beginPath();
        ctx.arc(0, 0, 31 + Math.sin(elapsed * 7) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(88,255,191,0.65)";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#58ffbf";
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    if (player.invulnerable > 0 && Math.floor(elapsed * 18) % 2 === 0) {
        ctx.globalAlpha = 0.35;
    }

    const main = colors[world].primary;
    const secondary = colors[world].secondary;

    ctx.shadowBlur = 30;
    ctx.shadowColor = main;

    ctx.fillStyle = main;

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(12, 13);
    ctx.lineTo(0, 8);
    ctx.lineTo(-12, 13);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#e9fbff";

    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(5, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = secondary;

    ctx.beginPath();
    ctx.moveTo(-12, 12);
    ctx.lineTo(-20, 20);
    ctx.lineTo(-8, 16);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(20, 20);
    ctx.lineTo(8, 16);
    ctx.closePath();
    ctx.fill();

    const engine = ctx.createRadialGradient(0, 17, 1, 0, 17, 14);
    engine.addColorStop(0, "#ffffff");
    engine.addColorStop(0.3, main);
    engine.addColorStop(1, "rgba(77,234,255,0)");

    ctx.fillStyle = engine;

    ctx.beginPath();
    ctx.arc(0, 18, 12 + Math.sin(elapsed * 20) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.restore();
}

function drawParticles() {
    for (const p of particles) {
        const alpha = clamp(p.life / p.maxLife, 0, 1);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.glow;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function drawTransition() {
    if (transitionPulse <= 0) return;

    const radius = (1 - transitionPulse) * Math.max(W, H) * 0.8;

    ctx.save();

    ctx.globalAlpha = transitionPulse * 0.35;
    ctx.strokeStyle = colors[world].primary;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 35;
    ctx.shadowColor = colors[world].primary;

    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, W, H);

    drawBackground();

    const offsetX = shake > 0 ? random(-shake, shake) : 0;
    const offsetY = shake > 0 ? random(-shake, shake) : 0;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    drawCollectibles();
    drawPowerups();
    drawObstacles();
    drawParticles();
    drawPlayer();

    ctx.restore();

    drawTransition();

    if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(0, 0, W, H);
    }
}

function updateHUD() {
    scoreEl.textContent = formatScore(score);
    bestScoreEl.textContent = formatScore(bestScore);

    comboEl.textContent = "x" + combo;
    speedEl.textContent = gameSpeed.toFixed(1);

    energyFill.style.width = player.energy + "%";

    progressFill.style.width = Math.max(5, worldProgress) + "%";

    worldName.textContent = world.toUpperCase();

    worldName.style.color = colors[world].primary;
    worldName.style.textShadow = `0 0 18px ${colors[world].primary}`;

    progressFill.style.background = colors[world].primary;
    progressFill.style.boxShadow = `0 0 12px ${colors[world].primary}`;

    energyFill.style.width = player.energy + "%";

    shieldIndicator.classList.toggle("visible", player.shield);

    const dashPercent = Math.floor(player.dash);

    if (dashPercent >= 70) {
        dashReady.innerHTML = "SPACE <span>READY</span>";
    } else {
        dashReady.innerHTML = "DASH <span>" + dashPercent + "%</span>";
    }
}

function gameLoop(timestamp) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);

    lastTime = timestamp;

    if (state === "playing") {
        updateGame(dt);
        updateHUD();
    } else {
        updateBackground(dt * 0.3);
        updateParticles(dt * 0.4);

        if (state === "menu") {
            player.x = W * 0.5 + Math.sin(timestamp * 0.0008) * 30;
            player.y = H * 0.55 + Math.sin(timestamp * 0.0012) * 15;
            player.angle = Math.sin(timestamp * 0.0007) * 0.12;
        }
    }

    draw();

    requestAnimationFrame(gameLoop);
}

function setPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
}

window.addEventListener("keydown", (event) => {
    const key = event.key;

    keys[key] = true;

    if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)
    ) {
        event.preventDefault();
    }

    if (key === " " || key === "Spacebar") {
        dash();
    }

    if (key.toLowerCase() === "p") {
        if (state === "playing") pauseGame();
        else if (state === "paused") resumeGame();
    }

    if (key.toLowerCase() === "r") {
        if (state === "gameover") startGame();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

canvas.addEventListener("pointerdown", (event) => {
    pointer.active = true;
    setPointerPosition(event);

    if (state === "playing") {
        canvas.setPointerCapture?.(event.pointerId);
    }
});

canvas.addEventListener("pointermove", (event) => {
    if (pointer.active) {
        setPointerPosition(event);
    }
});

canvas.addEventListener("pointerup", () => {
    pointer.active = false;
});

canvas.addEventListener("pointercancel", () => {
    pointer.active = false;
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
restartFromPause.addEventListener("click", startGame);
resumeButton.addEventListener("click", resumeGame);
pauseButton.addEventListener("click", pauseGame);

document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") {
        pauseGame();
    }
});

resetGame();
requestAnimationFrame((time) => {
    lastTime = time;
    gameLoop(time);
});
