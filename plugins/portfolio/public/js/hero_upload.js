var siteRoot;
var saveimageURL;
var heroUploadElementID;

function setupHeroUpload(root) {
    siteRoot = root;
    saveimageURL = siteRoot + '/actions/admin/content/media/inline_add_media';

    $(function() {
        'use strict';
        // Change this to the location of your server-side upload handler:
        var url = siteRoot + '/actions/admin/content/media/upload_media';
        $('#image_file').fileupload({
            url: url,
            dataType: 'json',
            done: function(error, data)
            {
                $('#upload_progress').hide();
                validateImageURL(data.result.filename);
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

function linkToHero(elementID) {
    heroUploadElementID = elementID;

    $('#link_to_image').show();
    $('#upload_image').hide();
    $('#hero_image_modal').modal({backdrop: 'static', keyboard: true});
}

function uploadHero(elementID) {
    heroUploadElementID = elementID;

    $('#link_to_image').hide();
    $('#upload_image').show();
    $('#hero_image_modal').modal({backdrop: 'static', keyboard: true});
}

function validateImageURL(imageURL)
{
    if(imageURL.length === 0){
        return;
    }

    var fileType = imageURL.substr(imageURL.lastIndexOf('.') + 1);

    switch(fileType)
    {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
            setImageURL(imageURL);
            return;
        default:
            return;
    }
}

function setImageURL(imageURL)
{
    $('#' + heroUploadElementID + '_preview').attr('src', imageURL);
    $('#' + heroUploadElementID).val(imageURL);
    $('#hero_image_modal').modal('hide');
}
