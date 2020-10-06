const path = require ('path');
const Fs = require('fs');

const DeepSpeech = require('deepspeech');
const Sox = require('sox-stream');
const MemoryStream = require('memory-stream');
const Duplex = require('stream').Duplex;
const Wav = require('node-wav');

const { delay } = require ('./xtools');

let modelPath = 
	path.join(__dirname, "..", "binaries", "models", "deepspeech-0.8.1-models.pbmm");
let scorerPath = 
	path.join(__dirname, "..", "binaries", "scorers", "deepspeech-0.8.1-models.scorer");

let model = new DeepSpeech.Model(modelPath);
let desiredSampleRate = model.sampleRate();

model.enableExternalScorer(scorerPath);

const defaultRoot = path.join(__dirname, "..", "uploads", "wav");

function Ds_Wrap(filename, root, filePath) {
    let audioFile = filePath || path.join(root || defaultRoot, filename);

    if (!Fs.existsSync(audioFile)) {
        console.log('file missing:', audioFile);
        return { 
        	"error": "Something went wrong! You can troubleshoot in these ways: \n" + 
        		"1. Check if the file was valid, 2. Check if it was properly uploaded" }
    }

    const buffer = Fs.readFileSync(audioFile);
    const result = Wav.decode(buffer);

    if (result.sampleRate < desiredSampleRate) {
        console.error('Warning: original sample rate (' 
        	+ result.sampleRate 
        	+ ') is lower than ' 
        	+ desiredSampleRate 
        	+ 'Hz. Up-sampling might produce erratic speech recognition.');
    }

    function bufferToStream(buffer) {
        let stream = new Duplex();
        stream.push(buffer);
        stream.push(null);
        return stream;
    }

    let audioStream = new MemoryStream();
    bufferToStream(buffer).
    pipe(Sox({
        global: {
            'no-dither': true,
        },
        output: {
            bits: 16,
            rate: desiredSampleRate,
            channels: 1,
            encoding: 'signed-integer',
            endian: 'little',
            compression: 0.0,
            type: 'raw'
        }
    })).
    pipe(audioStream);

    const render = () => {
        let audioBuffer = audioStream.toBuffer();

        const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate);
        console.log('audio length', audioLength);

        let metadata = model.sttWithMetadata(audioBuffer),
            tokens = metadata.transcripts[0].tokens;

        let result = [];

        for (var i = 0; i < tokens.length; i++) {
            if (result.length === 0) {
                result.push({ time: tokens[i].start_time, word: "" });
                result[result.length - 1].word += tokens[i].text;
                continue;
            }

            if (tokens[i].text !== " " && tokens[i - 1].text !== " ") {
                result[result.length - 1].word += tokens[i].text;
            } else if (tokens[i].text !== " " && tokens[i - 1].text === " ") {
                result.push({ time: tokens[i].start_time, word: tokens[i].text });
            } else if (tokens[i].text == " ") {
                continue;
            }
        }
        return { file: { length: audioLength, savedAs: filename }, words: result };
    };

    return new Promise(resolve => audioStream.on('finish', function() {
    	const result = render(...arguments);
    	resolve(result);
    }));
}

module.exports = {
	Ds_Wrap
}