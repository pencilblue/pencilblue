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

module.exports.logger = function(winston, config){
	var logger =  new (winston.Logger)({
	    transports: config.logging.transports,
	    level: config.log_level,
        padLevels: false
   });

	logger.isDebug = function(){
		return pb.log.levels[pb.log.level] <= 1;
	};

	logger.isSilly = function(){
		return pb.log.levels[pb.log.level] <= 0;
	};

	console.log('SystemStartup: Log Level is: '+config.log_level);
	return logger;
};
