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
 * React controller for manage articles page of the admin section.
 * @constructor
 * @param {Object} props The properties of the React instance.
 */
class Articles extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: null,
      articleToDelete: null,
      deleting: false
    };

    this.confirmDeletion = this.confirmDeletion.bind(this);
    this.performDeletion = this.performDeletion.bind(this);
  }

  componentDidMount() {
    this.getArticles();
  }

  /**
   * Retrieves articles from the API.
   *
   * @param  {Number} [limit]  The number of articles to retrieve.
   * @param  {Number} [offset] The offset of articles to start from.
   * @param  {String} [query]  The search query to retrieve articles by.
   */
  getArticles(limit = 50, offset = 0, query = '') {
    let self = this;

    $.ajax({
      url: '/api/content/articles?limit=' + limit + '&offset=' + offset + '&query=' + query,
      type: 'GET',
      success: (result) => {
        self.setState({
          articles: result.data
        });
      }
    });
  }

  /**
   * Opens the confirm deletion modal for a article.
   *
   * @param  {Object} article The article to be deleted.
   */
  confirmDeletion(article) {
    this.setState({
      articleToDelete: article
    });

    $('.deletion-modal').modal('show');
  }

  /**
   * Calls the API to delete a article.
   */
  performDeletion() {
    let self = this;

    self.setState({
      deleting: true
    });

    $.ajax({
      url: '/api/content/articles/' + getUid(this.state.articleToDelete),
      type: 'DELETE',
      success: (result) => {
        self.setState({
          articleToDelete: null,
          deleting: false
        });

        $('.deletion-modal').modal('hide');
      }
    });
  }

  /**
   * Renders the articles page components.
   */
  render() {
    let self = this;
    let confirmDeletionString = this.state.articleToDelete ? loc.generic.CONFIRM_DELETE + ' ' + this.state.articleToDelete.name + '?' : '';
    let spinnerPartial = this.state.deleting ? <i className="fa fa-fw fa-spinner fa-pulse"></i> : '';

    if(!this.state.articles) {
      return (
        <div>
          <h1>{loc.articles.MANAGE_ARTICLES}</h1>
          <div className="action-buttons">
            <a className="btn btn-sm btn-primary" href="/admin-new/content/articles/new">{loc.articles.NEW_ARTICLE}</a>
          </div>
          <h3><i className="fa fa-spinner fa-pulse"></i></h3>
        </div>
      )
    }

    if(!this.state.articles.length) {
      return (
        <div>
          <h1>{loc.articles.MANAGE_ARTICLES}</h1>
          <div className="action-buttons">
            <a className="btn btn-sm btn-primary" href="/admin-new/content/articles/new">{loc.articles.NEW_ARTICLE}</a>
          </div>
        </div>
      )
    }

    return (
      <div>
        <h1>{loc.articles.MANAGE_ARTICLES}</h1>
        <div className="action-buttons">
          <a className="btn btn-sm btn-primary" href="/admin-new/content/articles/new">{loc.articles.NEW_ARTICLE}</a>
        </div>
        <div className="table-container">
          <table className="table table-responsive table-condensed">
            <thead>
              <tr>
                <th>{loc.articles.HEADLINE}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {this.state.articles.map(function(article) {
                let uid = getUid(article);
                let editHref = '/admin-new/content/articles/' + uid;

                let confirmDeletion = function() {
                  self.confirmDeletion(article);
                }

                return (
                  <tr>
                    <td>{article.headline}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-secondary btn-sm-padding" onClick={confirmDeletion}>
                        <i className="fa fa-fw fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="deletion-modal modal fade">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">{confirmDeletionString}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger btn" onClick={this.performDeletion} disabled={this.state.deleting}>
                  {loc.generic.DELETE}
                  {spinnerPartial}
                </button>
                <button type="button" className="btn btn-secondary" data-dismiss="modal" disabled={this.state.deleting}>{loc.generic.CANCEL}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <Articles />,
  document.getElementById('articles')
);
