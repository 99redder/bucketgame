/**
 * Animations Module
 * Handles throw animations and celebration effects
 */

// Throw Animation Class
class ThrowAnimation {
    constructor(element, startPos, endPos, onComplete) {
        this.element = element;
        this.startPos = startPos;
        this.endPos = endPos;
        this.onComplete = onComplete;
        this.startTime = null;
        this.duration = this.calculateDuration();
        this.arcHeight = this.calculateArcHeight();
    }

    calculateDuration() {
        const distance = Math.hypot(
            this.endPos.x - this.startPos.x,
            this.endPos.y - this.startPos.y
        );
        // Duration between 400ms and 800ms based on distance
        return Math.min(Math.max(distance * 0.8, 400), 800);
    }

    calculateArcHeight() {
        const distance = Math.hypot(
            this.endPos.x - this.startPos.x,
            this.endPos.y - this.startPos.y
        );
        // Arc height proportional to distance
        return Math.min(distance * 0.4, 200);
    }

    // Easing function - ease out quad
    easeOutQuad(t) {
        return t * (2 - t);
    }

    // Easing for the arc - smooth parabola
    arcEasing(t) {
        // Sine wave creates a nice arc (up then down)
        return Math.sin(t * Math.PI);
    }

    animate(timestamp) {
        if (!this.startTime) {
            this.startTime = timestamp;
            this.element.classList.add('flying');
        }

        const elapsed = timestamp - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const easedProgress = this.easeOutQuad(progress);

        // Calculate X position (linear with easing)
        const x = this.startPos.x + (this.endPos.x - this.startPos.x) * easedProgress;

        // Calculate Y position with arc
        const baseY = this.startPos.y + (this.endPos.y - this.startPos.y) * easedProgress;
        const arcOffset = -this.arcHeight * this.arcEasing(progress);
        const y = baseY + arcOffset;

        // Calculate rotation (spin during flight)
        const rotation = progress * 360;

        // Calculate scale (slightly smaller at peak)
        const scale = 1 - 0.1 * this.arcEasing(progress);

        // Apply transform
        const rect = this.element.getBoundingClientRect();
        this.element.style.left = `${x - rect.width / 2}px`;
        this.element.style.top = `${y - rect.height / 2}px`;
        this.element.style.transform = `rotate(${rotation}deg) scale(${scale})`;

        if (progress < 1) {
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.complete();
        }
    }

    complete() {
        this.element.classList.remove('flying');
        if (this.onComplete) {
            this.onComplete();
        }
    }

    start() {
        requestAnimationFrame(this.animate.bind(this));
    }
}

// Return to pile animation (when throw misses)
class ReturnAnimation {
    constructor(element, startPos, endPos, onComplete) {
        this.element = element;
        this.startPos = startPos;
        this.endPos = endPos;
        this.onComplete = onComplete;
        this.startTime = null;
        this.duration = 400;
    }

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    animate(timestamp) {
        if (!this.startTime) {
            this.startTime = timestamp;
        }

        const elapsed = timestamp - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const easedProgress = this.easeOutBack(progress);

        const x = this.startPos.x + (this.endPos.x - this.startPos.x) * easedProgress;
        const y = this.startPos.y + (this.endPos.y - this.startPos.y) * easedProgress;

        const rect = this.element.getBoundingClientRect();
        this.element.style.left = `${x - rect.width / 2}px`;
        this.element.style.top = `${y - rect.height / 2}px`;
        this.element.style.transform = '';

        if (progress < 1) {
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.complete();
        }
    }

    complete() {
        // Reset to normal positioning
        this.element.style.left = '';
        this.element.style.top = '';
        this.element.style.transform = '';
        this.element.classList.add('wobble');

        if (this.onComplete) {
            this.onComplete();
        }
    }

    start() {
        requestAnimationFrame(this.animate.bind(this));
    }
}

// Confetti Celebration Effect
class ConfettiEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;
        this.colors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#96CEB4', // Green
            '#FFEAA7', // Yellow
            '#DDA0DD', // Plum
            '#98D8C8', // Mint
            '#F7DC6F', // Gold
            '#BB8FCE', // Purple
            '#85C1E9'  // Light Blue
        ];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: -20 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * 3 + 2,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            size: Math.random() * 12 + 6,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15,
            shape: Math.random() > 0.5 ? 'rect' : 'circle'
        };
    }

    createBurst(count = 150) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.vx *= 0.99; // Air resistance
            p.rotation += p.rotationSpeed;
        });

        // Remove particles that fell off screen
        this.particles = this.particles.filter(p => p.y < this.canvas.height + 50);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    animate() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        if (this.particles.length > 0) {
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.isRunning = false;
        }
    }

    start() {
        this.resize();
        this.isRunning = true;
        this.createBurst(150);
        this.animate();

        // Add more bursts over time
        setTimeout(() => this.createBurst(50), 300);
        setTimeout(() => this.createBurst(50), 600);
    }

    stop() {
        this.isRunning = false;
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Bucket splash effect
function triggerBucketSplash() {
    const bucket = document.getElementById('bucket');
    bucket.classList.add('splash');
    setTimeout(() => {
        bucket.classList.remove('splash');
    }, 400);
}
