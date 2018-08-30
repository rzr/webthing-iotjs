/**
 * Node Web Thing server implementation.
 */
'use strict';

const http = require('http');

const express = require('./express.js');
/**
 * A container for a single thing.
 */


function SingleThing(thing) {
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

  this.getThing = () => {
    return this.thing;
  };
  /**
   * Get the list of things.
   */


  this.getThings = () => {
    return [this.thing];
  };
  /**
   * Get the mDNS server name.
   */


  this.getName = () => {
    return this.thing.name;
  };

  return this;
}
/**
 * A container for multiple things.
 */


function MultipleThings(things, name) {
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

  this.getThing = idx => {
    idx = parseInt(idx);

    if (isNaN(idx) || idx < 0 || idx >= this.things.length) {
      return null;
    }

    return this.things[idx];
  };
  /**
   * Get the list of things.
   */


  this.getThings = () => {
    return this.things;
  };
  /**
   * Get the mDNS server name.
   */


  this.getName = () => {
    return this.name;
  };

  return this;
}
/**
 * Base handler that is initialized with a list of things.
 */


function BaseHandler(things) {
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

  this.getThing = req => {
    return this.things.getThing(req.params.thingId);
  };

  return this;
}
/**
 * Handle a request to / when the server manages multiple things.
 */


function ThingsHandler(things) {
  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = (req, res) => {
    if (!req || req.method !== 'GET') return;
    let things = this.things.getThings();
    let descriptions = [];

    for (let idx = 0; idx < things.length; idx++) {
      descriptions.push(things[idx].asThingDescription());
    }

    res.json(descriptions);
  };
}
/**
 * Handle a request to /.
 */


function ThingHandler(things) {
  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = (req, res) => {
    const thing = this.getThing(req);

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
  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = (req, res) => {
    const thing = this.getThing(req);

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
  BaseHandler.call(this, things);
  /**
   * Handle a GET request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */

  this.get = (req, res) => {
    const thing = this.getThing(req);

    if (thing === null) {
      res.status(404).end();
      return;
    }

    const propertyName = req.params.propertyName;

    if (thing.hasProperty(propertyName)) {
      let body = {};
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


  this.put = (req, res) => {
    if (!req || req.method !== 'PUT') return;
    const thing = this.getThing(req);

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
    this.hosts = ['127.0.0.1', `127.0.0.1:${port}`, 'localhost', `localhost:${port}`];
    this.isMultipleThing = this.things.things ? true : false;

    if (this.isMultipleThing) {
      const list = things.getThings();

      for (let i = 0; i < list.length; i++) {
        const thing = list[i];
        thing.setHrefPrefix(`/${i}`);
      }
    }

    this.app = express();
    this.server = http.createServer(this.app.request);
    const thingsHandler = new ThingsHandler(this.things);
    const thingHandler = new ThingHandler(this.things);
    const propertiesHandler = new PropertiesHandler(this.things);
    const propertyHandler = new PropertyHandler(this.things);

    if (this.isMultipleThing) {
      this.app.get('/', (req, res) => thingsHandler.get(req, res));
      this.app.get('/:thingId', (req, res) => thingHandler.get(req, res));
      this.app.get('/:thingId/properties', (req, res) => propertiesHandler.get(req, res));
      this.app.get('/:thingId/properties/:propertyName', (req, res) => propertyHandler.get(req, res));
      this.app.put('/:thingId/properties/:propertyName', (req, res) => propertyHandler.put(req, res));
    } else {
      this.app.get('/', (req, res) => thingHandler.get(req, res));
      this.app.get('/properties', (req, res) => propertiesHandler.get(req, res));
      this.app.get('/properties/:propertyName', (req, res) => propertyHandler.get(req, res));
      this.app.put('/properties/:propertyName', (req, res) => propertyHandler.put(req, res));
    }
  }
  /**
   * Start listening for incoming connections.
   */

  this.start = () => {
    this.server.listen(this.port);
  };
  /**
   * Stop listening.
   */


  this.stop = () => {
    this.server.close();
  };

  return this;
}

module.exports = {
  MultipleThings: MultipleThings,
  SingleThing: SingleThing,
  WebThingServer: WebThingServer
};