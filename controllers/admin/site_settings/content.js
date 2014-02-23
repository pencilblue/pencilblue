/**
 * Interface for changing the site's content configuration
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Content(){};

//inheritance
util.inherits(Content, pb.BaseController);

Content.prototype.render = function(cb) {
    var self = this;
	var dao  = new pb.DAO();
	pb.templates.load('admin/site_settings/content', '^loc_CONTENT^', null, function(data) {
        var result = data;
        
        var tabs =
        [
            {
                active: 'active',
                href: '#articles',
                icon: 'files-o',
                title: '^loc_ARTICLES^'
            },
            {
                href: '#timestamp',
                icon: 'clock-o',
                title: '^loc_TIMESTAMP^'
            },
            {
                href: '#authors',
                icon: 'user',
                title: '^loc_AUTHOR^'
            },
            {
                href: '#comments',
                icon: 'comment',
                title: '^loc_COMMENTS^'
            }
        ];
        
        pb.content.getSettings(function(err, contentSettings) {
            self.session = setFormFieldValues(contentSettings, self.session);
            
            prepareFormReturns(self.session, result, function(newSession, newResult)
            {
                self.session = newSession;
                result = newResult;
                
                var pills = require('../site_settings').getPillNavOptions('content');
                pills.splice(0, 1);
                pills.unshift(
                {
                    name: 'configuration',
                    title: '^loc_CONTENT^',
                    icon: 'chevron-left',
                    href: '/admin/site_settings/configuration'
                });
                
                var objects     = {
                    navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings']),
                    pills: pills,
                    tabs: tabs
                };
                var angularData = pb.js.getAngularController(objects);
                result          = result.concat(angularData);
                
                var content = self.localizationService.localize(['admin', 'site_settings'], result);
                cb({content: content});
            });
        });
    });
}

//exports
module.exports = Content;
