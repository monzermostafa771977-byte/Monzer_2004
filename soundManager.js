/**
 * نظام التنبيهات الصوتية المتكامل للحضور والانصراف
 * يدعم: الوضع الصامت، تغيير النغمات، الحفظ المحلي، والمزامنة السحابية مع Firebase
 */

class AttendanceSoundManager {
    constructor() {
        this.isMuted = localStorage.getItem('attendance_sound_muted') === 'true';
        this.currentTone = localStorage.getItem('attendance_sound_tone') || 'beep';
        this.databaseUrl = null;
        this.audioCtx = null;
    }

    setDatabaseUrl(url) {
        this.databaseUrl = url;
        this.syncWithFirebase();
    }

    // تهيئة محرك الصوت (Web Audio API) بدقة عالية ووضوح تام
    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // تشغيل التنبيه بنقاء وارتفاع صوت عاليين جداً
    play(type = 'in') {
        if (this.isMuted) return;

        this.initAudioContext();

        try {
            switch (this.currentTone) {
                case 'chime':
                    this.playChimeTone(type);
                    break;
                case 'success':
                    this.playSuccessTone();
                    break;
                case 'alert':
                    this.playAlertTone();
                    break;
                case 'bell':
                    this.playBellTone();
                    break;
                case 'modern':
                    this.playModernTone(type);
                    break;
                case 'beep':
                default:
                    this.playDefaultBeep(type);
                    break;
            }
        } catch (e) {
            console.error("خطأ في تشغيل الصوت:", e);
        }
    }

    playDefaultBeep(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'in' ? 950 : 600, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime); // رفع مستوى الصوت ليكون واضحاً
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);
    }

    playChimeTone(type) {
        const now = this.audioCtx.currentTime;
        const freqs = type === 'in' ? [523.25, 659.25, 783.99, 1046.50] : [1046.50, 783.99, 659.25, 523.25];
        
        freqs.forEach((f, index) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + (index * 0.06));

            gain.gain.setValueAtTime(0.2, now + (index * 0.06));
            gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.06) + 0.2);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + (index * 0.06));
            osc.stop(now + (index * 0.06) + 0.2);
        });
    }

    playSuccessTone() {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    playAlertTone() {
        const now = this.audioCtx.currentTime;
        for (let i = 0; i < 2; i++) {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, now + (i * 0.15));
            osc.frequency.setValueAtTime(800, now + (i * 0.15) + 0.07);

            gain.gain.setValueAtTime(0.2, now + (i * 0.15));
            gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.15) + 0.12);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + (i * 0.15));
            osc.stop(now + (i * 0.15) + 0.12);
        }
    }

    playBellTone() {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    playModernTone(type) {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(type === 'in' ? 700 : 500, now);
        osc.frequency.setValueAtTime(type === 'in' ? 900 : 700, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('attendance_sound_muted', this.isMuted);
        this.saveToFirebase();
        return this.isMuted;
    }

    setTone(toneName) {
        this.currentTone = toneName;
        localStorage.setItem('attendance_sound_tone', toneName);
        this.saveToFirebase();
    }

    // مزامنة غير متزامنة في الخلفية لضمان عدم بطء فتح التطبيق
    async syncWithFirebase() {
        if (!this.databaseUrl) return;
        try {
            const response = await fetch(`${this.databaseUrl}/settings/sound.json`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    if (data.isMuted !== undefined) {
                        this.isMuted = data.isMuted;
                        localStorage.setItem('attendance_sound_muted', this.isMuted);
                    }
                    if (data.currentTone) {
                        this.currentTone = data.currentTone;
                        localStorage.setItem('attendance_sound_tone', this.currentTone);
                    }
                }
            }
        } catch (e) {
            console.log("العمل دون اتصال بالإنترنت، جاري استخدام الذاكرة المحلية.");
        }
    }

    async saveToFirebase() {
        if (!this.databaseUrl) return;
        try {
            await fetch(`${this.databaseUrl}/settings/sound.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isMuted: this.isMuted, currentTone: this.currentTone })
            });
        } catch (e) {
            // تجاهل صامت لتفادي أي تأثير على الأداء
        }
    }
}

const attendanceSound = new AttendanceSoundManager();
