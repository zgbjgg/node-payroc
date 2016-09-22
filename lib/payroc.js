'use strict';

/* Requires */
var request = require('request')
var js2xmlparser = require("js2xmlparser");
var parseString = require('xml2js').parseString;

module.exports = function () {

  /* Options */
  var default_options = {
    apiKey: '2F822Rw39fx762MaV7Yy86jXGTC7sCDy',
    gatewayUrl: 'https://payroc.transactiongateway.com/api/v2/three-step',
    redirectUrl: 'http://127.0.0.1:8000/token'
  }

  /* Function for updating the default options for the
     given options */
  function update_options(new_options, options) {
    for (var opt in options) {
      new_options[opt] = options[opt];
    }
    return new_options;
  }

  /* Function to retrive the default options */
  function get_default_options() {
    return default_options;
  }
	
  /* Function to initialize options on SDK */
  function configure(options) {
    if (options !== undefined && typeof options === 'object') {
      default_options = update_options(default_options, options);
    }
  }

  /* Function to execute step one */
  function step_one(params, callback) {
    /* add api key and redirect url */
    params['api-key'] = get_default_options().apiKey;
    params['redirect-url'] = get_default_options().redirectUrl;
    var errorf = null;

    // to xml
    var xmlRequest = js2xmlparser.parse("sale", params);

    // send request
    request.post({
      url: get_default_options().gatewayUrl,
      body : xmlRequest,
      headers: {'Content-Type': 'text/xml'}
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        parseString(body, function(err, result) {
          callback(errorf, result);
        });
      } else {
        errorf = new Error('failed to send request')
        errorf.description = error;
        callback(errorf, {});
      }
    });
  }

  /* Function to execute step two */
  function step_two(params, callback) {
    var urlEncoded = params;
    var formUrl = urlEncoded['form-url'];
    delete urlEncoded['form-url'];
    var errorf = null;

    // send request
    request.post({
      url: formUrl,
      form: urlEncoded
    }, function(error, response, body) {
      if (!error && response.statusCode === 302) {
        // send redirect location back to client
        callback(errorf,{location: response.headers.location});
      } else {
        errorf = new Error('failed to send request')
        errorf.description = error;
        callback(errorf, {});
      }
    });
  }

  /* Must return all vars and/or function exported */
  return {
    configure: function(options) {
      configure(options)
    },

    step_one: function(params, callback) {
      step_one(params, callback)
    },

    step_two: function(params, callback) {
      step_two(params, callback)
    }
  } 
}
