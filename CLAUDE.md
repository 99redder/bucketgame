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
4. **Speech on landing** - ElevenLabs speaks animal name (with Web Speech fallback)
5. **Water splash effect** - Visual and audio splash when animal enters bucket
6. **Confetti celebration** - Canvas-based confetti when all animals collected
7. **Clapping sound** - Web Audio API generated applause
8. **"Congratulations!" voice** - Spoken at end of game
9. **Play Again button** - Resets game state
10. **PWA auto-update** - Service worker uses network-first and notifies on update

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
- **Network-first** for HTML and JS files (to get updates quickly)
- **Cache-first** for assets (images, CSS)
- Automatically claims clients and notifies them to reload on update
- Cache version: v9

## CSS Layout
- Grid layout: `grid-template-columns: 2fr 2fr 1.5fr` (animal pile | play area | bucket)
- Animal size: 70px (smaller screens) to 90px (iPad Pro)
- Bucket size: 240px to 300px depending on screen
- Animal pile uses flexbox with column wrap

## Change Log

### v9 (Current)
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
