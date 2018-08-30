/**
 * Node Web Thing server implementation.
 */
'use strict';

var http = require('http');

var express = require('./express.js');
/**
 * A container for a single thing.
 */


function SingleThing(thing) {
  var _this = this;

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

  this.getThing = function () {
    return _this.thing;
  };
  /**
   * Get the list of things.
   */


  this.getThings = function () {
    return [_this.thing];
  };
  /**
   * Get the mDNS server name.
   */


  this.getName = function () {
    return _this.thing.name;
  };

  return this;
}
/**
 * A container for multiple things.
 */


function MultipleThings(things, name) {
  var _this2 = this;

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

  this.getThing = function (idx) {
    idx = parseInt(idx);

    if (isNaN(idx) || idx < 0 || idx >= _this2.things.length) {
      return null;
    }

    return _this2.things[idx];
  };
  /**
   * Get the list of things.
   */


  this.getThings = function () {
    return _this2.things;
  };
  /**
   * Get the mDNS server name.
   */


  this.getName = function () {
    return _this2.name;
  };

  return this;
}
/**
 * Base handler that is initialized with a list of things.
 */


function BaseHandler(things) {
  var _this3 = this;

  /**
   * Initialize the handler.
   *
   * @param {Object} things List of Things managed by the server
   */
  this.things = things;
  /**
   * Get the thing this request is for.
   *
   * @param {Object} req The request object
   * @returns {Object} The thing, or null if not found.
   */

  this.getThing = function (req) {
    return _this3.things.getThing(req.params.thingId);
  };

  return this;
}
/**
 * Handle a request to / when the server manages multiple things.
 */


function ThingsHandler(things) {
  var _this4 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function (req, res) {
    if (!req || req.method !== 'GET') return;

    var things = _this4.things.getThings();

    var descriptions = [];

    for (var idx = 0; idx < things.length; idx++) {
      descriptions.push(things[idx].asThingDescription());
    }

    res.json(descriptions);
  };
}
/**
 * Handle a request to /.
 */


function ThingHandler(things) {
  var _this5 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function (req, res) {
    var thing = _this5.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    res.json(thing.asThingDescription());
  };
}
/**
 * Handle a request to /properties.
 */


function PropertiesHandler(things) {
  var _this6 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function (req, res) {
    var thing = _this6.getThing(req);

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
  var _this7 = this;

  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = function (req, res) {
    var thing = _this7.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    var propertyName = req.params.propertyName;

    if (thing.hasProperty(propertyName)) {
      var body = {};
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


  this.put = function (req, res) {
    if (!req || req.method !== 'PUT') return;

    var thing = _this7.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    var propertyName = req.params.propertyName;

    if (req.body.hasOwnProperty && !req.body.hasOwnProperty(propertyName)) {
      res.status(400).end();
      return;
    }

    if (thing.hasProperty(propertyName)) {
      try {
        thing.setProperty(propertyName, req.body[propertyName]);
      } catch (e) {
        res.status(403).end();
        return;
      }

      var body = {};
      body[propertyName] = thing.getProperty(propertyName);
      res.json(body);
    } else {
      res.status(404).end();
    }
  };

  return this;
}
/**
 * Server to represent a Web Thing over HTTP.
 */


function WebThingServer(things, port, sslOptions) {
  var _this8 = this;

  /**
   * Initialize the WebThingServer.
   *
   * @param {Object} things Things managed by this server -- should be of type
   *                        SingleThing or MultipleThings
   * @param {Number} port Port to listen on (defaults to 80)
   * @param {String} hostname Optional host name, i.e. mything.com
   * @param {Object} sslOptions SSL options to pass to the express server
   */
  {
    this.things = things;
    this.name = things.getName();
    this.port = Number(port) || (sslOptions ? 443 : 80);
    this.hosts = ['127.0.0.1', "127.0.0.1:".concat(port), 'localhost', "localhost:".concat(port)];
    this.isMultipleThing = this.things.things ? true : false;

    if (this.isMultipleThing) {
      var list = things.getThings();

      for (var i = 0; i < list.length; i++) {
        var thing = list[i];
        thing.setHrefPrefix("/".concat(i));
      }
    }

    this.app = express();
    this.server = http.createServer(this.app.request);
    var thingsHandler = new ThingsHandler(this.things);
    var thingHandler = new ThingHandler(this.things);
    var propertiesHandler = new PropertiesHandler(this.things);
    var propertyHandler = new PropertyHandler(this.things);

    if (this.isMultipleThing) {
      this.app.get('/', function (req, res) {
        return thingsHandler.get(req, res);
      });
      this.app.get('/:thingId', function (req, res) {
        return thingHandler.get(req, res);
      });
      this.app.get('/:thingId/properties', function (req, res) {
        return propertiesHandler.get(req, res);
      });
      this.app.get('/:thingId/properties/:propertyName', function (req, res) {
        return propertyHandler.get(req, res);
      });
      this.app.put('/:thingId/properties/:propertyName', function (req, res) {
        return propertyHandler.put(req, res);
      });
    } else {
      this.app.get('/', function (req, res) {
        return thingHandler.get(req, res);
      });
      this.app.get('/properties', function (req, res) {
        return propertiesHandler.get(req, res);
      });
      this.app.get('/properties/:propertyName', function (req, res) {
        return propertyHandler.get(req, res);
      });
      this.app.put('/properties/:propertyName', function (req, res) {
        return propertyHandler.put(req, res);
      });
    }
  }
  /**
   * Start listening for incoming connections.
   */

  this.start = function () {
    _this8.server.listen(_this8.port);
  };
  /**
   * Stop listening.
   */


  this.stop = function () {
    _this8.server.close();
  };

  return this;
}

module.exports = {
  MultipleThings: MultipleThings,
  SingleThing: SingleThing,
  WebThingServer: WebThingServer
};