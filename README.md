## red-mongo

red-mongo is a very lite an simple library to connect to Mongodb and map Document Object Models with plain Javascript ones.
It's purely schemaless, fully comptible with official Mongo API and made like a toolkit to fit your requirements rather than a full fonctionnal framework like Mongoose.
You can use it just to connect to Mongo, not very useful, but efficient : use only one connexion, callback made, so easily integrated with node.js and async.
If you look for a thin layer to define models in a non intrusive manner, it will give you the beginning of the answer ...


### Usage

#### Define a Model

```javascript 
var redMongo = require('redMongo')
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

var redMongo = require('red-mongo')
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

* options *Object*, passed to mongodb.Server and new mongodb.Db
  * `host`: server address, default to 127.0.0.1
  * `port`: server's port, default to 27017
  * `auto_reconnect`default to true
  * `poolSize` default to 10
  * ` w` default to 1
  * `strict` default to true
  * `native_parser` defaut to true


#### Models

##### redMongo.defineModel(options)

Create a new red-mongo model
