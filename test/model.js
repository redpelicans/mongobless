/* jshint node: true */
'use strict';

var mongoRedline = require('../')
  , util = require('util')
  , _ = require('underscore');

var Printable = {
  toString: function(){
    return this.type + '=>' + this.surface;
  }
};


var Piece = mongoRedline.defineModel({
  collection: 'test_pieces',
  mixins: [Printable],
  instanceMethods:{
    store: function(cb){
      this.constructor.store(this, cb);
    }
  },
  staticMethods: {
    __attrs: ['type'],
    get attrs(){
      function getAttrs(obj){
        if(mongoRedline.Model.isPrototypeOf(obj.__proto__)){
          return (obj.hasOwnProperty('__attrs') ? obj.__attrs : []).concat(getAttrs(obj.__proto__));
        }else{
          return obj.hasOwnProperty('__attrs') ? obj.__attrs : [];
        }
      }
      return getAttrs(this);
    },

    store: function(obj, cb){
      var store = _.inject(obj.constructor.attrs, function(s, attr){if(obj[attr]) s[attr] = obj[attr]; return s}, {});
      Piece.collection.insert(store, function(err, pieces){
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
    },

    __attrs: ['size'],
      
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
    },
    __attrs: ['radius'],
  }
});

module.exports = {
  Piece: Piece,
  Square: Square,
  Circle: Circle,
}
