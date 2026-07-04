/**
 * Blocks iPad Safari pinch and double-tap zoom so game gestures stay in-game.
 */
(() => {
    let lastTouchEnd = 0;

    const block = (event) => {
        event.preventDefault();
    };

    document.addEventListener('gesturestart', block, { passive: false });
    document.addEventListener('gesturechange', block, { passive: false });
    document.addEventListener('gestureend', block, { passive: false });

    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 1) event.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) event.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
})();
