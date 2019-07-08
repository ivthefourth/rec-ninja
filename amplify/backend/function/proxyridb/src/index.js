const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const axios = require('axios');

const AWS = require('aws-sdk');

const secretsManager = new AWS.SecretsManager({
  region: "us-west-2"
});

const secrets = secretsManager.getSecretValue({SecretId: 'ridb'}).promise()
  .then(({SecretString}) => { 
    axios.defaults.headers.common['apikey'] = JSON.parse(SecretString).RIDB_API_KEY;
  }) 

const server = awsServerlessExpress.createServer(app(axios));

exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  secrets.then(() => {
    awsServerlessExpress.proxy(server, event, context);
  })
  .catch(err => {
    console.log(`Secrets Error: ${err}`)
  });
};
