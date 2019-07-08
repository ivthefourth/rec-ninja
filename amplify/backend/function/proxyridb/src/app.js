/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/




const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const url = require('url');

const ridbUrl = 'https://ridb.recreation.gov/api/v1';

module.exports = (axios) => {
  // declare a new express app
  const app = express()
  app.use(bodyParser.json())
  app.use(awsServerlessExpressMiddleware.eventContext())


  // Enable CORS for all methods
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
  });

  app.get('/recareas', function(req, res, next) {
    const query = url.parse(req.url).query;
    axios.get(`${ridbUrl}/recareas?full&${query}`)
      .then(ridbRes => res.json(ridbRes.data))
      .catch(next)
  });
    
  app.get('/recareas/:id', function(req, res, next) {
    axios.get(`${ridbUrl}/recareas/${req.params.id}?full`)
      .then(ridbRes => res.json(ridbRes.data))
      .catch(next)
  });


  app.listen(3000, function() {
    console.log("App started")
  });
    

 return app;
}
