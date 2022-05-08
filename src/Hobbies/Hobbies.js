import { Col, Container, Row } from 'react-bootstrap';
import './Hobbies.css';
import PhotoText from './PhotoText/PhotoText';
const dataItemList = [
  ['', 'Tesla Bear', 'My Mini Australian Shepherd'],
  ['', 'Kayaking', ''],
  ['', 'Gaming', ''],
  ['', 'Skiing', ''],
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

const muiPaperRoot = () => {
  return (
    <div
      className='MuiPaper-root MuiPaper-outlined MuiPaper-rounded MuiCard-root css-1m39r5b'
      // style='opacity: 1; transition: opacity 700ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;'
    >
      <div className='MuiBox-root css-1aw80z2'>1</div>
      <div className='MuiBox-root css-8lbp59'>
        <div className='MuiBox-root css-k008qs'>
          <p className='MuiTypography-root MuiTypography-body2 css-5pmaw1'>
            Use the sx prop to add these properties:
          </p>
          <svg
            className='MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-97lw5d'
            focusable='false'
            aria-hidden='true'
            viewBox='0 0 24 24'
            data-testid='InfoOutlinedIcon'
          >
            <path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'></path>
          </svg>
        </div>
        <ul className='MuiTimeline-root MuiTimeline-positionRight css-1g4ebr4'>
          <li className='MuiTimelineItem-root MuiTimelineItem-positionRight MuiTimelineItem-missingOppositeContent css-1idwvnt'>
            <div className='MuiTimelineSeparator-root css-11tgw8h'>
              <span className='MuiTimelineDot-root MuiTimelineDot-filled MuiTimelineDot-filledGrey css-1uo0mn9'></span>
              <span className='MuiTimelineConnector-root css-7m4rs3'></span>
            </div>
            <div className='MuiTypography-root MuiTypography-body1 MuiTimelineContent-root MuiTimelineContent-positionRight css-1c1vs9b'>
              Margin Top
            </div>
          </li>
          <li className='MuiTimelineItem-root MuiTimelineItem-positionRight MuiTimelineItem-missingOppositeContent css-1idwvnt'>
            <div className='MuiTimelineSeparator-root css-11tgw8h'>
              <span className='MuiTimelineDot-root MuiTimelineDot-filled MuiTimelineDot-filledGrey css-1uo0mn9'></span>
              <span className='MuiTimelineConnector-root css-7m4rs3'></span>
            </div>
            <div className='MuiTypography-root MuiTypography-body1 MuiTimelineContent-root MuiTimelineContent-positionRight css-1c1vs9b'>
              Padding Bottom
            </div>
          </li>
          <li className='MuiTimelineItem-root MuiTimelineItem-positionRight MuiTimelineItem-missingOppositeContent css-1idwvnt'>
            <div className='MuiTimelineSeparator-root css-11tgw8h'>
              <span className='MuiTimelineDot-root MuiTimelineDot-filled MuiTimelineDot-filledGrey css-1uo0mn9'></span>
            </div>
            <div className='MuiTypography-root MuiTypography-body1 MuiTimelineContent-root MuiTimelineContent-positionRight css-1c1vs9b'>
              Flexbox
            </div>
          </li>
        </ul>
      </div>
    </div>
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
          </div>
        </div>
        <Row className='fileRepoGrid'>{getDataItems()}</Row>
        <PhotoText cardContents={object1} />
      </div>
      {muiPaperRoot}
    </Container>
  );
};

export default Hobbies;
