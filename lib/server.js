/**
 * Node Web Thing server implementation.
 */
'use strict';

const http = require('http');

let https;
let fs;

try {
  https = require('https');
  fs = require('fs');
} catch (err) {
  console.log('warning: https module is not usable');
}

const express = require('iotjs-express');
/**
 * A container for a single thing.
 */


function SingleThing(thing) {
  const _this = this;

  /**
   * Initialize the container.
   *
   * @param {Object} thing The thing to store
   */
  {
    this.thing = thing;
  }
  /**
   * Get the thing at the given index.
   */

  this.getThing = function() {
    return _this.thing;
  };
  /**
   * Get the list of things.
   */


  this.getThings = function() {
    return [_this.thing];
  };
  /**
   * Get the mDNS server name.
   */


  this.getName = function() {
    return _this.thing.title;
  };
}
/**
 * A container for multiple things.
 */


function MultipleThings(things, name) {
  const _this2 = this;

  /**
   * Initialize the container.
   *
   * @param {Object} things The things to store
   * @param {String} name The mDNS server name
   */
  {
    this.things = things;
    this.name = name;
  }
  /**
   * Get the thing at the given index.
   *
   * @param {Number|String} idx The index
   */

  this.getThing = function(idx) {
    idx = parseInt(idx);

    if (isNaN(idx) || idx < 0 || idx >= _this2.things.length) {
      return null;
    }

    return _this2.things[idx];
  };
  /**
   * Get the list of things.
   */


  this.getThings = function() {
    return _this2.things;
  };
  /**
   * Get the mDNS server name.
   */


  this.getName = function() {
    return _this2.name;
  };
}
/**
 * Base handler that is initialized with a list of things.
 */


function BaseHandler(things) {
  const _this3 = this;

  /**
   * Initialize the handler.
   *
   * @param {Object} things List of Things managed by the server
   */
  {
    this.things = things;
  }
  /**
   * Get the thing this request is for.
   *
   * @param {Object} req The request object
   * @returns {Object} The thing, or null if not found.
   */

  this.getThing = function(req) {
    return _this3.things.getThing(req.params.thingId);
  };
}
/**
 * Handle a request to / when the server manages multiple things.
 */


function ThingsHandler(things) {
  const _this4 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function(req, res) {
    if (!req || req.method !== 'GET') {
      return;
    }

    const things = _this4.things.getThings();

    const descriptions = [];

    for (let idx = 0; idx < things.length; idx++) {
      const thing = things[idx];
      const description = thing.asThingDescription();
      description.href = thing.getHref();
      description.base = ''.concat(req.protocol, '://').concat(req.headers.host).concat(thing.getHref());
      description.securityDefinitions = {
        nosec_sc: {
          scheme: 'nosec',
        },
      };
      description.security = 'nosec_sc';
      descriptions.push(description);
    }

    res.json(descriptions);
  };
}
/**
 * Handle a request to /.
 */


function ThingHandler(things) {
  const _this5 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function(req, res) {
    const thing = _this5.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    const description = thing.asThingDescription();
    res.json(description);
  };
}
/**
 * Handle a request to /properties.
 */


function PropertiesHandler(things) {
  const _this6 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function(req, res) {
    const thing = _this6.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    res.json(thing.getProperties());
  };
}
/**
 * Handle a request to /properties/<property>.
 */


function PropertyHandler(things) {
  const _this7 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function(req, res) {
    const thing = _this7.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    const propertyName = req.params.propertyName;

    if (thing.hasProperty(propertyName)) {
      const body = {};
      body[propertyName] = thing.getProperty(propertyName);
      res.json(body);
    } else {
      res.status(404).end();
    }
  };
  /**
   * Handle a PUT request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */


  this.put = function(req, res) {
    if (!req || req.method !== 'PUT') {
      return;
    }

    const thing = _this7.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    const propertyName = req.params.propertyName;

    if (req.body.hasOwnProperty && !req.body.hasOwnProperty(propertyName)) {
      res.status(400).end();
      return;
    }

    if (thing.hasProperty(propertyName)) {
      try {
        thing.setProperty(propertyName, req.body[propertyName]);
      } catch (e) {
        res.status(400).end();
        return;
      }

      const body = {};
      body[propertyName] = thing.getProperty(propertyName);
      res.json(body);
    } else {
      res.status(404).end();
    }
  };
}
/**
 * Server to represent a Web Thing over HTTP.
 */


function WebThingServer(
/**
 * Initialize the WebThingServer.
 *
 * For documentation on the additional route handlers, see:
 * http://expressjs.com/en/4x/api.html#app.use
 *
 * @param {Object} things Things managed by this server -- should be of type
 *                        SingleThing or MultipleThings
 * @param {Number} port Port to listen on (defaults to 80)
 * @param {String} hostname Optional host name, i.e. mything.com
 * @param {Object} sslOptions SSL options to pass to the express server
 * @param {Object[]} additionalRoutes List of additional routes to add to
 *                                    server, i.e. [{path: '..', handler: ..}]
 * @param {String} basePath Base URL path to use, rather than '/'
 */
  things) {
  const _this8 = this;

  const port = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  let hostname = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  const sslOptions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  const additionalRoutes = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  const basePath = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '/';
  {
    this.things = things;
    this.name = things.getName();
    this.port = Number(port) || (sslOptions ? 443 : 80);
    this.hostname = hostname;
    this.basePath = basePath.replace(/\/$/, '');
    this.hosts = ['localhost', 'localhost:'.concat(port)];

    if (hostname) {
      hostname = hostname.toLowerCase();
      this.hosts.push(hostname, ''.concat(hostname, ':').concat(port));
    }

    this.basePath = basePath.replace(/\/$/, '');
    this.isMultipleThing = this.things.things;

    if (this.isMultipleThing) {
      const list = things.getThings();

      for (let i = 0; i < list.length; i++) {
        const thing = list[i];
        thing.setHrefPrefix(''.concat(this.basePath, '/').concat(i));
      }
    } else {
      things.getThing().setHrefPrefix(this.basePath);
    }

    this.app = express();

    if (sslOptions && https) {
      const options = {
        key: fs.readFileSync('ssl/'.concat(this.hostname, '/ssl.key')),
        cert: fs.readFileSync('ssl/'.concat(this.hostname, '/ssl.cert')),
      };
      this.server = https.createServer(options, this.app.request);
    } else {
      this.server = http.createServer(this.app.request);
    }

    const thingsHandler = new ThingsHandler(this.things);
    const thingHandler = new ThingHandler(this.things);
    const propertiesHandler = new PropertiesHandler(this.things);
    const propertyHandler = new PropertyHandler(this.things);
    this.router = this.app;

    if (this.isMultipleThing) {
      this.router.get('/', function(req, res) {
        return thingsHandler.get(req, res);
      });
      this.router.get('/:thingId', function(req, res) {
        return thingHandler.get(req, res);
      });
      this.router.get('/:thingId/properties', function(req, res) {
        return propertiesHandler.get(req, res);
      });
      this.router.get('/:thingId/properties/:propertyName', function(req, res) {
        return propertyHandler.get(req, res);
      });
      this.router.put('/:thingId/properties/:propertyName', function(req, res) {
        return propertyHandler.put(req, res);
      });
    } else {
      this.router.get('/', function(req, res) {
        return thingHandler.get(req, res);
      });
      this.router.get('/properties', function(req, res) {
        return propertiesHandler.get(req, res);
      });
      this.router.get('/properties/:propertyName', function(req, res) {
        return propertyHandler.get(req, res);
      });
      this.router.put('/properties/:propertyName', function(req, res) {
        return propertyHandler.put(req, res);
      });
    }

    if (additionalRoutes) {
      console.log('TODO: implement this in iotjs-express');
    }
  }
  /**
   * Start listening for incoming connections.
   */

  this.start = function() {
    try {
      return _this8.server.listen(_this8.port);
    } catch (err) {
      console.error('error: Fail to listen (check HTTP port "'.concat(_this8.port, '")'));
      throw err;
    }
  };
  /**
   * Stop listening.
   */


  this.stop = function() {
    return _this8.server.close();
  };
}

module.exports = {
  MultipleThings: MultipleThings,
  SingleThing: SingleThing,
  WebThingServer: WebThingServer,
};
