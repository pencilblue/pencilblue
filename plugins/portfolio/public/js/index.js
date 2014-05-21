$(document).ready(function() {
    $(window).resize(resizeIndexPage);
    resizeIndexPage();
});

function resizeIndexPage() {
    var windowWidth = $(window).width();
    if(windowWidth >= 992) {
        sizeIndexPageForDesktop(windowWidth);
        return;
    }
    sizeIndexPageForMobile(windowWidth);
}


function sizeIndexPageForDesktop(windowWidth) {
    if(!$('.hero_bg').height()) {
        setTimeout('sizeIndexPageForDesktop(' + windowWidth + ')', 50);
        return;
    }

    $('.hero').height($('.hero_bg').height());
}

function sizeIndexPageForMobile(windowWidth) {
    if(!$('.hero_bg').height() || !$('.hero_callouts').height()) {
        setTimeout('sizeIndexPageForMobile(' + windowWidth + ')', 50);
        return;
    }
    console.log($('.hero_callouts').height());
    $('.hero').height($('.hero_bg').height() + $('.hero_callouts').height());
}
