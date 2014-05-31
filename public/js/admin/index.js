$(document).ready(function() {
    $.get('http://pencilblue.org/feed', function(feed) {
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
});

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
