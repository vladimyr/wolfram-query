'use strict';

const query = require('../index.js');

query('city Paris', { outputType: 'xml' }, (err, xml) => {
  if (err) {
    console.error('Error: ', err.message);
    return;
  }

  console.log(xml.write());
});
