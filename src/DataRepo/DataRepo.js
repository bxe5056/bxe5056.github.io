import { Col, Container, Row } from 'react-bootstrap';
import './DataRepo.css';
import dataItemList from './DataItemList';

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

const DataRepo = () => {
  return (
    <Container>
      <div className='container'>
        <div className='row'>
          <div className='col-lg-12 text-center buffer-y'>
            <h2>Past Works / File Repo</h2>
          </div>
        </div>
        <Row className='fileRepoGrid'>{getDataItems()}</Row>
      </div>
    </Container>
  );
};

export default DataRepo;
