global.getContentSettings = function(output)
{
    defaultContentSettings =
    {
        articles_per_page: 5,
        auto_break_articles: 0,
        display_timestamp: 1,
        date_format: 'Month dd, YYYY',
        display_hours_minutes: 1,
        time_format: '12',
        display_bylines: 1,
        display_writer_photo: 1,
        display_writer_position: 1,
        allow_comments: 1,
        default_comments: 1
    }
    
    getDBObjectsWithValues({object_type: 'setting', key: 'content_settings'}, function(data)
    {
        if(data.length == 0)
        {
            output(defaultContentSettings);
        }
        else
        {
            output(data[0].value);
        }
    
    });
}
