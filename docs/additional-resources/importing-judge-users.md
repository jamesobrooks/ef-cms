# Importing Judge Users

To import judge users into the system in bulk:

```
ENV=[ENV] FILE_NAME=[csv file path] ./scripts/bulk-import-judge-users.sh
```

Locally:

```
ENV=local FILE_NAME=[csv file name] node ./scripts/data-import/judge/bulkImportJudgeUsers.js 
```

A CSV file is included in the repo: [judge_users.csv](../web-api/judge_users.csv). The data fields should be in the same order as the provided CSV file.

Running the script will generate a log file, `bulk-import-log.txt`. Users that were successfully created will receive an email with login instructions. Any errors will be printed to the log file for further evaluation.
