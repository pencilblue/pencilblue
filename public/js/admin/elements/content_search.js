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