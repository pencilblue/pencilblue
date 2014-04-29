function UsernamePasswordAuthentication() {}

UsernamePasswordAuthentication.prototype.authenticate = function(credentials, cb) {
	if (!pb.utils.isObject(credentials) || !pb.utils.isString(credentials.username) || !pb.utils.isString(credentials.password)) {
		cb(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: "+credentials), null);
		return;
	}
	
	//build query
	var query = {
		object_type : 'user',
		'$or' : [ 
	        {
	        	username : credentials.username
	        }, 
	        {
	        	email : credentials.username
	        } 
        ],
		password : credentials.password
	};
	
	//check for required access level
	if (!isNaN(credentials.access_level)) {
		query.admin = {
			'$gt': credentials.access_level
		};
	}
	
	//search for user
	var dao = new pb.DAO();
	dao.loadByValues(query, 'user', cb);
};

//exports
module.exports = UsernamePasswordAuthentication;
