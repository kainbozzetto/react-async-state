FROM node:10

COPY ./ /srv/web

WORKDIR /srv/web

RUN yarn install
