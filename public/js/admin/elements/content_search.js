/*
    Copyright (C) 2015  PencilBlue, LLC

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
    source: function(request, response) {
      $.ajax({
        url: '/api/content/' + angular.element('#content_type').scope().navItem.type + 's',
        dataType: 'json',
        data: {
          'q': $('#content_search').val(),
          '$offset': 0,
          '$limit': 8,
          '$order': 'headline=1',
          '$select': 'headline=1'
        },
        success: function(data) {
          response($.map(data.data, function(item) {
            return {
              value: item._id,
              label: item.headline
            };
          }));
        }
      });
    },
    minLength: 0,
    select: function(event, ui) {
      setItem(ui.item.value);
      $(this).val(ui.item.label);
      return false;
    }
  });

  // Forces the source call to be made on input focus
  input.bind('focus', function(event) {
    var keydownEvent = $.Event('keydown');
    input.trigger(keydownEvent);
  });
});
