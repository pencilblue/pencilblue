var siteRoot;
var savelogoURL;

function setupUpload(root)
{
    siteRoot = root;
    savelogoURL = siteRoot + '/actions/admin/content/media/inline_add_media';

    $(function() 
    {
        'use strict';
        // Change this to the location of your server-side upload handler:
        var url = siteRoot + '/actions/admin/content/media/upload_media';
        $('#logo_file').fileupload(
        {
            url: url,
            dataType: 'json',
            done: function(error, data)
            {
                $('#upload_progress').hide();
                validateLogoURL(data.result.filename);
            },
            progressall: function (error, data)
            {
                $('#upload_progress').show();
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#upload_progress .progress-bar').css(
                    'width',
                    progress + '%'
                );
            }
        }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
    });
}

function showLogoModal(subsection)
{
    $('#link_to_logo').hide();
    $('#upload_logo').hide();
    $(subsection).show();
    
    $('#logo_modal').modal({backdrop: 'static', keyboard: true});
}

function validateLogoURL(logoURL)
{
    if(logoURL.length == 0)
    {
        return;
    }
    
    var fileType = logoURL.substr(logoURL.lastIndexOf('.') + 1);
    
    switch(fileType)
    {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
            setLogoURL(logoURL);
            return;
        default:
            return;
    }
}

function setLogoURL(logoURL)
{
    $('#site_logo_image').attr('src', logoURL);
    $('#logo_url').val(logoURL);
    $('#logo_modal').modal('hide');
}
