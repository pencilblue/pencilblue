/**
 * Check if the proposed name for a custom object type is available
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function GetObjectTypeURLAvailable(){}

//inheritance
util.inherits(GetObjectTypeURLAvailable, pb.FormController);
                   
GetObjectTypeURLAvailable.prototype.render = function(cb) {
	var self = this;
	var get = this.query;
	
	if(!get['url'] || get['url'].length == 0)
	{
	    cb({content: apiResponse(apiResponseCode.FAILURE, 'url was not passed')});
        return;
	}

    var dao = new pb.DAO();
    dao.count('custom_object_type', {url: get['url'].toLowerCase()}, function(err, count) {
        if(count > 0) {
            cb({content: apiResponse(apiResponseCode.SUCCESS, get['url'] + ' is not available', false)});
            return;
        }
        
        dao.count('page', {url: get['url'].toLowerCase()}, function(err, count) {
            if(count > 0) {
                cb({content: apiResponse(apiResponseCode.SUCCESS, get['url'] + ' is not available', false)});
                return;
            }
        
            cb({content: apiResponse(apiResponseCode.SUCCESS, get['url'] + ' is available', true)});
            return;
        });
    });
};

//exports 
module.exports = GetObjectTypeURLAvailable;
