import should from 'should';
import mongobless from '..';
import { Piece, Square, Circle } from './model';

const data = {
  collections:{
    pieces: [
      {
        _id: 1,
        type: "square",
        size : 2,
      },
      {
        _id: 2,
        type: "circle",
        radius: 1
      }
    ]
  }
};

let DB;

const connect = () => {
  const opt = process.env['NODE_ENV'] === 'travis' ? {host: 'localhost', port: 27017, database: 'tests'} : require('../params').db;
  return mongobless.connect(opt).then(db => DB = db);
};

const close = () => mongobless.close();
const drop = () => DB.dropDatabase();
const load = (data) => {
  var names = Object.keys(data.collections);
  const loads = names.map(name => DB.collection(name).insert(data.collections[name]));
  return Promise.all(loads);
};

describe('Polymorphism model with promises', () => {
  before(connect);
  beforeEach(() => drop().then(() => load(data)));
  after(close);

  it('should compute the right surface', (done) => {
    Piece
      .findAll()
      .then( pieces => {
        const totalDbSurface = pieces.reduce((res, piece) => res + piece.surface, 0);
        should(7).equal(totalDbSurface);
        done();
    })
    .catch(done);
  });

});

describe('MongoDB API with promises', () => {
  before(() => connect().then(drop));
  after(close);

  it('should load data', () => load(data));
  it('should get data', (done) => {
    Piece.findAll()
      .then(pieces => {
        should(pieces.map(p => p._id)).eql(data.collections.pieces.map(p => p._id));
        done();
      })
      .catch(done);
  });

  it('should filter data', (done) => {
    Piece.findAll({ type: 'square' })
      .then(pieces => {
        const totalDbSurface = pieces.reduce((res, piece) => res + piece.surface, 0);
        should(4).equal(totalDbSurface);
        done();
      })
      .catch(done);
  });

  it('should filter and project data', (done) => {
    Piece.findAll({ type: 'square' }, { size: 1 })
      .then(pieces => {
        should(pieces[0].size).equal(2);
        done();
      })
      .catch(done);
  });

  it('should find one', (done) => {
    Piece.findOne({ type: 'square' }, { size: 1 })
      .then(piece => {
        should(piece.size).equal(2);
        done();
      })
      .catch(done);
  });

});
