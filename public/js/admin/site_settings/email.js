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

var formRefillOptions =
[
    {
        id: 'secure_connection',
        type: 'button_group',
        elementPrefix: 'secure_connection_'
    },
    {
        id: 'verification_content',
        type: 'layout',
        onComplete: checkForCustomService
    }
];

$(document).ready(function()
{
    $('#media_button').hide();

    $('[data-toggle="tooltip"]').tooltip(
        {
            'placement': 'bottom'
            //'trigger': 'click'
        }
    ).css(
        {
            'cursor': 'pointer'
        }
    );
});

function checkForCustomService()
{
    if($('#service').val() == 'custom')
    {
        $('#custom_smtp_options').show();
    }
    else
    {
        $('#custom_smtp_options').hide();
    }
}

function prepareEmailSettingsSave()
{
    var wysId = $('.wysiwyg').attr('id').substring('wysiwg_'.length + 1);
    getWYSIWYGLayout(wysId, function(layout) {
        if(!$('#verification_content').position()) {
            $('fieldset').append('<textarea id="verification_content" name="verification_content" style="display: none">' + layout + '</textarea>');
        }

        $('#email_form').submit();
    });
}

function sendTestEmail() {
    if(!$('#test_email').val().length) {
        return;
    }

    $('#email_test_icon').removeClass('fa-send');
    $('#email_test_icon').addClass('fa-spinner fa-spin');

    var wysId = $('.wysiwyg').attr('id').substring('wysiwg_'.length + 1);
    getWYSIWYGLayout(wysId, function(layout) {
        $.post('/api/admin/site_settings/email/send_test', {email: $('#test_email').val(), content: layout}, function(result) {
            $('#email_test_icon').removeClass('fa-spinner fa-spin');
            $('#email_test_icon').addClass('fa-send');

            console.log(result);
        });
    });
}
