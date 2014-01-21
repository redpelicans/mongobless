var redMongo = require('..')
  , params = require('./params');


redMongo.connect(params, function(err){
  if(err)console.error(err);
  redMongo.close();
});

