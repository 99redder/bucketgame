/**
 * Audio Module with ElevenLabs Integration
 * High-quality text-to-speech for animal names
 */

// ==============================================
// CONFIGURATION - Add your ElevenLabs API key here
// ==============================================
const ELEVENLABS_CONFIG = {
    apiKey: 'sk_5c7e8c54d69e2f52744bf03cb2545d453d84a5d7479ffd21',
    voiceId: 'XB0fDUnXU5powFXDhCwa',  // "Charlotte" - warm, natural female voice
    // Alternative voices:
    // '21m00Tcm4TlvDq8ikWAM' - "Rachel" - warm female
    // 'Xb7hH8MSUJpSbSDYk0k2' - "Alice" - young female
    // 'pFZP5JQG7iQjIQuC4Bku' - "Lily" - warm British female
    modelId: 'eleven_multilingual_v2',  // Most natural sounding model
    cacheVersion: 'v5',  // Increment this to force re-download of all audio
    dbName: 'AnimalBucketAudioCache',
    dbVersion: 1
};
// ==============================================

class SpeechManager {
    constructor() {
        // Store blobs instead of Audio elements for reliable playback
        this.blobCache = new Map();
        this.audioContext = null;
        this.db = null;
        this.isElevenLabsEnabled = ELEVENLABS_CONFIG.apiKey !== 'YOUR_API_KEY_HERE';

        // Fallback to Web Speech API if no ElevenLabs key
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.voices = [];

        // Track currently playing audio to prevent overlaps
        this.currentAudio = null;
        this.currentAudioUrl = null;

        this.init();
    }

    async init() {
        // Initialize audio context for playback
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not available');
        }

        // Load fallback voices
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }

        // Initialize IndexedDB for persistent audio cache
        try {
            await this.initDB();
        } catch (e) {
            console.warn('IndexedDB not available, using memory cache only');
        }

        if (this.isElevenLabsEnabled) {
            console.log('ElevenLabs TTS enabled');
        } else {
            console.log('Using fallback Web Speech API (add ElevenLabs API key for better voice)');
        }
    }

    // Initialize IndexedDB for persistent audio storage
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(ELEVENLABS_CONFIG.dbName, ELEVENLABS_CONFIG.dbVersion);

            request.onerror = () => {
                console.warn('Failed to open IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized for audio cache');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('audio')) {
                    db.createObjectStore('audio', { keyPath: 'key' });
                }
            };
        });
    }

    // Get audio blob from IndexedDB
    async getFromDB(key) {
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['audio'], 'readonly');
                const store = transaction.objectStore('audio');
                const request = store.get(key);

                request.onsuccess = () => {
                    resolve(request.result?.blob || null);
                };
                request.onerror = () => {
                    resolve(null);
                };
            } catch (e) {
                resolve(null);
            }
        });
    }

    // Save audio blob to IndexedDB
    async saveToDB(key, blob) {
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['audio'], 'readwrite');
                const store = transaction.objectStore('audio');
                store.put({ key, blob });

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        const preferredVoices = ['Samantha', 'Karen', 'Victoria', 'Zira'];

        for (const preferred of preferredVoices) {
            const found = this.voices.find(v => v.name.includes(preferred) && v.lang.startsWith('en'));
            if (found) {
                this.voice = found;
                break;
            }
        }

        if (!this.voice) {
            this.voice = this.voices.find(v => v.lang.startsWith('en'));
        }
    }

    // Pre-load audio for all animals and congratulations
    async preloadAudio(onProgress) {
        if (!this.isElevenLabsEnabled) return { loaded: 0, total: 0 };

        const phrases = [
            'Cat', 'Dog', 'Elephant', 'Lion', 'Monkey', 'Pig',
            'Cow', 'Duck', 'Frog', 'Horse', 'Orca', 'Chicken',
            'Crocodile', 'Panda', 'Shark', 'Polar Bear', 'Giraffe',
            'Zebra', 'Penguin', 'Owl', 'Rabbit', 'Tiger', 'Turtle',
            'Snake', 'Dolphin', 'Kangaroo', 'Congratulations!'
        ];

        let loaded = 0;
        const total = phrases.length;

        // Load all audio and wait for completion
        const promises = phrases.map(async (phrase) => {
            try {
                await this.generateAndCacheAudio(phrase);
                loaded++;
                if (onProgress) {
                    onProgress(loaded, total);
                }
                console.log(`Cached audio ${loaded}/${total}: ${phrase}`);
            } catch (error) {
                console.warn(`Failed to cache: ${phrase}`, error);
                loaded++;
                if (onProgress) {
                    onProgress(loaded, total);
                }
            }
        });

        await Promise.all(promises);
        console.log(`Audio preloading complete: ${this.blobCache.size} items cached`);
        return { loaded: this.blobCache.size, total };
    }

    async generateAndCacheAudio(text) {
        // Include cache version in key to invalidate old audio
        const cacheKey = `${text}_${ELEVENLABS_CONFIG.cacheVersion}`;

        // Check memory cache first
        if (this.blobCache.has(cacheKey)) {
            return this.blobCache.get(cacheKey);
        }

        // Check IndexedDB cache
        const cachedBlob = await this.getFromDB(cacheKey);
        if (cachedBlob) {
            this.blobCache.set(cacheKey, cachedBlob);
            console.log(`Loaded from IndexedDB: ${text}`);
            return cachedBlob;
        }

        // Fetch from ElevenLabs API
        try {
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_CONFIG.voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': ELEVENLABS_CONFIG.apiKey
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: ELEVENLABS_CONFIG.modelId,
                        voice_settings: {
                            stability: 0.35,        // Lower = more expressive/natural
                            similarity_boost: 0.85, // Higher = closer to original voice
                            style: 0.7,             // Higher = more stylized delivery
                            use_speaker_boost: true
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            const audioBlob = await response.blob();

            // Store blob in memory cache
            this.blobCache.set(cacheKey, audioBlob);

            // Persist to IndexedDB for future sessions
            await this.saveToDB(cacheKey, audioBlob);

            return audioBlob;
        } catch (error) {
            console.warn('ElevenLabs generation failed:', error);
            return null;
        }
    }

    // Create a fresh Audio element from blob and play it
    async playElevenLabsAudio(text) {
        try {
            // Stop any currently playing audio first
            if (this.currentAudio) {
                try {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                } catch (e) {
                    // Ignore errors when stopping
                }
                if (this.currentAudioUrl) {
                    try {
                        URL.revokeObjectURL(this.currentAudioUrl);
                    } catch (e) {
                        // Ignore revoke errors
                    }
                }
                this.currentAudio = null;
                this.currentAudioUrl = null;
            }

            const cacheKey = `${text}_${ELEVENLABS_CONFIG.cacheVersion}`;
            let blob = this.blobCache.get(cacheKey);

            if (!blob) {
                console.log('Blob not in cache, generating for:', text);
                blob = await this.generateAndCacheAudio(text);
            } else {
                console.log('Blob found in cache for:', text);
            }

            if (!blob) {
                console.warn('No blob available for:', text);
                return false;
            }

            // Create a fresh Audio element each time from the blob
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;

            // Store reference to current audio
            this.currentAudio = audio;
            this.currentAudioUrl = audioUrl;

            // Set up event handlers before playing
            return new Promise((resolve) => {
                let resolved = false;

                const cleanup = () => {
                    if (!resolved) {
                        resolved = true;
                        try {
                            URL.revokeObjectURL(audioUrl);
                        } catch (e) {
                            // Ignore
                        }
                        if (this.currentAudio === audio) {
                            this.currentAudio = null;
                            this.currentAudioUrl = null;
                        }
                    }
                };

                audio.onended = () => {
                    console.log('Audio ended:', text);
                    cleanup();
                    resolve(true);
                };

                audio.onerror = (e) => {
                    console.warn('Audio playback error for:', text, e);
                    cleanup();
                    resolve(false);
                };

                // Start playback
                audio.play()
                    .then(() => {
                        console.log('ElevenLabs audio playing:', text);
                    })
                    .catch((error) => {
                        console.warn('Audio play() failed for:', text, error);
                        cleanup();
                        resolve(false);
                    });
            });
        } catch (error) {
            console.warn('ElevenLabs playback exception:', text, error);
            return false;
        }
    }

    // Fallback Web Speech API
    speakFallback(text, options = {}) {
        if (!this.synth) {
            console.warn('Web Speech API not available');
            return;
        }

        try {
            this.synth.cancel();
            const utterance = new SpeechSynthesisUtterance(text);

            if (this.voice) {
                utterance.voice = this.voice;
            }

            utterance.rate = options.rate || 0.85;
            utterance.pitch = options.pitch || 1.1;
            utterance.volume = options.volume || 1.0;

            this.synth.speak(utterance);
            console.log('Web Speech API speaking:', text);
        } catch (error) {
            console.warn('Web Speech API failed:', error);
        }
    }

    async speakAnimalName(animalName) {
        console.log('Speaking animal name:', animalName);

        // Ensure audio context is running
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            } catch (e) {
                console.warn('Failed to resume audio context:', e);
            }
        }

        if (this.isElevenLabsEnabled) {
            try {
                const played = await this.playElevenLabsAudio(animalName);
                if (played) {
                    console.log('Successfully played:', animalName);
                    return;
                } else {
                    console.warn('playElevenLabsAudio returned false for:', animalName);
                }
            } catch (error) {
                console.warn('ElevenLabs failed, using fallback:', error);
            }
        }

        // Fallback to Web Speech API
        console.log('Using fallback speech for:', animalName);
        this.speakFallback(animalName, { rate: 0.8, pitch: 1.15 });
    }

    async speakCongratulations() {
        console.log('Speaking congratulations');

        // Small delay then speak
        await new Promise(resolve => setTimeout(resolve, 500));

        if (this.isElevenLabsEnabled) {
            try {
                const played = await this.playElevenLabsAudio('Congratulations!');
                if (played) return;
            } catch (error) {
                console.warn('ElevenLabs congratulations failed:', error);
            }
        }

        // Fallback
        this.speakFallback('Congratulations!', { rate: 0.75, pitch: 1.2 });
    }

    unlock() {
        // Resume audio context
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Unlock Web Speech API fallback
        if (this.synth) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            this.synth.speak(utterance);
        }
    }
}

// Create water splash sound using Web Audio API
class SplashSound {
    constructor() {
        this.audioContext = null;
        this.isReady = false;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isReady = true;
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    unlock() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    play() {
        if (!this.audioContext || !this.isReady) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create multiple layers for a rich splash sound

        // Layer 1: Initial impact (low thud)
        const impactOsc = ctx.createOscillator();
        const impactGain = ctx.createGain();
        impactOsc.type = 'sine';
        impactOsc.frequency.setValueAtTime(150, now);
        impactOsc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        impactGain.gain.setValueAtTime(0.4, now);
        impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        impactOsc.connect(impactGain);
        impactGain.connect(ctx.destination);
        impactOsc.start(now);
        impactOsc.stop(now + 0.15);

        // Layer 2: Water noise (filtered white noise)
        const bufferSize = ctx.sampleRate * 0.4; // 400ms
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // Noise with envelope
            const t = i / bufferSize;
            const envelope = Math.pow(1 - t, 2) * Math.sin(t * Math.PI);
            noiseData[i] = (Math.random() * 2 - 1) * envelope;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        // Lowpass filter for water-like sound
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2000, now);
        lowpass.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        lowpass.Q.value = 1;

        // Highpass to remove rumble
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 200;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        noiseSource.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(now);

        // Layer 3: Bubbles (short high-frequency bursts)
        for (let i = 0; i < 5; i++) {
            const bubbleTime = now + 0.05 + Math.random() * 0.2;
            const bubbleOsc = ctx.createOscillator();
            const bubbleGain = ctx.createGain();

            bubbleOsc.type = 'sine';
            bubbleOsc.frequency.setValueAtTime(800 + Math.random() * 600, bubbleTime);
            bubbleOsc.frequency.exponentialRampToValueAtTime(200 + Math.random() * 200, bubbleTime + 0.05);

            bubbleGain.gain.setValueAtTime(0.1, bubbleTime);
            bubbleGain.gain.exponentialRampToValueAtTime(0.01, bubbleTime + 0.05);

            bubbleOsc.connect(bubbleGain);
            bubbleGain.connect(ctx.destination);
            bubbleOsc.start(bubbleTime);
            bubbleOsc.stop(bubbleTime + 0.06);
        }
    }
}

// Create clapping sound using Web Audio API
class ClappingSound {
    constructor() {
        this.audioContext = null;
        this.isReady = false;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isReady = true;
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    unlock() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    createClap() {
        if (!this.audioContext || !this.isReady) return;

        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const envelope = Math.exp(-i / (bufferSize * 0.1));
            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.value = 0.5;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
    }

    play() {
        if (!this.isReady) return;

        const clapTimes = [0, 150, 300, 500, 700, 900, 1100, 1350, 1600, 1850];
        clapTimes.forEach(time => {
            setTimeout(() => this.createClap(), time);
        });
    }
}

// Background music generator using Web Audio API
class BackgroundMusic {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.scheduledNotes = [];
        this.loopInterval = null;
        this.volume = 0.06; // Very subtle so voices are clear
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API not available for music');
        }
    }

    unlock() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Convert note name to frequency
    noteToFreq(note) {
        const notes = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00
        };
        return notes[note] || 440;
    }

    // Play a single note with soft attack
    playNote(freq, startTime, duration, type = 'sine') {
        if (!this.audioContext || !this.isPlaying) return;

        const osc = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        // Soft envelope for gentle sound
        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        noteGain.gain.linearRampToValueAtTime(0.2, startTime + duration * 0.5);
        noteGain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
    }

    // Play a chord
    playChord(notes, startTime, duration) {
        notes.forEach(note => {
            this.playNote(this.noteToFreq(note), startTime, duration, 'sine');
        });
    }

    // Play the melody loop
    playMelodyLoop() {
        if (!this.audioContext || !this.isPlaying) return;

        const now = this.audioContext.currentTime;
        const tempo = 0.4; // Time per beat in seconds

        // Simple cheerful melody - kid-friendly tune
        const melody = [
            { note: 'C5', time: 0, dur: 0.3 },
            { note: 'E5', time: 1, dur: 0.3 },
            { note: 'G5', time: 2, dur: 0.3 },
            { note: 'E5', time: 3, dur: 0.3 },
            { note: 'C5', time: 4, dur: 0.3 },
            { note: 'D5', time: 5, dur: 0.3 },
            { note: 'E5', time: 6, dur: 0.5 },
            { note: 'D5', time: 7, dur: 0.3 },
            { note: 'C5', time: 8, dur: 0.3 },
            { note: 'G4', time: 9, dur: 0.3 },
            { note: 'A4', time: 10, dur: 0.3 },
            { note: 'B4', time: 11, dur: 0.3 },
            { note: 'C5', time: 12, dur: 0.5 },
            { note: 'E5', time: 13, dur: 0.3 },
            { note: 'D5', time: 14, dur: 0.3 },
            { note: 'C5', time: 15, dur: 0.5 }
        ];

        // Background chords (soft pads)
        const chords = [
            { notes: ['C4', 'E4', 'G4'], time: 0, dur: 1.5 },
            { notes: ['C4', 'E4', 'G4'], time: 4, dur: 1.5 },
            { notes: ['G4', 'B4', 'D5'], time: 8, dur: 1.5 },
            { notes: ['C4', 'E4', 'G4'], time: 12, dur: 1.5 }
        ];

        // Play melody notes
        melody.forEach(({ note, time, dur }) => {
            this.playNote(this.noteToFreq(note), now + time * tempo, dur, 'triangle');
        });

        // Play background chords (quieter)
        chords.forEach(({ notes, time, dur }) => {
            notes.forEach(note => {
                const osc = this.audioContext.createOscillator();
                const noteGain = this.audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = this.noteToFreq(note);
                noteGain.gain.setValueAtTime(0, now + time * tempo);
                noteGain.gain.linearRampToValueAtTime(0.08, now + time * tempo + 0.1);
                noteGain.gain.linearRampToValueAtTime(0.05, now + time * tempo + dur);
                noteGain.gain.linearRampToValueAtTime(0, now + time * tempo + dur + 0.2);
                osc.connect(noteGain);
                noteGain.connect(this.masterGain);
                osc.start(now + time * tempo);
                osc.stop(now + time * tempo + dur + 0.3);
            });
        });

        // Schedule next loop
        const loopDuration = 16 * tempo * 1000; // 16 beats
        this.loopInterval = setTimeout(() => this.playMelodyLoop(), loopDuration);
    }

    start() {
        if (!this.audioContext) return;
        if (this.isPlaying) return;

        this.unlock();
        this.isPlaying = true;
        this.playMelodyLoop();
        console.log('Background music started');
    }

    stop() {
        this.isPlaying = false;
        if (this.loopInterval) {
            clearTimeout(this.loopInterval);
            this.loopInterval = null;
        }
        console.log('Background music stopped');
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }
}
