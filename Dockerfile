FROM node:22
LABEL maintainer="ezTeam <ezteam@couperin.org>"

ARG ARCHIVES_DIR_PATH
ARG RESULTS_DIR_PATH
ARG EZPAARSE_HOST

WORKDIR /usr/src/app

RUN npm i -g @ezpaarse-project/ezpaarse
RUN npm i -g @ezpaarse-project/ezmesure

RUN git clone https://github.com/ezpaarse-project/node-ezunpaywall.git

WORKDIR /usr/src/app/node-ezunpaywall
RUN npm ci
RUN npm i -g . 

WORKDIR /usr/src/app

COPY script.js ./script.js

CMD ["node script.js"]