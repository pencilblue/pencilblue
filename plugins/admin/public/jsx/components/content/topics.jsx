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

class Topics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topics: null
    };
  }

  componentDidMount() {
    this.getTopics();
  }

  getTopics(limit = 50, offset = 0, query = '') {
    let self = this;

    $.ajax({
      url: '/api/content/topics?limit=' + limit + '&offset=' + offset + '&query=' + query,
      type: 'GET',
      success: (result) => {
        self.setState({
          topics: result.data
        });
      }
    });
  }

  render() {
    if(!this.state.topics) {
      return (
        <div>
          <h1>{loc.topics.MANAGE_TOPICS}</h1>
          <div className="action-buttons">
            <a className="btn btn-sm btn-primary" href="/admin-new/content/topics/new">{loc.topics.NEW_TOPIC}</a>
          </div>
          <h3><i className="fa fa-spinner fa-pulse"></i></h3>
        </div>
      )
    }

    return (
      <div>
        <h1>{loc.topics.MANAGE_TOPICS}</h1>
        <div className="action-buttons">
          <a className="btn btn-sm btn-primary" href="/admin-new/content/topics/new">{loc.topics.NEW_TOPIC}</a>
        </div>
        <div>
          {this.state.topics.map(function(topic) {
            let uid = getUid(topic);
            let editHref = '/admin-new/content/topics/' + uid;

            return (
              <div className="btn-group" key={uid} style={{marginRight: '.5rem', marginBottom: '.5rem'}}>
                <button type="button" className="btn btn-sm btn-secondary">{topic.name}</button>
                <a className="btn btn-sm btn-secondary btn-sm-padding" href={editHref}>
                  <i className="fa fa-fw fa-edit"></i>
                </a>
                <button type="button" className="btn btn-sm btn-secondary btn-sm-padding">
                  <i className="fa fa-fw fa-trash"></i>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <Topics />,
  document.getElementById('topics')
);
