import { Col, Container, Row } from 'react-bootstrap';
import './Hobbies.css';
import PhotoText from './PhotoText/PhotoText';
const dataItemList = [
  [
    './fileFolder/CareBnB_StoryBoard_All_Streamlined_FontRoboto.xd',
    'IST 413',
    'CareBnB Adobe xD Prototype',
  ],
  [
    './fileFolder/IST505-ProposalPresentation.pptx',
    'IST 505',
    'Project Proposal Presentation',
  ],
];

const dataItem = (href, title, subtitle) => {
  return (
    <Col xs={12} lg={3} md={4} sm={6}>
      <a href={href || '#'} target='_blank' rel='noreferrer'>
        <h3> {title} </h3>
        <h5> {subtitle} </h5>
        <br />
      </a>
    </Col>
  );
};

const getDataItems = () => {
  return dataItemList.map((item) => {
    return dataItem(item[0], item[1], item[2]);
  });
};

let object1 = {
  title: 'This is Tesla',
  subheading: 'She is a dog',
};

const Hobbies = () => {
  return (
    <Container>
      <div className='container'>
        <div className='row'>
          <div className='col-lg-12 text-center'>
            <h2>
              <br />
              My Hobbies
            </h2>
            <hr className='star-primary' />
          </div>
        </div>
        <Row className='fileRepoGrid'>{getDataItems()}</Row>
        <PhotoText cardContents={object1} />
      </div>
    </Container>
  );
};

export default Hobbies;
