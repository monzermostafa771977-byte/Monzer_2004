/**
 * soundManager.js - نظام التنبيهات الصوتية للتطبيق
 */
class AttendanceSoundManager {
    constructor() { this.audioCtx = null; }
    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') { this.audioCtx.resume(); }
    }
    play(actionType = 'in') {
        try {
            this.initAudioContext();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            let freq = actionType === 'out' ? 587 : 880;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.35);
        } catch (e) {}
    }
}
const attendanceSound = new AttendanceSoundManager();
