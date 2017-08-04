import EchoEffect from './effects/echo-effect.js';
import RobotEffect from './effects/robot-effect.js';
import VolumeEffect from './effects/volume-effect.js';

const effectTypes = {
    ROBOT: 'robot',
    REVERSE: 'reverse',
    LOUDER: 'higher',
    SOFTER: 'lower',
    FASTER: 'faster',
    SLOWER: 'slower',
    ECHO: 'echo'
};

class AudioEffects {
    static get effectTypes () {
        return effectTypes;
    }
    constructor (buffer, name) {
        // Some effects will modify the playback rate and/or number of samples.
        // Need to precompute those values to create the offline audio context.
        let sampleCount = buffer.length;
        let playbackRate = 1;
        switch (name) {
        case effectTypes.ECHO:
            sampleCount = buffer.length + 0.25 * 3 * buffer.sampleRate;
            break;
        case effectTypes.FASTER:
            playbackRate = 1.5;
            sampleCount = Math.floor(buffer.length / playbackRate);
            break;
        case effectTypes.SLOWER:
            playbackRate = 0.5;
            sampleCount = Math.floor(buffer.length / playbackRate);
            break;
        case effectTypes.REVERSE:
            buffer.getChannelData(0).reverse();
            break;
        }

        this.audioContext = new OfflineAudioContext(1, sampleCount, buffer.sampleRate);
        this.buffer = buffer;
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.playbackRate.value = playbackRate;
        this.name = name;
    }
    process () {
        // Some effects need to use more nodes and must expose an input and output
        let input;
        let output;
        switch (this.name) {
        case effectTypes.LOUDER:
            ({input, output} = new VolumeEffect(this.audioContext, 1.5));
            break;
        case effectTypes.SOFTER:
            ({input, output} = new VolumeEffect(this.audioContext, 0.5));
            break;
        case effectTypes.ECHO:
            ({input, output} = new EchoEffect(this.audioContext, 0.25));
            break;
        case effectTypes.ROBOT:
            ({input, output} = new RobotEffect(this.audioContext, 0.25));
            break;
        }

        if (input && output) {
            this.source.connect(input);
            output.connect(this.audioContext.destination);
        } else {
            // No effects nodes are needed, wire directly to the output
            this.source.connect(this.audioContext.destination);
        }

        this.source.start();

        return this.audioContext.startRendering();
    }
}

export default AudioEffects;
