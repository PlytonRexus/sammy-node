## Prerequisite Dependencies

1. `node-tesseract-ocr`
- Tesseract
```sh
	aptitude install tesseract-ocr
```

2. `deepspeech`
- Model and Scorer
```sh
	# Download pre-trained English model files
	curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.8.1/deepspeech-0.8.1-models.pbmm
	curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.8.1/deepspeech-0.8.1-models.scorer
```
- Python3
```sh
	aptitude install python3
```
- TensorFlow
```sh
	pip3 install tensorflow
```
- Sox
```sh
	npm i sox
```

3. `@samuelcalegari/ds_ffmpeg`, `ffmpeg-extract-audio`, `ffmpeg-extract-frames-quality`
- ffmpeg
```sh
	aptitude install ffmpeg
```

## Heroku Instructions
```sh
heroku addons:create heroku-redis
git push heroku main
heroku ps:scale worker=1
```