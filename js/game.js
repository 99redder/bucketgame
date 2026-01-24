/**
 * Game Logic Module
 * Manages game state, animals, and win conditions
 */

class Game {
    constructor(speechManager, clappingSound, splashSound) {
        this.speechManager = speechManager;
        this.clappingSound = clappingSound;
        this.splashSound = splashSound;

        // Animal data
        this.allAnimals = [
            { name: 'cat', displayName: 'Cat' },
            { name: 'dog', displayName: 'Dog' },
            { name: 'elephant', displayName: 'Elephant' },
            { name: 'lion', displayName: 'Lion' },
            { name: 'monkey', displayName: 'Monkey' },
            { name: 'pig', displayName: 'Pig' },
            { name: 'cow', displayName: 'Cow' },
            { name: 'duck', displayName: 'Duck' },
            { name: 'frog', displayName: 'Frog' },
            { name: 'horse', displayName: 'Horse' },
            { name: 'orca', displayName: 'Orca' },
            { name: 'chicken', displayName: 'Chicken' },
            { name: 'crocodile', displayName: 'Crocodile' },
            { name: 'panda', displayName: 'Panda' },
            { name: 'shark', displayName: 'Shark' },
            { name: 'polarbear', displayName: 'Polar Bear' },
            { name: 'giraffe', displayName: 'Giraffe' },
            { name: 'zebra', displayName: 'Zebra' },
            { name: 'penguin', displayName: 'Penguin' },
            { name: 'owl', displayName: 'Owl' },
            { name: 'rabbit', displayName: 'Rabbit' },
            { name: 'tiger', displayName: 'Tiger' },
            { name: 'turtle', displayName: 'Turtle' },
            { name: 'snake', displayName: 'Snake' },
            { name: 'dolphin', displayName: 'Dolphin' },
            { name: 'kangaroo', displayName: 'Kangaroo' }
        ];

        this.remainingAnimals = [];
        this.isAnimating = false;
        this.isComplete = false;
        this.confettiEffect = null;

        // DOM elements
        this.animalPile = document.getElementById('animal-pile');
        this.bucket = document.getElementById('bucket');
        this.progressElement = document.getElementById('animals-remaining');
        this.celebrationElement = document.getElementById('celebration');
        this.confettiCanvas = document.getElementById('confetti-canvas');
    }

    init() {
        // Shuffle and set up animals
        this.remainingAnimals = this.shuffleArray([...this.allAnimals]);
        this.isComplete = false;
        this.isAnimating = false;

        // Clear the pile
        this.animalPile.innerHTML = '';

        // Create animal elements
        this.remainingAnimals.forEach((animal, index) => {
            const element = this.createAnimalElement(animal, index);
            this.animalPile.appendChild(element);
        });

        // Update progress
        this.updateProgress();

        // Initialize confetti
        this.confettiEffect = new ConfettiEffect(this.confettiCanvas);

        // Hide celebration if showing
        this.celebrationElement.classList.add('hidden');
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createAnimalElement(animal, index) {
        const div = document.createElement('div');
        div.className = 'animal wobble';
        div.dataset.animal = animal.name;
        div.dataset.displayName = animal.displayName;

        // Create image element
        const img = document.createElement('img');
        img.src = `images/animals/${animal.name}.svg`;
        img.alt = animal.displayName;
        img.draggable = false;

        div.appendChild(img);

        // Stagger the wobble animation
        div.style.animationDelay = `${index * 0.1}s`;

        return div;
    }

    updateProgress() {
        this.progressElement.textContent = this.remainingAnimals.length;
    }

    getBucketRect() {
        return this.bucket.getBoundingClientRect();
    }

    isOverBucket(x, y) {
        const rect = this.getBucketRect();
        // Expand the hit area slightly for better UX
        const padding = 30;
        return (
            x >= rect.left - padding &&
            x <= rect.right + padding &&
            y >= rect.top - padding &&
            y <= rect.bottom + padding
        );
    }

    handleThrow(element, endPos, velocity, touchHandler) {
        if (this.isAnimating || this.isComplete) return;

        const animalName = element.dataset.animal;
        const displayName = element.dataset.displayName;
        const bucketRect = this.getBucketRect();

        // Get the bucket center for animation target
        const bucketCenter = {
            x: bucketRect.left + bucketRect.width / 2,
            y: bucketRect.top + bucketRect.height * 0.4 // Aim for top of bucket
        };

        // Check if the throw is valid (toward the bucket with enough velocity)
        const isValidThrow = touchHandler.isThrowingTowardBucket(endPos, velocity, bucketRect);

        if (isValidThrow || this.isOverBucket(endPos.x, endPos.y)) {
            // Successful throw toward bucket
            this.isAnimating = true;

            const throwAnim = new ThrowAnimation(
                element,
                endPos,
                bucketCenter,
                () => this.onAnimalLanded(element, animalName, displayName)
            );
            throwAnim.start();
        } else {
            // Missed throw - return to pile
            const pileRect = this.animalPile.getBoundingClientRect();
            const returnPos = {
                x: pileRect.left + Math.random() * (pileRect.width - 100) + 50,
                y: pileRect.top + Math.random() * (pileRect.height - 100) + 50
            };

            const returnAnim = new ReturnAnimation(
                element,
                endPos,
                returnPos,
                () => {
                    // Animal returns to normal pile behavior
                }
            );
            returnAnim.start();
        }
    }

    onAnimalLanded(element, animalName, displayName) {
        // Trigger bucket splash animation and sound
        triggerBucketSplash();
        this.splashSound.play();

        // Add landing animation class
        element.classList.add('landing');

        // Remove from remaining animals
        this.remainingAnimals = this.remainingAnimals.filter(a => a.name !== animalName);

        // Update progress
        this.updateProgress();

        // Remove the element after animation
        setTimeout(() => {
            element.remove();
            this.isAnimating = false;

            // Check for game completion
            if (this.remainingAnimals.length === 0) {
                this.onGameComplete();
            }
        }, 400);
    }

    onGameComplete() {
        this.isComplete = true;

        // Delay before celebration
        setTimeout(() => {
            // Show celebration screen
            this.celebrationElement.classList.remove('hidden');

            // Start confetti
            this.confettiEffect.start();

            // Play clapping
            this.clappingSound.play();

            // Speak congratulations
            this.speechManager.speakCongratulations();
        }, 500);
    }

    reset() {
        // Stop confetti
        if (this.confettiEffect) {
            this.confettiEffect.stop();
        }

        // Re-initialize the game
        this.init();
    }
}
