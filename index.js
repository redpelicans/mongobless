var mongodb = require('mongodb')
  , _ = require("underscore")
  , redModels = [];

module.exports.connect = function(opt, cb){
  var options = _.extend({host: '127.0.0.1', port: 27017, auto_reconnect: true, poolSize: 10, w:1, strict: true, native_parser: true}, opt)
    ,  mongoserver = new mongodb.Server(options.host, options.port, options)
    ,  dbconnector = module.exports.db = new mongodb.Db(options.database, mongoserver, options);

  dbconnector.open(function(err, db){
    if (err) return cb(err);

    for(var i in redModels){
      redModels[i].connect(db);
    }

    console.log("mongo-redline is ready for your requests ...");

    cb(null, db); 
  });
  return this;
};

module.exports.objectID = mongodb.ObjectID;

module.exports.close = function(cb){ module.exports.db.close(cb); };


var Model = module.exports.Model = new Function;

/** 
* Model.collection -> mongodb.collection
*
* MongoDB collection getter
*
**/
Model.prototype = {
  get collection(){
  // Obsolete
    return this.constructor.collection;
  }
};

/**
* Model.bless([[Object]]) -> Object
*
* Use to dynamically type an object as Model by setting object's __proto__ with
* Model.prototype:
*
*     function(obj){
*         obj.__proto__ = this.prototype;
*         return obj;
*     }
*
* Very dangerous: use it carefully !!
*
**/
Model.bless = function(obj){
  obj.__proto__ = this.prototype;
  return obj;
};


Model.hasOwnCollection = function(){
  // false si n'hérite pas directement de Model
  return this.hasOwnProperty('collectionName');
};

Model.connect = function(db){
  if(this.hasOwnCollection()) this.db = db;
};

/**
* Model.findOne(query, callback) -> [[Model]]
*
* wrapper around this.collection.findOne but result object will be blessed (see
* [[Model.bless]]).
**/
Model.findOne = function(query, callback){
  var cb = function (err, res) {
    if(err) return callback(err);
    if(!res) return callback(null, null);
    callback(null, this.bless(res));
  }.bind(this);
  this.collection.findOne(query, cb);
  return this;
}

/**
* Model.findAll(query, options, callback) -> [[Array]]
*
* wrapper around this.collection.find but result objects will be blessed (see
* [[Model.bless]]).
*
* ##### exemple:
*
*        models.products.finditems(
*             {hId: 1, :date: {$lte: new Date()}}, 
*             {sort: {date: 1}},
*             function(err, results){ ... }
*        );
*
* ##### options: see http://mongodb.github.com/node-mongodb-native/
*
**/

Model.findAll = function(query, options, callback){
  var args = Array.prototype.slice.call(arguments)
    , fn = args.pop()
    , self = this
    , cb = function (err, res) {
    if(err) return fn(err);
    fn(null, _.map(res, function(obj){return self.bless(obj);}));
  };
  this.collection.find.apply(this.collection, args).toArray(cb);
  return this;
}

Model.findItems = Model.findAll;

/** 
* Model#collection -> mongodb.collection
*
* MongoDB collection getter
*
**/

Model.__defineGetter__('collection', function(){return this.db.collection(this.collectionName)});


/** 
* utils.extend(destination, source) -> destination
*
* Mixin source properties into destination object, including getters and setters
*
*  - destination (Object): object to be extended
*  - source (Object): properties supplier
*
*        var foo = {msg: 'coucou'};
*        utils.extend(foo, {boo: function(){return this.msg}})
*        foo.boo();
*
**/

var extend = module.exports.extend = function (destination, source) {
  var sources = Array.prototype.slice.call(arguments, 1);
  for(var i in sources){
    var source = sources[i];
    Object.keys(source).forEach(function(property) {
      Object.defineProperty(destination, property, Object.getOwnPropertyDescriptor(source, property));
    });
  }
  return destination;
}


/** 
* utils.defineModel([, options = {}]) -> Model
*
* Use to define a new Model, see [[HREF.Model]].
* 
* - options (Object): new model definition
*
* ##### options
*
* * parent (Model): parent class of resulting model
* * 'collection' (String): mongodb collection name
* * 'mixins' (Array): mixins for new model
* * 'staticMethods' (Object): new model static methods
* * 'instanceMethods' (Object): new model instance methods
*
**/
module.exports.defineModel = function(options){
  superKlass = options['extends'] || Model ;
  options = options || {};

  var klass = options.staticMethods && options.staticMethods.init || new Function;
  if(options.staticMethods) extend(klass, options.staticMethods);
  klass.__proto__ = superKlass;
  klass.prototype = options.instanceMethods || {};

  if(options.collection){
    klass.collectionName = options.collection;
    redModels.push(klass);
  }

  if(options.mixins){
    var p = {};
    options.mixins.forEach(function(mixin){
      extend(p, mixin);
    });
    klass.prototype = extend(p, klass.prototype);
  }

  klass.prototype.__proto__ = superKlass.prototype;
  klass.prototype.constructor = klass;

  return klass;
}

