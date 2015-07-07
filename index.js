'use strict';

var util = require('./util.js'),
    got  = require('got'),
    et   = require('elementtree');

var isEmpty    = util.isEmpty,
    assignProp = util.assignProp,
    typedVal   = util.typedVal,
    createUrl  = util.createUrl;

var APP_ID  = '3H4296-5YPAGQUJK7',
    WEB_URL = 'http://www.wolframalpha.com/input/',
    API_URL = 'http://api.wolframalpha.com/v2/query';

var DEF_SCANTIMEOUT = 10;


function processPlaintext(plaintext){
    if (!plaintext)
        return plaintext;

    var lines = plaintext.split('\n');
    
    var COL_DELIM = ' | ';

    return lines.map(function(line){
        var cols = line.split(COL_DELIM);
        return cols.map(function(col){
            return col.trim();
        });
    });
}


function getLinks(pod){
    var links = [];

    pod.findall('infos/info/link').forEach(function(linkNode){
        var link = {};
        assignProp(link, 'text', linkNode.get('text'));
        assignProp(link, 'url',  linkNode.get('url'));

        if (isEmpty(link))
            return;

        links.push(link);
    });    

    return links;
}

function getSubpods(pod){
    var subpods = [];

    pod.findall('subpod').forEach(function(subpodNode){
        var subpod = {};

        var title     = subpodNode.get('title'),
            plaintext = processPlaintext(subpodNode.findtext('plaintext')),
            minput    = subpodNode.findtext('minput');

        assignProp(subpod, 'title', title);
        assignProp(subpod, 'plaintext', plaintext);
        assignProp(subpod, 'minput', minput);

        if (isEmpty(subpod))
            return;

        subpods.push(subpod);
    });

    return subpods;
}

function getPods(xmldoc){
    var pods = [];

    xmldoc.findall('pod').forEach(function(podNode){            
        var pod = {};
        assignProp(pod, 'title', podNode.get('title'));
        assignProp(pod, 'error', typedVal(podNode.get('error'), 'bool'));
        assignProp(pod, 'type', podNode.get('id'));
        assignProp(pod, 'scanner', podNode.get('scanner'));
        assignProp(pod, 'subpods', getSubpods(podNode));
        assignProp(pod, 'links', getLinks(podNode));

        if (isEmpty(pod))
            return; 

        pods.push(pod);
    });

    return pods;
}

function getResultInfo(xmldoc){
    var resultInfo = {};

    var resultNode = xmldoc.getroot();
    assignProp(resultInfo, 'id', resultNode.get('id'));
    assignProp(resultInfo, 'success', typedVal(resultNode.get('success'), 'bool'));
    assignProp(resultInfo, 'podcount', typedVal(resultNode.get('numpods'), 'number'));
    assignProp(resultInfo, 'timing', typedVal(resultNode.get('timing'), 'number'));
    assignProp(resultInfo, 'parsetiming', typedVal(resultNode.get('parsetiming'), 'number'));
    assignProp(resultInfo, 'datatypes', typedVal(resultNode.get('datatypes'), 'array'));
    assignProp(resultInfo, 'timedoutpods', typedVal(resultNode.get('timedoutpods'), 'array'));
    assignProp(resultInfo, 'version', typedVal(resultNode.get('version'), 'number'));

    return resultInfo;
}

function getResultError(xmldoc){
    var resultNode = xmldoc.getroot(),
        isError    = typedVal(resultNode.get('error'), 'bool');

    if (!isError)
        return null;

    var errCode = typedVal(resultNode.findtext('error/code'), 'number'),
        errMsg  = resultNode.findtext('error/msg');

    var err = new Error(errMsg);
    err.code = errCode;
    return err;
}

function execQuery(input, options, callback){
    if (arguments.length === 2)
        callback = options;

    callback = callback || Function.prototype;
    options = options || {};

    var query = {
        input: input,
        format: 'plaintext,minput',
        appid: APP_ID,
        scantimeout: DEF_SCANTIMEOUT
    };

    var queryParams = options.query || {};
    if (options.appId)
        queryParams.appid = options.appId;

    Object.keys(queryParams).forEach(function(paramName){
        query[paramName] = queryParams[paramName];
    });

    var queryUrl = createUrl(API_URL, query),
        url      = createUrl(WEB_URL, { i: query.input });

    got(queryUrl, function complete(err, xml){
        if (err) {
            callback(err);
            return;
        }

        var resDoc = et.parse(xml);

        var err = getResultError(resDoc);
        if (err) {
            callback(err, xml);
            return;
        }

        var outputType = options.outputType;

        if (outputType === 'xml') {
            callback(null, resDoc.tostring());
            return;
        }

        var info = getResultInfo(resDoc),
            pods = getPods(resDoc);

        var result = {
            url: url,
            queryUrl: queryUrl,
            query: query,
            info: info,
            pods: pods
        };

        if (outputType === 'json') {
            var json = JSON.stringify(result, null, 2);
            callback(null, json);
            return;
        }

        callback(null, result);
    });
}

module.exports = execQuery;
