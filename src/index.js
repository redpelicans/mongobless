import mongodb from 'mongodb';
import _ from 'lodash';

const debug = require('debug')('mongobless');

const models = [];
let DB;
const Model = new Function();
const isFunction = obj => typeof obj === 'function';

function extend(destination) {
  const sources = Array.prototype.slice.call(arguments, 1);
  for(let i in sources){
    const source = sources[i];
    Object.keys(source).forEach(function(property) {
      Object.defineProperty(destination, property, Object.getOwnPropertyDescriptor(source, property));
    });
  }
  return destination;
}

Model.bless = function(obj){
  if (!obj) return;
  obj.__proto__ = this.prototype;
  obj.constructor = this;
  return obj;
};

Model.findAll = function(...params){
  const blessAll = data => data.map(obj => this.bless(obj));
  const fn = params[params.length - 1];

  if (isFunction(fn)) {
    const cb = (err, res) => {
      if(err) return fn(err);
      fn(null, blessAll(res));
    };
    this.collection.find(...params.slice(0, -1)).toArray(cb);
    return this;
  }
  return this.collection.find(...params).toArray().then(blessAll);
};

Model.findOne = function(...params){
  const blessOne = obj => this.bless(obj);
  const fn = params[params.length - 1];

  if (isFunction(fn)) {
    const cb = (err, res) => {
      if(err) return fn(err);
      fn(null, blessOne(res));
    };
    this.collection.findOne(...params.slice(0, -1), cb);
    return this;
  }
  return this.collection.findOne(...params).then(blessOne);
}

Object.defineProperty(Model, 'collection', {
    enumerable: true
  , configurable: false
  , get: function(){return this.db.collection(this.collectionName) }
});

Model.connect = function(db){ 
  this.db = db;
}

Model.extendableProperties = ['connect', 'collection', 'findOne', 'findAll'];

export default function MongoBless(options = {}){
  return function(constructor){
    if(options.collection){
      if(constructor.isPersistentRoot)throw new Error(`Cannot overload collection's name for class '${constructor.name}'`);
      models.push(constructor);
      constructor.collectionName = options.collection;
      constructor.isPersistentRoot = true;
      _.each(Model.extendableProperties, prop => {
        Object.defineProperty(constructor, prop, Object.getOwnPropertyDescriptor(Model, prop));
      });
      if(!constructor.bless){
        Object.defineProperty(constructor, 'bless', Object.getOwnPropertyDescriptor(Model, 'bless'));
      }
    }else{
      constructor.isPersistentRoot = false;
    }
  }
}

MongoBless.close = cb => { 
  if (cb) return DB.close(cb); 
  return DB.close();
}

MongoBless.bless = function(obj){ 
  return Model.bless.bind(this)(obj);
};

MongoBless.connect = function(opt, cb){
  const options = _.extend({host: '127.0.0.1', port: 27017, auto_reconnect: true, poolSize: 10, w:1, strict: true, native_parser: true, verbose: true}, opt);
  let mongoserver;

  if (!options.replicaSet)
    mongoserver = new mongodb.Server(options.host, options.port, options);
  else {
    const replicaServers = _.map(options.replicaSet.servers, function(server){
      return new mongodb.Server( server.host, server.port, server.options);
    });
    mongoserver = new mongodb.ReplSet(replicaServers, _.extend({}, options.replicaSet.options, {rs_name: options.replicaSet.name}));
  }

  const dbconnector =  new mongodb.Db(options.database, mongoserver, options);
  const initModels = (db) => {
    DB = db;
    for(const i in models){ models[i].connect(db) }
    debug("mongobless is ready for your requests ...");
    return db;
  };

  if (cb) {
    dbconnector.open((err, db) => { 
      if (err) return cb(err);
      initModels(db); 
      cb(null, db);
    });
  } else {
    return dbconnector.open().then(initModels);
  }

};


export const ObjectId = mongodb.ObjectID;
