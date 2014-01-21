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
        port: 465,
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

global.sendEmail = function(from, to, subject, body)
{
    getEmailSettings(function(emailSettings)
    {
        var nodemailer = require("nodemailer");
        
        if(emailSettings.service == 'custom')
        {
            var smtpTransport = nodemailer.createTransport("SMTP",
            {
                host: emailSettings.host,
                secureConnection: emailSettings.secure_connection,
                port: emailSettings.port,
                auth:
                {
                    user: emailSettings.username,
                    pass: emailSettings.password
                }
            });
        }
        else
        {
            var smtpTransport = nodemailer.createTransport("SMTP",
            {
                service: emailSettings.service,
                auth:
                {
                    user: emailSettings.username,
                    pass: emailSettings.password
                }
            });
        }
        
        var mailOptions =
        {
            from: from,
            to: to,
            subject: subject,
            html: body
        };
        
        smtpTransport.sendMail(mailOptions, function(error, response)
        {
            if(error)
            {
                console.log(error);
            }

            smtpTransport.close();
        });
    });
}
