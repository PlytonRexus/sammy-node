const http = require ("https");
const fs = require ('fs');
const path = require ('path');

const ytdl = require ("ytdl-core");

exports.fetchVideo = function (url) {
    let urlv = new URL(url);
    let uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let currentFilename = 'video-' + uniqueSuffix + ".mp4";
    let dest = path.join(__dirname, "..", "uploads", "tmp", currentFilename);
    let conf = { filter: format => format.container === 'mp4' };

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

            const request = http.get(url, response => {
                // Not sure what status codes are returned when.
                // This seriously needs fixing.

                if (response.statusCode >= 200 && response.statusCode < 300) {
                    response.pipe(file);
                } 
                else {
                    file.close();
                    fs.unlink(dest, () => {}); // Delete temp file
                    reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
                }
            });

            request.on("error", err => {
                file.close();
                fs.unlink(dest, () => {}); // Delete temp file
                reject(err.message);
            });

            file.on("finish", () => {
                if (process.env.DEBUG_SAM) console.log("File downloaded.", dest);
                resolve(dest);
            });

            file.on("error", err => {
                file.close();

                if (err.code === "EEXIST") {
                    reject("File already exists");
                } else {
                    fs.unlink(dest, () => {}); // Delete temp file
                    reject(err.message);
                }
            });
        });
    }
}