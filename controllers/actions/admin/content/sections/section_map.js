/**
 * SectionMap - Saves a reorganized section map
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SectionMap(){}

//inheritance
util.inherits(SectionMap, pb.FormController);

SectionMap.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	var message = this.hasRequiredParams(post, ['map']);
	if(message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }
    
    var sectionMap = JSON.parse(decodeURIComponent(post['map']));
    if(sectionMap.length <= 0 || !sectionMap[0].uid) {
        this.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
        return;
    }
    
    pb.settings.set('section_map', sectionMap, function(err, data) {
		if(util.isError(err)) {
            self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
            return;
        }
        
        self.session.success = '^loc_SECTION_MAP_SAVED^';
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
    });
};

SectionMap.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections/section_map', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['map']))
        {
            formError(request, session, message, '/admin/content/sections/section_map', output);
            return;
        }
        
        var sectionMap = JSON.parse(decodeURIComponent(post['map']));
        if(!sectionMap[0].uid)
        {
            formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections/section_map', output);
            return;
        }
        
        var settingDocument = createDocument('setting', {key: 'section_map', value: sectionMap});
        
        getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
        {
            if(data.length > 0)
            {
                editDBObject(data[0]._id, settingDocument, [], function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections/section_map', output);
                        return;
                    }
                    
                    session.success = '^loc_SECTION_MAP_SAVED^';
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/content/sections/section_map'});
                    });
                });
                return;
            }
            
            createDBObject(settingDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections/section_map', output);
                    return;
                }
                
                session.success = '^loc_SECTION_MAP_SAVED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/sections/section_map'});
                });
            });
        });
    });
};

//exports
module.exports = SectionMap;
