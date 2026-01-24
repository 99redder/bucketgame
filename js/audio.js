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
    modelId: 'eleven_multilingual_v2'  // Most natural sounding model
};
// ==============================================

class SpeechManager {
    constructor() {
        this.audioCache = new Map();
        this.audioContext = null;
        this.isElevenLabsEnabled = ELEVENLABS_CONFIG.apiKey !== 'YOUR_API_KEY_HERE';

        // Fallback to Web Speech API if no ElevenLabs key
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.voices = [];

        this.init();
    }

    init() {
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

        if (this.isElevenLabsEnabled) {
            console.log('ElevenLabs TTS enabled');
            // Pre-generate common phrases
            this.preloadAudio();
        } else {
            console.log('Using fallback Web Speech API (add ElevenLabs API key for better voice)');
        }
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
    async preloadAudio() {
        if (!this.isElevenLabsEnabled) return;

        const phrases = [
            'Cat', 'Dog', 'Elephant', 'Lion', 'Monkey', 'Pig',
            'Cow', 'Duck', 'Frog', 'Horse', 'Orca', 'Chicken',
            'Crocodile', 'Panda', 'Shark', 'Polar Bear', 'Giraffe',
            'Zebra', 'Penguin', 'Owl', 'Rabbit', 'Tiger', 'Turtle',
            'Snake', 'Dolphin', 'Kangaroo', 'Congratulations!'
        ];

        // Load in background without blocking
        phrases.forEach(phrase => {
            this.generateAndCacheAudio(phrase);
        });
    }

    async generateAndCacheAudio(text) {
        if (this.audioCache.has(text)) {
            return this.audioCache.get(text);
        }

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
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;  // Max volume

            this.audioCache.set(text, audio);
            return audio;
        } catch (error) {
            console.warn('ElevenLabs generation failed:', error);
            return null;
        }
    }

    async playElevenLabsAudio(text) {
        try {
            let audio = this.audioCache.get(text);

            if (!audio) {
                audio = await this.generateAndCacheAudio(text);
            }

            if (audio) {
                audio.currentTime = 0;

                // Use Web Audio API to amplify the sound
                if (this.audioContext && !audio._connectedToGain) {
                    const source = this.audioContext.createMediaElementSource(audio);
                    const gainNode = this.audioContext.createGain();
                    gainNode.gain.value = 2.0;  // Amplify 2x louder
                    source.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    audio._connectedToGain = true;
                }

                await audio.play();
                console.log('ElevenLabs audio played:', text);
                return true;
            }
        } catch (error) {
            console.warn('ElevenLabs playback failed:', error);
        }
        return false;
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

        if (this.isElevenLabsEnabled) {
            try {
                const played = await this.playElevenLabsAudio(animalName);
                if (played) return;
            } catch (error) {
                console.warn('ElevenLabs failed, using fallback:', error);
            }
        }

        // Fallback to Web Speech API
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
