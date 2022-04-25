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
                <Link to='/bentheitguy/' className='nav-links'>
                  Home
                </Link>
                <Link to='/bentheitguy/resume' className='nav-links'>
                  Resume
                </Link>
                <Link to='/bentheitguy/hobbies' className='nav-links'>
                  Hobbies
                </Link>
                <Link to='/bentheitguy/datarepo' className='nav-links'>
                  Past Works
                </Link>
                <Link to='/bentheitguy/404' className='nav-links'>
                  Contact
                </Link>
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
