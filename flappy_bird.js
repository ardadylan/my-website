class Cloud {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = canvas.width + Math.random() * 100;
        this.y = Math.random() * 150 + 50;
        this.speed = Math.random() * 1 + 0.5;
        this.size = Math.random() * 30 + 30;
    }

    update() {
        this.x -= this.speed;
        return this.x < -this.size;
    }

    draw() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        this.ctx.arc(this.x - this.size/3, this.y, this.size/3, 0, Math.PI * 2);
        this.ctx.arc(this.x + this.size/3, this.y, this.size/3, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

class Bird {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = canvas.width / 3;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.radius = 15;
        this.angle = 0;
        this.targetAngle = 0;
    }

    flap() {
        this.velocity = -5;
        this.targetAngle = 45;
    }

    update() {
        this.velocity += 0.2;
        this.y += this.velocity;
        
        this.targetAngle = Math.max(-45, Math.min(45, this.velocity * 5));
        const angleDiff = this.targetAngle - this.angle;
        this.angle += angleDiff * 0.1;
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(-this.angle * Math.PI / 180);
        
        // Bird body
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(5, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(20, 0);
        this.ctx.lineTo(10, 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

class Pipe {
    constructor(canvas, ctx, x, pipeCount) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = x;
        this.width = 50;
        this.gap = 150;
        
        // Make first three pipes easier by placing gaps near the middle
        if (pipeCount < 3) {
            // Center of the canvas +/- small random offset
            const centerY = canvas.height / 2;
            const offset = Math.random() * 60 - 30; // Random offset between -30 and +30
            this.height = centerY - (this.gap / 2) + offset;
        } else {
            // Normal random height for subsequent pipes
            this.height = Math.random() * (canvas.height - 300) + 150;
        }
        
        this.scored = false;
    }

    update() {
        this.x -= 3;
    }

    draw() {
        this.ctx.fillStyle = '#22B14C';
        
        // Top pipe
        this.ctx.fillRect(this.x, 0, this.width, this.height);
        this.ctx.fillRect(this.x - 5, this.height - 20, this.width + 10, 20);
        
        // Bottom pipe
        const bottomHeight = this.canvas.height - (this.height + this.gap);
        this.ctx.fillRect(this.x, this.height + this.gap, this.width, bottomHeight);
        this.ctx.fillRect(this.x - 5, this.height + this.gap, this.width + 10, 20);
    }

    collidesWith(bird) {
        const birdBounds = bird.getBounds();
        return (
            (birdBounds.x + birdBounds.width > this.x &&
             birdBounds.x < this.x + this.width) &&
            (birdBounds.y < this.height ||
             birdBounds.y + birdBounds.height > this.height + this.gap)
        );
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        this.bird = new Bird(this.canvas, this.ctx);
        this.pipes = [];
        this.clouds = Array(5).fill().map(() => new Cloud(this.canvas, this.ctx));
        this.score = 0;
        this.highScore = 0;
        this.lastPipeTime = 0;
        this.gameActive = false;
        this.pipeCount = 0;
        
        this.bindEvents();
        this.showStartScreen();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameActive) {
                    this.bird.flap();
                } else {
                    this.startGame();
                }
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.gameActive) {
                this.bird.flap();
            } else {
                this.startGame();
            }
        });
    }

    startGame() {
        this.bird = new Bird(this.canvas, this.ctx);
        this.pipes = [];
        this.clouds = Array(5).fill().map(() => new Cloud(this.canvas, this.ctx));
        this.score = 0;
        this.lastPipeTime = 0;
        this.gameActive = true;
        this.pipeCount = 0;
        this.gameLoop();
    }

    showStartScreen() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Flappy Bird', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Click or Press Space to Start', this.canvas.width/2, this.canvas.height/2 + 20);
        
        if (this.highScore > 0) {
            this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width/2, this.canvas.height/2 + 60);
        }
    }

    gameLoop() {
        if (!this.gameActive) return;

        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw clouds
        this.clouds = this.clouds.filter(cloud => !cloud.update());
        while (this.clouds.length < 5) {
            this.clouds.push(new Cloud(this.canvas, this.ctx));
        }
        this.clouds.forEach(cloud => cloud.draw());

        // Generate new pipes
        if (Date.now() - this.lastPipeTime > 1500) {
            this.pipes.push(new Pipe(this.canvas, this.ctx, this.canvas.width, this.pipeCount));
            this.lastPipeTime = Date.now();
            this.pipeCount++;
        }

        // Update and draw pipes
        this.pipes = this.pipes.filter(pipe => {
            pipe.update();
            if (pipe.x + pipe.width < 0) return false;
            
            if (!pipe.scored && pipe.x < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.highScore = Math.max(this.highScore, this.score);
            }
            
            pipe.draw();
            return true;
        });

        // Update and draw bird
        this.bird.update();
        this.bird.draw();

        // Draw score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score.toString(), this.canvas.width/2, 50);

        // Check collisions
        if (this.bird.y < 0 || this.bird.y + this.bird.radius > this.canvas.height ||
            this.pipes.some(pipe => pipe.collidesWith(this.bird))) {
            this.gameActive = false;
            this.showStartScreen();
            return;
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
