const { join } = require ('path');
const tesseract = require("node-tesseract-ocr");

const config = {
    lang: "eng",
    oem: 1,
    psm: 3,
};

// we can also make it eng+hin or hin+eng but traineddata will be
// required at `/usr/share/tesseract-ocr/4.00/tessdata/hin.traineddata`

tesseract.recognize("/home/mihir/Pictures/Screenshot from 2020-10-06 01-34-24.png", config)
// join(__dirname, "..", "/uploads/jpg/frame-1601822039862-213147058-10.jpg")
.then(text => {
    console.log("Result:", text)
})
.catch(error => {
    console.log(error.message)
});