/**
 * UsernameAvailable - Interface for signing a user up
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function UsernameAvailable(){}

//inheritance
util.inherits(UsernameAvailable, pb.BaseController);

UsernameAvailable.prototype.render = function(cb) {
	var get  = this.query;
    
	var message = this.hasRequiredParams(get, ['username']);
    if(message) {
        cb({content: apiResponse(apiResponseCode.FAILURE, 'username missing from request')});
        return;
    }
    
    pb.users.isUserNameOrEmailTaken(get.username, '', null, function(error, isTaken) {
        if(isTaken) {
            cb({content: apiResponse(apiResponseCode.SUCCESS, get.username + ' is not available', false)});
            return;
        }
        
        
        cb({content: apiResponse(apiResponseCode.SUCCESS, get.username + ' is available', true)});
    });	
};

//exports
module.exports = UsernameAvailable;
