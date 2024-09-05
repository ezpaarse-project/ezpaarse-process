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
    │   │   │   ├── <filename>.<y>.<mois>.<jour>.log.gz

/results
└── <machine>
    ├── <portal>
    │   ├── <yyyy>
    │   │   ├── <yyyy-mm> 
    │   │   │   ├── <filename>.<y>.<mois>.<jour>.ec.csv
    │   │   │   ├── <filename>.<y>.<mois>.<jour>.report.json

```

### Configuration file template
```json
{
  "<machine>": [
    {
      "portal": "<portal>",
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
| ARCHIVES_DIR_PATH | Path of the ‘archive’ folder containing the logs |
| RESULTS_DIR_PATH | Path of the ‘results’ folder containing ECs |
| EZMESURE_URL | URL of ezMESURE | 
| EZPAARSE_HOST | ezPAARSE host for ezp command |
| EZMESURE_HOST | ezMESURE host for ezm command |
| EZMESURE_ADMIN_USERNAME | ezMESURE admin username to create token | 
| EZMESURE_ADMIN_PASSWORD | ezMESURE admin password to create token | 
| EZUNPAYWALL_URL | URL of ezunpaywall | 
| EZUNPAYWALL_APIKEY | API key to enrich line with ezu log in JSON format | 
| ELASTIC_URL | Elastic URL to send data from log in JSON format | 
| TIMEZONE | Timezone of application | 
| SMTP_HOST | SMTP host | 
| SMTP_PORT | SMTP port | 
| NOTIFICATIONS_SENDER | email sender | 
| NOTIFICATIONS_RECEIVERS | | 
| CRON_SCHEDULE | Schedule of cron | 