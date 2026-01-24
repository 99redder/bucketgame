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

    // Disable start button and show loading
    startButton.disabled = true;
    startButton.textContent = 'Loading voices...';
    startButton.style.opacity = '0.7';

    // Preload all audio before enabling the game
    try {
        await speechManager.preloadAudio((loaded, total) => {
            startButton.textContent = `Loading voices (${loaded}/${total})...`;
        });
        console.log('All audio preloaded successfully');
    } catch (error) {
        console.warn('Audio preload error:', error);
    }

    // Enable start button
    startButton.disabled = false;
    startButton.textContent = 'Start Game!';
    startButton.style.opacity = '1';

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

        // Listen for service worker updates and auto-reload
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                console.log('App updated! Reloading...');
                window.location.reload();
            }
        });

        // Also handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('New service worker activated, reloading...');
            window.location.reload();
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

    // Start over button
    startOverButton.addEventListener('click', restartGame);
    startOverButton.addEventListener('touchend', (e) => {
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
