FROM node:22
LABEL maintainer="ezTeam <ezteam@couperin.org>"

ENV HOME /usr/src/app
RUN mkdir -p $HOME/.config

ARG NODE_ENV
ARG TIMEZONE
ARG ARCHIVES_DIR_PATH
ARG RESULTS_DIR_PATH
ARG EZPAARSE_HOST
ARG EZMESURE_USERNAME
ARG EZMESURE_PASSWORD
ARG EZMESURE_URL
ARG EZUNPAYWALL_URL
ARG EZUNPAYWALL_APIKEY
ARG ELASTIC_URL
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
COPY . .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD [ "npm", "start" ]