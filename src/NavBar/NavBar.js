import React from 'react';
import './NavBar.css';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

const navItems = [
  ['/', 'Home'],
  ['/resume', 'Resume'],
  ['/hobbies', 'Hobbies', 'hidden'],
  ['/datarepo', 'Past Works'],
  ['/404', 'Contact', 'hidden'],
];

const navItem = (href, title) => {
  return (
    <Link to={href} className='nav-links'>
      {title}
    </Link>
  );
};

const getNavItems = () => {
  return navItems.map((item) => {
    if (item[2]) return '';
    return navItem(item[0], item[1]);
  });
};

class NavBar extends React.Component {
  render() {
    return (
      <div className='NavBar'>
        <nav
          id='mainNav'
          className='navbar navbar-default navbar-fixed-top
            navbar-custom'
        >
          <Container fluid>
            <Row md={12} className={'align-center'}>
              <Col md>
                <Link
                  className='nav navbar-brand font-montserrat'
                  to='/bentheitguy/'
                >
                  Benjamin Eppinger
                </Link>
              </Col>
              <Col className='text-align-right font-montserrat'>
                {getNavItems()}
              </Col>
            </Row>
            <Row>
              <span className='banner-note'>
                Note: This page is finally a work-in-progress again, so bear
                with me as I change some things up here.
              </span>
            </Row>
          </Container>
        </nav>
      </div>
    );
  }
}

export default NavBar;
