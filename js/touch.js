/**
 * Touch Handler Module
 * Manages touch/drag interactions for the animal throwing mechanic
 */

class TouchHandler {
    constructor(callbacks = {}) {
        this.callbacks = callbacks;
        this.isDragging = false;
        this.currentElement = null;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastPos = { x: 0, y: 0 };
        this.lastTime = 0;
        this.velocityHistory = [];

        this.bindEvents();
    }

    bindEvents() {
        // Touch events
        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });

        // Mouse events for desktop testing
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    // Get the animal element from the touch/click target
    getAnimalElement(target) {
        if (target.classList.contains('animal')) {
            return target;
        }
        return target.closest('.animal');
    }

    onTouchStart(e) {
        const touch = e.touches[0];
        const animalElement = this.getAnimalElement(touch.target);

        if (!animalElement || animalElement.classList.contains('flying')) {
            return;
        }

        e.preventDefault();
        this.startDrag(animalElement, touch.clientX, touch.clientY);
    }

    onTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        this.updateDrag(touch.clientX, touch.clientY);
    }

    onTouchEnd(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.endDrag();
    }

    onMouseDown(e) {
        const animalElement = this.getAnimalElement(e.target);

        if (!animalElement || animalElement.classList.contains('flying')) {
            return;
        }

        e.preventDefault();
        this.startDrag(animalElement, e.clientX, e.clientY);
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.updateDrag(e.clientX, e.clientY);
    }

    onMouseUp(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.endDrag();
    }

    startDrag(element, x, y) {
        this.isDragging = true;
        this.currentElement = element;
        this.startPos = { x, y };
        this.currentPos = { x, y };
        this.lastPos = { x, y };
        this.lastTime = performance.now();
        this.velocityHistory = [];
        this.velocity = { x: 0, y: 0 };

        // Get the element's current position
        const rect = element.getBoundingClientRect();
        this.elementOffset = {
            x: x - rect.left - rect.width / 2,
            y: y - rect.top - rect.height / 2
        };

        // Add dragging class
        element.classList.add('dragging');
        element.classList.remove('wobble');

        // Position element at touch point
        this.positionElement(x, y);

        // Call callback
        if (this.callbacks.onDragStart) {
            this.callbacks.onDragStart(element, { x, y });
        }
    }

    updateDrag(x, y) {
        const now = performance.now();
        const dt = now - this.lastTime;

        this.currentPos = { x, y };

        // Calculate velocity with smoothing
        if (dt > 0) {
            const instantVelocity = {
                x: (x - this.lastPos.x) / dt,
                y: (y - this.lastPos.y) / dt
            };

            // Keep a short history for smoothing
            this.velocityHistory.push(instantVelocity);
            if (this.velocityHistory.length > 5) {
                this.velocityHistory.shift();
            }

            // Average the velocity history
            this.velocity = this.velocityHistory.reduce(
                (acc, v) => ({
                    x: acc.x + v.x / this.velocityHistory.length,
                    y: acc.y + v.y / this.velocityHistory.length
                }),
                { x: 0, y: 0 }
            );
        }

        this.lastPos = { x, y };
        this.lastTime = now;

        // Update element position
        this.positionElement(x, y);

        // Call callback
        if (this.callbacks.onDragMove) {
            this.callbacks.onDragMove(this.currentElement, this.currentPos, this.velocity);
        }
    }

    positionElement(x, y) {
        if (!this.currentElement) return;

        const rect = this.currentElement.getBoundingClientRect();
        const centerX = x - rect.width / 2;
        const centerY = y - rect.height / 2;

        this.currentElement.style.left = `${centerX}px`;
        this.currentElement.style.top = `${centerY}px`;
    }

    endDrag() {
        if (!this.currentElement) return;

        const element = this.currentElement;
        const endPos = { ...this.currentPos };
        const velocity = { ...this.velocity };

        // Remove dragging class
        element.classList.remove('dragging');

        // Reset state
        this.isDragging = false;
        this.currentElement = null;

        // Call callback with final position and velocity
        if (this.callbacks.onDragEnd) {
            this.callbacks.onDragEnd(element, endPos, velocity);
        }
    }

    // Calculate if the throw is heading toward the bucket
    isThrowingTowardBucket(endPos, velocity, bucketRect) {
        // Get the center of the bucket
        const bucketCenter = {
            x: bucketRect.left + bucketRect.width / 2,
            y: bucketRect.top + bucketRect.height / 2
        };

        // Calculate direction to bucket
        const directionToBucket = {
            x: bucketCenter.x - endPos.x,
            y: bucketCenter.y - endPos.y
        };

        // Normalize directions
        const velocityMag = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const dirMag = Math.sqrt(directionToBucket.x * directionToBucket.x + directionToBucket.y * directionToBucket.y);

        if (velocityMag < 0.3) {
            // Not thrown fast enough - treat as a drop
            return false;
        }

        // Calculate dot product to see if velocity is roughly toward bucket
        const dot = (velocity.x * directionToBucket.x + velocity.y * directionToBucket.y) / (velocityMag * dirMag);

        // Allow some tolerance (cos of ~60 degrees)
        return dot > 0.3;
    }
}
