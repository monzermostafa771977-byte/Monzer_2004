/**
 * soundManager.js - نظام الصوت والتنبيهات الخلفية (غير معيق للواجهة)
 * يعمل بتزامن خلفي ويدعم جميع خيارات الحضور، الانصراف، السهر، والعطلات.
 */

class AttendanceSoundManager {
    constructor() {
        this.isMuted = localStorage.getItem('attendance_sound_muted') === 'true';
        this.currentTone = localStorage.getItem('attendance_sound_tone') || 'beep';
        this.databaseUrl = "https://monzer-771977-default-rtdb.europe-west1.firebasedatabase.app";
        this.audioCtx = null;
        this.syncWithFirebase();
    }

    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    play(actionType = 'in') {
        if (this.isMuted) return;
        this.initAudioContext();

        try {
            switch (this.currentTone) {
                case 'chime':
                    this.playChime(actionType);
                    break;
                case 'success':
                    this.playSuccess();
                    break;
                case 'bell':
                    this.playBell();
                    break;
                case 'beep':
                default:
                    this.playBeep(actionType);
                    break;
            }
        } catch (e) {
            console.error("خطأ في تشغيل الصوت:", e);
        }
    }

    playBeep(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        
        let freq = 880;
        if (type === 'out') freq = 587;
        if (type === 'overtime') freq = 1046;
        if (type === 'weekend') freq = 783;
        if (type === 'holiday') freq = 659;

        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);
    }

    playChime(type) {
        const now = this.audioCtx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + (idx * 0.05));
            gain.gain.setValueAtTime(0.25, now + (idx * 0.05));
            gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.05) + 0.2);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + (idx * 0.05));
            osc.stop(now + (idx * 0.05) + 0.2);
        });
    }

    playSuccess() {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playBell() {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
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

    async syncWithFirebase() {
        if (!this.databaseUrl) return;
        try {
            const res = await fetch(`${this.databaseUrl}/settings/sound.json`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    if (data.isMuted !== undefined) this.isMuted = data.isMuted;
                    if (data.currentTone) this.currentTone = data.currentTone;
                }
            }
        } catch (e) {}
    }

    async saveToFirebase() {
        if (!this.databaseUrl) return;
        try {
            await fetch(`${this.databaseUrl}/settings/sound.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isMuted: this.isMuted, currentTone: this.currentTone })
            });
        } catch (e) {}
    }
}

const attendanceSound = new AttendanceSoundManager();
