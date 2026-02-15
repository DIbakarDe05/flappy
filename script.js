/**
 * Flappy Bird Web Game
 * 
 * Core Game Logic and Loop
 */

class Bird {
    constructor(game) {
        this.game = game;
        this.x = this.game.width * 0.2; // Positioned at 20% width
        this.y = this.game.height / 2;
        this.radius = 20;
        this.velocity = 0;
        this.gravity = 0.25;
        // Animation
        this.frameTimer = 0;
        this.frameInterval = 100; // ms
        this.animationSequence = [0, 1, 0, 2]; // Central, Up, Central, Down
        this.currentSequenceIndex = 0;
        this.jumpStrength = -5.5;
        this.rotation = 0;

        // For bobbing animation
        this.baseY = this.y;
        this.bobTimer = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotation based on velocity
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
        ctx.rotate(this.rotation);

        // Always use Central image
        const currentImageIndex = 0;
        const img = this.game.assets.birdImages[currentImageIndex];

        if (img && img.complete && img.naturalWidth > 0) {
            // Draw custom image
            // Draw centered
            ctx.drawImage(img, -this.radius * 2, -this.radius * 1.5, this.radius * 4, this.radius * 3);
        } else {
            // Fallback: Draw Geometric Bird
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(this.radius / 2, -this.radius / 2, this.radius / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(this.radius / 2 + 2, -this.radius / 2, this.radius / 8, 0, Math.PI * 2);
            ctx.fill();

            // Beak
            ctx.fillStyle = "#FF6B6B";
            ctx.beginPath();
            ctx.moveTo(this.radius / 2, 0);
            ctx.lineTo(this.radius + 10, 5);
            ctx.lineTo(this.radius / 2, 10);
            ctx.fill();
        }
        ctx.restore();
    }

    drawIdle(ctx, deltaTime) {
        ctx.save();

        // Bobbing math
        this.bobTimer += deltaTime * 0.005;
        this.y = this.baseY + Math.sin(this.bobTimer) * 10;

        // No animation update needed for single image
        // this.updateAnimation(deltaTime);

        ctx.translate(this.x, this.y);

        const currentImageIndex = 0; // Always Central
        const img = this.game.assets.birdImages[currentImageIndex];

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -this.radius * 2, -this.radius * 1.5, this.radius * 4, this.radius * 3);
        } else {
            // Fallback
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(this.radius / 2, -this.radius / 2, this.radius / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(this.radius / 2 + 2, -this.radius / 2, this.radius / 8, 0, Math.PI * 2);
            ctx.fill();

            // Beak
            ctx.fillStyle = "#FF6B6B";
            ctx.beginPath();
            ctx.moveTo(this.radius / 2, 0);
            ctx.lineTo(this.radius + 10, 5);
            ctx.lineTo(this.radius / 2, 10);
            ctx.fill();
        }
        ctx.restore();
    }

    update(deltaTime) {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // No need to update animation timer for gameplay as it is velocity based now
        // this.updateAnimation(deltaTime);

        // Floor collision
        if (this.y + this.radius >= this.game.height) {
            this.y = this.game.height - this.radius;
            this.game.gameOver();
        }

        // Ceiling collision (optional, but good for polish)
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    }

    updateAnimation(deltaTime) {
        if (!deltaTime) return;
        this.frameTimer += deltaTime;
        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            this.currentSequenceIndex++;
            if (this.currentSequenceIndex >= this.animationSequence.length) {
                this.currentSequenceIndex = 0;
            }
        }
    }

    jump() {
        this.velocity = this.jumpStrength;
        // Play jump sound
        this.game.playSound('jump');
    }
}

class Pipe {
    constructor(game, x) {
        this.game = game;
        this.x = x;
        this.width = 60;
        this.gap = 170; // Gap size
        this.speed = 2;
        this.passed = false;

        // Randomize gap position
        // Minimum pipe height
        const minHeight = 50;
        const availableSpace = this.game.height - this.gap - (minHeight * 2);
        const randomY = Math.random() * availableSpace;

        this.topHeight = minHeight + randomY;
        this.bottomY = this.topHeight + this.gap;
        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.fillStyle = "#2ECC71"; // Pipe Green

        // Top Pipe
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        // Pipe Cap (Top)
        ctx.fillStyle = "#27AE60";
        ctx.fillRect(this.x - 5, this.topHeight - 20, this.width + 10, 20);

        ctx.fillStyle = "#2ECC71";
        // Bottom Pipe
        ctx.fillRect(this.x, this.bottomY, this.width, this.game.height - this.bottomY);
        // Pipe Cap (Bottom)
        ctx.fillStyle = "#27AE60";
        ctx.fillRect(this.x - 5, this.bottomY, this.width + 10, 20);
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        // Handle High DPI displays
        this.dpr = window.devicePixelRatio || 1;

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.lastTime = 0;
        this.score = 0;
        this.bestScore = localStorage.getItem('flappy_best_score') || 0;
        document.getElementById('best-score').innerText = this.bestScore;

        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;

        // Assets
        this.assets = {
            birdImages: [], // changed to array
            audio: {
                jump: new Audio('assets/jump.mp3'),
                score: new Audio('assets/score.mp3'),
                gameover: new Audio('assets/gameover.mp3')
            }
        };

        // Load custom images: Central, Up, Down
        // We'll treat index 0 = Central, 1 = Up, 2 = Down
        const imageSources = ['assets/CENTRAL.png', 'assets/UPWARD.png', 'assets/DOWNWARD.png'];
        imageSources.forEach(src => {
            const img = new Image();
            img.src = src;
            this.assets.birdImages.push(img);
        });
        // Preload audios
        Object.values(this.assets.audio).forEach(audio => {
            audio.load();
            // Reset volume just in case
            audio.volume = 0.5;
        });

        this.pipes = [];
        this.pipeTimer = 0;
        this.pipeInterval = 2200; // ms

        this.bird = new Bird(this);

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Controls
        const handleInput = (e) => {
            if (e.type === 'keydown' && e.code !== 'Space') return;
            if (e.type === 'keydown') e.preventDefault(); // Prevent scrolling

            if (this.isRunning) {
                this.bird.jump();
            } else if (this.isGameOver) {
                // Ignore input on game over immediately? Or allow restart?
                // Restart is handled by button, but space detection could be nice too
            }
        };

        window.addEventListener('keydown', handleInput);
        this.canvas.addEventListener('mousedown', handleInput);
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent standard touch actions
            handleInput(e);
        }, { passive: false });

        document.getElementById('start-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent propagation to canvas
            this.start();
        });

        document.getElementById('restart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.restart();
        });

        // Pause/Resume
        document.getElementById('pause-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePause();
        });

        document.getElementById('resume-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePause();
        });
    }

    togglePause() {
        if (!this.isRunning || this.isGameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            document.getElementById('pause-screen').classList.remove('hidden');
            document.getElementById('pause-screen').classList.add('active');
            document.getElementById('pause-btn').classList.add('hidden'); // Optional: hide pause button while paused?
        } else {
            document.getElementById('pause-screen').classList.remove('active');
            document.getElementById('pause-screen').classList.add('hidden');
            document.getElementById('pause-btn').classList.remove('hidden');

            // Resume loop
            this.lastTime = performance.now();
            requestAnimationFrame(ts => this.loop(ts));
        }
    }

    resize() {
        // Get CSS size
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;

        // Scale context
        this.ctx.scale(this.dpr, this.dpr);

        this.width = rect.width;
        this.height = rect.height;

        if (!this.isRunning) {
            // Keep bird centered if not running
            this.bird.y = this.height / 2;
            this.bird.baseY = this.height / 2;
            this.drawWelcome(0);
        }
    }

    playSound(name) {
        const audio = this.assets.audio[name];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => {
                // Auto-play policy might block this until interaction
                // console.log("Audio play blocked", e);
            });
        }
    }

    start() {
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('pause-btn').classList.remove('hidden'); // Show pause btn
        document.getElementById('score-display').classList.remove('hidden');
        document.getElementById('score-display').innerText = 0;

        this.isRunning = true;
        this.isGameOver = false;
        this.score = 0;
        this.pipes = [];
        this.pipeTimer = 0;
        this.bird = new Bird(this);
        this.lastTime = performance.now();

        requestAnimationFrame(ts => this.loop(ts));
    }

    restart() {
        document.getElementById('game-over-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.add('hidden');
        this.start();
    }

    gameOver() {
        if (this.isGameOver) return; // Prevent double trigger
        this.isRunning = false;
        this.isGameOver = true;
        this.playSound('gameover');

        document.getElementById('pause-btn').classList.add('hidden');

        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('active');
        document.getElementById('score-display').classList.add('hidden');

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappy_best_score', this.bestScore);
        }

        document.getElementById('final-score').innerText = this.score;
        document.getElementById('best-score').innerText = this.bestScore;
    }

    update(deltaTime) {
        this.bird.update(deltaTime);

        // Pipe Management
        this.pipeTimer += deltaTime;
        if (this.pipeTimer > this.pipeInterval) {
            this.pipes.push(new Pipe(this, this.width));
            this.pipeTimer = 0;
        }

        this.pipes.forEach(pipe => {
            pipe.update();

            // Checking Collision
            // 1. Horizontal overlap
            if (
                this.bird.x + this.bird.radius > pipe.x &&
                this.bird.x - this.bird.radius < pipe.x + pipe.width
            ) {
                // 2. Vertical check (Top pipe or Bottom pipe)
                if (
                    (this.bird.y - this.bird.radius < pipe.topHeight) ||
                    (this.bird.y + this.bird.radius > pipe.bottomY)
                ) {
                    this.gameOver();
                }
            }

            // Scoring
            if (!pipe.passed && this.bird.x > pipe.x + pipe.width) {
                this.score++;
                pipe.passed = true;
                document.getElementById('score-display').innerText = this.score;
                this.playSound('score');
            }
        });

        // Filter pipes
        this.pipes = this.pipes.filter(pipe => !pipe.markedForDeletion);
    }

    draw() {
        // Clear
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Background (Simple gradient handling in CSS + clearRect is transparent, so we need to fill if we want to draw on canvas or let CSS show through)
        // Since CSS has the gradient, we can let it show through by clearing, OR draw game elements on top.
        // Let's NOT fillRect background so CSS gradient is visible.

        // Draw Pipes
        this.pipes.forEach(pipe => pipe.draw(this.ctx));

        // Draw Bird
        this.bird.draw(this.ctx);
    }

    drawWelcome(deltaTime) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.bird.drawIdle(this.ctx, deltaTime);
    }

    loop(timestamp) {
        // If paused, do nothing but maybe request next frame to stay alive if needed, 
        // but typically we stop requesting loops. 
        // We will restart loop on resume.
        if (this.isPaused) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.isRunning) {
            this.update(deltaTime);
            this.draw();
            requestAnimationFrame(ts => this.loop(ts));
        } else if (!this.isGameOver) {
            // Idle state on welcome screen
            this.drawWelcome(deltaTime);
            requestAnimationFrame(ts => this.loop(ts));
        }
    }
}

// Initialize
window.addEventListener('load', () => {
    const game = new Game();
    // Start the idle loop
    requestAnimationFrame(ts => game.loop(ts));
});
