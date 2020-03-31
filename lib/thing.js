/**
 * High-level Thing base class implementation.
 */
'use strict';
/**
 * A Web Thing.
 */

function Thing/**
* Initialize the object.
*
* @param {String} id The thing's unique ID - must be a URI
* @param {String} title The thing's title
* @param {String} type (Optional) The thing's type(s)
* @param {String} description (Optional) Description of the thing
*/(id, title, type, description) {
  const _this = this;

  {
    if (!Array.isArray(type)) {
      type = [type];
    }

    this.id = id;
    this.title = title;
    this.context = 'https://iot.mozilla.org/schemas';
    this.type = type || [];
    this.description = description || '';
    this.properties = {};
    this.availableActions = {};
    this.availableEvents = {};
    this.actions = {};
    this.events = [];
    this.subscribers = [];
    this.hrefPrefix = '';
    this.uiHref = null;
  }
  /**
   * Return the thing state as a Thing Description.
   *
   * @returns {Object} Current thing state
   */

  this.asThingDescription = function() {
    const thing = {
      id: _this.id,
      title: _this.title,
      '@context': _this.context,
      '@type': _this.type,
      properties: _this.getPropertyDescriptions(),
      actions: {},
      events: {},
      links: [{
        rel: 'properties',
        href: ''.concat(_this.hrefPrefix, '/properties'),
      }],
    };

    for (const name in _this.availableActions) {
      thing.actions[name] = _this.availableActions[name].metadata;
      thing.actions[name].links = [{
        rel: 'action',
        href: ''.concat(_this.hrefPrefix, '/actions/').concat(name),
      }];
    }

    for (const _name in _this.availableEvents) {
      thing.events[_name] = _this.availableEvents[_name].metadata;
      thing.events[_name].links = [{
        rel: 'event',
        href: ''.concat(_this.hrefPrefix, '/events/').concat(_name),
      }];
    }

    if (_this.uiHref) {
      thing.links.push({
        rel: 'alternate',
        mediaType: 'text/html',
        href: _this.uiHref,
      });
    }

    if (_this.description) {
      thing.description = _this.description;
    }

    return thing;
  };
  /**
   * Get this thing's href.
   *
   * @returns {String} The href.
   */


  this.getHref = function() {
    if (_this.hrefPrefix) {
      return _this.hrefPrefix;
    }

    return '/';
  };
  /**
   * Get this thing's UI href.
   *
   * @returns {String|null} The href.
   */


  this.getUiHref = function() {
    return _this.uiHref;
  };
  /**
   * Set the prefix of any hrefs associated with this thing.
   *
   * @param {String} prefix The prefix
   */


  this.setHrefPrefix = function(prefix) {
    _this.hrefPrefix = prefix;

    for (let property in _this.properties) {
      property = _this.properties[property];
      property.setHrefPrefix(prefix);
    }

    for (const actionName in _this.actions) {
      for (let action in _this.actions[actionName]) {
        action = _this.actions[actionName][action];
        action.setHrefPrefix(prefix);
      }
    }
  };
  /**
   * Set the href of this thing's custom UI.
   *
   * @param {String} href The href
   */


  this.setUiHref = function(href) {
    _this.uiHref = href;
  };
  /**
   * Get the ID of the thing.
   *
   * @returns {String} The ID.
   */


  this.getId = function() {
    return _this.id;
  };
  /**
   * Get the title of the thing.
   *
   * @returns {String} The title.
   */


  this.getTitle = function() {
    return _this.title;
  };
  /**
   * Get the type context of the thing.
   *
   * @returns {String} The context.
   */


  this.getContext = function() {
    return _this.context;
  };
  /**
   * Get the type(s) of the thing.
   *
   * @returns {String[]} The type(s).
   */


  this.getType = function() {
    return _this.type;
  };
  /**
   * Get the description of the thing.
   *
   * @returns {String} The description.
   */


  this.getDescription = function() {
    return _this.description;
  };
  /**
   * Get the thing's properties as an object.
   *
   * @returns {Object} Properties, i.e. name -> description
   */


  this.getPropertyDescriptions = function() {
    const descriptions = {};

    for (const name in _this.properties) {
      descriptions[name] = _this.properties[name].asPropertyDescription();
    }

    return descriptions;
  };
  /**
   * Add a property to this thing.
   *
   * @param {Object} property Property to add
   */


  this.addProperty = function(property) {
    property.setHrefPrefix(_this.hrefPrefix);
    _this.properties[property.name] = property;
  };
  /**
   * Remove a property from this thing.
   *
   * @param {Object} property Property to remove
   */


  this.removeProperty = function(property) {
    if (_this.properties.hasOwnProperty(property.name)) {
      delete _this.properties[property.name];
    }
  };
  /**
   * Find a property by name.
   *
   * @param {String} propertyName Name of the property to find
   *
   * @returns {(Object|null)} Property if found, else null
   */


  this.findProperty = function(propertyName) {
    if (_this.properties.hasOwnProperty(propertyName)) {
      return _this.properties[propertyName];
    }

    return null;
  };
  /**
   * Get a property's value.
   *
   * @param {String} propertyName Name of the property to get the value of
   *
   * @returns {*} Current property value if found, else null
   */


  this.getProperty = function(propertyName) {
    const prop = _this.findProperty(propertyName);

    if (prop) {
      return prop.getValue();
    }

    return null;
  };
  /**
   * Get a mapping of all properties and their values.
   *
   * Returns an object of propertyName -> value.
   */


  this.getProperties = function() {
    const props = {};

    for (const name in _this.properties) {
      props[name] = _this.properties[name].getValue();
    }

    return props;
  };
  /**
   * Determine whether or not this thing has a given property.
   *
   * @param {String} propertyName The property to look for
   *
   * @returns {Boolean} Indication of property presence
   */


  this.hasProperty = function(propertyName) {
    return _this.properties.hasOwnProperty(propertyName);
  };
  /**
   * Set a property value.
   *
   * @param {String} propertyName Name of the property to set
   * @param {*} value Value to set
   */


  this.setProperty = function(propertyName, value) {
    const prop = _this.findProperty(propertyName);

    if (!prop) {
      return;
    }

    prop.setValue(value);
  };
  /**
   * Notify all subscribers of a property change.
   *
   * @param {Object} property The property that changed
   */


  this.propertyNotify = function(property) {
    const object = {
      messageType: 'propertyStatus',
      data: {},
    };
    object.data[property.name] = property.getValue();
    const message = JSON.stringify(object);

    for (let subscriber in _this.subscribers) {
      subscriber = _this.subscribers[subscriber];

      try {
        subscriber.send(message);
      } catch (e) { // do nothing
      }
    }
  };
}

module.exports = Thing;
