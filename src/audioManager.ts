export class AudioManager {
    private ctx: AudioContext | null = null;
    private panner: PannerNode | null = null;
    private masterGain: GainNode | null = null;

    constructor() {
        // We'll initialize on user interaction to comply with browser policies
    }

    private init(): void {
        if (this.ctx) return;

        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);

        this.panner = this.ctx.createPanner();
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = 'inverse';
        this.panner.refDistance = 1;
        this.panner.maxDistance = 10000;
        this.panner.rolloffFactor = 1;
        this.panner.coneInnerAngle = 360;
        this.panner.coneOuterAngle = 0;
        this.panner.coneOuterGain = 0;
        this.panner.connect(this.masterGain);
    }

    public async resume(): Promise<void> {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    public playPop(x: number, y: number, z: number): void {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Setup positional panner
        const panner = this.ctx.createPanner();
        panner.positionX.value = x;
        panner.positionY.value = y;
        panner.positionZ.value = z;
        panner.connect(this.masterGain!);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(panner);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    public playInflate(x: number, y: number, z: number): void {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const panner = this.ctx.createPanner();
        panner.positionX.value = x;
        panner.positionY.value = y;
        panner.positionZ.value = z;
        panner.connect(this.masterGain!);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(panner);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    public playDraw(freq: number): void {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }
}
