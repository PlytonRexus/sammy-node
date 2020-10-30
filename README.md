## Heroku Instructions
```sh
heroku create sm-web

heroku buildpacks:add heroku-community/apt
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-ci-redis.git
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
heroku buildpacks:add heroku/nodejs

heroku addons:create heroku-redis

heroku config:add DENSECAP_KEY=<YOUR_DENSECAP_KEY> REQUEST_TIMEOUT=<TIMEOUT> DEBUG_SAM=<true/false>

git push heroku master
heroku ps:scale worker=1
```