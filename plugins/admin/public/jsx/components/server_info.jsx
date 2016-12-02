/*
    Copyright (C) 2017  PencilBlue, LLC

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

class ServerInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: null
    };
  }

  componentDidMount() {
    this.getServerInfo();
  }

  getServerInfo() {
    let self = this;
    $.ajax({
      url: '/api/cluster',
      type: 'GET',
      success: (result) => {
        self.setState({
          info: result
        });

        setTimeout(self.getServerInfo.bind(this), 30000);
      }
    });
  }

  getServerIcon(ip, isMaster) {
    if(ip.indexOf('192.168') > -1 || ip.indexOf('127.0.0.1') > -1 || ip.indexOf('localhost') > -1) {
      return 'fa fa-fw fa-laptop';
    }
    if(isMaster) {
      return 'fa fa-fw fa-cloud-download';
    }
    else {
      return 'fa fa-fw fa-cloud';
    }
  }

  getFormattedUptime(seconds) {
    seconds = Math.floor(seconds);
    var minutes = 0;
    var hours = 0;

    while(seconds > 60 * 60) {
      seconds -= 60 * 60;
      hours++;
    }
    while(seconds > 60) {
      seconds -= 60;
      minutes++;
    }

    if(seconds < 10) {
      seconds = '0' + seconds;
    }
    if(minutes < 10) {
      minutes = '0' + minutes;
    }

    return hours + ':' + minutes + ':' + seconds;
  }

  render() {
    var self = this;

    if(!this.state.info) {
      return (
        <h3><i className="fa fa-spinner fa-pulse"></i></h3>
      );
    }

    return (
      <div>
        <h3>{loc.generic.STATUS}</h3>
        {this.state.info.map(function(server) {
          let memoryPercentage = Math.floor((server.mem_usage.heapUsed / server.mem_usage.heapTotal) * 100);
          let memoryClass = 'progress ';
          if(memoryPercentage >= 90) {
            memoryClass += 'progress-danger';
          }
          else if(memoryPercentage >= 70) {
            memoryClass += 'progress-warning';
          }
          else {
            memoryClass += 'progress-success';
          }

          return (
            <div className="context-box" key={server._id}>
              <h3>
                <i className={self.getServerIcon(server.ip, server.is_master)}></i>
                {server.ip}
              </h3>
              <h5>{loc.generic.UPTIME}: {self.getFormattedUptime(server.uptime)}</h5>
              <h5>{loc.generic.MEMORY_USED}</h5>
              <progress className={memoryClass} value={memoryPercentage} max="100"></progress>
            </div>
          )
        })}
      </div>
    );
  }
}

ReactDOM.render(
  <ServerInfo />,
  document.getElementById('server_info')
);
