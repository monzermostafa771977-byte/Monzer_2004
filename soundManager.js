/**
 * نظام التنبيهات الصوتية المتكامل للحضور والانصراف
 * يدعم: الوضع الصامت، تغيير النغمات، والحفظ التلقائي في LocalStorage
 */

class AttendanceSoundManager {
    constructor() {
        this.isMuted = localStorage.getItem('attendance_sound_muted') === 'true';
        this.currentTone = localStorage.getItem('attendance_sound_tone') || 'beep';
        this.audioCtx = null;
    }

    // تهيئة محرك الصوت (Web Audio API)
    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // تشغيل التنبيه (نوع الحضور: 'in' أو الانصراف: 'out')
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
                case 'beep':
                default:
                    this.playDefaultBeep(type);
                    break;
            }
        } catch (e) {
            console.error("خطأ في تشغيل الصوت:", e);
        }
    }

    // النغمة القياسية
    playDefaultBeep(type) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'in' ? 880 : 587.33, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    // نغمة جرس رقيقة
    playChimeTone(type) {
        const now = this.audioCtx.currentTime;
        const freqs = type === 'in' ? [523.25, 659.25, 783.99] : [783.99, 659.25, 523.25];
        
        freqs.forEach((f, index) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + (index * 0.08));

            gain.gain.setValueAtTime(0.08, now + (index * 0.08));
            gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.08) + 0.25);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + (index * 0.08));
            osc.stop(now + (index * 0.08) + 0.25);
        });
    }

    // نغمة نجاح
    playSuccessTone() {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // نغمة تنبيه مميزة
    playAlertTone() {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(450, now + 0.1);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // تبديل وضع كتم الصوت
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('attendance_sound_muted', this.isMuted);
        return this.isMuted;
    }

    // تغيير النغمة
    setTone(toneName) {
        this.currentTone = toneName;
        localStorage.setItem('attendance_sound_tone', toneName);
    }
}

// تصدير كائن جاهز للاستخدام الفوري في المشروع
const attendanceSound = new AttendanceSoundManager();
