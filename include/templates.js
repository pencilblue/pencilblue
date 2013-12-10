global.getHTMLTemplate = function(templateLocation, pageName, metaDesc, output)
{
    var fileLocation = DOCUMENT_ROOT + '/templates/' + templateLocation + '.html';
    var instance = this;
    
    this.loadTemplate = function()
    {
        // Load the header template HTML and customize
        minify.optimize(fileLocation,
        {
            callback: function(data)
            {
                templateString = data.toString();
                templateString = templateString.split('^site_name^').join(pb.config.siteName);
                templateString = templateString.split('^site_root^').join(pb.config.siteRoot);
                if(typeof pageName !== "undefined")
                {
                    templateString = templateString.split('^page_name^').join(' | ' + pageName);
                }
                else
                {
                    templateString = templateString.split('^page_name^').join('');
                }
                
                if(typeof metaDesc !== "undefined")
                {
                    templateString = templateString.split('^meta_desc^').join(metaDesc);
                }
                else
                {
                    templateString = templateString.split('^meta_desc^').join(pb.config.siteName + ' | ' + pageName);
                }
                
                templateString = templateString.split('^year^').join(new Date().getFullYear());
                
                var subTemplateCount = templateString.split('^tmp_').length;
                
                if(subTemplateCount == 1)
                {
                    output(templateString);
                    return;
                }
                
                instance.loadSubTemplate(templateString, output);
            }
        });
    }
    
    this.loadSubTemplate = function(templateString, output)
    {
        var instance = this;
    
        var startIndex = templateString.indexOf('^tmp_') + 5;
        var endIndex = templateString.substr(startIndex).indexOf('^');
        var templateName = templateString.substr(startIndex, endIndex);
        
        getHTMLTemplate(templateName.split('=').join('/'), null, null, function(data)
        {
            templateString = templateString.split('^tmp_' + templateName + '^').join(data);
            
            var subTemplateCount = templateString.split('^tmp_').length;
            
            if(subTemplateCount == 1)
            {
                output(templateString);
                return;
            }
            
            instance.loadSubTemplate(templateString, output);
        });
    }

    getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
    {
        if(data.length > 0)
        {
            fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/templates/' + templateLocation + '.html', function(exists)
            {
                if(exists)
                {
                    fileLocation = DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/templates/' + templateLocation + '.html';
                }
                
                instance.loadTemplate();
            });
        }
        else
        {
            instance.loadTemplate();
        }
    });
}
