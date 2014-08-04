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
    $.get('https://pencilblue.org/feed', function(feed) {
        if(!feed) {
            onFeedFail();
            return;
        }
        else if(feed instanceof XMLDocument === false) {
            onFeedFail();
            return;
        }
        else if($(feed).find('rss').length === 0) {
            onFeedFail();
            return;
        }

        var item = $(feed).find('rss').find('item');

        $('#news_title').html(item.find('title').html());
        $('.news_link').attr('href', item.find('link').html());

        var copy = item.find('encoded');
        if(copy.length === 0) {
            copy = item.find('content\\:encoded');
        }

        var displayableCopy = cleanNewsCopy(copy.html());
        $('#news_copy').html(displayableCopy);
        $('#news_loader').hide();
        $('#news_container').show();
    });

    $('.modal[data-color]').on('show hidden', function(e) {
      $('body')
        .toggleClass('modal-color-' + $(this).data('color'));
    });
});

function onFeedFail() {
    $('#news_copy').html(loc.admin.FEED_UNAVAILABLE);
    $('#news_loader').hide();
    $('#news_container').show();
    $('#news_link').hide();
}

function cleanNewsCopy(copy) {

    copy = copy.split('<![CDATA[').join('').split(']]>').join('');
    if(copy.indexOf('<br') > copy.indexOf('<div')) {
        copy = copy.substr(0, copy.indexOf('<br'));
        copy = copy.split('<div>').join('').split('</div>').join('');
    }
    else {
        copy = copy.substr(copy.indexOf('<div>') + 5, copy.indexOf('</div>'));
    }

    while(copy.indexOf('^media_display_') > -1) {
        var index = copy.indexOf('^media_display_');
        var endIndex = copy.substr(index + 1).indexOf('^');
        copy = copy.split(copy.substr(index, endIndex + 2)).join('');
    }

    return copy;
}

function refreshServers() {
    var opts = {
      lines: 11, // The number of lines to draw
      length: 20, // The length of each line
      width: 11, // The line thickness
      radius: 60, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: '50%', // Top position relative to parent
      left: '50%' // Left position relative to parent
    };
    $('#cluster_info_table').spin(opts);

    var xhr = $.post('/api/cluster/refresh', {}, function(data, status, xhr) {
        setTimeout(function() {
            window.location.reload();
        }, data.data.wait);
    }, 'json');
    xhr.fail(function() {
        window.location.reload();
    });
}
