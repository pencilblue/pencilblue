global.getHTMLTemplate = function(templateLocation, pageName, metaDesc, output)
{
    // Load the header template HTML and customize
    fs.readFile(DOCUMENT_ROOT + '/templates/' + templateLocation + '.html', function(error, data)
    {
        if(error)
        {
            console.log(error.message);
            output('');
            return;
        }
        
        templateString = data.toString();
        templateString = templateString.split('^site_name^').join(SITE_NAME);
        templateString = templateString.split('^site_root^').join(SITE_ROOT);
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
            templateString = templateString.split('^meta_desc^').join(SITE_NAME + ' | ' + pageName);
        }
        
        templateString = templateString.split('^year^').join(new Date().getFullYear());
        
        output(templateString);
    });
}
