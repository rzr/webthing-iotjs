'use strict';

module.exports = {
  Property: require('./lib/property'),
  Thing: require('./lib/thing'),
  Value: require('./lib/value'),
  server: require('./lib/server')
};
module.exports.MultipleThings = module.exports.server.MultipleThings;
module.exports.SingleThing = module.exports.server.SingleThing;
module.exports.WebThingServer = module.exports.server.WebThingServer;