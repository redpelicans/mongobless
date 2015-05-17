import mongodb from 'mongodb';
import _ from 'lodash';

let debug = require('debug')('mongobless:init');

let models = [];
let DB;
let Model = new Function();

function extend(destination) {
  var sources = Array.prototype.slice.call(arguments, 1);
  for(let i in sources){
    var source = sources[i];
    Object.keys(source).forEach(function(property) {
      Object.defineProperty(destination, property, Object.getOwnPropertyDescriptor(source, property));
    });
  }
  return destination;
}

Model.bless = function(obj){
  obj.__proto__ = this.prototype;
  obj.constructor = this;
  return obj;
};

Model.findAll = function(){
  let args = Array.prototype.slice.call(arguments)
    , fn = args.pop()
    , self = this
    , cb = (err, res) => {
      if(err) return fn(err);
      fn(null, res.map(obj => self.bless(obj)));
    };
    this.collection.find.apply(this.collection, args).toArray(cb);
    return this;
};

Model.findOne = function(query, cb){
  let callback = (err, res) => {
    if(err) return cb(err);
    if(!res) return cb(null, null);
    cb(null, this.bless(res));
  }.bind(this);
  this.collection.findOne(query, callback);
  return this;
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

MongoBless.close = cb => DB.close(cb); 

MongoBless.bless = function(obj){ 
  return Model.bless.bind(this)(obj);
};

MongoBless.connect = function(opt, cb){
  var options = _.extend({host: '127.0.0.1', port: 27017, auto_reconnect: true, poolSize: 10, w:1, strict: true, native_parser: true, verbose: true}, opt)
    , mongoserver;

  if (!options.replicaSet)
    mongoserver = new mongodb.Server(options.host, options.port, options);
  else {
    var replicaServers = _.map(options.replicaSet.servers, function(server){
      return new mongodb.Server( server.host, server.port, server.options);
    });
    mongoserver = new mongodb.ReplSet(replicaServers, _.extend({}, options.replicaSet.options, {rs_name: options.replicaSet.name}));
  }

  var dbconnector =  new mongodb.Db(options.database, mongoserver, options);

  dbconnector.open(function(err, db){
    DB = db;
    if (err) return cb(err);
    for(let i in models){ models[i].connect(db) }
    debug("mongobless is ready for your requests ...");
    cb(null, db); 
  });
};


export let ObjectId = mongodb.ObjectID;
