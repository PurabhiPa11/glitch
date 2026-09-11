
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameContainer = document.querySelector(".game-container");

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const integrityFill = document.getElementById("integrityFill");
const fpsCounter = document.getElementById("fpsCounter");

const glitchWarning = document.getElementById("glitchWarning");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseScreen = document.getElementById("pauseScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const finalScore = document.getElementById("finalScore");
const finalLevel = document.getElementById("finalLevel");
const finalFragments = document.getElementById("finalFragments");


/* =========================================================
   CANVAS RESOLUTION
   ========================================================= */

let width = 0;
let height = 0;

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* =========================================================
   GAME STATE
   ========================================================= */

let gameRunning = false;
let paused = false;

let score = 0;
let level = 1;

let integrity = 100;

let fragmentsCollected = 0;

let lastTime = 0;

let spawnTimer = 0;
let glitchTimer = 0;

let glitchDuration = 0;

let controlsReversed = false;

let animationFrameId;


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    x: 0,
    y: 0,

    width: 24,
    height: 24,

    speed: 280,

    vx: 0,
    vy: 0,

    trail: []

};


/* =========================================================
   OBJECT ARRAYS
   ========================================================= */

let fragments = [];
let obstacles = [];
let particles = [];
let stars = [];
let glitchLines = [];


/* =========================================================
   INPUT
   ========================================================= */

const keys = {};

window.addEventListener("keydown", (event) => {

    keys[event.key.toLowerCase()] = true;

    if (
        event.key === " " ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
    }

    if (event.key === " ") {

        if (gameRunning) {

            togglePause();

        }

    }

});


window.addEventListener("keyup", (event) => {

    keys[event.key.toLowerCase()] = false;

});


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    score = 0;
    level = 1;
    integrity = 100;
    fragmentsCollected = 0;

    spawnTimer = 0;
    glitchTimer = 0;
    glitchDuration = 0;

    controlsReversed = false;

    fragments = [];
    obstacles = [];
    particles = [];
    glitchLines = [];

    player.x = width / 2;
    player.y = height / 2;

    player.vx = 0;
    player.vy = 0;

    player.trail = [];

    gameRunning = true;
    paused = false;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");

    updateHUD();

    createStars();

    lastTime = performance.now();

    cancelAnimationFrame(animationFrameId);

    animationFrameId = requestAnimationFrame(gameLoop);

}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    if (paused) {
        return;
    }

    const deltaTime = Math.min(
        (timestamp - lastTime) / 1000,
        0.05
    );

    lastTime = timestamp;

    update(deltaTime);

    draw();

}


/* =========================================================
   UPDATE
   ========================================================= */

function update(deltaTime) {

    updatePlayer(deltaTime);

    updateFragments(deltaTime);

    updateObstacles(deltaTime);

    updateParticles(deltaTime);

    updateStars(deltaTime);

    updateGlitches(deltaTime);

    spawnObjects(deltaTime);

    updateLevel();

    updateHUD();

    checkCollisions();

}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function updatePlayer(deltaTime) {

    let horizontal = 0;
    let vertical = 0;

    if (keys["a"] || keys["arrowleft"]) {
        horizontal -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        horizontal += 1;
    }

    if (keys["w"] || keys["arrowup"]) {
        vertical -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        vertical += 1;
    }


    if (controlsReversed) {
        horizontal *= -1;
        vertical *= -1;
    }


    const magnitude = Math.sqrt(
        horizontal * horizontal +
        vertical * vertical
    );

    if (magnitude > 0) {

        horizontal /= magnitude;
        vertical /= magnitude;

    }


    player.vx = horizontal * player.speed;
    player.vy = vertical * player.speed;


    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;


    /* Keep player inside screen */

    const margin = 18;

    player.x = Math.max(
        margin,
        Math.min(width - margin, player.x)
    );

    player.y = Math.max(
        margin + 20,
        Math.min(height - margin, player.y)
    );


    /* Player trail */

    if (magnitude > 0) {

        player.trail.push({
            x: player.x,
            y: player.y,
            life: 1
        });

    }

    if (player.trail.length > 20) {
        player.trail.shift();
    }

    player.trail.forEach(point => {
        point.life -= deltaTime * 2.5;
    });

    player.trail = player.trail.filter(
        point => point.life > 0
    );

}


/* =========================================================
   SPAWN OBJECTS
   ========================================================= */

function spawnObjects(deltaTime) {

    spawnTimer += deltaTime;

    const spawnInterval = Math.max(
        0.35,
        1.15 - level * 0.055
    );


    if (spawnTimer < spawnInterval) {
        return;
    }

    spawnTimer = 0;


    const random = Math.random();


    if (random < 0.62) {

        createFragment();

    } else {

        createObstacle();

    }

}


/* =========================================================
   CREATE FRAGMENT
   ========================================================= */

function createFragment() {

    const size = 10 + Math.random() * 6;

    fragments.push({

        x: Math.random() * (width - 60) + 30,

        y: Math.random() * (height - 120) + 70,

        size: size,

        rotation: Math.random() * Math.PI,

        rotationSpeed:
            (Math.random() - 0.5) * 3,

        pulse: Math.random() * Math.PI * 2,

        fake: Math.random() < 0.10

    });

}


/* =========================================================
   CREATE OBSTACLE
   ========================================================= */

function createObstacle() {

    const size = 18 + Math.random() * 22;

    const edge = Math.floor(Math.random() * 4);

    let x;
    let y;


    if (edge === 0) {

        x = -size;
        y = Math.random() * height;

    } else if (edge === 1) {

        x = width + size;
        y = Math.random() * height;

    } else if (edge === 2) {

        x = Math.random() * width;
        y = -size;

    } else {

        x = Math.random() * width;
        y = height + size;

    }


    const angle = Math.atan2(
        height / 2 - y,
        width / 2 - x
    );


    const speed =
        55 +
        level * 10 +
        Math.random() * 45;


    obstacles.push({

        x: x,
        y: y,

        size: size,

        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,

        rotation: Math.random() * Math.PI,

        rotationSpeed:
            (Math.random() - 0.5) * 4,

        life: 1

    });

}


/* =========================================================
   UPDATE FRAGMENTS
   ========================================================= */

function updateFragments(deltaTime) {

    fragments.forEach(fragment => {

        fragment.rotation +=
            fragment.rotationSpeed * deltaTime;

        fragment.pulse += deltaTime * 4;

    });

}


/* =========================================================
   UPDATE OBSTACLES
   ========================================================= */

function updateObstacles(deltaTime) {

    obstacles.forEach(obstacle => {

        obstacle.x += obstacle.vx * deltaTime;
        obstacle.y += obstacle.vy * deltaTime;

        obstacle.rotation +=
            obstacle.rotationSpeed * deltaTime;

    });


    obstacles = obstacles.filter(obstacle => {

        return (
            obstacle.x > -100 &&
            obstacle.x < width + 100 &&
            obstacle.y > -100 &&
            obstacle.y < height + 100
        );

    });

}


/* =========================================================
   COLLISION DETECTION
   ========================================================= */

function checkCollisions() {

    /* Fragment collision */

    for (let i = fragments.length - 1; i >= 0; i--) {

        const fragment = fragments[i];

        const distance = Math.hypot(
            player.x - fragment.x,
            player.y - fragment.y
        );


        if (distance < 22) {

            if (fragment.fake) {

                damagePlayer(10);

                createExplosion(
                    fragment.x,
                    fragment.y,
                    "#ff5263"
                );

            } else {

                score += 100 * level;

                fragmentsCollected++;

                createExplosion(
                    fragment.x,
                    fragment.y,
                    "#54e8ff"
                );

            }

            fragments.splice(i, 1);

        }

    }


    /* Obstacle collision */

    for (let i = obstacles.length - 1; i >= 0; i--) {

        const obstacle = obstacles[i];

        const distance = Math.hypot(
            player.x - obstacle.x,
            player.y - obstacle.y
        );


        if (distance < obstacle.size + 12) {

            damagePlayer(18);

            createExplosion(
                player.x,
                player.y,
                "#ff5263"
            );

            obstacles.splice(i, 1);

        }

    }

}


/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(amount) {

    integrity -= amount;

    integrity = Math.max(0, integrity);

    createScreenGlitch();


    if (integrity <= 0) {

        endGame();

    }

}


/* =========================================================
   LEVEL SYSTEM
   ========================================================= */

function updateLevel() {

    const newLevel =
        Math.floor(score / 1200) + 1;


    if (newLevel > level) {

        level = newLevel;

        createLevelBurst();

    }

}


/* =========================================================
   PARTICLES
   ========================================================= */

function createExplosion(x, y, color) {

    for (let i = 0; i < 14; i++) {

        const angle =
            Math.random() * Math.PI * 2;

        const speed =
            40 + Math.random() * 140;

        particles.push({

            x: x,
            y: y,

            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,

            life: 1,

            size: 1 + Math.random() * 3,

            color: color

        });

    }

}


function updateParticles(deltaTime) {

    particles.forEach(particle => {

        particle.x +=
            particle.vx * deltaTime;

        particle.y +=
            particle.vy * deltaTime;

        particle.life -=
            deltaTime * 1.8;

        particle.vx *= 0.97;
        particle.vy *= 0.97;

    });


    particles = particles.filter(
        particle => particle.life > 0
    );

}


/* =========================================================
   STARS / BACKGROUND
   ========================================================= */

function createStars() {

    stars = [];

    const count = Math.floor(
        (width * height) / 9000
    );


    for (let i = 0; i < count; i++) {

        stars.push({

            x: Math.random() * width,
            y: Math.random() * height,

            size: Math.random() * 1.4 + 0.3,

            speed:
                Math.random() * 18 + 5,

            alpha:
                Math.random() * 0.5 + 0.2

        });

    }

}


function updateStars(deltaTime) {

    stars.forEach(star => {

        star.y += star.speed * deltaTime;

        if (star.y > height) {

            star.y = 0;
            star.x = Math.random() * width;

        }

    });

}


/* =========================================================
   GLITCH SYSTEM
   ========================================================= */

function updateGlitches(deltaTime) {

    glitchTimer += deltaTime;


    const nextGlitch =
        Math.max(
            3.5,
            7 - level * 0.25
        );


    if (
        glitchTimer > nextGlitch &&
        glitchDuration <= 0
    ) {

        glitchTimer = 0;

        triggerGlitch();

    }


    if (glitchDuration > 0) {

        glitchDuration -= deltaTime;

        createGlitchLines();

        if (glitchDuration <= 0) {

            controlsReversed = false;

            glitchWarning.classList.remove(
                "active"
            );

            gameContainer.classList.remove(
                "glitching"
            );

        }

    }

}


/* =========================================================
   TRIGGER GLITCH
   ========================================================= */

function triggerGlitch() {

    glitchDuration =
        1.5 + Math.random() * 1.5;


    controlsReversed =
        Math.random() < 0.65;


    glitchWarning.classList.add("active");

    gameContainer.classList.add("glitching");

}


/* =========================================================
   SCREEN GLITCH
   ========================================================= */

function createScreenGlitch() {

    glitchDuration =
        Math.max(glitchDuration, 0.7);

    gameContainer.classList.add("glitching");

}


/* =========================================================
   GLITCH LINES
   ========================================================= */

function createGlitchLines() {

    if (Math.random() < 0.4) {

        glitchLines.push({

            y: Math.random() * height,

            height:
                Math.random() * 8 + 2,

            life: 0.25

        });

    }


    glitchLines.forEach(line => {

        line.life -= 0.03;

    });


    glitchLines =
        glitchLines.filter(
            line => line.life > 0
        );

}


/* =========================================================
   LEVEL BURST
   ========================================================= */

function createLevelBurst() {

    for (let i = 0; i < 35; i++) {

        const angle =
            Math.random() * Math.PI * 2;

        const speed =
            60 + Math.random() * 180;

        particles.push({

            x: player.x,
            y: player.y,

            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,

            life: 1,

            size: Math.random() * 3 + 1,

            color:
                Math.random() > 0.5
                    ? "#54e8ff"
                    : "#9d7cff"

        });

    }

}


/* =========================================================
   DRAW EVERYTHING
   ========================================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    drawBackground();

    drawGrid();

    drawStars();

    drawFragments();

    drawObstacles();

    drawParticles();

    drawPlayer();

    drawGlitchLines();

    drawVignette();

}


/* =========================================================
   BACKGROUND
   ========================================================= */

function drawBackground() {

    const gradient =
        ctx.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            width
        );


    gradient.addColorStop(
        0,
        "#09111d"
    );

    gradient.addColorStop(
        1,
        "#020409"
    );


    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =========================================================
   GRID
   ========================================================= */

function drawGrid() {

    const gridSize = 55;

    ctx.lineWidth = 1;

    ctx.strokeStyle =
        "rgba(84, 232, 255, 0.035)";


    for (
        let x = 0;
        x < width;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);

        ctx.stroke();

    }


    for (
        let y = 0;
        y < height;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(width, y);

        ctx.stroke();

    }

}


/* =========================================================
   STARS
   ========================================================= */

function drawStars() {

    stars.forEach(star => {

        ctx.globalAlpha = star.alpha;

        ctx.fillStyle = "#b8c6da";

        ctx.fillRect(
            star.x,
            star.y,
            star.size,
            star.size
        );

    });

    ctx.globalAlpha = 1;

}


/* =========================================================
   FRAGMENTS
   ========================================================= */

function drawFragments() {

    fragments.forEach(fragment => {

        ctx.save();

        ctx.translate(
            fragment.x,
            fragment.y
        );

        ctx.rotate(
            fragment.rotation
        );


        const pulse =
            1 +
            Math.sin(fragment.pulse) *
            0.15;


        ctx.scale(
            pulse,
            pulse
        );


        const color =
            fragment.fake
                ? "#ff5263"
                : "#54e8ff";


        ctx.strokeStyle = color;

        ctx.lineWidth = 2;


        ctx.beginPath();

        ctx.moveTo(
            0,
            -fragment.size
        );

        ctx.lineTo(
            fragment.size,
            0
        );

        ctx.lineTo(
            0,
            fragment.size
        );

        ctx.lineTo(
            -fragment.size,
            0
        );

        ctx.closePath();

        ctx.stroke();


        ctx.fillStyle =
            fragment.fake
                ? "rgba(255,82,99,0.12)"
                : "rgba(84,232,255,0.12)";

        ctx.fill();


        ctx.restore();

    });

}


/* =========================================================
   OBSTACLES
=============================================== */

function drawObstacles() {

    obstacles.forEach(obstacle => {

        ctx.save();

        ctx.translate(
            obstacle.x,
            obstacle.y
        );

        ctx.rotate(
            obstacle.rotation
        );


        ctx.strokeStyle =
            "#ff5263";

        ctx.lineWidth = 2;


        ctx.beginPath();

        ctx.moveTo(
            -obstacle.size,
            -obstacle.size
        );

        ctx.lineTo(
            obstacle.size,
            obstacle.size
        );

        ctx.moveTo(
            obstacle.size,
            -obstacle.size
        );

        ctx.lineTo(
            -obstacle.size,
            obstacle.size
        );

        ctx.stroke();


        ctx.strokeStyle =
            "rgba(255,82,99,0.35)";

        ctx.strokeRect(
            -obstacle.size / 2,
            -obstacle.size / 2,
            obstacle.size,
            obstacle.size
        );


        ctx.restore();

    });

}


/* =========================================================
   PARTICLES
=============================================== */

function drawParticles() {

    particles.forEach(particle => {

        ctx.globalAlpha =
            Math.max(0, particle.life);

        ctx.fillStyle =
            particle.color;


        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    });

    ctx.globalAlpha = 1;

}


/* =========================================================
   PLAYER
=============================================== */

function drawPlayer() {

    /* Trail */

    player.trail.forEach(point => {

        ctx.globalAlpha =
            point.life * 0.35;

        ctx.fillStyle =
            "#54e8ff";


        ctx.fillRect(
            point.x - 2,
            point.y - 2,
            4,
            4
        );

    });

    ctx.globalAlpha = 1;


    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );


    /* Outer diamond */

    ctx.strokeStyle =
        "#54e8ff";

    ctx.lineWidth = 2;


    ctx.beginPath();

    ctx.moveTo(0, -13);
    ctx.lineTo(13, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-13, 0);

    ctx.closePath();

    ctx.stroke();


    /* Inner core */

    ctx.fillStyle =
        "#e8edf7";

    ctx.beginPath();

    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-6, 0);

    ctx.closePath();

    ctx.fill();


    /* Direction indicator */

    ctx.strokeStyle =
        "#9d7cff";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(0, -17);
    ctx.lineTo(0, -22);

    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   GLITCH LINES
=============================================== */

function drawGlitchLines() {

    glitchLines.forEach(line => {

        ctx.globalAlpha =
            Math.max(0, line.life);

        ctx.fillStyle =
            Math.random() > 0.5
                ? "#54e8ff"
                : "#ff5263";


        ctx.fillRect(
            Math.random() * width * 0.7,
            line.y,
            Math.random() * width * 0.3,
            line.height
        );

    });

    ctx.globalAlpha = 1;

}


/* =========================================================
   VIGNETTE
=============================================== */

function drawVignette() {

    const gradient =
        ctx.createRadialGradient(
            width / 2,
            height / 2,
            height * 0.2,
            width / 2,
            height / 2,
            width * 0.7
        );


    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.65)"
    );


    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =========================================================
   HUD
=============================================== */

function updateHUD() {

    scoreElement.textContent =
        String(score).padStart(6, "0");


    levelElement.textContent =
        String(level).padStart(2, "0");


    integrityFill.style.width =
        `${integrity}%`;


    if (integrity > 60) {

        integrityFill.style.background =
            "#54e8ff";

    } else if (integrity > 30) {

        integrityFill.style.background =
            "#ff9d57";

    } else {

        integrityFill.style.background =
            "#ff5263";

    }

}


/* =========================================================
   FPS COUNTER
=============================================== */

let fpsFrames = 0;
let fpsTime = 0;

function updateFPS(deltaTime) {

    fpsFrames++;
    fpsTime += deltaTime;

    if (fpsTime >= 0.5) {

        const fps =
            Math.round(
                fpsFrames / fpsTime
            );

        fpsCounter.textContent =
            `${fps} FPS`;

        fpsFrames = 0;
        fpsTime = 0;

    }

}


/* =========================================================
   PAUSE
=============================================== */

function togglePause() {

    paused = !paused;

    if (paused) {

        pauseScreen.classList.remove(
            "hidden"
        );

    } else {

        pauseScreen.classList.add(
            "hidden"
        );

        lastTime = performance.now();

    }

}


/* =========================================================
   GAME OVER
=============================================== */

function endGame() {

    gameRunning = false;

    gameContainer.classList.remove(
        "glitching"
    );

    glitchWarning.classList.remove(
        "active"
    );


    finalScore.textContent =
        String(score).padStart(6, "0");


    finalLevel.textContent =
        String(level).padStart(2, "0");


    finalFragments.textContent =
        String(fragmentsCollected).padStart(
            2,
            "0"
        );


    gameOverScreen.classList.remove(
        "hidden"
    );

}


/* =========================================================
   BUTTON EVENTS
=============================================== */

startButton.addEventListener(
    "click",
    startGame
);


restartButton.addEventListener(
    "click",
    startGame
);


/* =========================================================
   FPS WRAPPER
   This runs alongside the main animation system.
=============================================== */

function performanceLoop(timestamp) {

    if (lastPerformanceTime === 0) {
        lastPerformanceTime = timestamp;
    }

    const delta =
        (timestamp - lastPerformanceTime) /
        1000;

    lastPerformanceTime = timestamp;

    updateFPS(
        Math.min(delta, 0.1)
    );

    requestAnimationFrame(
        performanceLoop
    );

}

let lastPerformanceTime = 0;

requestAnimationFrame(
    performanceLoop
);


/* =========================================================
   INITIAL DRAW
=============================================== */

createStars();

draw();