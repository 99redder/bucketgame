/**
 * Audio Module
 * Handles speech synthesis for animal names and celebration
 */

class SpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.voices = [];
        this.isReady = false;

        this.init();
    }

    init() {
        // Load voices
        this.loadVoices();

        // Voices may load asynchronously
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synth.getVoices();

        // Try to find a good female voice
        // Priority: Samantha (iOS), then any female English voice
        const preferredVoices = [
            'Samantha', // iOS default female
            'Karen',    // Australian female
            'Moira',    // Irish female
            'Fiona',    // Scottish female
            'Victoria', // US female
            'Zira',     // Windows female
            'Google UK English Female',
            'Google US English'
        ];

        // Try to find a preferred voice
        for (const preferred of preferredVoices) {
            const found = this.voices.find(v =>
                v.name.includes(preferred) && v.lang.startsWith('en')
            );
            if (found) {
                this.voice = found;
                break;
            }
        }

        // Fallback to any English female voice
        if (!this.voice) {
            this.voice = this.voices.find(v =>
                v.lang.startsWith('en') &&
                (v.name.toLowerCase().includes('female') ||
                 v.name.toLowerCase().includes('woman'))
            );
        }

        // Fallback to any English voice
        if (!this.voice) {
            this.voice = this.voices.find(v => v.lang.startsWith('en'));
        }

        // Final fallback to first available voice
        if (!this.voice && this.voices.length > 0) {
            this.voice = this.voices[0];
        }

        this.isReady = this.voices.length > 0;
        console.log('Speech ready:', this.isReady, 'Voice:', this.voice?.name);
    }

    speak(text, options = {}) {
        if (!this.synth || !this.isReady) {
            console.warn('Speech synthesis not available');
            return;
        }

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Set voice if available
        if (this.voice) {
            utterance.voice = this.voice;
        }

        // Child-friendly settings
        utterance.rate = options.rate || 0.85;    // Slower for kids
        utterance.pitch = options.pitch || 1.1;   // Slightly higher pitch
        utterance.volume = options.volume || 1.0;

        // Callback when speech ends
        if (options.onEnd) {
            utterance.onend = options.onEnd;
        }

        this.synth.speak(utterance);
    }

    speakAnimalName(animalName) {
        this.speak(animalName, {
            rate: 0.8,
            pitch: 1.15
        });
    }

    speakCongratulations() {
        // Small delay before speaking
        setTimeout(() => {
            this.speak('Congratulations!', {
                rate: 0.75,
                pitch: 1.2
            });
        }, 500);
    }

    // iOS requires user interaction to enable speech
    unlock() {
        if (this.synth) {
            // Create a silent utterance to unlock
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            this.synth.speak(utterance);
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

    // Create a single clap sound
    createClap() {
        if (!this.audioContext || !this.isReady) return;

        const ctx = this.audioContext;

        // White noise for clap
        const bufferSize = ctx.sampleRate * 0.1; // 100ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // Noise with decay envelope
            const envelope = Math.exp(-i / (bufferSize * 0.1));
            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Filter to shape the clap sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        // Gain for volume
        const gain = ctx.createGain();
        gain.gain.value = 0.5;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
    }

    // Play a clapping sequence
    play() {
        if (!this.isReady) return;

        // Play multiple claps with timing
        const clapTimes = [0, 150, 300, 500, 700, 900, 1100, 1350, 1600, 1850];

        clapTimes.forEach(time => {
            setTimeout(() => this.createClap(), time);
        });
    }
}
