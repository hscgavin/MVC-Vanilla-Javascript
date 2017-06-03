/**
 * IIFE to allow private scope
 */

(function (window) {
  'use strict';


  /**
   * Creates a Model instance
   *
   * @constructor
   * @param {object} store a ref to Store object
   */

  function ListModel(store) {
    this.store = store;
  }

  ListModel.prototype = {

  /**
	 * Removes an item
	 *
	 * @param {number} id is the id of the item to be removed
	 * @param {function} callback a function run after removal is complete.
	 */
    removeItem: function (id, callback) {
      this.store.removeItem(id, callback);
    }

  }





   /**
   * Create a Store object for separation of concerns and better reuse
   * For simplicity, make a ajax call to initiate the store data
   *
   * @param {array} items we can pass in for testing or let store to fetch data from api
   * @param {string} api endpoint for fetching data
   */
  function Store(items, api) {
    var defaultApi = 'http://marketplace.envato.com/api/edge/popular:themeforest.json';
    this.items = items;
    this.fetching = false;
    this.error = false;
    this.api = api || defaultApi;
  }

  /**
	 * Remove an item by id from the Store
   * In reality, we delete item in DB by sending a ajax to Api endpoint
	 *
	 * @param {number} remove item by id
	 * @param {function} callback executes after
	 */
	Store.prototype.removeItem = function (id, callback) {
	  var self = this;

	  callback = callback || function () {};

		for (var i = 0; i < self.items.length; i++) {
			if (self.items[i].id == id) {
				self.items.splice(i, 1);
				break;
			}
		}
		callback.call(self, self.items);
	};


})(window);