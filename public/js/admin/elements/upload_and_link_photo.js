/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var siteRoot;
var saveimageURL;

function setupUpload(root)
{
    siteRoot = root;
    saveimageURL = siteRoot + '/actions/admin/content/media/inline_add_media';

    $(function()
    {
        'use strict';
        // Change this to the location of your server-side upload handler:
        var url = siteRoot + '/actions/admin/content/media/upload_media';
        $('#image_file').fileupload(
        {
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

function showImageModal(subsection)
{
    $('#link_to_image').hide();
    $('#upload_image').hide();
    $(subsection).show();

    $('#image_modal').modal({backdrop: 'static', keyboard: true});
}

function validateImageURL(imageURL)
{
    if(imageURL.length === 0)
    {
        return;
    }

    var fileType = imageURL.substr(imageURL.lastIndexOf('.') + 1).toLowerCase();

    switch(fileType)
    {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
        case 'webp':
            setImageURL(imageURL);
            return;
        default:
            return;
    }
}

function setImageURL(imageURL)
{
    $('#uploaded_image_preview').attr('src', imageURL);
    $('#uploaded_image').val(imageURL);
    $('#image_modal').modal('hide');
}
