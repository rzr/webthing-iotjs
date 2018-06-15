/**
 * Node Web Thing server implementation.
 */

'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const https = require('https');

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
    const wsHref = `${req.secure ? 'wss' : 'ws'}://${req.headers.host}`;
    res.json(
      this.things.getThings().map((thing) => {
        const description = thing.asThingDescription();
        description.href = thing.getHref();
        description.links.push({
          rel: 'alternate',
          href: `${wsHref}${thing.getHref()}`,
        });
        description.base =
          `${req.protocol}://${req.headers.host}${thing.getHref()}`;
        description.securityDefinitions = {
          nosec_sc: {
            scheme: 'nosec',
          },
        };
        description.security = 'nosec_sc';
        return description;
      })
    );
  }
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

    const wsHref = `${req.secure ? 'wss' : 'ws'}://${req.headers.host}`;
    const description = thing.asThingDescription();
    description.links.push({
      rel: 'alternate',
      href: `${wsHref}${thing.getHref()}`,
    });
    description.base =
      `${req.protocol}://${req.headers.host}${thing.getHref()}`;
    description.securityDefinitions = {
      nosec_sc: {
        scheme: 'nosec',
      },
    };
    description.security = 'nosec_sc';

    res.json(description);
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
      res.json({[propertyName]: thing.getProperty(propertyName)});
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
    const thing = this.getThing(req);
    if (thing === null) {
      res.status(404).end();
      return;
    }

    const propertyName = req.params.propertyName;
    if (!req.body.hasOwnProperty(propertyName)) {
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

      res.json({[propertyName]: thing.getProperty(propertyName)});
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

    utils.getAddresses().forEach((address) => {
      this.hosts.push(address, `${address}:${port}`);
    });

    if (hostname) {
      hostname = hostname.toLowerCase();
      this.hosts.push(hostname, `${hostname}:${port}`);
    }

    if (this.things.constructor.name === 'MultipleThings') {
      const list = things.getThings();
      for (let i = 0; i < list.length; i++) {
        const thing = list[i];
        thing.setHrefPrefix(`${this.basePath}/${i}`);
      }
    } else {
      things.getThing().setHrefPrefix(this.basePath);
    }

    this.app = express();
    this.app.use(bodyParser.json());

    // Validate Host header
    this.app.use((request, response, next) => {
      const host = request.headers.host;
      if (this.hosts.includes(host.toLowerCase())) {
        next();
      } else {
        response.status(403).send('Forbidden');
      }
    });

    // Set CORS headers
    this.app.use((request, response, next) => {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Headers',
                         'Origin, X-Requested-With, Content-Type, Accept');
      response.setHeader('Access-Control-Allow-Methods',
                         'GET, HEAD, PUT, POST, DELETE');
      next();
    });

    if (sslOptions) {
      this.server = https.createServer(sslOptions);
      this.app.isTls = true;
    } else {
      this.server = http.createServer();
      this.app.isTls = false;
    }

    expressWs(this.app, this.server);

    const thingsHandler = new ThingsHandler(this.things);
    const thingHandler = new ThingHandler(this.things);
    const propertiesHandler = new PropertiesHandler(this.things);
    const propertyHandler = new PropertyHandler(this.things);
    const actionsHandler = new ActionsHandler(this.things);
    const actionHandler = new ActionHandler(this.things);
    const actionIdHandler = new ActionIDHandler(this.things);
    const eventsHandler = new EventsHandler(this.things);
    const eventHandler = new EventHandler(this.things);

    this.router = express.Router();

    if (Array.isArray(additionalRoutes)) {
      for (const route of additionalRoutes) {
        this.router.use(route.path, route.handler);
      }
    }
    if (this.things.constructor.name === 'MultipleThings') {
      this.router.get('/', (req, res) => thingsHandler.get(req, res));
      this.router.get('/:thingId', (req, res) => thingHandler.get(req, res));
      this.router.get('/:thingId/properties',
                      (req, res) => propertiesHandler.get(req, res));
      this.router.get('/:thingId/properties/:propertyName',
                      (req, res) => propertyHandler.get(req, res));
      this.router.put('/:thingId/properties/:propertyName',
                      (req, res) => propertyHandler.put(req, res));
      this.router.get('/:thingId/actions',
                      (req, res) => actionsHandler.get(req, res));
      this.router.post('/:thingId/actions',
                       (req, res) => actionsHandler.post(req, res));
      this.router.get('/:thingId/actions/:actionName',
                      (req, res) => actionHandler.get(req, res));
      this.router.post('/:thingId/actions/:actionName',
                       (req, res) => actionHandler.post(req, res));
      this.router.get('/:thingId/actions/:actionName/:actionId',
                      (req, res) => actionIdHandler.get(req, res));
      this.router.put('/:thingId/actions/:actionName/:actionId',
                      (req, res) => actionIdHandler.put(req, res));
      this.router.delete('/:thingId/actions/:actionName/:actionId',
                         (req, res) => actionIdHandler.delete(req, res));
      this.router.get('/:thingId/events',
                      (req, res) => eventsHandler.get(req, res));
      this.router.get('/:thingId/events/:eventName',
                      (req, res) => eventHandler.get(req, res));
    } else {
      this.router.get('/', (req, res) => thingHandler.get(req, res));
      this.router.get('/properties',
                      (req, res) => propertiesHandler.get(req, res));
      this.router.get('/properties/:propertyName',
                      (req, res) => propertyHandler.get(req, res));
      this.router.put('/properties/:propertyName',
                      (req, res) => propertyHandler.put(req, res));
      this.router.get('/actions',
                      (req, res) => actionsHandler.get(req, res));
      this.router.post('/actions',
                       (req, res) => actionsHandler.post(req, res));
      this.router.get('/actions/:actionName',
                      (req, res) => actionHandler.get(req, res));
      this.router.post('/actions/:actionName',
                       (req, res) => actionHandler.post(req, res));
      this.router.get('/actions/:actionName/:actionId',
                      (req, res) => actionIdHandler.get(req, res));
      this.router.put('/actions/:actionName/:actionId',
                      (req, res) => actionIdHandler.put(req, res));
      this.router.delete('/actions/:actionName/:actionId',
                         (req, res) => actionIdHandler.delete(req, res));
      this.router.get('/events',
                      (req, res) => eventsHandler.get(req, res));
      this.router.get('/events/:eventName',
                      (req, res) => eventHandler.get(req, res));
    }

    this.app.use(this.basePath || '/', this.router);
    this.server.on('request', this.app);
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
  MultipleThings,
  SingleThing,
  WebThingServer,
};
