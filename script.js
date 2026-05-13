const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiElement = document.getElementById('ui');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const startBestScore = document.getElementById('startBestScore');
const playBtn = document.getElementById('playBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const gameOverTitle = document.getElementById('gameOverTitle');

let score = 0;
let lives = 5;
let highScore = localStorage.getItem('bubbleSmasherBest') || 0;
let isGameOver = false;
let gameStarted = false;
let bubbles = [];
let particles = [];
let width, height;
let spawnTimer = 0;

highScoreElement.textContent = highScore;
startBestScore.textContent = highScore;

playBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    uiElement.style.display = 'flex';
    resetGame();
    gameStarted = true;
});

// Colors for bubbles
const bubbleColors = [
    'rgba(0, 183, 175, 0.6)', // Primary teal
    'rgba(255, 107, 107, 0.6)', // Reddish
    'rgba(77, 201, 255, 0.6)', // Light blue
    'rgba(255, 217, 61, 0.6)'  // Yellowish
];

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Bubble {
    constructor() {
        this.isBonus = Math.random() < 0.1; // 10% chance to be a bonus bubble

        const speedMultiplier = 1 + (score / 500);

        if (this.isBonus) {
            this.radius = Math.random() * 20 + 15; // 15 to 35 (slightly smaller)
            this.speedY = -(Math.random() * 3 + 2) * speedMultiplier; // Faster upward speed
            this.color = 'rgba(255, 215, 0, 0.8)'; // Gold color for bonus
        } else {
            this.radius = Math.random() * 30 + 20; // 20 to 50
            this.speedY = -(Math.random() * 2 + 1) * speedMultiplier; // Normal upward speed
            this.color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
        }

        this.x = Math.random() * (width - this.radius * 2) + this.radius;
        this.y = height + this.radius;
        this.speedX = (Math.random() - 0.5) * 1; // Slight horizontal drift
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
    }

    update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * this.wobbleSpeed + this.wobbleOffset) * 2;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Highlights for 3D bubble effect
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        if (this.isBonus) {
            // Draw a glowing core for bonus bubbles
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();
        }

        ctx.lineWidth = this.isBonus ? 3 : 2;
        ctx.strokeStyle = this.isBonus ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.8)';
        ctx.stroke();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 5 + 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function gameOver() {
    isGameOver = true;
    gameStarted = false;
    finalScoreElement.textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('bubbleSmasherBest', highScore);
        highScoreElement.textContent = highScore;
        startBestScore.textContent = highScore;
        gameOverTitle.textContent = "New Best Score!";
        gameOverTitle.style.color = "#ffd93d";
    } else {
        gameOverTitle.textContent = "Game Over";
        gameOverTitle.style.color = "#ff6b6b";
    }

    gameOverScreen.style.display = "flex";
    uiElement.style.display = "none";
}

function resetGame() {
    score = 0;
    lives = 5;
    bubbles = [];
    particles = [];
    spawnTimer = 0;
    isGameOver = false;
    gameStarted = true;

    scoreElement.textContent = score;
    livesElement.textContent = lives;
    gameOverScreen.style.display = "none";
    uiElement.style.display = "flex";
}

function handleInput(x, y) {
    if (!gameStarted) return;

    if (isGameOver) {
        resetGame();
        return;
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(x - b.x, y - b.y);

        if (dist <= b.radius) {
            // Smash!
            for (let p = 0; p < 8; p++) {
                particles.push(new Particle(b.x, b.y, b.color));
            }
            bubbles.splice(i, 1);

            if (b.isBonus) {
                score += 100; // 10x points for bonus bubble
            } else {
                score += 10;
            }

            scoreElement.textContent = score;
            // Only smash one bubble per click/tap
            break;
        }
    }
}

canvas.addEventListener('mousedown', (e) => handleInput(e.clientX, e.clientY));
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    for (let i = 0; i < e.changedTouches.length; i++) {
        handleInput(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
    }
}, { passive: false });

function animate(time) {
    ctx.clearRect(0, 0, width, height);

    if (gameStarted) {
        // Spawn bubbles
        if (!isGameOver) {
            spawnTimer++;
            // Spawn faster as score increases, cap at a minimum interval
            const spawnRate = Math.max(20, 60 - Math.floor(score / 50));
            if (spawnTimer >= spawnRate) {
                bubbles.push(new Bubble());
                spawnTimer = 0;
            }
        }

        // Update and draw bubbles
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const b = bubbles[i];
            b.update();
            b.draw();

            // Remove if off screen top
            if (b.y + b.radius < 0) {
                bubbles.splice(i, 1);
                if (!isGameOver && !b.isBonus) {
                    lives--;
                    livesElement.textContent = lives;
                    if (lives <= 0) {
                        gameOver();
                    }
                }
            }
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();

            if (p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }
    } else {
        // Just draw a few passive background bubbles for the start screen
        if (bubbles.length < 5) {
            if (Math.random() < 0.05) bubbles.push(new Bubble());
        }
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const b = bubbles[i];
            b.update();
            b.draw();
            if (b.y + b.radius < 0) bubbles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);