## mongo-redline

mongo-redline is a very lite an simple Node.js library to connect to Mongodb and map documents with plain Javascript objects.
It's purely schemaless, fully compatible with official Mongo API and made like a toolkit to fit your needs, rather than a full functional framework like Mongoose.
You can use it just to connect to Mongo, it may not very useful, but could be efficient : use only one connection, callback made, so easily integrated with node.js and async.
If you look for a thin layer to define models in a non intrusive manner, it will give you the beginning of the answer ...


### Usage

#### Define a Model

```javascript 
var redMongo = require('mongo-redline')
  , Mixin1 = require('mixin1');

var MyModel =  redMongo.defineModel({ 

  collection: 'my_models',

  mixins: [Mixin1],

  instanceMethods: {
    get age(){
      return (new Date()).getFullYear() -  this.birthdayYear;
    }
  },

  staticMethods: {
    function doIt(newModel){}
  }

});

```

#### Connect, Query and Manipule Objects


```javascript 

var redMongo = require('mongo-redline')
  , myModel = require('my_model');

redMongo.connect({}, function(err){
  if( err) return console.error( "...");
  // Query my_models collection
  my_model.findOne({name: 'toto'}, function(err, model){
    if(err)console.error(err);
    else console.log(model.age)
    redMongo.close();
  });
}
```



### API

#### Connection

##### redMongo.connect(options, cb)

Create a MongoDB connection, and callback it has result.

* options *Object*, passed to `mongodb.Server` and `new mongodb.Db`

  * `host`: server address, default to 127.0.0.1
  * `port`: server's port, default to 27017
  * `auto_reconnect`default to true
  * `poolSize` default to 10
  * ` w` default to 1
  * `strict` default to true
  * `native_parser` defaut to true


#### Models

Create a new redMongo model. 

RedMongo models offer:

* type definitions via redMongo models
* a binding between collections and redMongo models
* a binding at reading time between mongo's documents and javascript objets
* facilities to query (findOne, findAll) documents based redMongo models and a bridge to mongodb API

##### redMongo.defineModel(options)

Returns a redModel.

* options *Object*:

  * `collection`: collection's name. May be optionnal for polymorphisme.
  * `extends`: redMongo super model, default as redMongo.Model (see ex pieces.js)
  * `mixins`: list of javascript objects to be used as mixins for the new model
  * `instanceMethods`: javascript object used to define documents methods
  * `staticMethods`: javascript object used to define `redModel` methods. Adding an entry within this object is similare to set a function attribute on the resulting redModel. 'init' key is reserved to define constructor (see below)

`RedModel.bless`, defined within `staticMethods` or in an other manner, is used to 'type' mongo's document. At reading time each document is blessed depending on its collection. For polymorphism you have to do it manually (see below). 


```javascript 

var Printable = {
  toString: function(){
    return this.type + ' => ' + this.surface;
  },
}

var Piece  = redMongo.defineModel({
  collection: 'pieces',

  mixins: [Printable],

  staticMethods: {
   
    init: function(name){
      this.name = name;
      this.type = 'piece';
    },

    bless: function (obj){
      switch( obj.type ){
        case 'square':
          return redMongo.Model.bless.bind(Square)(obj);
        case 'circle':
          return redMongo.Model.bless.bind(Circle)(obj);
      default:
       return redMongo.Model.bless.bind(Piece)(obj);
      }
    }
  }
});

var Square = redMongo.defineModel({
  extends: Piece,

  instanceMethods: {
    get surface(){
      return this.size * this.size;
    }
  },
  staticMethods: {
    init: function(size){
      this.size = size;
      this.type = 'square';
    }
  }
});


```

##### redModel.findOne( arguments )

Use same signature as `node-mongodb-native` driver. will call `redModel.bless(document)` on resulting document.

Return only one result, the first if many.


```javascript 
  Piece.findOne({_id: ObjectId("52de8aa97a2731486fdcf8ee")}, function(err, piece){});
```


##### redModel.findAll( arguments )

Same as `node-mongodb-native`#find, but will call `redModel.bless(document)` on each resulting document.

```javascript 
  Piece.findAll({type: 'square'}, function(err, pieces){});
```

In this example, you will extract all squares documents from the collection, resulting documents will be blessed as Square. 

`Square.findAll()` will give you all Pieces, not only Squares. You have to select `type` manually.


##### redModel.collection

Give you direct access to `node-mongodb-native` driver:

```javascript 
  Piece.collection.insert([new Square(2), new Circle(2)], function(err, res){})
```
