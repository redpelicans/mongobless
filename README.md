red-mongo
=========


red-mongo is a very lite an simple library to connect to Mongodb and map Document Object Models with plain Javascript ones.
It's purely schemaless and fully comptible with official Mongo API.


# Defining a Model

```javascript 
var red-mongo = require('red-mongo')
  , OtherModel = require('other_models');

var MyModel =  red-mongo.define( red-mongo.Model, { 

  collectionName: 'my_models',
  mixins: [OtherModel],

  instanceMethods: {
    get age(){
      return this._age;
    }
  },

  staticMethods: {
    function doIt(newModel){}
  }

});

```
