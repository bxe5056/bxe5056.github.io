import React from 'react';
import './Home.css';
import { Container, Row, Col } from 'react-bootstrap';
import profilePic from './profile.png';
import Resume from '../Resume/Resume';

class Home extends React.Component {
  render() {
    return (
      <Container className='welcome'>
        <Container className='welcome'>
          {/* {importedItem()} */}
          <Row className='padding-welcome welcome'>
            <Col lg={3}>
              <img className='img-profile' src={profilePic} alt="Ben's Face" />
            </Col>
            <Col lg={9}>
              <div className='intro-text'>
                <Row>
                  <span className='name font-montserrat'>
                    Benjamin Eppinger
                  </span>
                </Row>
                <Row>
                  <span className='skills'>
                    I’m a full-time software developer in the Greater Denver
                    (CO) region, currently doing project management and Ionic Mobile App Development in React JS.
                  </span>
                  <br />
                </Row>
                <Row>
                  <span className='skills'>
                    I received a BS and MS in 2019 at Penn State's <br />{' '}
                    College of Information Sciences and Technology.
                  </span>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
        <Container className='resume'>
          <Row className='justify-content-md-center'>
            <Col md={12}>
              <Resume />
            </Col>
          </Row>
        </Container>
        <br />
        <br />
        <br />
      </Container>
    );
  }
}

export default Home;
