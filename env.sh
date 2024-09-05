#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/env.local.sh"

export EZPAARSE_HOST="localhost:59599"

export EZMESURE_URL="https://localhost"
export EZMESURE_ADMIN_USERNAME="ezmesure-admin"
export EZMESURE_ADMIN_PASSWORD="changeme"

export EZUNPAYWALL_URL="https://unpaywall.inist.fr"
export EZUNPAYWALL_APIKEY="demo"

export ELASTIC_URL="https://localhost:9200"

export TIMEZONE="Europe/Paris"

export SMTP_HOST="maildev"
export SMTP_PORT="25"
export NOTIFICATIONS_SENDER="dev-ezpaarse-process@inist.fr"
export NOTIFICATIONS_RECEIVERS="test@test.fr"

export NODE_CONFIG='{ "smtp": { "secure": false, "ignoreTLS": true } }'
export NODE_ENV='development'

export CRON_SCHEDULE="30 1 * * * *"


if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi
