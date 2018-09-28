
'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests

var request = require('request');
var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());


// Endpoint to be call from the client side
app.post('/api/message', function (req, res) {

  var payload = {

    input: req.body.input || {"text":"show menu"}
  };
	//console.log(req.body.input);
  let options = {
method: "POST",
headers: {"Content-Type": "application/json"},
url: "https://survival-network-system.eu-gb.mybluemix.net/survival-chatbot",
json: payload.input 
};

request(options, (error, response, body) => 
{

if (error)
{
console.log('Error<request>: ' + error);
}
else
{
let Response = body;
 
if (error)
{
console.log('Error<request>: ' + error);
}
else
{
	//console.log(JSON.stringify(Response));
	 // This is a fix for now, as since Assistant version 2018-07-10,
    // output text can now be in output.generic.text
    var output = Response.output;
    if (output.text.length === 0 && output.hasOwnProperty('generic')) {
      var generic = output.generic;

      if (Array.isArray(generic)) {
        // Loop through generic and add all text to data.output.text.
        // If there are multiple responses, this will add all of them
        // to the response.
        for(var i = 0; i < generic.length; i++) {
          if (generic[i].hasOwnProperty('text')) {
            Response.output.text.push(generic[i].text);
          
          }else if (generic[i].hasOwnProperty('title')) {
            Response.output.text.push(generic[i].title);
          }
        }
      }
    }
	console.log(JSON.stringify(Response));
	return res.json(updateMessage(payload, Response));

}
}
});

 
  });

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

module.exports = app;