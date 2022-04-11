import React from 'react';
import './NavBar.css';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

class NavBar extends React.Component {
  render() {
    return (
      <div className='NavBar'>
        <nav
          id='mainNav'
          class='navbar navbar-default navbar-fixed-top
            navbar-custom'
        >
          <Container fluid>
            <Row md={12} className={'align-center'}>
              <Col md>
                <a class='nav navbar-brand' href='#page-top'>
                  Benjamin Eppinger
                </a>
              </Col>
              <Col mdPush='auto' className='text-align-right'>
                <Link to='/bentheitguy/' className='nav-links'>
                  Home
                </Link>
                <Link to='/bentheitguy/resume' className='nav-links'>
                  Resume
                </Link>
                <Link to='/bentheitguy/sample' className='nav-links'>
                  Courses
                </Link>
                <Link to='/bentheitguy/404' className='nav-links'>
                  Evidence of Work
                </Link>
                <Link to='/bentheitguy/404' className='nav-links'>
                  File Repo
                </Link>
                <Link to='/bentheitguy/404' className='nav-links'>
                  Contact
                </Link>
              </Col>
            </Row>
            <Row>
              <span class='banner-note'>
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
