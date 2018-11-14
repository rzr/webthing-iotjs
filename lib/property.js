/**
 * High-level Property base class implementation.
 */
'use strict';
/**
 * A Property represents an individual state value of a thing.
 */

function Property(thing, name, value, metadata) {
  var _this2 = this;

  var _this = this;
  /**
   * Initialize the object.
   *
   * @param {Object} thing Thing this property belongs to
   * @param {String} name Name of the property
   * @param {Value} value Value object to hold the property value
   * @param {Object} metadata Property metadata, i.e. type, description, unit,
   *                          etc., as an object.
   */


  {
    this.thing = thing;
    this.name = name;
    this.value = value;
    this.hrefPrefix = '';
    this.href = "/properties/".concat(this.name);
    this.metadata = metadata || {}; // Add the property change observer to notify the Thing about a property
    // change.

    this.value.on('update', function () {
      return _this2.thing.propertyNotify(_this2);
    });
  }
  /**
   * Validate new property value before setting it.
   *
   * @param {*} value - New value
   */

  this.validateValue = function (value) {
    switch (_this2.metadata.type) {
      case 'null':
        if (value !== null) {
          throw new Error('Value must be null');
        }

        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error('Value must be a boolean');
        }

        break;

      case 'object':
        if (typeof value !== 'object') {
          throw new Error('Value must be an object');
        }

        break;

      case 'array':
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }

        break;

      case 'number':
        if (typeof value !== 'number') {
          throw new Error('Value must be a number');
        }

        break;

      case 'integer':
        if (typeof value !== 'number' || value % 1 !== 0) {
          throw new Error('Value must be an integer');
        }

        break;

      case 'string':
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }

        break;
    }

    if (_this2.metadata.hasOwnProperty('readOnly') && _this2.metadata.readOnly) {
      throw new Error('Read-only property');
    }

    if (_this2.metadata.hasOwnProperty('minimum') && value < _this2.metadata.minimum) {
      throw new Error("Value less than minimum: ".concat(_this2.metadata.minimum));
    }

    if (_this2.metadata.hasOwnProperty('maximum') && value > _this2.metadata.maximum) {
      throw new Error("Value greater than maximum: ".concat(_this2.metadata.maximum));
    }

    if (_this2.metadata.hasOwnProperty('enum') && _this2.metadata.enum.length > 0 && !_this2.metadata.enum.includes(value)) {
      throw new Error("Invalid enum value");
    }
  };
  /**
   * Get the property description.
   *
   * @returns {Object} Description of the property as an object.
   */


  this.asPropertyDescription = function () {
    var description = JSON.parse(JSON.stringify(_this2.metadata));
    description.href = _this2.hrefPrefix + _this2.href;
    return description;
  };
  /**
   * Set the prefix of any hrefs associated with this property.
   *
   * @param {String} prefix The prefix
   */


  this.setHrefPrefix = function (prefix) {
    _this2.hrefPrefix = prefix;
  };
  /**
   * Get the href of this property.
   *
   * @returns {String} The href
   */


  this.getHref = function () {
    return "".concat(_this2.hrefPrefix).concat(_this2.href);
  };
  /**
   * Get the current property value.
   *
   * @returns {*} The current value
   */


  this.getValue = function () {
    return _this2.value.get();
  };
  /**
   * Set the current value of the property.
   *
   * @param {*} value The value to set
   */


  this.setValue = function (value) {
    _this2.value.set(value);
  };
  /**
   * Get the name of this property.
   *
   * @returns {String} The property name.
   */


  this.getName = function () {
    return _this2.name;
  };
  /**
   * Get the thing associated with this property.
   *
   * @returns {Object} The thing.
   */


  this.getThing = function () {
    return _this2.thing;
  };
  /**
   * Get the metadata associated with this property
   *
   * @returns {Object} The metadata
   */


  this.getMetadata = function () {
    return _this2.metadata;
  };

  return this;
}

module.exports = Property;