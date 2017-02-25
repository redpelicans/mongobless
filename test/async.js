import should from 'should';
import async from 'async';
import mongobless from '..';
import { Piece, Square, Circle } from './model';

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

  it('should compute a right surface', (done) => {
    Piece.findAll((err, pieces) => {
      should.not.exist(err);
      const totalDbSurface = pieces.reduce((res, piece) => res + piece.surface, 0);
      should(21).equal(totalDbSurface);
      done();
    });
  });
});

describe('MongoDB API with callbacks', () => {
  before((done) => connect(() => drop(done)));
  after(close);

  it('should load data', (done) => load(data, done));
  it('should get data', (done) => {
    Piece.findAll((err, pieces) => {
      if (err) return done(err);
      should(pieces.map(p => p._id)).eql(data.collections.pieces.map(p => p._id));
      done();
    });
  });

  it('should filter data', (done) => {
    Piece.findAll({ type: 'square' }, (err, pieces) => {
      if (err) return done(err);
      const totalDbSurface = pieces.reduce((res, piece) => res + piece.surface, 0);
      should(9).equal(totalDbSurface);
      done();
    })
  });

  it('should filter and project data', (done) => {
    Piece.findAll({ type: 'square' }, { size: 1 }, (err, pieces) => {
      if (err) return done(err);
      should(pieces[0].size).equal(3);
      done();
    })
  });

  it('should find one', (done) => {
    Piece.findOne({ type: 'square' }, { size: 1 }, (err, piece) => {
      if (err) return done(err);
      should(piece.size).equal(3);
      done();
    })
  });

});
