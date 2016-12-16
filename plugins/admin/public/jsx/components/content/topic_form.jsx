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

class TopicForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topic: null
    };

    this.handleValueChange = this.handleValueChange.bind(this);
    this.saveTopic = this.saveTopic.bind(this);
  }

  componentDidMount() {
    if(itemId) {
      this.getTopic();
      return;
    }

    this.setState({
      topic: {
        name: ''
      }
    });
  }

  getTopic() {
    let self = this;

    $.ajax({
      url: '/api/content/topics/' + itemId,
      type: 'GET',
      success: (result) => {
        result.originalName = result.name;
        self.setState({
          topic: result
        });
      }
    });
  }

  handleValueChange(event) {
    let newState = JSON.parse(JSON.stringify(this.state));
    newState.topic[event.target.id] = event.target.value;

    this.setState(newState);
  }

  saveTopic(event) {
    let self = this;

    $.ajax({
      url: '/api/content/topics' + (itemId ? '/' + itemId : ''),
      type: itemId ? 'PUT' : 'POST',
      contentType: 'application/json',
      data: JSON.stringify(this.state.topic),
      success: (result) => {
        if(itemId) {
          result.originalName = result.name;
          self.setState({
            topic: result
          });
          return;
        }

        self.setState({
          topic: {
            name: ''
          }
        });
      }
    });
    event.preventDefault();
  }

  render() {
    if(!this.state.topic) {
      return (
        <div>
          <h3><i className="fa fa-spinner fa-pulse"></i></h3>
        </div>
      )
    }
    let topicName = itemId ? loc.generic.EDIT + ' ' + this.state.topic.originalName : loc.topics.NEW_TOPIC;

    return (
      <div>
        <h1>{topicName}</h1>
        <form onSubmit={this.saveTopic}>
          <div className="form-group">
            <label htmlFor="name">{loc.topics.TOPIC_NAME}</label>
            <input type="text" className="form-control" id="name" value={this.state.topic.name} onChange={this.handleValueChange} required></input>
          </div>
          <input type="submit" className="btn btn-primary" value={loc.generic.SAVE}></input>
        </form>
      </div>
    )
  }
}

ReactDOM.render(
  <TopicForm />,
  document.getElementById('topic_form')
);
