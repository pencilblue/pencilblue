global.getEmailSettings = function(output)
{
    defaultEmailSettings =
    {
        from_name: 'pencilblue',
        from_address: 'no-reply@pencilblue.org',
        verification_subject: 'pencilblue Account Confirmation',
        service: 'Gmail',
        host: '',
        secure_connection: 1,
        port: '465',
        username: '',
        password: ''
    }
    
    getDBObjectsWithValues({object_type: 'setting', key: 'email_settings'}, function(data)
    {
        if(data.length == 0)
        {
            getHTMLTemplate('admin/elements/default_verification_email', null, null, function(data)
            {
                defaultEmailSettings.verification_content = data;
                output(defaultEmailSettings);
            });
        }
        else
        {
            output(data[0].value);
        }
    
    });
}
