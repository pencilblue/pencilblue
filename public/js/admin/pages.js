function loadPagesContent(siteRoot, area)
{
    $('#pages_content').html('<div class="progress progress-striped active" style="width: 50%"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div>');
    $('#pages_content').load(siteRoot + '/admin/pages/' + area);
}
