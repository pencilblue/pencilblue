/**
 * EditSection - Input for editing an existing site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditSection(){}

//inheritance
util.inherits(EditSection, pb.BaseController);

EditSection.prototype.render = function(cb) {
	var self = this;
	
	//make sure an ID was passed
    if(!this.query.id) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/sections/section_map'));
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(this.query.id, 'section', function(err, section) {
        if(section == null) {
        	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/sections/section_map'));
            return;
        }
        
        section.keywords = section.keywords.join(',');
        pb.templates.load('admin/content/sections/edit_section', '^loc_EDIT_SECTION^', null, function(data) {
            var result = data.split('^section_id^').join(section._id);
            var tabs   =
            [
                {
                    active: 'active',
                    href: '#section_settings',
                    icon: 'cog',
                    title: '^loc_SETTINGS^'
                },
                {
                    href: '#section_seo',
                    icon: 'tasks',
                    title: '^loc_SEO^'
                }
            ];
            
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
            	dao.query('section', {parent: null}, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(parents) {                            
                    
            		self.getEditorSelectList(function(editors) {
                        
            			var pills = require('../sections').getPillNavOptions('new_section');
                        pills.unshift(
                        {
                            name: 'manage_topics',
                            title: '^loc_NEW_SECTION^',
                            icon: 'chevron-left',
                            href: '/admin/content/sections/section_map'
                        });
                        
                        var objects = {
                            navigation: pb.AdminNavigation.get(self.session, ['content', 'sections']),
                            pills: pills,
                            tabs: tabs,
                            parents: parents,
                            editors: editors,
                            section: section
                        };
                        var angularData = pb.js.getAngularController(objects);
                        result = result.concat(angularData);
                    
                        var content = self.localizationService.localize(['admin', 'sections'], result);
                        cb({content: content});
                    });
                });
            });
        });
    });
};

EditSection.prototype.getEditorSelectList = function(cb) {
	var self    = this;
    var dao     = new pb.DAO();
	var editors = [];
	var currId  = self.session.authentication.user_id;
	dao.query('user', {admin: {$gt: ACCESS_WRITER}}, {_id: 1, first_name: 1, last_name: 1}).then(function(data){
        
		for(var i = 0; i < data.length; i++) {
            
			var editor = {_id: data[0]._id, name: data[0].first_name + ' ' + data[0].last_name};
            if(currId == data[i]._id.toString()) {
                editor.selected = 'selected';
            }
            editors.push(editor);
        }
        cb(editors);
    });
};

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            output({redirect: pb.config.siteRoot + '/admin/sections/section_map'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/sections/section_map'});
                return;
            }
            
            var section = data[0];
            section.keywords = section.keywords.join(',');
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/sections/edit_section', '^loc_EDIT_SECTION^', null, function(data)
                {
                    result = result.concat(data);
                    
                    result = result.split('^section_id^').join(section._id);
                    
                    var tabs =
                    [
                        {
                            active: 'active',
                            href: '#section_settings',
                            icon: 'cog',
                            title: '^loc_SETTINGS^'
                        },
                        {
                            href: '#section_seo',
                            icon: 'tasks',
                            title: '^loc_SEO^'
                        }
                    ];
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        getDBObjectsWithValues({object_type: 'section', parent: null, $orderby: {name: 1}}, function(parents)
                        {
                            EditSection.getEditors(session, function(editors)
                            {
                                var pills = require('../sections').getPillNavOptions('edit_section');
                                pills.unshift(
                                {
                                    name: 'manage_topics',
                                    title: section.name,
                                    href: '/admin/content/sections/section_map'
                                });
                            
                                result = result.concat(pb.js.getAngularController(
                                {
                                    navigation: getAdminNavigation(session, ['content', 'sections']),
                                    pills: pills,
                                    tabs: tabs,
                                    parents: parents,
                                    editors: editors,
                                    section: section
                                }));
                            
                                editSession(request, session, [], function(data)
                                {
                                    output({cookie: getSessionCookie(session), content: localize(['admin', 'sections'], result)});
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

EditSection.getEditors = function(session, output)
{
    var editors = [];
    
    getDBObjectsWithValues({object_type: 'user', admin: {$gt: ACCESS_WRITER}}, function(data)
    {
        for(var i = 0; i < data.length; i++)
        {
            var editor = {_id: data[0]._id, name: data[0].first_name + ' ' + data[0].last_name};
            
            editors.push(editor);
        }
        
        output(editors);
    });
};

//exports
module.exports = EditSection;
