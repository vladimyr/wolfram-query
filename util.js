'use strict';

var Url = require('url');

function isEmpty(input){
    // null is allowed, undefined is not
    if (input === undefined)
        return true;
    if (input === null)
        return false;

    // boolean
    if (input === true || input === false)
        return false;

    // array-like
    if (input.length)
        return input.length === 0;

    // object
    if (typeof input === 'object')
        return Object.keys(input).length === 0;
    
    // coerce to boolean
    return !input;
}

function assignProp(obj, prop, val){
    if (isEmpty(val))
        return;

    obj[prop] = val;
}

function typedVal(str, type){
    if (isEmpty(str))
        return;

    if (type === 'array')
        return str.split(',');
    
    if (type === 'number')
        return Number(str);

    if (type === 'bool' || type === 'boolean')
        return str === true + '';

    return str;
}

function createUrl(baseUrl, query){
    var url = Url.parse(baseUrl);
    url.query = query;
    return Url.format(url);
}

module.exports = {
    isEmpty: isEmpty,
    assignProp: assignProp,
    typedVal: typedVal,
    createUrl: createUrl
};
