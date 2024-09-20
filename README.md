# ezPAARSE process

This repository is a template for automating log processing with ezpaarse using the ezp command and loading ECs using the ezm command.

**Table of content**
- [Description](#Description)
- [Prerequisites](#Prerequisites)
- [Installation](#Installation)
- [Environment variables](#Environment-variables)

## Description

This is a docker container containing node scripts that will read the contents of the configuration file and run ezp and ezm according to it. These scripts generate logs and send an email at the end of all processing with a summary of what has happened. These scripts are called via a cron.

## Prerequisites

The tools you need to start this container run are :
* docker
* [ezpaarse](https://github.com/ezpaarse-project/ezpaarse) up
* [ezmesure](https://github.com/ezpaarse-project/ezmesure) up
* Good file architecture
* Configuration file

### File architecture required

```
/archives
└── <machine>
    ├── <portal>
    │   ├── <yyyy>
    │   │   ├── <yyyy-mm> 
    │   │   │   ├── <filename>.<yyyy>.<mm>.<dd>.log.gz

/results
└── <machine>
    ├── <portal>
    │   ├── <yyyy>
    │   │   ├── <yyyy-mm> 
    │   │   │   ├── <filename>.<yyyy>.<mm>.<dd>.ec.csv
    │   │   │   ├── <filename>.<yyyy>.<mm>.<dd>.report.json

```

### Configuration file template
```json
{
  "<machine>": [
    {
      "portal": "<portalName>",
      "headers": { 
        "<header-key>": "<header-value>"
      }
    }
  ],
}
```

## Environment variables

| name | description |
| ---  | --- |
| NODE_ENV | env of application | 
| TIMEZONE | Timezone of application |
| ARCHIVES_DIR_PATH | Path of the ‘archive’ folder containing the logs |
| RESULTS_DIR_PATH | Path of the ‘results’ folder containing ECs |
| EZPAARSE_HOST | ezPAARSE host for ezp command |
| EZMESURE_URL | URL of ezMESURE | 
| EZMESURE_USERNAME | ezMESURE username to create token | 
| EZMESURE_PASSWORD | ezMESURE password to create token | 
| EZUNPAYWALL_URL | URL of ezunpaywall | 
| EZUNPAYWALL_APIKEY | API key to enrich line with ezu log in JSON format | 
| ELASTIC_URL | Elastic URL to send data from log in JSON format | 
| SMTP_HOST | SMTP host | 
| SMTP_PORT | SMTP port | 
| NOTIFICATIONS_SENDER | email sender | 
| NOTIFICATIONS_RECEIVERS | emails receivers | 
| CRON_SCHEDULE | Schedule of cron | 

## Dev

1. Make sure you have ezpaarse and ezmesure start in dev mode on your machine
2. Create config.json on @/config and put your config inside
3. Start script node ./utils/dev to create log example
4. Create env.local.sh
5. Set all necessary env variables
6. Start docker compose up

## How to use

// TODO doc