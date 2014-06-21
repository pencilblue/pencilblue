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
    $('fieldset').append('<textarea id="verification_content" name="verification_content" style="display: none">' + encodeURIComponent($('#layout_editable').html()) + '</textarea>');

    $('#email_form').submit();
}
