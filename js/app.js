/**
 * Main App Entry Point
 * Initializes all game components and handles startup
 */

// Global instances
let speechManager;
let clappingSound;
let game;
let touchHandler;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');
const playAgainButton = document.getElementById('play-again-button');

// Initialize the application
function initApp() {
    // Register service worker for PWA
    registerServiceWorker();

    // Initialize audio systems
    speechManager = new SpeechManager();
    clappingSound = new ClappingSound();
    clappingSound.init();

    // Set up event listeners
    setupEventListeners();

    console.log('Animal Bucket Game initialized');
}

// Register service worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Set up event listeners
function setupEventListeners() {
    // Start button
    startButton.addEventListener('click', startGame);
    startButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        startGame();
    });

    // Play again button
    playAgainButton.addEventListener('click', restartGame);
    playAgainButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        restartGame();
    });

    // Unlock audio on first interaction
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    // Handle orientation change
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
}

// Unlock audio (required for iOS)
function unlockAudio() {
    speechManager.unlock();
    clappingSound.unlock();
    console.log('Audio unlocked');
}

// Start the game
function startGame() {
    // Hide start screen, show game
    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    // Initialize game
    game = new Game(speechManager, clappingSound);
    game.init();

    // Initialize touch handler
    touchHandler = new TouchHandler({
        onDragStart: (element, pos) => {
            // Visual feedback when picking up animal
        },
        onDragMove: (element, pos, velocity) => {
            // Could add trail effect here
        },
        onDragEnd: (element, pos, velocity) => {
            game.handleThrow(element, pos, velocity, touchHandler);
        }
    });

    console.log('Game started');
}

// Restart the game
function restartGame() {
    game.reset();
    console.log('Game restarted');
}

// Handle orientation changes
function handleOrientationChange() {
    // Force landscape on mobile
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
            // Orientation lock not supported, that's ok
        });
    }
}

// Handle window resize
function handleResize() {
    // Resize confetti canvas if game is complete
    if (game && game.confettiEffect) {
        game.confettiEffect.resize();
    }
}

// Lock to landscape orientation if possible
function tryLockLandscape() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
            console.log('Could not lock orientation');
        });
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Try to lock landscape when page loads
window.addEventListener('load', tryLockLandscape);
