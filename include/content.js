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

/**
 * Service for content settings retrieval
 *
 * @module Services
 * @class ContentService
 * @constructor
 */
function ContentService(){}

/**
 * Retrieves the content settings
 *
 * @method getSettings
 * @param {Function} cb Callback function
 */
ContentService.getSettings = function(cb){
	pb.settings.get('content_settings', function(err, settings){
		if (settings === null) {
			settings = ContentService.getDefaultSettings();
			pb.settings.set('content_settings', settings, pb.utils.cb);
		}
		
		cb(err, settings);
	});
};

/**
 * Retrieves the default content settings from installation
 *
 * @method getDefaultSettings
 * @return {Object} Content settings
 */
ContentService.getDefaultSettings = function() {
    return {
        articles_per_page: 5,
        auto_break_articles: 0,
		read_more_text: 'Read more',
        display_timestamp: 1,
        date_format: 'M dd, YYYY',
        two_digit_date: 0,
        display_hours_minutes: 1,
        time_format: '12',
        two_digit_time: 0,
        display_bylines: 1,
        display_author_photo: 1,
        display_author_position: 1,
        allow_comments: 1,
        default_comments: 1,
        require_account: 0,
        require_verification: 0
    };
};

/**
 * Returns a formatted time stamp from a date
 *
 * @method getTimestampTextFromSettings
 * @param {Date} date
 * @param {Object} contentSettings
 */
ContentService.getTimestampTextFromSettings = function(date, contentSettings) {
	return ContentService.getTimestampText(date, contentSettings.date_format, contentSettings.two_digit_date,
    		contentSettings.display_hours_minutes, contentSettings.time_format, contentSettings.two_digit_time);
};

ContentService.getTimestampText = function(date, format, twoDigitDate, displayTime, timeFormat, twoDigitTime, ls) {
    if (!ls) {
        ls = new pb.Localization();
    }

	var dateString = format;
    var monthNames = [
      ls.get('JAN'),
      ls.get('FEB'),
      ls.get('MAR'),
      ls.get('APR'),
      ls.get('MAY'),
      ls.get('JUN'),
      ls.get('JUL'),
      ls.get('AUG'),
      ls.get('SEP'),
      ls.get('OCT'),
      ls.get('NOV'),
      ls.get('DEC')
    ];

    var month = date.getMonth() + 1;
	var day = date.getDate();

	month = (twoDigitDate && month < 10) ? '0' + month : month.toString();
	day = (twoDigitDate && day < 10) ? '0' + day : day.toString();

    dateString = dateString.split('YYYY').join(date.getFullYear());
    dateString = dateString.split('yy').join(date.getYear());
    dateString = dateString.split('M').join(monthNames[date.getMonth()]);
    dateString = dateString.split('mm').join(month);
    dateString = dateString.split('dd').join(day);

    if (typeof displayTime !== 'undefined' && displayTime) {

        var hours   = date.getHours();
        var minutes = date.getMinutes();
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        var ampm = '';

        if(timeFormat == '12') {
            if(hours > 12) {
                hours -= 12;
                ampm = ' '+ls.get('TIME_PM');
            }
            else {
                ampm = ' '+ls.get('TIME_AM');
            }
        }
        if(twoDigitTime && hours < 10) {
            hours = '0' + hours;
        }

        dateString = dateString.concat(' ' + hours + ':' + minutes + ampm);
    }
    return dateString;
};

//exports
module.exports.ContentService = ContentService;
