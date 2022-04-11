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
              <img class='img-profile' src={profilePic} alt="Ben's Face" />
            </Col>
            <Col lg={9}>
              <div class='intro-text'>
                <Row>
                  <span class='name'>Benjamin Eppinger</span>
                </Row>
                <Row>
                  <span class='skills'>
                    I’m a full-time software developer in the Greater Boston
                    (MA) region, currently doing full-stack NodeJS development
                    on a customer-facing web application.
                  </span>
                  <br />
                </Row>
                <Row>
                  <span class='skills'>
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
