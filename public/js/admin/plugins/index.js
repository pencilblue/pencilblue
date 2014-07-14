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
