/**
 * EditSection - Edits a site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditSection(){}

//inheritance
util.inherits(EditSection, pb.FormController);

EditSection.prototype.onPostParamsRetrieved = function(post, cb){
	var self = this; 
	
	//merge in get params
	pb.utils.merge(this.query, post);
	
	//verify required parameters exist
	var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(post.id, 'section', function(err, section) {
    	//TODO handle error
    	
        if(section == null) {
            self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', output);
            return;
        }

        //update existing document
        pb.DocumentCreator.update(post, section, ['keywords'], ['url', 'parent']);
        
        //ensure a URL was provided
        if(!section['url']) {
            section['url'] = section['name'].toLowerCase().split(' ').join('-');
        }
        
        //now start validation
        //check for reserved names
        if(section['name'] == 'admin') {
            formError('^loc_EXISTING_SECTION^', '/admin/content/sections/section_map', cb);
            return;
        }
        
        var where = {_id: {$ne: section._id}, $or: [{name: section['name']}, {url: section['url']}]};
        dao.count('section', where, function(err, count) {
            if(count > 0) {console.log('here');
                self.formError('^loc_EXISTING_SECTION^', '/admin/content/sections/section_map', cb);
                return;
            }
            
            dao.update(section).then(function(data) {
                if(util.isError(data)) {
                    self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
                    return;
                }
                
                self.session.success = section.name + ' ^loc_EDITED^';
                self.checkForSectionMapUpdate(section, function() {                
                    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
                });
            });
        });
    });
};

EditSection.prototype.getRequiredFields = function() {
	return ['id', 'name', 'editor'];
};

EditSection.prototype.checkForSectionMapUpdate = function(section, cb) {
	//only check if a parent exists
    if(!section['parent']) {
        cb();
        return;
    }
        
    var sectionUID = section._id.toString();

    pb.settings.get('section_map', function(err, sectionMap) {
        if(sectionMap == null) {
            cb();
            return;
        }
        
        var sectionMapElement = null;
        for(var i = 0; i < sectionMap.length; i++) {
            
        	for(var j = 0; j < sectionMap[i].children.length; j++) {
                
        		if(sectionMap[i].children[j].uid == sectionUID) {
                    
        			if(sectionMap[i].uid != section['parent']) {
                        sectionMapElement = sectionMap[i].children[j];
                        sectionMap[i].children.splice(j, 1);
                    }
                    break;
                }
            }
        }
        
        if(!sectionMapElement) {
            cb();
            return;
        }
        
        for(var i = 0; i < sectionMap.length; i++) {
            if(sectionMap[i].uid == section['parent'])  {
                sectionMap[i].children.push(sectionMapElement);
                break;
            }
        }
        
        pb.settings.set('section_map', sectionMap, cb);
    });
};

EditSection.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections/section_map', output);
            return;
        }
        
        var get = getQueryParameters(request);
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['name', 'editor']))
        {
            formError(request, session, message, '/admin/content/sections/section_map', output);
            return;
        }
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/sections/section_map', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections/section_map', output);
                return;
            }
            
            var section = data[0];
            var sectionDocument = createDocument('section', post, ['keywords'], ['url', 'parent']);
            
            if(!sectionDocument['url'])
            {
                sectionDocument['url'] = sectionDocument['name'].toLowerCase().split(' ').join('-');
            }
            if(sectionDocument['name'] == 'admin')
            {
                formError(request, session, '^loc_EXISTING_SECTION^', '/admin/content/sections/section_map', output);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'section', $or: [{name: sectionDocument['name']}, {url: sectionDocument['url']}]}, function(data)
            {
                if(data.length > 0)
                {
                    for(var i = 0; i < data.length; i++)
                    {
                        if(!data[i]._id.equals(section._id))
                        {
                            formError(request, session, '^loc_EXISTING_SECTION^', '/admin/content/sections/section_map', output);
                            return;
                        }
                    }
                }
                
                editDBObject(section._id, sectionDocument, [], function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections/section_map', output);
                        return;
                    }
                    
                    session.success = sectionDocument.name + ' ^loc_EDITED^';
                    
                    EditSection.checkForSectionMapUpdate(sectionDocument, function()
                    {                
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: pb.config.siteRoot + '/admin/content/sections/section_map'});
                        });
                    });
                });
            });
        });
    });
};

EditSection.checkForSectionMapUpdate = function(sectionDocument, output)
{
    if(!sectionDocument['parent'])
    {
        output();
        return;
    }

    getDBObjectsWithValues({object_type: 'section', name: sectionDocument['name']}, function(data)
    {
        if(data.length == 0)
        {
            output();
            return;
        }
        
        var sectionUID = data[0]._id.toString();

        getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
        {
            if(data.length == 0)
            {
                output();
            }
            
            var sectionMap = data[0].value;
            var sectionMapElement = null;
            
            for(var i = 0; i < sectionMap.length; i++)
            {
                for(var j = 0; j < sectionMap[i].children.length; j++)
                {
                    if(sectionMap[i].children[j].uid == sectionUID)
                    {
                        if(sectionMap[i].uid != sectionDocument['parent'])
                        {
                            sectionMapElement = sectionMap[i].children[j];
                            sectionMap[i].children.splice(j, 1);
                        }
                        break;
                    }
                }
            }
            
            if(!sectionMapElement)
            {
                output();
                return;
            }
            
            for(var i = 0; i < sectionMap.length; i++)
            {
                if(sectionMap[i].uid == sectionDocument['parent'])
                {
                    sectionMap[i].children.push(sectionMapElement);
                    break;
                }
            }
            
            var settingDocument = createDocument('setting', {key: 'section_map', value: sectionMap});
            editDBObject(data[0]._id, settingDocument, [], function(data)
            {
                output();
            });
        });
    });
};

//exports
module.exports = EditSection;
