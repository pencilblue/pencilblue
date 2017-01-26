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

/* PLACEHOLDER UNTIL SERVICE EXISTS */
let quickItems = [{
  type: 'IMAGE',
  image: '/img/pb_icon.svg',
  href: '/admin-new'
}, {
  type: 'ICON',
  icon: 'fa-tags',
  href: '/admin-new/content/topics'
}, {
  type: 'ICON',
  icon: 'fa-file-o',
  href: '/admin-new/content/pages'
}, {
  type: 'ICON',
  icon: 'fa-files-o',
  href: '/admin-new/content/articles'
}, {
  type: 'ICON',
  icon: 'fa-camera',
  href: '/admin-new/content/media'
}, {
  type: 'ICON',
  icon: 'fa-cubes',
  href: '/admin-new/content/objects/types'
}, {
  type: 'ICON',
  icon: 'fa-desktop',
  href: '/'
}, {
  type: 'ICON',
  icon: 'fa-power-off',
  href: '/actions/logout'
}];

/**
 * React component for the left nav.
 * @constructor
 * @param {Object} props The properties of the React instance.
 */
class LeftNav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      navOpen: null,
      navItems: []
    };

    this.toggleNav = this.toggleNav.bind(this);
  }

  /**
   * Toggles the opening and closing of the nav.
   */
  toggleNav() {
    this.setState((prevState) => ({
      navOpen: !prevState.navOpen,
      navItems: prevState.navItems
    }));
  }

  componentDidMount() {
    this.getNavigation();
  }

  /**
   * Retrieves the navigation from the API.
   */
  getNavigation() {
    var self = this;
    $.ajax({
      url: '/api/content/navigation/map/admin' + (typeof activeNavItems !== 'undefined' ? '?activeItems=' + activeNavItems : ''),
      type: 'GET',
      success: (result) => {
        self.setState((prevState) => ({
          navOpen: prevState.navOpen,
          navItems: result.data
        }));
      }
    });
  }

  /**
   * Renders the left nav component.
   */
  render() {
    if(!this.state.navItems.length) {
      let tempQuickItems = [{
        type: 'IMAGE',
        image: '/img/pb_icon.svg',
        href: '/admin-new'
      }, {
        type: 'ICON',
        icon: 'fa-spinner fa-pulse',
        href: ''
      }]

      return (
        <div className="left-nav">
        <div className="quick-items">
          {tempQuickItems.map(function(item) {
            return <LeftNavQuickItem key={item.href} item={item} />
          })}
        </div>
        </div>
      )
    }
    else {
      let navClasses = 'left-nav ' + (this.state.navOpen ? 'open' : (this.state.navOpen === false ? 'closed' : ''));
      let toggleClasses = 'fa fa-fw ' + (this.state.navOpen ? 'fa-angle-left' : 'fa-angle-right');
      let itemsStyle = {
        display: this.state.navOpen ? 'block': 'none'
      }
      let quickItemsStyle = {
        display: this.state.navOpen ? 'none' : 'block'
      }

      let template = (
        <div className={navClasses}>
          <div className="items" style={itemsStyle}>
            <div className="item">
              <img className="logo" src="https://pencilblue.org/img/pb_logo.svg"></img>
            </div>
            {this.state.navItems.map(function(item) {
              return <LeftNavItem key={item.id} item={item} />
            })}
          </div>
          <div className="quick-items" style={quickItemsStyle}>
            {quickItems.map(function(item) {
              return <LeftNavQuickItem key={item.href} item={item} />
            })}
          </div>
          <div className="toggle-button" onClick={this.toggleNav}>
            <i className={toggleClasses}></i>
          </div>
        </div>
      );

      return template;
    }
  }
}

/**
 * Main items of the left navigation.
 *
 * @namespace Components
 * @class LeftNavItem
 */
class LeftNavItem extends React.Component {
  constructor(props) {
    super(props);
    if(props.item.children && props.item.active) {
      props.item.open = true;
    }
    this.state = {
      item: props.item
    };

    this.toggleItem = this.toggleItem.bind(this);
  }

  toggleItem() {
    this.setState((prevState) => {
      prevState.item.open = !prevState.item.open;
      return {
        item: prevState.item
      };
    });
  }

  render() {
    let iconClasses = 'fa fa-fw fa-' + this.state.item.icon;
    let template;

    if(!this.state.item.children) {
      let itemClasses = 'item ' + (this.state.item.active ? 'active' : '');

      template = (
        <div className={itemClasses}>
          <div className="header">
            <a href={this.state.item.href.split('/admin').join('/admin-new')}>
              <i className={iconClasses} />
              {this.state.item.title}
            </a>
          </div>
        </div>
      );
    }
    else {
      let itemClasses = 'item ' + (this.state.item.open ? 'open' : (this.state.item.open === false ? 'closed' : ''));

      template = (
        <div className={itemClasses}>
          <div className="header" onClick={this.toggleItem}>
            <i className={iconClasses} />
            {this.state.item.title}
          </div>
          <div className="sub-items">
            {this.state.item.children.map(function(child) {
              return <LeftNavItem key={child.id} item={child} />
            })}
          </div>
        </div>
      );
    }

    return template;
  }
}

/**
 * Quick link items of the left navigation.
 *
 * @namespace Components
 * @class LeftNavQuickItem
 */
class LeftNavQuickItem extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    let template;

    switch(this.props.item.type) {
      case 'IMAGE':
        template = (
          <div className="item">
            <a href={this.props.item.href}>
              <img className="logo" src={this.props.item.image} />
            </a>
          </div>
        );
        break;
      case 'ICON':
      default:
        let iconClasses = 'fa fa-fw ' + this.props.item.icon;
        template = (
          <div className="item">
            <a href={this.props.item.href}>
              <i className={iconClasses} />
            </a>
          </div>
        );
        break;
    }

    return template;
  }
}

ReactDOM.render(
  <LeftNav />,
  document.getElementById('left_nav')
);
