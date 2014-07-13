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

$(function()
{
    'use strict';
    var url = '/actions/admin/plugins/settings/wp_import/import';
    $('#wp_file').fileupload(
    {
        url: url,
        dataType: 'json',
        done: function(error, data)
        {
            if(data.result.code !== 0) {
                window.location = '/admin/plugins/settings/wp_import/import';
                return;
            }
            window.location = '/admin/plugins/settings/wp_import/manage_new_users';
        },
        progressall: function (error, data)
        {
            $('#upload_progress').show();
        }
    }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
});
