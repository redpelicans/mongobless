import should from 'should';
import async from 'async';
import { Piece, Square, Circle } from './model';
import mongobless from '../src';

const data={
  collections:{
    pieces: [
      {
        _id: 1,
        type: "square",
        size : 3,
      },
      {
        _id: 2,
        type: "circle",
        radius: 2
      }
    ]
  }
};

let DB;

const connect = (cb) => {
  let opt = process.env['NODE_ENV'] === 'travis' ? {host: 'localhost', port: 27017, database: 'tests'} : require('../params').db;
  mongobless.connect(opt, function(err, db) {
    if(err) return cb(err);
    DB = db;
    cb(err, mongobless);
  });
};
const close = cb => mongobless.close(cb);
const drop = cb => DB.dropDatabase(cb);
const load = (data, cb) => {
  var names = Object.keys(data.collections);
  async.each(names, function(name, cb) {
    DB.collection(name).insert(data.collections[name], cb)
  }, cb)
};

describe('Polymorphism model', function(){
  before(connect);
  beforeEach((done) => {
    drop(err => {
      if (err) done(err);
      load(data, done);
    })
  });
  after(close);

  describe('Compute total surface with callbacks', () => {
    it('should have a good surface', (done) => {
      Piece.findAll((err, pieces) => {
        should.not.exist(err);
        const totalDbSurface = pieces.reduce((res, piece) => res + piece.surface, 0);
        should(21).equal(totalDbSurface);
        done();
      });
    });
  });
});
