/**
 * High-level Thing base class implementation.
 */

'use strict';

/**
 * A Web Thing.
 */
function Thing(id, title, type, description) {
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
  this.asThingDescription = () => {
    const thing = {
      id: this.id,
      title: this.title,
      '@context': this.context,
      '@type': this.type,
      properties: this.getPropertyDescriptions(),
      actions: {},
      events: {},
      links: [
        {
          rel: 'properties',
          href: `${this.hrefPrefix}/properties`,
        },
      ],
    };

    for (const name in this.availableActions) {
      thing.actions[name] = this.availableActions[name].metadata;
      thing.actions[name].links = [
        {
          rel: 'action',
          href: `${this.hrefPrefix}/actions/${name}`,
        },
      ];
    }

    for (const name in this.availableEvents) {
      thing.events[name] = this.availableEvents[name].metadata;
      thing.events[name].links = [
        {
          rel: 'event',
          href: `${this.hrefPrefix}/events/${name}`,
        },
      ];
    }

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
  };

  /**
   * Get this thing's href.
   *
   * @returns {String} The href.
   */
  this.getHref = () => {
    if (this.hrefPrefix) {
      return this.hrefPrefix;
    }

    return '/';
  };

  /**
   * Get this thing's UI href.
   *
   * @returns {String|null} The href.
   */
  this.getUiHref = () => {
    return this.uiHref;
  };

  /**
   * Set the prefix of any hrefs associated with this thing.
   *
   * @param {String} prefix The prefix
   */
  this.setHrefPrefix = (prefix) => {
    this.hrefPrefix = prefix;

    for (let property in this.properties) {
      property = this.properties[property];
      property.setHrefPrefix(prefix);
    }

    for (const actionName in this.actions) {
      for (let action in this.actions[actionName]) {
        action = this.actions[actionName][action];
        action.setHrefPrefix(prefix);
      }
    }
  };

  /**
   * Set the href of this thing's custom UI.
   *
   * @param {String} href The href
   */
  this.setUiHref = (href) => {
    this.uiHref = href;
  };

  /**
   * Get the ID of the thing.
   *
   * @returns {String} The ID.
   */
  this.getId = () => {
    return this.id;
  };

  /**
   * Get the title of the thing.
   *
   * @returns {String} The title.
   */
  this.getTitle = () => {
    return this.title;
  };

  /**
   * Get the type context of the thing.
   *
   * @returns {String} The context.
   */
  this.getContext = () => {
    return this.context;
  };

  /**
   * Get the type(s) of the thing.
   *
   * @returns {String[]} The type(s).
   */
  this.getType = () => {
    return this.type;
  };

  /**
   * Get the description of the thing.
   *
   * @returns {String} The description.
   */
  this.getDescription = () => {
    return this.description;
  };

  /**
   * Get the thing's properties as an object.
   *
   * @returns {Object} Properties, i.e. name -> description
   */
  this.getPropertyDescriptions = () => {
    const descriptions = {};
    for (const name in this.properties) {
      descriptions[name] = this.properties[name].asPropertyDescription();
    }

    return descriptions;
  };

  /**
   * Add a property to this thing.
   *
   * @param {Object} property Property to add
   */
  this.addProperty = (property) => {
    property.setHrefPrefix(this.hrefPrefix);
    this.properties[property.name] = property;
  };

  /**
   * Remove a property from this thing.
   *
   * @param {Object} property Property to remove
   */
  this.removeProperty = (property) => {
    if (this.properties.hasOwnProperty(property.name)) {
      delete this.properties[property.name];
    }
  };

  /**
   * Find a property by name.
   *
   * @param {String} propertyName Name of the property to find
   *
   * @returns {(Object|null)} Property if found, else null
   */
  this.findProperty = (propertyName) => {
    if (this.properties.hasOwnProperty(propertyName)) {
      return this.properties[propertyName];
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
  this.getProperty = (propertyName) => {
    const prop = this.findProperty(propertyName);
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
  this.getProperties = () => {
    const props = {};
    for (const name in this.properties) {
      props[name] = this.properties[name].getValue();
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
  this.hasProperty = (propertyName) => {
    return this.properties.hasOwnProperty(propertyName);
  };


  /**
   * Set a property value.
   *
   * @param {String} propertyName Name of the property to set
   * @param {*} value Value to set
   */
  this.setProperty = (propertyName, value) => {
    const prop = this.findProperty(propertyName);
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
  this.propertyNotify = (property) => {
    const object = {
      messageType: 'propertyStatus',
      data: {},
    };
    object.data[property.name] = property.getValue();
    const message = JSON.stringify(object);

    for (let subscriber in this.subscribers) {
      subscriber = this.subscribers[subscriber];
      try {
        subscriber.send(message);
      } catch (e) {
        // do nothing
      }
    }
  };
}

module.exports = Thing;
