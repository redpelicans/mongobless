/* jshint node: true */
'use strict';

var mongoRedline = require('../')
  , should = require('should')
  , assert = require('assert')
  , _ = require('underscore')
  , util = require('util')
  , database = 'tests'
  , Piece = require('./model').Piece
  , Square = require('./model').Square
  , Circle = require('./model').Circle;

describe('Polymorphism model', function(){
  before(function(done){
    mongoRedline.connect({host: 'localhost', database: database, verbose: false}, function(err, db){
      should.not.exist(err);
      should.ok(Piece.db.collection);
      db.collection(Piece.collectionName).drop(function(){done()});
    });
  });

  after(function(done){
    mongoRedline.db.collection(Piece.collectionName).drop(function(){
      mongoRedline.close(); 
      done()
    });
  });

  // after(function(done){
  //   mongoRedline.close(); 
  //   done()
  // });


  var pieces = {
    square: new Square(2),
    circle: new Circle(1)
  };
  var storedSquare;

  describe('Add a square and load it', function(){
    it('should be a square instance Model', function(done){
      should.ok(pieces.square.collection);
      pieces.square.store(function(err, piece){
        should.not.exist(err);
        storedSquare = piece;
        Piece.findOne({type: 'square', size: 2}, function(err, piece){
          should.not.exist(err);
          should.exist(piece.collection);
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
    it('should be a circle data structure', function(done){
      pieces.circle.store(function(err, piece){
        should.not.exist(err);
        should.exist(piece._id);
        piece.type.should.equal('circle');
        should.not.exist(piece.surface);
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
