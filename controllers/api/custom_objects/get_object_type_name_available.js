/**
 * Check if the proposed name for a custom object type is available
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function GetObjectTypeNameAvailable(){}

//inheritance
util.inherits(GetObjectTypeNameAvailable, pb.FormController);
                   
GetObjectTypeNameAvailable.prototype.render = function(cb) {
	var self = this;
	var get = this.query;
	
	if(!get['name'] || get['name'].length == 0)
	{
	    cb({content: apiResponse(apiResponseCode.FAILURE, 'name was not passed')});
        return;
	}

    var dao = new pb.DAO();
    dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}
		
		//none to manage
        if(customObjectTypes.length == 0) {                
            cb({content: apiResponse(apiResponseCode.SUCCESS, get['name'] + ' is available', true)});
            return;
        }
        
        // Case insensitive test for duplicate name
        for(var i =0; i < customObjectTypes.length; i++)
        {
            if(get['name'].toLowerCase() == customObjectTypes[i].name.toLowerCase())
            {
                cb({content: apiResponse(apiResponseCode.SUCCESS, get['name'] + ' is not available', false)});
                return;
            }
        }
        
        cb({content: apiResponse(apiResponseCode.SUCCESS, get['name'] + ' is available', true)});
        return;
    });
};

//exports 
module.exports = GetObjectTypeNameAvailable;
