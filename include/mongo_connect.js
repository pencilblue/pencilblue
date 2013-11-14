global.mongo = require('mongodb').MongoClient
    , format = require('util').format;
global.ObjectID = require('mongodb').ObjectID;

global.mongoDB;
mongo.connect(MONGO_SERVER + MONGO_DATABASE, function(error, db)
{
    if(error)
    {
        throw error;
    }
    mongoDB = db;
});
