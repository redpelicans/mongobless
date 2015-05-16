import {Piece, Square, Circle} from './model';
import should from 'should';
import _ from 'lodash';
import * as DB from './helpers/db';
import {data} from './data/pieces';


describe('Polymorphism model', function(){

  before(cb => DB.connect(cb))

  beforeEach(done => {
    DB.drop( err => {
      if(err) done(err);
      DB.load(data, done);
    })
  })

  after( done => DB.close(done) )

  describe('Compute total surface', () => {
    it('should have a good surface', (done) => {
      Piece.findAll((err, dbpieces) => {
        should.not.exist(err);
        let totalDbSurface = _.inject(dbpieces, (res, piece) => res + piece.surface, 0);
        should(7).equal(totalDbSurface);
        done();
      });
    });
  });

});
