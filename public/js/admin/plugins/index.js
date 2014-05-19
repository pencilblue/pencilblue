/**
 * Client Side javascript used for the plugins index page.
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */

$(document).ready(function() {
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

function uninstallPlugin(pid) {
	doPluginAPIAction('uninstall', pid);
};

function installPlugin(pid) {
	doPluginAPIAction('install', pid);
}

function resetSettings(pid) {
	doPluginAPIAction('reset_settings', pid);
}

function initialize(pid) {
	doPluginAPIAction('initialize', pid);
}

function setTheme() {
	doPluginAPIAction('set_theme', $('#active_theme').val());
}

function doPluginAPIAction(action, identifier) {
	$('#progress_modal').modal({});
	$.post("/api/plugins/"+action+"/"+encodeURIComponent(identifier),
		function(data) {
			$('#modal_label').val('Completed');
			$('#progress_console').val(data.message);
			$('#progress_bar').removeClass('active');
            $('#progress_footer').show();

			setTimeout(window.location.reload, 3000);
		}
	)
	.fail(function(err) {
		$('#modal_label').val('Completed');
		$('#progress_bar').removeClass('active');

		var data = null;
		try {
			data = JSON.parse(err.responseText);
		}
		catch(e){
			data = {
				message: 'An error occurred while attempting to complete the action. STATUS='+err.status+'',
				data: []
			};
		}

		//process errors
		var output = data.message;
		for(var i = 0; i < data.data.length; i++) {
			output += "\n"+data.data[i];
		}
		$('#progress_console').val(output);
        $('#progress_footer').show();
	});
}
