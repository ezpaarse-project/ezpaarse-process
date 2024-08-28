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
    │   │   │   ├── file.log

/results
└── <machine>
    ├── <portal>
    │   ├── <yyyy>
    │   │   ├── <yyyy-mm> 
    │   │   │   ├── file.ec
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
| ARCHIVES_DIR_PATH | Path of the ‘archive’ folder containing the logs |
| RESULTS_DIR_PATH | Path of the ‘results’ folder containing ECs |
| EZPAARSE_HOST | ezPAARSE host for ezp command |
| EZMESURE_HOST | ezMESURE host for ezm command |