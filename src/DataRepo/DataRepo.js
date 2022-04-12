import { Col, Container, Row } from 'react-bootstrap';
import './DataRepo.css';

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

const DataRepo = () => {
  return (
    <Container>
      <div class='container'>
        <div class='row'>
          <div class='col-lg-12 text-center'>
            <h2>
              <br />
              <br />
              File Repository
            </h2>
            <hr class='star-primary' />
          </div>
        </div>
        <Row className='fileRepoGrid'>
          {dataItem(
            './fileFolder/CareBnB_StoryBoard_All_Streamlined_FontRoboto.xd',
            'IST 413',
            'CareBnB Adobe xD Prototype'
          )}
          {dataItem(
            './fileFolder/IST505-ProposalPresentation.pptx',
            'IST 505',
            'Project Proposal Presentation'
          )}
          {dataItem(
            './fileFolder/525Poster.pptx',
            'IST 525',
            'IST 525 Class Project Poster'
          )}

          {dataItem(
            './fileFolder/Eppinger597ProposalPresentation.pptx',
            'IST 597',
            'ML ProjectFi Class Proposal Presentation'
          )}
          {dataItem(
            './fileFolder/Eppinger597ProjectPresentation.pptx',
            'IST 597',
            'ML ProjectFi Class Final Presentation'
          )}
          {dataItem(
            './fileFolder/Module11PPT.pptx',
            'IST 597',
            'AI - Content Moderation Presentation'
          )}
        </Row>
      </div>
    </Container>
  );
};

export default DataRepo;
