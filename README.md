## Heroku Instructions
```sh
heroku create sm-web
heroku buildpacks:add heroku-community/apt
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
heroku buildpacks:add heroku/nodejs
heroku addons:create heroku-redis
git push heroku master
heroku ps:scale worker=1
```