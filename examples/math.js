'use strict';

const query = require('../index.js');

query('x^2')
  .then(data => console.log(JSON.stringify(data, null, 2)));
