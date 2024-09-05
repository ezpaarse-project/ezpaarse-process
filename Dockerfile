FROM node:22
LABEL maintainer="ezTeam <ezteam@couperin.org>"

ENV HOME /usr/src/app
RUN mkdir -p $HOME/.config

ARG NODE_ENV
ARG ARCHIVES_DIR_PATH
ARG RESULTS_DIR_PATH
ARG EZPAARSE_HOST
ARG EZMESURE_ADMIN_USERNAME
ARG EZMESURE_ADMIN_PASSWORD
ARG EZMESURE_URL
ARG EZUNPAYWALL_URL
ARG EZUNPAYWALL_APIKEY
ARG ELASTIC_URL
ARG TIMEZONE
ARG SMTP_HOST
ARG SMTP_PORT
ARG NOTIFICATIONS_SENDER
ARG NOTIFICATIONS_RECEIVERS
ARG CRON_SCHEDULE

WORKDIR /usr/src/app

RUN npm i -g @ezpaarse-project/ezpaarse
RUN npm i -g @ezpaarse-project/ezmesure

RUN git clone https://github.com/ezpaarse-project/node-ezunpaywall.git

WORKDIR /usr/src/app/node-ezunpaywall
RUN npm i -g . --install-links

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY ./bin ./bin
COPY ./lib ./lib