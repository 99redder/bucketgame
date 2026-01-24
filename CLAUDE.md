# Animal Bucket Game - Project Context

## Overview
A kids' game PWA for iPad where children throw animals into a bucket one at a time. Each animal landing triggers a voice saying the animal name, and completing all animals triggers a celebration.

## Tech Stack
- **Vanilla JavaScript** - No framework, keeps bundle small for PWA
- **CSS Animations + requestAnimationFrame** - Hybrid approach for smooth animations
- **ElevenLabs API** - For high-quality text-to-speech (female voice)
- **Web Speech API** - Fallback TTS if ElevenLabs fails
- **Web Audio API** - For synthesized splash and clapping sounds
- **Service Worker** - For offline functionality with auto-update
- **Landscape orientation** - Locked for optimal throwing experience

## API Keys
- **ElevenLabs API Key**: `sk_5c7e8c54d69e2f52744bf03cb2545d453d84a5d7479ffd21`
  - Voice ID: `XB0fDUnXU5powFXDhCwa` (Charlotte - warm, natural female voice)
  - Model: `eleven_multilingual_v2` (most natural sounding)
  - Voice Settings: stability=0.35, similarity_boost=0.85, style=0.7

## Deployment
- Hosted on GitHub Pages
- Uses relative paths (`./`) for compatibility
- PWA auto-updates via network-first strategy for HTML/JS files

## File Structure
```
bucketgame/
├── index.html              # Main game page with PWA meta tags
├── manifest.json           # PWA manifest (fullscreen, landscape)
├── sw.js                   # Service worker for offline caching (auto-update)
├── CLAUDE.md               # This file - project context
├── css/
│   └── styles.css          # Layout, animations, iPad optimizations
├── js/
│   ├── app.js              # Main entry point, initializes game
│   ├── game.js             # Game state and logic
│   ├── animations.js       # Throw physics, celebration effects
│   ├── audio.js            # ElevenLabs TTS, splash/clapping sounds
│   └── touch.js            # Touch/drag handling
└── images/
    ├── animals/            # 26 animal SVG illustrations
    └── icons/              # PWA icons
```

## Animals (26 total)
1. cat
2. dog
3. elephant
4. lion
5. monkey
6. pig
7. cow
8. duck
9. frog
10. horse
11. orca
12. chicken
13. crocodile
14. panda
15. shark
16. polarbear (display: "Polar Bear")
17. giraffe
18. zebra
19. penguin
20. owl
21. rabbit
22. tiger
23. turtle
24. snake
25. dolphin
26. kangaroo

## Key Features
1. **Drag-and-throw mechanics** - Touch/drag animals and release to throw
2. **Parabolic throw animation** - Animals arc through the air with rotation
3. **Bucket landing detection** - Determines if animal lands in bucket
4. **Speech on landing** - ElevenLabs speaks animal name when it lands in bucket (with Web Speech fallback)
5. **Animal display popup** - Shows large animal image with name label at bottom center for 2 seconds
6. **Water splash effect** - Visual and audio splash when animal enters bucket
7. **Confetti celebration** - Canvas-based confetti when all animals collected
8. **Clapping sound** - Web Audio API generated applause
9. **"Congratulations!" voice** - Spoken at end of game
10. **Play Again button** - Resets game state
11. **PWA auto-update** - Service worker uses network-first and notifies on update

## Audio System (audio.js)
- **SpeechManager class**: Handles ElevenLabs API calls with Web Speech API fallback
- **SplashSound class**: Web Audio API synthesized water splash
- **ClappingSound class**: Web Audio API synthesized applause

### ElevenLabs Integration
```javascript
const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
    }
);
```

## Service Worker Strategy
- **Network-first** for HTML, JS, and CSS files (to get updates quickly)
- **Cache-first** for assets (images only)
- Automatically claims clients and notifies them to reload on update
- Cache version: v16

## CSS Layout
- Grid layout: `grid-template-columns: 2fr 2fr 1.5fr` (animal pile | play area | bucket)
- Animal size: 70px (smaller screens) to 90px (iPad Pro)
- Bucket size: 240px to 300px depending on screen
- Animal pile uses flexbox with column wrap

## Change Log

### v16 (Current)
- Moved animal name speech from pickup to when animal lands in bucket
- Added large animal display popup that shows for 2 seconds at bottom center
- Display includes enlarged animal image (180px) with styled name label
- Pop-bounce animation for the animal image
- Smooth fade-in/fade-out transitions
- Added "Start Over" button in top right corner:
  - Larger size (1.6rem font, more padding)
  - Red background (gradient) with white text
  - More prominent for easy access
- Implemented audio queue system for reliable speech:
  - Queue ensures audio plays sequentially without conflicts
  - Audio context is resumed before each playback (iOS/iPad fix)
  - 100ms delay between audio clips for cleanup
  - Automatic fallback to Web Speech API if ElevenLabs fails
  - Enhanced emoji-based logging for easier debugging (🔊 ✅ ⚠️ ❌)
- Added motion trail effect when dragging animals:
  - Semi-transparent clones follow the animal during drag
  - Trail elements fade out and shrink (0.3s animation)
  - New trail element every 50ms for smooth effect
  - Automatically cleaned up when drag ends
- Fixed robotic voices permanently:
  - Incremented IndexedDB database version to 2 (clears ALL old cached audio)
  - Incremented audio cache version to v7
  - Database upgrade deletes old object store and creates fresh one
  - Forces complete re-download of all 27 animal voices with Charlotte
- Improved audio playback reliability:
  - Added 5 second timeout to prevent hanging audio promises
  - More aggressive audio context resume (checks state before every playback)
  - Increased delay between audio clips (150ms instead of 100ms)
  - Extended fallback speech wait time (2s instead of 1.5s)
  - Better logging with queue finish indicator
- Reduced background music volume from 6% to 3% for clearer animal voices
- Service worker cache version incremented to v16
- CSS now uses network-first strategy (was cache-first) for instant style updates
- Animals now stay in fixed positions when one is removed (no reflowing)

### v15
- Fixed audio reliability issues causing missing or robotic voices
- Store audio blobs instead of Audio elements (cloneNode was unreliable)
- Added IndexedDB persistence so voices survive page refreshes
- Fresh Audio element created for each playback (more reliable)
- Proper blob URL cleanup after playback to prevent memory leaks
- Incremented audio cache version to v5

### v14
- Animal name is now spoken when picked up (instead of when landing in bucket)
- Incremented audio cache version to v4 to force fresh voice downloads
- All old robotic voices will be re-downloaded with Charlotte voice

### v13
- Fixed voices not playing by removing Web Audio API gain node conflict
- Now clones audio elements for reliable playback
- Lowered background music volume from 15% to 6%

### v12
- Added background music using Web Audio API
- Cheerful, kid-friendly melody that loops during gameplay
- Music starts when game begins

### v11
- Added audio cache versioning to invalidate old robotic voices
- Cache key now includes version (e.g., "Cat_v3") to force fresh downloads
- All animals will now use the new Charlotte voice

### v10
- Fixed audio not playing for all animals by properly preloading all voices
- Start button now shows loading progress (e.g., "Loading voices (5/27)...")
- Game only starts after all 27 audio clips are cached
- Changed preloadAudio to use Promise.all instead of fire-and-forget

### v9
- Increased ElevenLabs voice volume using Web Audio API gain (2x amplification)

### v8
- Switched to ElevenLabs `eleven_multilingual_v2` model (most natural sounding)
- Changed voice from Rachel to Charlotte (warmer, more natural)
- Adjusted voice settings for more expressiveness (stability=0.35, style=0.7)

### v7
- Made animal pile area larger (2fr column instead of 1fr)
- Reduced animal size to 70px to fit all 26 animals
- Increased bucket size to 240px
- Updated responsive breakpoints

### v6
- Fixed audio error handling for ElevenLabs
- Added try/catch with proper Web Speech API fallback

### v5
- Added 11 new animals (polarbear, giraffe, zebra, penguin, owl, rabbit, tiger, turtle, snake, dolphin, kangaroo)
- Total animals now 26

### v4
- Implemented auto-update for PWA
- Network-first strategy for HTML/JS
- Added SW_UPDATED message to trigger page reload

### v3
- Added water splash sound effect using Web Audio API
- Integrated splash visual and audio on bucket landing

### v2
- Integrated ElevenLabs API for high-quality TTS
- Added crocodile, panda, shark animals
- Replaced sheep with orca

### v1
- Initial release with 12 animals
- Web Speech API for TTS
- Basic throw mechanics and celebration
