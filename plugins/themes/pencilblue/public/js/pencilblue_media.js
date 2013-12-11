$(document).ready(function()
{
    sizeMediaEmbeds();
    $(window).resize(sizeMediaEmbeds);
});

function sizeMediaEmbeds()
{
    $('.media_embed').each(function()
    {
        var mediaEmbed = $(this);
        var caption = mediaEmbed.find('.media_caption').first();
        var media = mediaEmbed.find('img').first();
        
        var captionPadding = Math.ceil(caption.css('padding-left').split('px').join('')) + Math.ceil(caption.css('padding-right').split('px').join(''));
        
        if(!media)
        {
            media = $(this).find('iframe').first();
        }
        
        if(media.width() > 0)
        {
            caption.width(media.width() - captionPadding);
        }
        else
        {
            media.load(function()
            {
                caption.width(media.width() - captionPadding);
            });
        }
    });
}
