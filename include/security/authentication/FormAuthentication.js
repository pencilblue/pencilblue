function FormAuthentication() {}

//dependencies
var UsernamePasswordAuthentication = pb.UsernamePasswordAuthentication;

//inheritance
util.inherits(FormAuthentication, UsernamePasswordAuthentication);

FormAuthentication.prototype.authenticate = function(postObj, cb) {
	if (!pb.utils.isObject(postObj)) {
		cb(new Error("FormAuthentication: The postObj parameter must be an object: "+postObj), null);
		return;
	}
	
	//call the parent function
	var userDocument = pb.DocumentCreator.create('user', postObj);
	FormAuthentication.super_.prototype.authenticate.apply(this, [userDocument, cb]);
};

//exports
module.exports = FormAuthentication;
