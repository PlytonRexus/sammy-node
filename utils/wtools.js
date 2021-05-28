let https = require ('https');
let http = require ('http');
const fs = require ('fs');
const path = require ('path');

const ytdl = require ("ytdl-core");
const fetch = require ("node-fetch");
/**
 * Downloads .mp4 video from provided URL and returns
 * the file path of the local copy
 * Uses https.get(), requires internet
 * Can manage youtube files with hosts: www.youtube.com
 * and youtu.be
 * 
 * Stores in /uplods/tmp
 *
 * @param {string} url
 * @returns {Promise<string>} Address of the video
 */
exports.fetchVideo = function (url) {
    let urlv = new URL(url);
    let uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let currentFilename = 'video-' + uniqueSuffix + ".mp4";
    let dest = path.join(__dirname, "..", "uploads", "tmp", currentFilename);
    let conf = { filter: format => format.container === 'mp4' };

    // if (urlv.protocol == "http:")
    //     https = http;

    if (urlv.host === "www.youtube.com") {
        return new Promise(async (resolve, reject) => {
            try {
                let str = fs.createWriteStream(dest);
                ytdl(urlv.href, conf).pipe(str);
                str.on('close', function() {
                    resolve(dest);
                });
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });
    } else if (urlv.host === "youtu.be") {
        return new Promise(async (resolve, reject) => {
            try {
                let str = fs.createWriteStream(dest);
                ytdl("https://www.youtube.com/watch?v=" 
                    + urlv.pathname.substr(1) 
                    + "&feature=youtu.be", conf)
                    .pipe(str);
                str.on('close', function() {
                    resolve(dest);
                });
            } catch (err) {
                reject(err);
            }
        });
    } else {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest, { flags: "wx" });

            const request = https.get(url, response => {
                // Not sure what status codes are returned when.
                // This seriously needs fixing.

                if (response.statusCode >= 200 && response.statusCode < 300) {
                    if (process.env.DEBUG_SAM) 
                        console.log("Download started from " + urlv.href + ".");
                    response.pipe(file);
                } 
                else {
                    file.close();
                    fs.unlink(dest, () => {}); // Delete temp file
                    reject
                    (`Server responded with ${response.statusCode}: ${response.statusMessage}`);
                }
            }).on("error", err => {
                file.close();
                fs.unlink(dest, () => {}); // Delete temp file
                reject(err.message);
            });

            file.on("finish", () => {
                file.close(() => {
                    if (process.env.DEBUG_SAM) 
                        console.log("File downloaded at:", dest);
                    resolve(dest)
                });
            });

            file.on("error", err => {
                file.close();

                if (err.code === "EEXIST") {
                    reject("File already exists");
                } else {
                    fs.unlink(dest, () => {}); // Delete temp file
                    console.log(err.message);
                    reject(err.message);
                }
            });
        });
    }
}
/**
 * Converts a local address to a URL in the format
 * https://sm-web2.herokuapp.com/uploads/tmp/example.mp4 (by default)
 *
 * @param {string} addr
 * @param {string} [origin="https://sm-web2.herokuapp.com"]
 * @returns {URL|null} A URL instance of the address
 */
const addrToUrl = function(addr, origin = "https://sm-web2.herokuapp.com") {
    let pathname = addr.match(/\/uploads\/tmp\/*/i);
    if (pathname)
        return new URL(origin + pathname[0]);
    return null;
}
/**
 * Fires a post request to https://sammy-audio.herokuapp.com/vid/link
 * to create a transcription job for the provided video
 * Uses fetch, requires internet
 *
 * @param {string} url
 * @param {string} vidAddr
 * @returns {number} Job ID of the started job at Audio API
 */
exports.postAudioReq = async function(url, vidAddr) {
    let urlv, 
        targetUrl = 'https://sammy-audio.herokuapp.com/vid/link';
    
    if (url)
        urlv = new URL(url);
    if (vidAddr)
        urlv = addrToUrl(vidAddr);
        
    let finalUrl = `${targetUrl}?url=${urlv.href}`;
    let res = await fetch(finalUrl, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json" 
        }
    });

    res = await res.json();

    console.log(res);

    return (parseInt(res.id));
}
/**
 * Sets the request timeout in express for local environments
 * Won't be useful on platforms with fixed timeouts like Heroku,
 * but the route will keep working
 * 
 * Middleware
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
exports.reqTimeout = function (req, res, next) {
    req.setTimeout(parseInt(process.env.REQUEST_TIMEOUT || 30, 10) * 60 * 1000);
    next();
}