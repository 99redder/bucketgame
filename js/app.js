/**
 * Main App Entry Point
 * Initializes all game components and handles startup
 */

// Global instances
let speechManager;
let clappingSound;
let splashSound;
let backgroundMusic;
let game;
let touchHandler;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');
const playAgainButton = document.getElementById('play-again-button');
const startOverButton = document.getElementById('start-over-button');

// Initialize the application
async function initApp() {
    // Register service worker for PWA
    registerServiceWorker();

    // Initialize audio systems
    speechManager = new SpeechManager();
    clappingSound = new ClappingSound();
    clappingSound.init();
    splashSound = new SplashSound();
    splashSound.init();
    backgroundMusic = new BackgroundMusic();
    backgroundMusic.init();

    // Set up event listeners
    setupEventListeners();

    // Voice clips are read from local storage only when needed. Play is ready
    // immediately, even on a new or offline iPad.
    startButton.textContent = 'Let’s play!';

    console.log('Animal Bucket Game initialized');
}

// Register service worker with auto-update support
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Use relative path for GitHub Pages compatibility
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
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

    // Play again button
    playAgainButton.addEventListener('click', restartGame);

    // Start over button
    startOverButton.addEventListener('click', restartGame);

    // Unlock audio on first interaction
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    window.addEventListener('resize', handleResize);
}

// Unlock audio (required for iOS)
function unlockAudio() {
    speechManager.unlock();
    clappingSound.unlock();
    splashSound.unlock();
    backgroundMusic.unlock();
    console.log('Audio unlocked');
}

// Start the game
function startGame() {
    // Hide start screen, show game
    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    // Start background music
    backgroundMusic.start();

    // Initialize game
    game = new Game(speechManager, clappingSound, splashSound);
    game.init();

    // Initialize touch handler
    touchHandler = new TouchHandler({
        onDragStart: (element, pos) => {
            // Animal picked up
        },
        onDragMove: (element, pos, velocity) => {
            // Could add trail effect here
        },
        onDragEnd: (element, pos, velocity, tapped) => {
            game.handleThrow(element, pos, velocity, touchHandler, tapped);
        }
    });

    console.log('Game started');
}

// Restart the game
function restartGame() {
    game.reset();
    console.log('Game restarted');
}

// Handle window resize
function handleResize() {
    // Resize confetti canvas if game is complete
    if (game && game.confettiEffect) {
        game.confettiEffect.resize();
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
