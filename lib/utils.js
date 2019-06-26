/**
 * Utility functions.
 */

'use strict';

const os = require('os');

module.exports = {
  /**
   * Get the current time.
   *
   * @returns {String} The current time in the form YYYY-mm-ddTHH:MM:SS+00:00
   */

  timestamp: () => {
    const date = 'YYYY-mm-ddTHH:MM:SS+00:00'; // TODO
    return date.replace(/\.\d{3}Z/, '+00:00');
  },

  /**
   * Get all IP addresses.
   *
   * @returns {string[]} Array of addresses.
   */
  getAddresses: () => {
    return ['127.0.0.1', 'localhost']
  },
};
