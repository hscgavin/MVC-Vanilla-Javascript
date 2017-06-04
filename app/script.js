/**
 * IIFE to allow private scope
 */

(function (window) {
  'use strict';


  /**
   * Create Event for notifying states changed
   *
   * @param sender
   * @constructor
   */
  function Event(sender) {
    this.sender = sender;
    this.listeners = [];
  }

  Event.prototype = {
    attach: function (listener) {
      this.listeners.push(listener);
    },
    // find the sender and run the listener function
    notify: function (args) {
      for (var i = 0; i < this.listeners.length; i ++) {
        this.listeners[i](this.sender, args);
      }
    }
  };


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
    // Sorted items by rating_decimal
    this.itemsOfLastWeek = items && items.length && this.sortItemsByRating(items);
    this.fetching = false;
    this.error = false;
    this.api = api || defaultApi;

    //Initiate Event to notify observers about changes.
    this.stateChanged = new Event(this);
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

      for (var i = 0; i < self.itemsOfLastWeek.length; i++) {
        if (self.itemsOfLastWeek[i].id == id) {
          self.itemsOfLastWeek.splice(i, 1);
          break;
        }
      }
      callback.call(self, self.itemsOfLastWeek);
    },


    /**
     *  Fetch data from API endpoint
     *
     * @param {string} api
     * @param {function} successCallback handle successful ajax return data
     * @param {function} errorCallback handle error
     */
    fetchData: function (api, successCallback, errorCallback) {
      var self = this;
      self.fetching = true;
      self.stateChanged.notify({
        fetching: self.fetching
      });
      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          self.fetching = false;
          self.stateChanged.notify({
            fetching: self.fetching
          });
          if (xhr.status == 200) {
            successCallback.call(self, JSON.parse(xhr.responseText))
          }
          else if (xhr.status == 400) {
            self.error = true;
            errorCallback.call(self, 'There was an error 400');
          }
          else {
            self.error = true;
            errorCallback.call(self, 'something else other than 200 was returned');
          }
        }
      };

      xhr.open("GET", api, true);
      xhr.send();

    },

    /**
     * retrieving all itemsOfLastWeek
     * If there are no itemsOfLastWeek, retrieve itemsOfLastWeek from api endpoint
     *
     * @param callback The callback fire after data returns (e.g. update view from ctrl)
     */
    getItems: function (callback) {
      var self = this;
      if (!self.itemsOfLastWeek) {
        self.fetchData(
          self.api,
          function (res) {
            var items = res && res.popular && res.popular.items_last_week || [];
            self.itemsOfLastWeek = self.sortItemsByRating(items);
            callback.call(self, self.itemsOfLastWeek);
          },
          function (res) {
            alert(res); // handle error
          }
        )
      } else {
        callback.call(self, self.itemsOfLastWeek);
      }
    },

    /**
     * Sort items in rating from highest to lowest
     *
     * @param {Array}items the list of items data
     * @returns {Array}
     */
    
    sortItemsByRating: function (items) {
      var orderedItems = items.slice(0);
      orderedItems.sort(function (a, b) {
        return parseFloat(b.rating_decimal).toFixed(2) - parseFloat(a.rating_decimal).toFixed(2)
      });
      return orderedItems;
    }

  };



  //**********************
  // View
  //**********************

  /**
   * Creates a View instance to render element with data
   *
   * @constructor
   * @param {string} template string
   * @param {object} element is for this view to be mounted to
   */
  function View(template, element) {
    // Easy to make mistakes here, in reality we can use ES6 template string instead
    var defaultTemplate
      = '<div data-id="{{id}}" class="{{classname}}">'
      +   '<a class="content-container__thumbnail-link" href="{{url}}">'
      +     '<img class="content-container__thumbnail" src="{{thumbnail}}" alt="{{item}}">'
      +   '</a>'
      +   '<div class="content-container__info">'
      +     '<a class="content-container__header-link" href="{{url}}">'
      +       '<span class="content-container__info-header">{{item}}</span>'
      +     '</a>'
      +     '<span class="content-container__rating">Rating: {{rating}}</span>'
      +     '<a data-itemId="{{id}}" class="content-container__removebtn">Remove</a>'
      +   '</div>'
      + '</div>';

    this.template = template || defaultTemplate;
    this.$container = element;
    this.$loader = document.getElementById('loader');
  }

  View.prototype = {

    /**
     * a simple template engine to render template string
     *
     * @param templateString
     * @param data data is for replacing {{xx}}
     */
    simpleTemplate: function (templateString, data) {
      // copy data
      var newData = JSON.parse(JSON.stringify(data));
      var viewString = templateString;
      newData.classname = data.rating == '5.0' ?
        'five-stars content-container__item-wrapper' : 'content-container__item-wrapper';
      var dataToBeReplaced = [
        'id',
        'classname',
        'thumbnail',
        'rating',
        'url',
        'item'
      ];

      for (var i=0; i < dataToBeReplaced.length; i++) {
        var find = '{{'+ dataToBeReplaced[i] +'}}';
        var re = new RegExp(find, 'g');
        viewString = viewString.replace(re, newData[dataToBeReplaced[i]])
      }

      return viewString;

    },

    /**
     * Render all items
     *
     * @param {array} items: all items to be displayed
     * @param {function} callback get run after DOM is ready
     */
    showListItems: function (items, callback) {
      var self = this;
      var listView = items.reduce(function (view, item) {
        return view + self.simpleTemplate(self.template, item)
      }, '');

      // Render DOM
      self.$container.innerHTML = listView;
      // callback for binding events
      if (callback) callback.call(self)
    },

    /**
     * Removes an item from DOM
     *
     * @param {string || number} id of the item to remove
     */
    removeItem: function (id) {
      var el = this.$container.querySelector('[data-id="' + id + '"]');
      if (el) {
        this.$container.removeChild(el);
      }
    },

    /**
     * Bind event and handler
     *
     * @param event
     * @param handler
     */
    bind: function (event, handler) {
      // can bind different event

      var self = this;

      switch (event) {
        case 'removeItem':
          var $removeBtns = self.$container.querySelectorAll('.content-container__removebtn')
          // Prevent throwing error if $removeBtns is an empty array
          if ($removeBtns.length) {
            addEventListener('click', function (e) {
              handler(e.target.getAttribute('data-itemId'));
            });
          }
        break;
      }
    },

    // Instead of keep creating functions here
    // Should consider create a render function takes 2 arguments {action, data}
    // e.g. render('removeItem, id)
    // then render page accordingly

    handleStateChanged: function(data) {
      var self = this;
      if (data.fetching) {
        self.$loader.classList.remove('hide')
      } else {
        self.$loader.classList.add('hide')
      }
    }

  };

  //**********************
  // Controller
  //**********************

  /**
	 * Create Controller instance
   * TO glue them together
	 *
	 * @constructor
	 * @param {object} model The model instance
	 * @param {object} view The view instance
	 */

  function Controller(model, view) {
    var self = this;
    self.model = model;
    self.view = view;
    // attach loader
    self.model.store.stateChanged.attach(function (sender, args) {
      // this is just for loader only to avoid over engineering
      // although we can handel other states as well e.g. items assigned
      self.handleStateChanged(args)
    })
  }


  Controller.prototype = {
    
    
    bindEvents: function () {
      var self = this;
      self.view.bind('removeItem', function (id) {
        self.removeItem(id);
      });
      // All event bindings should go here
    },


    /**
     * Load all items, should get called on window on load event
     */
    loadAllItems: function () {
      var self = this;
      self.model.getItems(function (data) {
        self.view.showListItems(data, function () {
          self.bindEvents()
        })
      })
    },


    /**
     * Find the DOM element matching that ID,
     * remove it from the DOM and remove it from store.
     *
     * @param {number || string} id The ID of the item to remove from the DOM and store
     */
    removeItem: function (id) {
      var self = this;
      self.model.removeItem(id, function () {
        self.view.removeItem(id)
      });

    },
    handleStateChanged: function (data) {
      var self = this;
      if (data) {
        self.view.handleStateChanged(data)
      }
    }

  };

  // Expose them with namespace envato
  window.envato = {};
  window.envato.Store = Store;
  window.envato.ListModel = ListModel;
  window.envato.View = View;
  window.envato.Controller = Controller;


})(window);




// App Entry point
(function () {
  'use strict';


  function App() {
		this.store = new envato.Store();
		this.model = new envato.ListModel(this.store);
		this.view = new envato.View(null, document.getElementById('main')); // use default template
		this.controller = new envato.Controller(this.model, this.view);
	}
	var app = new App();

  window.addEventListener('load', function () {
    app.controller.loadAllItems();
  });

})();