/**
 * High-level Thing base class implementation.
 */

'use strict';

const Ajv = require('ajv');
const ajv = new Ajv();

/**
 * A Web Thing.
 */
class Thing {
  /**
   * Initialize the object.
   *
   * @param {String} name The thing's name
   * @param {String} type (Optional) The thing's type(s)
   * @param {String} description (Optional) Description of the thing
   */
  constructor(name, type, description) {
    if (!Array.isArray(type)) {
      type = [type];
    }

    this.name = name;
    this.context = 'https://iot.mozilla.org/schemas';
    this.type = type || [];
    this.description = description || '';
    this.properties = {};
    this.subscribers = new Set();
    this.hrefPrefix = '';
    this.uiHref = null;
  }

  /**
   * Return the thing state as a Thing Description.
   *
   * @returns {Object} Current thing state
   */
  asThingDescription() {
    const thing = {
      name: this.name,
      href: this.hrefPrefix ? this.hrefPrefix : '/',
      '@context': this.context,
      '@type': this.type,
      properties: this.getPropertyDescriptions(),
      links: [
        {
          rel: 'properties',
          href: `${this.hrefPrefix}/properties`,
        },
       ],
    };

    if (this.uiHref) {
      thing.links.push({
        rel: 'alternate',
        mediaType: 'text/html',
        href: this.uiHref,
      });
    }

    if (this.description) {
      thing.description = this.description;
    }

    return thing;
  }

  /**
   * Get this thing's href.
   *
   * @returns {String} The href.
   */
  getHref() {
    if (this.hrefPrefix) {
      return this.hrefPrefix;
    }

    return '/';
  }

  /**
   * Get this thing's UI href.
   *
   * @returns {String|null} The href.
   */
  getUiHref() {
    return this.uiHref;
  }

  /**
   * Set the prefix of any hrefs associated with this thing.
   *
   * @param {String} prefix The prefix
   */
  setHrefPrefix(prefix) {
    this.hrefPrefix = prefix;

    for (const property of Object.values(this.properties)) {
      property.setHrefPrefix(prefix);
    }

  }

  /**
   * Set the href of this thing's custom UI.
   *
   * @param {String} href The href
   */
  setUiHref(href) {
    this.uiHref = href;
  }

  /**
   * Get the name of the thing.
   *
   * @returns {String} The name.
   */
  getName() {
    return this.name;
  }

  /**
   * Get the type context of the thing.
   *
   * @returns {String} The context.
   */
  getContext() {
    return this.context;
  }

  /**
   * Get the type(s) of the thing.
   *
   * @returns {String[]} The type(s).
   */
  getType() {
    return this.type;
  }

  /**
   * Get the description of the thing.
   *
   * @returns {String} The description.
   */
  getDescription() {
    return this.description;
  }

  /**
   * Get the thing's properties as an object.
   *
   * @returns {Object} Properties, i.e. name -> description
   */
  getPropertyDescriptions() {
    const descriptions = {};
    for (const name in this.properties) {
      descriptions[name] = this.properties[name].asPropertyDescription();
    }

    return descriptions;
  }

  /**
   * Add a property to this thing.
   *
   * @param {Object} property Property to add
   */
  addProperty(property) {
    property.setHrefPrefix(this.hrefPrefix);
    this.properties[property.name] = property;
  }

  /**
   * Remove a property from this thing.
   *
   * @param {Object} property Property to remove
   */
  removeProperty(property) {
    if (this.properties.hasOwnProperty(property.name)) {
      delete this.properties[property.name];
    }
  }

  /**
   * Find a property by name.
   *
   * @param {String} propertyName Name of the property to find
   *
   * @returns {(Object|null)} Property if found, else null
   */
  findProperty(propertyName) {
    if (this.properties.hasOwnProperty(propertyName)) {
      return this.properties[propertyName];
    }

    return null;
  }

  /**
   * Get a property's value.
   *
   * @param {String} propertyName Name of the property to get the value of
   *
   * @returns {*} Current property value if found, else null
   */
  getProperty(propertyName) {
    const prop = this.findProperty(propertyName);
    if (prop) {
      return prop.getValue();
    }

    return null;
  }

  /**
   * Get a mapping of all properties and their values.
   *
   * Returns an object of propertyName -> value.
   */
  getProperties() {
    const props = {};
    for (const name in this.properties) {
      props[name] = this.properties[name].getValue();
    }

    return props;
  }

  /**
   * Determine whether or not this thing has a given property.
   *
   * @param {String} propertyName The property to look for
   *
   * @returns {Boolean} Indication of property presence
   */
  hasProperty(propertyName) {
    return this.properties.hasOwnProperty(propertyName);
  }

  /**
   * Set a property value.
   *
   * @param {String} propertyName Name of the property to set
   * @param {*} value Value to set
   */
  setProperty(propertyName, value) {
    const prop = this.findProperty(propertyName);
    if (!prop) {
      return;
    }

    prop.setValue(value);
  }

  /**
   * Notify all subscribers of a property change.
   *
   * @param {Object} property The property that changed
   */
  propertyNotify(property) {
    const message = JSON.stringify({
      messageType: 'propertyStatus',
      data: {
        [property.name]: property.getValue(),
      },
    });

    for (const subscriber of this.subscribers) {
      try {
        subscriber.send(message);
      } catch (e) {
        // do nothing
      }
    }
  }
}

module.exports = Thing;
