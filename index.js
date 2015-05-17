'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = MongoBless;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var debug = require('debug')('mongobless:init');

var models = [];
var DB = undefined;
var Model = new Function();

function extend(destination) {
  var sources = Array.prototype.slice.call(arguments, 1);
  for (var i in sources) {
    var source = sources[i];
    Object.keys(source).forEach(function (property) {
      Object.defineProperty(destination, property, Object.getOwnPropertyDescriptor(source, property));
    });
  }
  return destination;
}

Model.bless = function (obj) {
  obj.__proto__ = this.prototype;
  obj.constructor = this;
  return obj;
};

Model.findAll = function () {
  var args = Array.prototype.slice.call(arguments),
      fn = args.pop(),
      self = this,
      cb = function cb(err, res) {
    if (err) return fn(err);
    fn(null, res.map(function (obj) {
      return self.bless(obj);
    }));
  };
  this.collection.find.apply(this.collection, args).toArray(cb);
  return this;
};

Model.findOne = function (query, cb) {
  var _this = this;

  var callback = (function (err, res) {
    if (err) return cb(err);
    if (!res) return cb(null, null);
    cb(null, _this.bless(res));
  }).bind(this);
  this.collection.findOne(query, callback);
  return this;
};

Object.defineProperty(Model, 'collection', {
  enumerable: true,
  configurable: false,
  get: function get() {
    return this.db.collection(this.collectionName);
  }
});

Model.connect = function (db) {
  this.db = db;
};

Model.extendableProperties = ['connect', 'collection', 'findOne', 'findAll'];

function MongoBless() {
  var options = arguments[0] === undefined ? {} : arguments[0];

  return function (constructor) {
    if (options.collection) {
      if (constructor.isPersistentRoot) throw new Error('Cannot overload collection\'s name for class \'' + constructor.name + '\'');
      models.push(constructor);
      constructor.collectionName = options.collection;
      constructor.isPersistentRoot = true;
      _lodash2['default'].each(Model.extendableProperties, function (prop) {
        Object.defineProperty(constructor, prop, Object.getOwnPropertyDescriptor(Model, prop));
      });
      if (!constructor.bless) {
        Object.defineProperty(constructor, 'bless', Object.getOwnPropertyDescriptor(Model, 'bless'));
      }
    } else {
      constructor.isPersistentRoot = false;
    }
  };
}

MongoBless.close = function (cb) {
  return DB.close(cb);
};

MongoBless.bless = function (obj) {
  return Model.bless.bind(this)(obj);
};

MongoBless.connect = function (opt, cb) {
  var options = _lodash2['default'].extend({ host: '127.0.0.1', port: 27017, auto_reconnect: true, poolSize: 10, w: 1, strict: true, native_parser: true, verbose: true }, opt),
      mongoserver;

  if (!options.replicaSet) mongoserver = new _mongodb2['default'].Server(options.host, options.port, options);else {
    var replicaServers = _lodash2['default'].map(options.replicaSet.servers, function (server) {
      return new _mongodb2['default'].Server(server.host, server.port, server.options);
    });
    mongoserver = new _mongodb2['default'].ReplSet(replicaServers, _lodash2['default'].extend({}, options.replicaSet.options, { rs_name: options.replicaSet.name }));
  }

  var dbconnector = new _mongodb2['default'].Db(options.database, mongoserver, options);

  dbconnector.open(function (err, db) {
    DB = db;
    if (err) return cb(err);
    for (var i in models) {
      models[i].connect(db);
    }
    debug('mongobless is ready for your requests ...');
    cb(null, db);
  });
};

var ObjectId = _mongodb2['default'].ObjectID;
exports.ObjectId = ObjectId;

