// trail.js - An improved, physics-based mouse trail effect with custom cursor
document.addEventListener('DOMContentLoaded', function() {
    if (matchMedia('(pointer: fine)').matches) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouseX = 0;
        let mouseY = 0;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let mouseDeltaX = 0;
        let mouseDeltaY = 0;
        const MAX_PARTICLES = 200; // Performance safeguard

        // Hide the default cursor
        document.body.style.cursor = 'none';

        // Set up canvas
        canvas.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999;';
        document.body.appendChild(canvas);

        // Create custom cursor dot
        const cursorDot = document.createElement('div');
        cursorDot.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: hsl(200, 90%, 65%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(cursorDot);

        function setCanvasSize() {
            // Scale for high DPI displays
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
            
            // Set CSS size to match actual dimensions
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        }
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        // Particle class - NOW WITH PHYSICS
        class Particle {
            constructor(x, y, deltaX, deltaY) {
                this.x = x;
                this.y = y;
                // Base size on mouse speed for a more dynamic effect
                const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const baseSize = Math.min(speed * 0.5, 5);
                this.size = Math.random() * baseSize + 1; // 1px to (baseSize + 1)px

                // Key Improvement 1: Velocity based on mouse movement + randomness
                this.speedX = (deltaX * 0.4) + (Math.random() * 2 - 1);
                this.speedY = (deltaY * 0.4) + (Math.random() * 2 - 1);

                this.color = `hsl(${Math.random() * 60 + 200}, 90%, 65%)`; // Cooler blues/cyans
                this.alpha = 1;
                // Key Improvement 2: Introduce a friction coefficient
                this.friction = 0.94; // 6% of velocity is lost per frame
            }
            update() {
                // Key Improvement 3: Apply friction to velocity
                this.speedX *= this.friction;
                this.speedY *= this.friction;

                // Update position based on velocity
                this.x += this.speedX;
                this.y += this.speedY;

                // Fade and shrink out
                this.alpha -= 0.012;
                if (this.alpha < 0) this.alpha = 0;
                this.size *= 0.97;
            }
            draw() {
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Animation loop
        function animate() {
            // Clear properly without obscuring content
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw custom cursor dot on canvas for consistent styling
            ctx.fillStyle = 'hsl(200, 90%, 65%)';
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Create new particles. Spawn rate based on mouse speed.
            if (particles.length < MAX_PARTICLES) {
                const speed = Math.sqrt(mouseDeltaX * mouseDeltaX + mouseDeltaY * mouseDeltaY);
                const spawnCount = Math.min(Math.floor(speed / 2), 5);
                
                for (let i = 0; i < spawnCount; i++) {
                    // Add a slight spawn offset for a wider trail
                    const offsetX = (Math.random() - 0.5) * 10;
                    const offsetY = (Math.random() - 0.5) * 10;
                    particles.push(new Particle(mouseX + offsetX, mouseY + offsetY, mouseDeltaX, mouseDeltaY));
                }
            }

            // Update and draw all particles
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                // Remove dead particles
                if (particles[i].alpha <= 0 || particles[i].size <= 0.2) {
                    particles.splice(i, 1);
                    i--;
                }
            }

            // Reset mouse delta after using it
            mouseDeltaX = 0;
            mouseDeltaY = 0;

            requestAnimationFrame(animate);
        }
        animate();

        // Track mouse movement
        document.addEventListener('mousemove', (event) => {
            // Key Improvement 4: Calculate mouse movement delta
            mouseX = event.clientX;
            mouseY = event.clientY;

            // Update custom cursor position
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;

            // This calculates the difference between the current and previous position
            if (prevMouseX !== 0 && prevMouseY !== 0) {
                mouseDeltaX = mouseX - prevMouseX;
                mouseDeltaY = mouseY - prevMouseY;
            }
            // Store the current position for the next mousemove event
            prevMouseX = mouseX;
            prevMouseY = mouseY;
        });

        // Ensure cursor is hidden when leaving window
        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            cursorDot.style.opacity = '1';
        });
    }
});