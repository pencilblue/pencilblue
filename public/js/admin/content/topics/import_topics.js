function setupUpload(siteRoot)
{
    $(function() 
    {
        'use strict';
        // Change this to the location of your server-side upload handler:
        var url = siteRoot + '/actions/admin/content/topics/import_topics';
        $('#topics_file').fileupload(
        {
            url: url,
            dataType: 'json',
            done: function(error, data)
            {
                window.location = siteRoot + '/admin/content/topics';
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
