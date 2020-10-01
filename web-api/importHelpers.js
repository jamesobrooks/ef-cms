const AWS = require('aws-sdk');
const fs = require('fs');
const { getUserToken } = require('./storage/scripts/loadTest/loadTestHelpers');

const getToken = async () => {
  const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.REGION,
  });

  return await getUserToken({
    cognito,
    env: process.env.ENV,
    password: process.env.USTC_ADMIN_PASS,
    username: 'ustcadmin@example.com',
  });
};

const getServices = async () => {
  const apigateway = new AWS.APIGateway({
    region: process.env.REGION,
  });
  const { items: apis } = await apigateway
    .getRestApis({ limit: 200 })
    .promise();

  return apis
    .filter(api => api.name.includes(`gateway_api_${process.env.ENV}`))
    .reduce((obj, api) => {
      obj[
        api.name.replace(`_${process.env.ENV}`, '')
      ] = `https://${api.id}.execute-api.${process.env.REGION}.amazonaws.com/${process.env.ENV}`;
      return obj;
    }, {});
};

const readCsvFile = file => {
  return fs.readFileSync(file, 'utf8');
};

module.exports = {
  getServices,
  getToken,
  readCsvFile,
};
