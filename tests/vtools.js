const vtools = require ('../utils/vtools');
const { join } = require ('path');

const wtools = require ('../utils/wtools');
const xtools = require ('../utils/xtools');
// vtools
//     .getCaption(
//         "../uploads/jpg/frame-1601822039862-213147058-10.jpg")
//     .then((caps) => { console.log(caps) })
//     .catch(e => console.log(e));

function responder(vidAddr) {
    return new Promise(async resolve => {
    	console.log(vidAddr);
        let scenes = await vtools.extractScenes(vidAddr, 0.05);
        scenes.push(1.2);
        if (process.env.DEBUG_SAM) console.log("Scene changes extracted.", scenes);

        let frameObject = await vtools.extractFrames(vidAddr, scenes);
        if (process.env.DEBUG_SAM) console.log("Frames extracted.", frameObject);

        let i = 1,
            compressed = [];
        while (i <= frameObject.numberOfFrames) {
            compressed.push(await xtools.sharpValidation(
                join(
                    __dirname,
                    "..",
                    "uploads",
                    "jpg",
                    "frame-" + frameObject.suffix + `-${i}.jpg`
                ), "image/jpg"
            ));
            i += 1;
        }

        if (process.env.DEBUG_SAM) console.log("Frames compressed.", compressed.length);

        let captions = await vtools.getCaption(null, compressed);

        if (process.env.DEBUG_SAM) console.log("Captions received.", captions.length);

        let ocrs = await vtools.getOCR(null, compressed);

        if (process.env.DEBUG_SAM) console.log("OCR complete.", ocrs);

        // if (captions.length === scenes.length) {
        captions = captions.map(function(cap, idx) {
            return { time: Math.round(scenes[idx] * 1000), captions: cap[0].caption };
        });
        ocrs = ocrs.map((line, idx) => {
            return { "time": Math.round(scenes[idx] * 1000), "ocr": line }
        });
        // }

        let responseFinal = { "captions": captions, "ocr": ocrs };

        resolve(responseFinal);
    });
}

responder(join(__dirname, '../uploads/tmp/ElephantsDream.mp4'))
.then(resp => console.log(resp))
.catch(e => console.log(e));