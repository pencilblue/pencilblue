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
    var input = $('#content_search');
    input.autocomplete({
        source: function( request, response ) {
            $.ajax({
                url: "/api/content/search/",
                dataType: "json",
                data: {
                   type: $('#content_type').val(),
                   q: $('#content_search').val(),
                },
                success: function( data ) {
                    response( $.map( data.data, function( item ) {
                        return {
                            value: item._id,
                            label: item.display
                        };
                    }));
                }
            });
        },
        minLength: 3,
        select: function( event, ui ) {

        	var idFieldName = $('#selection_id_field').val();
        	$('#'+idFieldName).val(ui.item.value);
            $(this).val(ui.item.label);
            return false;
        },
         open: function() {
                //$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
         },
         close: function() {
                //$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
         }
    });
});
