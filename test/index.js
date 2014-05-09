/* jshint node: true */
'use strict';

var mongoRedline = require('../')
  , should = require('should')
  , assert = require('assert')
  , _ = require('underscore')
  , database = 'tests';

var Printable = {
  toString: function(){
    return this.type + '=>' + this.surface;
  }
};

var Piece = mongoRedline.defineModel({
  collection: 'test_pieces',
  mixins: [Printable],
  staticMethods: {
    init: function(name){
      this.name = name;
      this.type = 'piece';
    },
    store: function(obj, cb){
      Piece.collection.insert(obj, function(err, pieces){
        if(err)return cb(err);
        cb(null, pieces[0]);
      });
    },
    bless: function(obj){
      switch(obj.type){
        case 'square':
          return mongoRedline.Model.bless.bind(Square)(obj);
        case 'circle':
          return mongoRedline.Model.bless.bind(Circle)(obj);
        default:
          return mongoRedline.Model.bless.bind(Piece)(obj);
      }
    }
  },
});

var Square = mongoRedline.defineModel({
  extends: Piece,
  instanceMethods: {
    get surface(){
      return this.size * this.size;
    },
  },
  staticMethods:{
    init: function(size){
      this.size = size;
      this.type = 'square';
    }
  }
});

var Circle = mongoRedline.defineModel({
  extends: Piece,
  instanceMethods: {
    get surface(){
      return Math.PI * Math.pow(this.radius, 2);
    },
  },
  staticMethods:{
    init: function(radius){
      this.radius = radius;
      this.type = 'circle';
    }
  }
});


describe('Polymorphism model', function(){
  before(function(done){
    mongoRedline.connect({host: 'localhost', database: database, verbose: false}, function(err, db){
      should.not.exist(err);
      db.collection(Piece.collectionName).drop(function(){done()});
    });
  });

  after(function(done){
    mongoRedline.db.collection(Piece.collectionName).drop(function(){
      mongoRedline.close(); 
      done()
    });
  });

  var pieces = {
    square: new Square(2),
    circle: new Circle(1)
  };
  var storedSquare;

  describe('Add a square and load it', function(){
    it('should be a square', function(done){
      Piece.store(pieces.square, function(err, piece){
        should.not.exist(err);
        storedSquare = piece;
        Piece.findOne({type: 'square', size: 2}, function(err, piece){
          should.not.exist(err);
          should.exist(piece.toString);
          should.exist(piece._id);
          piece.type.should.equal('square');
          piece.surface.should.equal(pieces.square.surface);
          piece._id.toString().should.equal(storedSquare._id.toString());
          done();
        });
      });
    });
  });

  describe('Add a circle', function(){
    it('should be a circle', function(done){
      Piece.store(pieces.circle, function(err, piece){
        should.not.exist(err);
        should.exist(piece._id);
        should.exist(piece.toString);
        piece.type.should.equal('circle');
        piece.surface.should.equal(pieces.circle.surface);
        done();
      });
    });
  });


  describe('Compute total surface', function(){
    it('should hace a good surface', function(done){
      Piece.findAll(function(err, dbpieces){
        should.not.exist(err);
        var totalDbSurface = _.inject(dbpieces, function(res, piece){return res + piece.surface}, 0)
          , totalSurface = _.inject(_.values(pieces), function(res, piece){return res + piece.surface}, 0);
        totalSurface.should.equal(totalDbSurface);
        done();
      });
    });
  });



});
