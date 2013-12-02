// Create a new DBObject by passing a mongo JSON of variables (i.e., {type: "user", name: "Blake", state: "NC"})
global.createDBObject = function(variables, output)
{
    (new DAO()).insert(variables).then(function(result){
    	if (typeof result === 'Error') {
            throw result;
        }
    	output(result);
    });
};

// Edit DBObject with ObjectID
global.editDBObject = function(oid, variables, unsetSkips, output)
{
    variables['last_updated'] = new Date();
    
    if(variables._id)
    {
        delete variables._id;
    }
    
    getDBObjectsWithValues({object_type: variables.object_type, _id: ObjectID(oid.toString())}, function(data)
    {
        var object = data[0];
        if(!object)
        {
            return null;
        }
        
        if(typeof unsetSkips === 'undefined')
        {
            unsetSkips = [];
        }
        unsetSkips.push('_id');
        
        var unsets = {};
        for(var key in object)
        {
            var unsetMatch = false;
            for(var i = 0; i < unsetSkips.length; i++)
            {
                if(key == unsetSkips[i])
                {
                    unsetMatch = true;
                    break;
                }
            }
            if(unsetMatch)
            {
                continue;
            }
            if(typeof variables[key] === undefined)
            {
                unsets[key] = 1;
            }
            // Allows for automatic removal of temporary session variables
            if(variables.object_type == 'session' && !variables[key])
            {
                unsets[key] = 1;
            }
        }
    
        mongoDB.collection(variables.object_type).update({_id: ObjectID(oid.toString())}, {$set: variables, $unset: unsets}, function(error, doc)
        {
            if(error)
            {
                throw error;
            }
            getDBObjectsWithValues({object_type: variables.object_type, _id: ObjectID(oid.toString())}, output);
        });
    });
};

// Delete DBObject with ObjectID
global.deleteDBObject = function(oid, object_type, output)
{
    (new DAO()).deleteById(oid, object_type).then(function(result){
    	if (typeof result === 'Error') {
            throw result;
        }
    	output(result);
    });
};

// Deletes DBObject that meet criteria
global.deleteMatchingDBObjects = function(criteria, output)
{
    mongoDB.collection(criteria.object_type).remove(criteria, function(error)
    {
        if(error)
        {
            throw error;
        }
        output(true);
    });
};

// Retrieves an array of objects
global.getDBObjectsWithValues = function(values, output) {
	
	var orderBy = null;
    if (values['$orderby']) {
        orderBy = values['$orderby'];
        delete values['$orderby'];
    }

    (new DAO()).query(values.object_type, values, DAO.PROJECT_ALL, orderBy).then(function(result){
    	if (typeof result === 'Error') {
            throw result;
        }
    	output(result);
    });
};
