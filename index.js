'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObjectId = undefined;
exports.default = MongoBless;

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var debug = require('debug')('mongobless');

var models = [];
var DB = void 0;
var Model = new Function();
var isFunction = function isFunction(obj) {
  return typeof obj === 'function';
};

function extend(destination) {
  var sources = Array.prototype.slice.call(arguments, 1);

  var _loop = function _loop(i) {
    var source = sources[i];
    Object.keys(source).forEach(function (property) {
      Object.defineProperty(destination, property, Object.getOwnPropertyDescriptor(source, property));
    });
  };

  for (var i in sources) {
    _loop(i);
  }
  return destination;
}

Model.bless = function (obj) {
  if (!obj) return;
  obj.__proto__ = this.prototype;
  obj.constructor = this;
  return obj;
};

Model.findAll = function () {
  var _this = this,
      _collection2;

  var blessAll = function blessAll(data) {
    return data.map(function (obj) {
      return _this.bless(obj);
    });
  };

  for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
    params[_key] = arguments[_key];
  }

  var fn = params[params.length - 1];

  if (isFunction(fn)) {
    var _collection;

    var cb = function cb(err, res) {
      if (err) return fn(err);
      fn(null, blessAll(res));
    };
    (_collection = this.collection).find.apply(_collection, _toConsumableArray(params.slice(0, -1))).toArray(cb);
    return this;
  }
  return (_collection2 = this.collection).find.apply(_collection2, [].concat(params, [fn])).toArray().then(blessAll);
};

Model.findOne = function (query, cb) {
  var _this2 = this;

  var blessOne = function blessOne(obj) {
    return _this2.bless(obj);
  };
  var callback = function callback(err, res) {
    if (err) return cb(err);
    cb(null, blessOne(res));
  };
  if (cb) {
    this.collection.findOne(query, callback);
    return this;
  }
  return this.collection.findOne(query).then(blessOne);
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
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (constructor) {
    if (options.collection) {
      if (constructor.isPersistentRoot) throw new Error('Cannot overload collection\'s name for class \'' + constructor.name + '\'');
      models.push(constructor);
      constructor.collectionName = options.collection;
      constructor.isPersistentRoot = true;
      _lodash2.default.each(Model.extendableProperties, function (prop) {
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
  if (cb) return DB.close(cb);
  return DB.close();
};

MongoBless.bless = function (obj) {
  return Model.bless.bind(this)(obj);
};

MongoBless.connect = function (opt, cb) {
  var options = _lodash2.default.extend({ host: '127.0.0.1', port: 27017, auto_reconnect: true, poolSize: 10, w: 1, strict: true, native_parser: true, verbose: true }, opt);
  var mongoserver = void 0;

  if (!options.replicaSet) mongoserver = new _mongodb2.default.Server(options.host, options.port, options);else {
    var replicaServers = _lodash2.default.map(options.replicaSet.servers, function (server) {
      return new _mongodb2.default.Server(server.host, server.port, server.options);
    });
    mongoserver = new _mongodb2.default.ReplSet(replicaServers, _lodash2.default.extend({}, options.replicaSet.options, { rs_name: options.replicaSet.name }));
  }

  var dbconnector = new _mongodb2.default.Db(options.database, mongoserver, options);
  var initModels = function initModels(db) {
    DB = db;
    for (var i in models) {
      models[i].connect(db);
    }
    debug("mongobless is ready for your requests ...");
    return db;
  };

  if (cb) {
    dbconnector.open(function (err, db) {
      if (err) return cb(err);
      initModels(db);
      cb(null, db);
    });
  } else {
    return dbconnector.open().then(initModels);
  }
};

var ObjectId = exports.ObjectId = _mongodb2.default.ObjectID;
