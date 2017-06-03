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
    },

  /**
	 * Return last_week_items from store
   *
   * @param {function} callback The callback to fire upon retrieving data
	 */
    getItems: function (callback) {
      return this.store.getItems(callback)
    }

  };





   /**
   * Create a Store object for separation of concerns and better reuse
   * For simplicity, make a ajax call to initiate the store data
   *
   * @param {array} items we can pass in for testing or let store to fetch data from api
   * @param {string} api endpoint for fetching data
   */
  function Store(items, api) {
    var defaultApi = 'http://marketplace.envato.com/api/edge/popular:themeforest.json';

    // Define states
    this.items = items;
    this.fetching = false;
    this.error = false;
    this.api = api || defaultApi;
  }

  Store.prototype = {

    /**
     * Remove an item by id from the Store
     * In reality, we delete item in DB by sending a ajax to Api endpoint
     *
     * @param {number} id is the id of item we want to remove
     * @param {function} callback is a function executes after
     */
    removeItem: function (id, callback) {
      var self = this;

      callback = callback || function () {};

      for (var i = 0; i < self.items.length; i++) {
        if (self.items[i].id == id) {
          self.items.splice(i, 1);
          break;
        }
      }
      callback.call(self, self.items);
    },


    /**
     *  Fetch data from API endpoint
     *
     * @param {string} api
     * @param {callback} callback function
     */
    fetchData: function (api, callback) {
      var self = this;
      self.fetching = true;
      // Return a promise
      return fetch(api)
        .then((function (res) {
          if (!res.ok) throw Error(res.status);
          return res;
        }))
        .then(function (res) {
          self.fetching = false;
          return res.json()
        })
        .catch(function () {
          self.fetching = false;
          // Deal with error later, let it fallback to empty obj for now
          return {data: {}}
        });
    },

    /**
     * retrieving all items
     * If there are no items, retrieve items from api endpoint
     *
     * @param callback The callback fire after data returns (e.g. update view from ctrl)
     */
    getItems: function (callback) {
      var self = this;
      if (!self.items) {
        this.fetchData(this.api).then(function (res) {
          self.lastWeekItems = res && res.popular && res.popular.items_last_week || []
          callback.call(self, self.lastWeekItems)
        })
      }
    }

  };


})(window);