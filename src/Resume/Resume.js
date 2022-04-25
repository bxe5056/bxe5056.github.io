import { Container } from 'react-bootstrap';
import './Resume.css';

const Resume = () => {
  return (
    <Container className='iframe-container'>
      <iframe
        src='https://app.box.com/embed/preview/q15bsl0ont4er07suzw5sllndp6uehap?direction=ASC&theme=dark'
        className='responsive-iframe'
        frameBorder='0'
        allowFullScreen
        webkitallowfullscreen='true'
        msallowfullscreen='true'
        title='Resume'
      ></iframe>
    </Container>
  );
};

export default Resume;
