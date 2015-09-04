## mongobless [![Build Status](https://travis-ci.org/redpelicans/mongobless.png)](https://travis-ci.org/redpelicans/mongobless)


mongobless is a very lite an simple Node.js library to connect to Mongodb and map documents with plain Javascript objects.
It's purely schemaless, fully compatible with official Mongo API and made like a toolkit to fit your needs, rather than a full functional framework like Mongoose.
It's only a read-only ODM, writes MUST be done manually.
You can use it just to connect to Mongo, it may not very useful, but could be efficient : use only one connection, callback made, so easily integrated with node.js and async.
If you look for a thin layer to define models in a non intrusive manner, it will give you the beginning of the answer ...

Last but not the least, Mongobless use es6 and es7 syntax, so you need babel to use it ...

### Usage

#### Define a Model

```javascript 
import mongobless from 'mongobless'

@mogobless({collection: 'models'})
export default class MyModel { 
  // plain es6 class 
  get age(){
    return (new Date()).getFullYear() -  this.birthdayYear;
  }
  
  static doIt(newModel){}

});

```



#### Inheritance

"Programming is subcontracting" said B. Meyer beginning of 90's, let's build subtypes, now ... 
We have to define Piece, Square and Circle types.


```
import  mongobless from  'mongobless';

@mongobless({collection: 'pieces'})
export class Piece{
  static bless(obj){
    switch(obj.type){
      case 'square':
        return mongobless.bless.bind(Square)(obj);
      case 'circle':
        return mongobless.bless.bind(Circle)(obj);
      default:
        return mongobless.bless.bind(Piece)(obj);
    }
  }
}

@mongobless()
export class Square extends Piece{
  get surface(){
    return this.size * this.size;
  }
    
  constructor(size){
    this.size = size;
    this.type = 'square';
  }
}

@mongobless()
export class Circle extends Piece{
  get surface(){
    //return Math.PI * Math.pow(this.radius, 2);
    return 3 * Math.pow(this.radius, 2);
  }

  constructor(radius){
    this.radius = radius;
    this.type = 'circle';
  }
}

```

mongobless is not very smart, just lite, so to define inheritance, you mainly have to do it manually, but good news, it's very simple and you can do what you want! First, at insert time, always add a type (or whetever name you want) attribute to your documents. In this example domain value must be ['circle', 'square']. Second, at loading time, if you use findOne or findAll, mongobless will call Piece.bless(document) for each document, and depending on document type value, will be blessed to the right type (here Square or Circle). It's clearly an antipattern, for a class to know it's subclasses, but in this context it's so simple, and useful that we will use it !


#### Connect, Query and Manipule Objects

```javascript 
import mongobless from 'mongobless'
import Mymodel from 'my_model';

mongobless.connect({}, err => {
  if( err) return console.error( "...");
  // Query models collection
  my_model.findOne({name: 'toto'}, (err, model) => {
    if(err)console.error(err);
    else console.log(model.age)
    mongobless.close();
  });
}
```
#### Run your Code

Because of the use of es6, es7 syntaxe you need a transpiler to use it:

```
  $ babel-node --stage 0 piece.js
```

### API

#### Connection

##### mongobless.connect(options, cb)

Create a MongoDB connection, and callback it has result.

* options *Object*, passed to `mongodb.Server` and `new mongodb.Db`

  * `host`: server address, default to 127.0.0.1
  * `port`: server's port, default to 27017
  * `auto_reconnect`default to true
  * `poolSize` default to 10
  * ` w` default to 1
  * `strict` default to true
  * `native_parser` defaut to true
  
  
##### mongobless.findOne( arguments )

Use same signature as `node-mongodb-native` driver. will call `redModel.bless(document)` on resulting document.

Return only one result, the first if many.


```javascript 
  Piece.findOne({_id: ObjectId("52de8aa97a2731486fdcf8ee")}, (err, piece) => {});
```

##### redModel.findAll( arguments )

Same as `node-mongodb-native`#find, but will call `redModel.bless(document)` on each resulting document.

```javascript 
  Piece.findAll({type: 'square'}, (err, pieces) => {});
```

In this example, you will extract all squares documents from the collection, resulting documents will be blessed as Square. 

`Square.findAll()` will give you all Pieces, not only Squares. You have to select `type` manually.


##### mongobless.collection

Give you direct access to `node-mongodb-native` driver:

```javascript 
  Piece.collection.insert([new Square(2), new Circle(2)], function(err, res){})
```

That's all folks ....
