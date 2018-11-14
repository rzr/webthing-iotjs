/**
 * High-level Thing base class implementation.
 */
'use strict';
/**
 * A Web Thing.
 */

function Thing(name, type, description) {
  var _this = this;

  /**
   * Initialize the object.
   *
   * @param {String} name The thing's name
   * @param {String} type (Optional) The thing's type(s)
   * @param {String} description (Optional) Description of the thing
   */
  {
    if (!Array.isArray(type)) {
      type = [type];
    }

    this.name = name;
    this.context = 'https://iot.mozilla.org/schemas';
    this.type = type || [];
    this.description = description || '';
    this.properties = {};
    this.subscribers = [];
    this.hrefPrefix = '';
    this.uiHref = null;
  }
  /**
   * Return the thing state as a Thing Description.
   *
   * @returns {Object} Current thing state
   */

  this.asThingDescription = function () {
    var thing = {
      name: _this.name,
      href: _this.hrefPrefix ? _this.hrefPrefix : '/',
      '@context': _this.context,
      '@type': _this.type,
      properties: _this.getPropertyDescriptions(),
      links: [{
        rel: 'properties',
        href: "".concat(_this.hrefPrefix, "/properties")
      }]
    };

    if (_this.uiHref) {
      thing.links.push({
        rel: 'alternate',
        mediaType: 'text/html',
        href: _this.uiHref
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


  this.getHref = function () {
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


  this.getUiHref = function () {
    return _this.uiHref;
  };
  /**
   * Set the prefix of any hrefs associated with this thing.
   *
   * @param {String} prefix The prefix
   */


  this.setHrefPrefix = function (prefix) {
    _this.hrefPrefix = prefix;

    for (var property in _this.properties) {
      property = _this.properties[property];
      property.setHrefPrefix(prefix);
    }
  };
  /**
   * Set the href of this thing's custom UI.
   *
   * @param {String} href The href
   */


  this.setUiHref = function (href) {
    _this.uiHref = href;
  };
  /**
   * Get the name of the thing.
   *
   * @returns {String} The name.
   */


  this.getName = function () {
    return _this.name;
  };
  /**
   * Get the type context of the thing.
   *
   * @returns {String} The context.
   */


  this.getContext = function () {
    return _this.context;
  };
  /**
   * Get the type(s) of the thing.
   *
   * @returns {String[]} The type(s).
   */


  this.getType = function () {
    return _this.type;
  };
  /**
   * Get the description of the thing.
   *
   * @returns {String} The description.
   */


  this.getDescription = function () {
    return _this.description;
  };
  /**
   * Get the thing's properties as an object.
   *
   * @returns {Object} Properties, i.e. name -> description
   */


  this.getPropertyDescriptions = function () {
    var descriptions = {};

    for (var _name in _this.properties) {
      descriptions[_name] = _this.properties[_name].asPropertyDescription();
    }

    return descriptions;
  };
  /**
   * Add a property to this thing.
   *
   * @param {Object} property Property to add
   */


  this.addProperty = function (property) {
    property.setHrefPrefix(_this.hrefPrefix);
    _this.properties[property.name] = property;
  };
  /**
   * Remove a property from this thing.
   *
   * @param {Object} property Property to remove
   */


  this.removeProperty = function (property) {
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


  this.findProperty = function (propertyName) {
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


  this.getProperty = function (propertyName) {
    var prop = _this.findProperty(propertyName);

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


  this.getProperties = function () {
    var props = {};

    for (var _name2 in _this.properties) {
      props[_name2] = _this.properties[_name2].getValue();
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


  this.hasProperty = function (propertyName) {
    return _this.properties.hasOwnProperty(propertyName);
  };
  /**
   * Set a property value.
   *
   * @param {String} propertyName Name of the property to set
   * @param {*} value Value to set
   */


  this.setProperty = function (propertyName, value) {
    var prop = _this.findProperty(propertyName);

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


  this.propertyNotify = function (property) {
    var object = {
      messageType: 'propertyStatus',
      data: {}
    };
    object.data[property.name] = property.getValue();
    var message = JSON.stringify(object);

    for (var idx; idx < _this.subscribers.length; idx++) {
      var subscriber = _this.subscribers[idx];

      try {
        subscriber.send(message);
      } catch (e) {// do nothing
      }
    }
  };

  return this;
}

module.exports = Thing;