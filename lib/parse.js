'use strict';

const et = require('elementtree');
const utils = require('./utils.js');
const assign = utils.assign;
const isEmpty = utils.isEmpty;
const typedVal = utils.typedVal;

const COLUMN_DELIMITER = '|';

function processPlaintext(plaintext) {
  if (!plaintext) return plaintext;

  let lines = plaintext.split('\n');

  // Trim whitespace out of individual lines;
  // remove empty leftover lines
  return lines.map(line => parseLine(line))
              .filter(line => !isEmpty(line));
}

function getLinks(pod) {
  let links = [];

  pod.findall('infos/info/link').forEach(link => {
    let data = assign({}, {
      text: link.get('text'),
      url: link.get('url')
    });

    if (isEmpty(data)) return;
    links.push(data);
  });

  return links;
}

function getSubpods(pod) {
  let subpods = [];

  pod.findall('subpod').forEach(subpod => {
    let data = assign({}, {
      title: subpod.get('title'),
      plaintext: processPlaintext(subpod.findtext('plaintext')),
      minput: subpod.findtext('minput')
    });

    if (isEmpty(data)) return;
    subpods.push(data);
  });

  return subpods;
}

module.exports = function parse(xml) {
  let source = et.parse(xml);
  let err = getResultError(source);
  let info = getResultData(source);

  return {
    err, source,
    data() { return { info, pods: getPods(source) }; }
  };
};

function getPods(xmldoc) {
  let pods = [];

  xmldoc.findall('pod').forEach(pod => {
    let data = assign({}, {
      title: pod.get('title'),
      error: typedVal(pod.get('error'), 'bool'),
      type: pod.get('id'),
      scanner: pod.get('scanner'),
      subpods: getSubpods(pod),
      links: getLinks(pod)
    });

    if (isEmpty(data)) return;
    pods.push(data);
  });

  return pods;
}

function getResultError(xmldoc) {
  let root = xmldoc.getroot();

  let isError = typedVal(root.get('error'), 'bool');
  if (!isError) return null;

  // Extract error details.
  let code = typedVal(root.findtext('error/code'), 'number');
  let message = root.findtext('error/msg');

  // Return error instance.
  let err = new Error(message);
  err.code = code;
  return err;
}


function getResultData(xmldoc) {
  let root = xmldoc.getroot();

  let data = assign({}, {
    id: root.get('id'),
    success: typedVal(root.get('success'), 'bool'),
    podcount: typedVal(root.get('numpods'), 'number'),
    timing: typedVal(root.get('timing'), 'number'),
    parsetiming: typedVal(root.get('parsetiming'), 'number'),
    datatypes: typedVal(root.get('datatypes'), 'array'),
    timedoutpods: typedVal(root.get('timedoutpods'), 'array'),
    version: typedVal(root.get('version'), 'number'),
  });

  return data;
}

function parseLine(line, columnDelimiter) {
  columnDelimiter = columnDelimiter || COLUMN_DELIMITER;

  return line.split(columnDelimiter)
             .map(column => column.trim())
             .filter(column => !isEmpty(column));
}
