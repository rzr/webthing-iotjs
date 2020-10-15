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
  }

  /**
   * Get the list of things.
   */
  this.getThings = () => {
    return [this.thing];
  }

  /**
   * Get the mDNS server name.
   */
  this.getName = () => {
    return this.thing.title;
  }
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
  this.getThing = (idx) => {
    idx = parseInt(idx);
    if (isNaN(idx) || idx < 0 || idx >= this.things.length) {
      return null;
    }

    return this.things[idx];
  }

  /**
   * Get the list of things.
   */
  this.getThings = () => {
    return this.things;
  }

  /**
   * Get the mDNS server name.
   */
  this.getName = () => {
    return this.name;
  }
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
  {
    this.things = things;
  }

  /**
   * Get the thing this request is for.
   *
   * @param {Object} req The request object
   * @returns {Object} The thing, or null if not found.
   */
  this.getThing = (req) => {
    return this.things.getThing(req.params.thingId);
  }
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
    if (!req || req.method !== 'GET') {
      return;
    }
    const things = this.things.getThings();
    const descriptions = [];

    for (let idx = 0; idx < things.length; idx++) {
      const thing = things[idx];
      const description = thing.asThingDescription();
      description.href = thing.getHref();

      description.base =
          `${req.protocol}://${req.headers.host}${thing.getHref()}`;
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
    const description = thing.asThingDescription();

    res.json(description);
  }
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
  }
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
      const body = {};
      body[propertyName] = thing.getProperty(propertyName);
      res.json(body);
    } else {
      res.status(404).end();
    }
  }

  /**
   * Handle a PUT request.
   *
   * @param {Object} req The request object
   * @param {Object} res The response object
   */
  this.put = (req, res) => {
    if (!req || req.method !== 'PUT') {
      return;
    }
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
        res.status(400).end();
        return;
      }

      const body = {};
      body[propertyName] = thing.getProperty(propertyName);
      res.json(body);
    } else {
      res.status(404).end();
    }
  }
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
    things,
    port = null,
    hostname = null,
    sslOptions = null,
    additionalRoutes = null,
    basePath = '/'
  ) {
  {
    this.things = things;
    this.name = things.getName();
    this.port = Number(port) || (sslOptions ? 443 : 80);
    this.hostname = hostname;
    this.basePath = basePath.replace(/\/$/, '');

    this.hosts = [
      'localhost',
      `localhost:${port}`,
    ];

    if (hostname) {
      hostname = hostname.toLowerCase();
      this.hosts.push(hostname, `${hostname}:${port}`);
    }
    this.basePath = basePath.replace(/\/$/, '');

    this.isMultipleThing = (this.things.things);
    if (this.isMultipleThing) {
      const list = things.getThings();
      for (let i = 0; i < list.length; i++) {
        const thing = list[i];
        thing.setHrefPrefix(`${this.basePath}/${i}`);
      }
    } else {
      things.getThing().setHrefPrefix(this.basePath);
    }

    this.app = express();
    this.server = http.createServer(this.app.request);

    const thingsHandler = new ThingsHandler(this.things);
    const thingHandler = new ThingHandler(this.things);
    const propertiesHandler = new PropertiesHandler(this.things);
    const propertyHandler = new PropertyHandler(this.things);

    this.router = this.app;

    if (this.isMultipleThing) {
      this.router.get('/', (req, res) => thingsHandler.get(req, res));
      this.router.get('/:thingId', (req, res) => thingHandler.get(req, res));
      this.router.get('/:thingId/properties',
                      (req, res) => propertiesHandler.get(req, res));
      this.router.get('/:thingId/properties/:propertyName',
                      (req, res) => propertyHandler.get(req, res));
      this.router.put('/:thingId/properties/:propertyName',
                      (req, res) => propertyHandler.put(req, res));
    } else {
      this.router.get('/', (req, res) => thingHandler.get(req, res));
      this.router.get('/properties',
                      (req, res) => propertiesHandler.get(req, res));
      this.router.get('/properties/:propertyName',
                      (req, res) => propertyHandler.get(req, res));
      this.router.put('/properties/:propertyName',
                      (req, res) => propertyHandler.put(req, res));
    }
  }

  /**
   * Start listening for incoming connections.
   */
  this.start = () => {
    return this.server.listen(this.port);
  }

  /**
   * Stop listening.
   */
  this.stop = () => {
    return this.server.close();
  }
}

module.exports = {
  MultipleThings: MultipleThings,
  SingleThing: SingleThing,
  WebThingServer: WebThingServer,
};
