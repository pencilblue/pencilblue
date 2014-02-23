/**
 * NewSection - Creates a new site section
 *    
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewSection(){}

//inheritance
util.inherits(NewSection, pb.FormController);

NewSection.prototype.onPostParamsRetrieved = function(post, cb) {
	var self    = this;
	var message = this.hasRequiredParams(post, ['name', 'editor']);
	if (message) {
        this.formError(message, '/admin/content/sections/new_section', cb);
        return;
    }
    
    var sectionDocument = pb.DocumentCreator.create('section', post, ['keywords'], ['parent']);
    if (!sectionDocument['url']) {
        sectionDocument['url'] = sectionDocument['name'].toLowerCase().split(' ').join('-');
    }
    
    //check for reserved sections
    if(sectionDocument['name'] == 'admin') {
        this.formError('^loc_EXISTING_SECTION^', '/admin/content/sections/new_section', output);
        return;
    }
    
    var dao = new pb.DAO();
    dao.count('section', {$or: [{name: sectionDocument['name']}, {url: sectionDocument['url']}]}, function(err, count) {
        //TODO handle error
    	
    	//make sure there isn't an existing section with the given name or URL
    	if (count > 0) {
            self.formError('^loc_EXISTING_SECTION^', '/admin/content/sections/new_section', output);
            return;
        }
        
    	dao.update(sectionDocument).then(function(data) {
            if(util.isError(data)) {
                self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/new_section', output);
                return;
            }
            
            self.session.success = sectionDocument.name + ' ^loc_CREATED^';
            
            self.checkForSectionMap(sectionDocument, function() {                
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/new_section'));
            });
        });
    });
};

NewSection.prototype.checkForSectionMap = function(sectionDocument, cb) {
	   
    var sectionUID = sectionDocument._id.toString();
    pb.settings.get('section_map', function(err, data) {
    	
        if(data == null) {
            
        	var value = [
	             {
	            	 uid: sectionUID, 
	            	 children: []
	             }
            ];
        	pb.settings.set('section_map', value, cb);
            return;
        }
        
        var sectionMap = data;
        if (!sectionDocument['parent']) {
            sectionMap.push({uid: sectionUID, children: []});
        }
        else {
            for (var i = 0; i < sectionMap.length; i++) {
                if (sectionMap[i].uid == sectionDocument['parent']) {
                    sectionMap[i].children.push({uid: sectionUID});
                    break;
                }
            }
        }
        
        pb.settings.set('section_map', sectionMap, cb);
    });
};

NewSection.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections/new_section', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['name', 'editor']))
        {
            formError(request, session, message, '/admin/content/sections/new_section', output);
            return;
        }
        
        var sectionDocument = createDocument('section', post, ['keywords'], ['parent']);
        if(!sectionDocument['url'])
        {
            sectionDocument['url'] = sectionDocument['name'].toLowerCase().split(' ').join('-');
        }
        if(sectionDocument['name'] == 'admin')
        {
            formError(request, session, '^loc_EXISTING_SECTION^', '/admin/content/sections/new_section', output);
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
                        formError(request, session, '^loc_EXISTING_SECTION^', '/admin/content/sections/new_section', output);
                        return;
                    }
                }
            }
            
            createDBObject(sectionDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections/new_section', output);
                    return;
                }
                
                session.success = sectionDocument.name + ' ^loc_CREATED^';
                
                NewSection.checkForSectionMap(sectionDocument, function()
                {                
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/content/sections/new_section'});
                    });
                });
            });
        });
    });
};

NewSection.checkForSectionMap = function(sectionDocument, output)
{
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
                var settingDocument = createDocument('setting', {key: 'section_map', value: [{uid: sectionUID, children: []}]});
                createDBObject(settingDocument, function(data)
                {
                    output();
                });
                return;
            }
            
            var sectionMap = data[0].value;
            
            if(!sectionDocument['parent'])
            {
                sectionMap.push({uid: sectionUID, children: []});
            }
            else
            {
                for(var i = 0; i < sectionMap.length; i++)
                {
                    if(sectionMap[i].uid == sectionDocument['parent'])
                    {
                        sectionMap[i].children.push({uid: sectionUID});
                        break;
                    }
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
module.exports = NewSection;
