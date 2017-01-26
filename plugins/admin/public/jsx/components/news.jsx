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

/**
 * React component for the news box.
 * @constructor
 * @param {Object} props The properties of the React instance.
 */
class News extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: null,
      copy: null,
      link: null
    };
  }

  componentDidMount() {
    this.getNews();
  }

  /**
   * Retrieves blog posts from the RSS feed.
   */
  getNews() {
    let self = this;
    $.ajax({
      url: 'https://pencilblue.org/feed',
      type: 'GET',
      success: (result) => {
        self.setState(self.parseNews(result));
      }
    });
  }

  parseNews(feed) {
    let item = $(feed).find('rss').find('item');
    item = $(item[0]);

    let title = item.find('title').text();
    let link = item.find('link').text();

    let copy = item.find('encoded');
    if(copy.length === 0) {
      copy = item.find('content\\:encoded');
    }
    copy = copy.html().split('<![CDATA[').join('').split(']]>').join('');

    return {
      title: title,
      copy: {__html: copy},
      link: link
    };
  }

  /**
   * Renders the news component.
   */
  render() {
    if(!this.state.title) {
      return (
        <div>
          <h1>PencilBlue News</h1>
          <div className="context-box">
            <h3><i className="fa fa-spinner fa-pulse"></i></h3>
          </div>
        </div>
      )
    }

    return (
      <div>
        <h1>PencilBlue News</h1>
        <div className="context-box">
          <h3>
            <a href={this.state.link} target="_blank">{this.state.title}</a>
          </h3>
          <div dangerouslySetInnerHTML={this.state.copy}></div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <News />,
  document.getElementById('news')
);
