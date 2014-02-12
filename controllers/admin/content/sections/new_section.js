/**
 * NewSection - Input for creating a new site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewSection(){}

//inheritance
util.inherits(NewSection, pb.BaseController);

NewSection.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/content/sections/new_section', '^loc_NEW_SECTION^', null, function(data) {
        
        var tabs = [
            {
                active: 'active',
                href: '#section_settings',
                icon: 'cog',
                title: '^loc_SETTINGS^'
            },
            {
                href: '#section_meta_data',
                icon: 'tasks',
                title: '^loc_META_DATA^'
            }
        ];
            
        self.displayErrorOrSuccess(data, function(result) {
        
        	var dao = new pb.DAO();
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
                        editors: editors
                    };
                    var angularData = pb.js.getAngularController(objects);
                    result = result.concat(angularData);
                
                    var content = self.localizationService.localize(['admin', 'sections'], result);
                    cb({content: content});
                });
            });
        });
    });
};

NewSection.prototype.getEditorSelectList = function(cb) {
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

/**
 * TODO Remove after conversion
 */
NewSection.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/sections/new_section', '^loc_NEW_SECTION^', null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: 'active',
                        href: '#section_settings',
                        icon: 'cog',
                        title: '^loc_SETTINGS^'
                    },
                    {
                        href: '#section_meta_data',
                        icon: 'tasks',
                        title: '^loc_META_DATA^'
                    }
                ];
                    
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                
                    getDBObjectsWithValues({object_type: 'section', parent: null, $orderby: {name: 1}}, function(parents)
                    {                            
                        NewSection.getEditors(session, function(editors)
                        {
                            var pills = require('../sections').getPillNavOptions('new_section');
                            pills.unshift(
                            {
                                name: 'manage_topics',
                                title: '^loc_NEW_SECTION^',
                                icon: 'chevron-left',
                                href: '/admin/content/sections/section_map'
                            });
                            
                            result = result.concat(getAngularController(
                            {
                                navigation: getAdminNavigation(session, ['content', 'sections']),
                                pills: pills,
                                tabs: tabs,
                                parents: parents,
                                editors: editors
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
};

NewSection.getEditors = function(session, output) {
    
	var editors = [];
    getDBObjectsWithValues({object_type: 'user', admin: {$gt: ACCESS_WRITER}}, function(data)
    {
        for(var i = 0; i < data.length; i++)
        {
            var editor = {_id: data[0]._id, name: data[0].first_name + ' ' + data[0].last_name};
        
            if(session['user']._id.equals(data[i]._id))
            {
                editor.selected = 'selected';
            }
            
            editors.push(editor);
        }
        
        output(editors);
    });
};

//exports
module.exports = NewSection;
