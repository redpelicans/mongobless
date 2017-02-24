import should from 'should';
import mongobless from '../src';
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
  let opt = process.env['NODE_ENV'] === 'travis' ? {host: 'localhost', port: 27017, database: 'tests'} : require('../params').db;
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

  describe('Compute total surface', () => {
    it('should have a good surface', (done) => {
      Piece
        .findAll()
        .then( pieces => {
          let totalDbSurface = pieces.reduce((res, piece) => res + piece.surface, 0);
          should(7).equal(totalDbSurface);
          done();
      })
      .catch(done);
    });
  });

});
