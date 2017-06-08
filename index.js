'use strict';

const Url = require('url');
const parse = require('./lib/parse.js');
const got = require('got');
const noop = Function.prototype;

const DEFAULT_SCANTIMEOUT = 10;
const WEB_URL = 'http://www.wolframalpha.com/input/';
const API_URL = 'http://api.wolframalpha.com/v2/query';

module.exports = function(input, options={}, callback=noop) {
  let query = Object.assign({
    input,
    format: 'plaintext,minput',
    appid: options.appId || process.env.WOLFRAM_API_TOKEN,
    scantimeout: DEFAULT_SCANTIMEOUT
  }, options.query);

  if (!query.appid) {
    return Promise.reject(new Error('Wolfram API token is missing!'));
  }

  let queryUrl = createUrl(API_URL, query);
  let url = createUrl(WEB_URL, { i: query.input });

  options = Object.assign(options, { url, queryUrl });

  return got(queryUrl)
    .then(resp => processResponse(resp.body, options))
    .then(data => {
      callback(null, data);
      return data;
    })
    .catch(err => {
      callback(err);
      return Promise.reject(err);
    });
};

function createUrl(baseUrl, query) {
  let url = Url.parse(baseUrl);
  url.query = query;
  return Url.format(url);
}

function processResponse(xml, options) {
  let result = parse(xml);

  // Reject with parsed error.
  if (result.err) return Promise.reject(result.err);

  // Return parsed xml tree.
  if (options.outputType === 'xml') {
    return result.source;
  }

  // Return extracted data.
  let data = Object.assign({
    url: options.url,
    queryUrl: options.queryUrl,
    query: options.query
  }, result.data());
  return data;
}
