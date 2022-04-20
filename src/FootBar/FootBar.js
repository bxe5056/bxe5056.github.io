import React from 'react';
import './FootBar.css';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebookF, FaGithub, FaLinkedin } from 'react-icons/fa';

class FootBar extends React.Component {
  render() {
    return (
      <div className='FootBar'>
        <footer class='text-center' id='contact'>
          <div class='footer-above'>
            <Container>
              <Row class='row'>
                <Col md={4} class='footer-col'>
                  <h3>Location</h3>
                  <p>
                    Somewhere around
                    <br />
                    Boston, MA
                    <br />
                    <a href='mail:bxe5056@gmail.com'>Email me for more info!</a>
                  </p>
                </Col>
                <Col md={4} class='footer-col'>
                  <Row md={9} className='justify-content-md-center'>
                    <h3>Around the Web</h3>
                  </Row>
                  <Row md={9} className='justify-content-md-center'>
                    <Col md={3}>
                      <a
                        href='https://www.facebook.com/bxe5056'
                        class='btn-social btn-outline'
                      >
                        <FaFacebookF />
                      </a>
                    </Col>
                    <Col md={3}>
                      <a
                        href='http://www.linkedin.com/in/benjamindeppingerpsu'
                        class='btn-social btn-outline'
                      >
                        <FaLinkedin />
                      </a>
                    </Col>
                    <Col md={3}>
                      <a
                        href='https://github.com/bxe5056'
                        class='btn-social btn-outline'
                      >
                        <FaGithub />
                      </a>
                    </Col>
                  </Row>
                </Col>
                <Col md={4} class='footer-col'>
                  <h3>Contact Me</h3>
                  <p>
                    <a href='mail:bxe5056@gmail.com'>bxe5056@gmail.com</a>
                    <br />
                    <a href='sms:18143108292'>+1 814 310 8292</a>
                  </p>
                </Col>
              </Row>
            </Container>
          </div>
          <div class='footer-below'>
            <Container>
              <Row>
                <Col lg={12}>Copyright © Benjamin Eppinger 2022</Col>
              </Row>
            </Container>
          </div>
        </footer>
      </div>
    );
  }
}

export default FootBar;
