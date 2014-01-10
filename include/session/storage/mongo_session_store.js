/**
 * MongoSessionStore
 * 
 * @author Brian Hyder <brianhyder@gmail.com
 */
function MongoSessionStore(){

};

var SESSION_COLLECTION_NAME = 'session';

MongoSessionStore.prototype.get = function(sessionId, cb){
	var dao = new pb.DAO();
	
	var query = {
		client_id: sessionId
	};
	dao.query(SESSION_COLLECTION_NAME, query, pb.DAO.PROJECT_ALL, pb.DAO.NATURAL_ORDER, 1, 0).then(function(result){
		var isError =  typeof result  == 'Error';
		if (isError){
			cb(result, null);
			return;
		}
		cb(null, result.length > 0 ? result[0] : null);
	});
};

MongoSessionStore.prototype.set = function(session, cb){
	var dao = new pb.DAO();
	
	//ensure an object type is set
	session.object_type = SESSION_COLLECTION_NAME;
	session.expires     = new Date().getTime() + (pb.config.session.timeout * 1000);
	
	//persist the session
	dao.update(session).then(function(result){
		var isError =  typeof result  == 'Error';
		cb(isError ? result : null, result);
	});
};

MongoSessionStore.prototype.clear = function(sessionId, cb){
	var dao = new pb.DAO();
	dao.deleteMatching(MongoSessionStore.getSessionQuery(sessionId), SESSION_COLLECTION_NAME).then(function(result){
		var isError =  typeof result  == 'Error';
		cb(isError ? result : null, result);
	});
};

MongoSessionStore.getSessionQuery = function(sessionId){
	return {
		client_id: sessionId
	};
};

MongoSessionStore.clearExpired = function(cb){
	pb.log.debug("MongoSessionStore: Reaping expired sessions...");
	var start = new Date().getTime();
	
	var dao   = new pb.DAO();
	var query = {
		expires: {
			"$lte": new Date().getTime()
		}
	};
	dao.deleteMatching(query, SESSION_COLLECTION_NAME).then(function(result){
		pb.log.debug("MongoSessionStore: Expired "+result+" sessions in "+(new Date().getTime() - start)+"ms");
		if (cb){
			cb(null, result);
		}
	});
};

MongoSessionStore.shutdown = function(){
	pb.log.debug("MongoSessionStore: Stopping Reaper...");
	clearInterval(TIMEOUT_ID);
	TIMEOUT_ID = null;
};

MongoSessionStore.startReaper = function(){
	if(TIMEOUT_ID == null){
		TIMEOUT_ID = setInterval(MongoSessionStore.clearExpired, 30000);
		pb.log.debug("MongoSessionStore: Reaper Interval ID="+TIMEOUT_ID);
	}
};

//set interval for expiring sessions
var TIMEOUT_ID = null;
MongoSessionStore.startReaper();

//set exports
module.exports = MongoSessionStore;