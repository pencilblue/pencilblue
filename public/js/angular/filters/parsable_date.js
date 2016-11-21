angular.module('parseDate', [])
.filter('parsableDate', function() {
  return function(input) {
    if(typeof input === 'undefined') {
      return '';
    }
    var csv = input.split('-').join(',')
                   .split(' ').join(',')
                   .split(':').join(',');
    var dateArray = csv.split(',');

    var now = new Date();
    var offset = Math.floor(now.getTimezoneOffset() / 60);
    var offsetString;
    if(offset < 0) {
      offset *= -1;
      offsetString = (offset < 10 ? '+0' + offset : '+' + offset) + ':00';
    }
    else {
      offsetString = (offset < 10 ? '-0' + offset : '-' + offset) + ':00';
    }

    return dateArray[2] + '-' + dateArray[0] + '-' + dateArray[1] + 'T' + dateArray[3] + ':' + dateArray[4] + offsetString;
  };
});
