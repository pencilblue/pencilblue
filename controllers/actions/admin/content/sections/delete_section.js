/**
 * DeleteSection - Deletes a site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteSection(){}

//inheritance
util.inherits(DeleteSection, pb.BaseController);

DeleteSection.prototype.render = function(cb) {
	var self    = this;
	var message = this.hasRequiredParams(this.query, ['id']);
	if (message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }
    
	//ensure existence
	var dao = new pb.DAO();
	dao.loadById(this.query.id, 'section', function(err, section) {
        if(section == null) {
            self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
            return;
        }
        
        //delete the section
        var where = {$or: [{_id: ObjectID(get['id'])}, {parent: get['id']}]};
        dao.deleteMatching(where, 'section').then(function(result) {
        	if(result < 1) {
                self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
                return;
            }
        	
            session.success = section.name + ' ^loc_DELETED^';
            self.updateSectionMap(this.query.id, function(err, result) {
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
            });
        });
    });
};

DeleteSection.prototype.updateSectionMap = function(removeID, cb) {
	pb.settings.get('section_map', function(sectionMap) {
        if (sectionMap == null) {
            cb();
            return;
        }
        
        //searh for section in map.
        for(var i = 0; i < sectionMap.length; i++) {
            if(sectionMap[i].uid == removeID) {
                sectionMap.splice(i, 1);
                break;
            }
            
            for(var j = 0; j < sectionMap[i].children.length; j++) {
                if(sectionMap[i].children[j].uid == removeID) {
                    sectionMap[i].children.splice(j, 1);
                    break;
                }
            }
        }
        
        pb.settings.set('section_map', sectionMap, cb);
    });
};

DeleteSection.init = function(request, output)
{

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections/section_map', output);
            return;
        }
        
        var get = getQueryParameters(request);
        
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
            
            deleteMatchingDBObjects({object_type: 'section', $or: [{_id: ObjectID(get['id'])}, {parent: get['id']}]}, function(success)
            {
                session.success = section.name + ' ^loc_DELETED^';
                
                DeleteSection.updateSectionMap(get['id'], function(data)
                {
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/content/sections/section_map'});
                    });
                });
            });
        });
    });
};

DeleteSection.updateSectionMap = function(removeID, output)
{
    getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
    {
        if(data.length == 0)
        {
            output();
            return;
        }
        
        var sectionMap = data[0].value;
        
        for(var i = 0; i < sectionMap.length; i++)
        {
            if(sectionMap[i].uid == removeID)
            {
                sectionMap.splice(i, 1);
                break;
            }
            
            for(var j = 0; j < sectionMap[i].children.length; j++)
            {
                if(sectionMap[i].children[j].uid == removeID)
                {
                    sectionMap[i].children.splice(j, 1);
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
};

//exports
module.exports = DeleteSection;
