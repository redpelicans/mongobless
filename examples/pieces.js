var redMongo = require('..')
  , params = require('./params')
  , async = require('async');


var Piece  = redMongo.defineModel({
  collection: 'pieces',

  instanceMethods: {
    toString: function(){
      return this.type + ' => ' + this.surface;
    },
  },

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

var Circle = redMongo.defineModel({
  extends: Piece,

  instanceMethods: {
    get surface(){
      return 3.14 * this.radius * this.radius;
    }
  },

  staticMethods: {
    init: function(radius){
      this.radius = radius;
      this.type = 'circle';
    }
  }
});


function addPieces(cb){
  Piece.collection.insert([new Square(2), new Circle(2)], function(err, res){
    cb(err);
  });
}

function computeTotalSurface(cb){
  Piece.findAll({}, function(err, pieces){
    if(err)return cb(err);
    var surface = pieces.reduce(function(sum, piece){return sum + piece.surface}, 0);
    cb(null, surface);
  });
}

redMongo.connect(params, function(err){
  if(err)console.error(err);
  async.waterfall([addPieces, computeTotalSurface], function(err, surface){
    if(err)cb(err);
    else console.log(surface);
    redMongo.close();
  });
});
