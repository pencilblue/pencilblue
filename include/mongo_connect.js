global.MONGO_SERVER = 'mongodb://127.0.0.1:27017/';
global.MONGO_DATABASE = 'pencil_blue';

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
