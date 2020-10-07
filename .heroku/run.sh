#!/bin/bash
aptitude install python3.8
aptitude install python3-pip
pip3 install tensorflow
aptitude install ffmpeg
aptitude install tesseract-ocr
curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.8.1/deepspeech-0.8.1-models.pbmm -o $BUILD_DIR/binaries/models/deepspeech-0.8.1-models.pbmm
curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.8.1/deepspeech-0.8.1-models.scorer -o $BUILD_DIR/binaries/models/deepspeech-0.8.1-models.scorer
