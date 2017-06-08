'use strict';

function isEmpty(input){
  // Disallow undefined values.
  if (input === undefined) return true;

  if (input === null) return false;
  if (input === true || input === false) return false;

  // Disallow empty arrays.
  if (input.length) return input.length === 0;

  // Disallow empty objects.
  if (typeof input === 'object') return Object.keys(input).length === 0;

  // Coerce input to boolean.
  return !input;
}

function typedVal(str, type){
  if (isEmpty(str)) return;
  if (type === 'array') return str.split(',');
  if (type === 'number') return parseInt(str, 10);
  if (type === 'bool' || type === 'boolean')  return str === true + '';
  return str;
}

function set(dest, prop, val) {
  if (!isEmpty(val)) dest[prop] = val;
}

function assign(dest, source) {
  source = source || {};
  Object.keys(source)
    .forEach(prop => set(dest, prop, source[prop]));
  return dest;
}

module.exports = {
  isEmpty,
  typedVal,
  assign
};
