class MediaHandler {
    constructor() {
        this.audioCtx = null;
        this.stream = null;
        this.processor = null;
        this.nextStartTime = 0;
        this.activeSources = [];
    }

    async init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            await this.audioCtx.audioWorklet.addModule('/static/pcm-processor.js');
        }
        if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
    }

    async startMic(onData) {
        await this.init();
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    channelCount: 1
                } 
            });
            
            const source = this.audioCtx.createMediaStreamSource(this.stream);
            this.processor = new AudioWorkletNode(this.audioCtx, 'pcm-processor');

            this.processor.port.onmessage = (e) => {
                // Downsample from browser rate (e.g. 48k) to 16k
                const downsampled = this.downsampleBuffer(
                    e.data,
                    this.audioCtx.sampleRate,
                    16000
                );
                const pcm16 = this.float32ToInt16(downsampled);
                onData(pcm16);
            };

            source.connect(this.processor);
        } catch (err) {
            console.error('Mic error:', err);
            throw err;
        }
    }

    stopMic() {
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        if (this.processor) this.processor.disconnect();
        this.stream = null;
        this.processor = null;
    }

    playChunk(arrayBuffer) {
        if (!this.audioCtx) return;
        
        const float32 = this.int16ToFloat32(new Int16Array(arrayBuffer));
        const buffer = this.audioCtx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;
        this.nextStartTime = Math.max(now, this.nextStartTime);
        source.start(this.nextStartTime);
        this.nextStartTime += buffer.duration;

        this.activeSources.push(source);
        source.onended = () => {
            const idx = this.activeSources.indexOf(source);
            if (idx > -1) this.activeSources.splice(idx, 1);
        };
    }

    stopPlayback() {
        this.activeSources.forEach(s => { try { s.stop(); } catch(e){} });
        this.activeSources = [];
        this.nextStartTime = 0;
    }

    // Utils
    downsampleBuffer(buffer, sampleRate, outSampleRate) {
        if (outSampleRate === sampleRate) return buffer;
        const ratio = sampleRate / outSampleRate;
        const newLength = Math.round(buffer.length / ratio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
            let accum = 0, count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                accum += buffer[i];
                count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    }

    float32ToInt16(buffer) {
        let l = buffer.length;
        const res = new Int16Array(l);
        while (l--) res[l] = Math.min(1, Math.max(-1, buffer[l])) * 0x7FFF;
        return res.buffer;
    }

    int16ToFloat32(buffer) {
        let l = buffer.length;
        const res = new Float32Array(l);
        while (l--) res[l] = buffer[l] / 0x8000;
        return res;
    }
}
