'use strict';

module.exports = {
  Property: require('./lib/property'),
  Thing: require('./lib/thing'),
  Value: require('./lib/value'),
  ...require('./lib/server'),
};
