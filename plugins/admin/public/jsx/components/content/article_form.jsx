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
 * React controller for new/edit article pages of the admin section.
 * @constructor
 * @param {Object} props The properties of the React instance.
 */
class ArticleForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      article: null
    };

    this.handleValueChange = this.handleValueChange.bind(this);
    this.setDraft = this.setDraft.bind(this);
    this.saveArticle = this.saveArticle.bind(this);
  }

  componentDidMount() {
    if(itemId) {
      this.getArticle();
      return;
    }

    this.setState({
      article: {
        headline: '',
        draft: true
      }
    });
  }

  /**
   * Retrieves an editable article from the API.
   */
  getArticle() {
    let self = this;

    $.ajax({
      url: '/api/content/articles/' + itemId,
      type: 'GET',
      success: (result) => {
        result.originalName = result.headline;
        self.setState({
          article: result
        });
      }
    });
  }

  /**
   * Handles updated state change from form input.
   *
   * @param  {Object} [event]  The input event object.
   */
  handleValueChange(event) {
    let newState = JSON.parse(JSON.stringify(this.state));
    newState.article[event.target.id] = event.target.value;

    this.setState(newState);
  }

  setDraft(event) {
    let newState = JSON.parse(JSON.stringify(this.state));
    newState.article.draft = event.target.value === 'true' ? true : false;

    this.setState(newState);
  }

  /**
   * Adds or updates the article with the API.
   *
   * @param  {Object} [event]  The form submit event object.
   */
  saveArticle(event) {
    let self = this;

    $.ajax({
      url: '/api/content/articles' + (itemId ? '/' + itemId : ''),
      type: itemId ? 'PUT' : 'POST',
      contentType: 'application/json',
      data: JSON.stringify(this.state.article),
      success: (result) => {
        if(itemId) {
          result.originalName = result.name;
          self.setState({
            article: result
          });
          return;
        }

        self.setState({
          article: {
            headline: '',
            draft: true
          }
        });
      }
    });
    event.preventDefault();
  }

  /**
   * Renders the article form page components.
   */
  render() {
    if(!this.state.article) {
      return (
        <div>
          <h3><i className="fa fa-spinner fa-pulse"></i></h3>
        </div>
      )
    }

    let self = this;
    let articleName = itemId ? loc.generic.EDIT + ' ' + this.state.article.originalName : loc.articles.NEW_ARTICLE;
    let draftClasses = 'btn btn-sm btn-secondary ' + (this.state.article.draft ? 'active' : '');
    let publishClasses = 'btn btn-sm btn-secondary ' + (!this.state.article.draft ? 'active' : '');

    return (
      <div>
        <h1>{articleName}</h1>
        <form onSubmit={this.saveArticle}>
          <div className="form-group">
            <label htmlFor="headline">{loc.articles.HEADLINE}</label>
            <input type="text" className="form-control" id="headline" value={this.state.article.headline} onChange={this.handleValueChange} required></input>
          </div>
          <div className="form-group">
            <label htmlFor="draft">{loc.articles.DRAFT}</label>
            <br/>
            <div className="btn-group">
              <button type="button" className={draftClasses} value="true" onClick={self.setDraft}>{loc.generic.YES}</button>
              <button type="button" className={publishClasses} value="false" onClick={self.setDraft}>{loc.generic.NO}</button>
            </div>
          </div>
          <input type="submit" className="btn btn-primary" value={loc.generic.SAVE}></input>
        </form>
      </div>
    )
  }
}

ReactDOM.render(
  <ArticleForm />,
  document.getElementById('article_form')
);
