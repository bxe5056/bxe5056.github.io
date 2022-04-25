import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TeslaIcon from '../../photos/PXL-TeslaBear-1.jpg';
import './PhotoText.css';

export default function PhotoText(props) {
  let cardContents = props.cardContents;
  let contents = {
    title: cardContents.title || '',
    subheader: cardContents.subheader || '',
    image: cardContents.image?.image || null,
    imageAlt: cardContents.image?.alt || '',
    height: cardContents.image?.height || '200',
  };

  return (
    <Card sx={{ maxWidth: 400 }} className={'card-item-margin'}>
      <CardHeader title={contents.title} subheader={contents.subheader} />
      <CardMedia
        component='img'
        height='350'
        image={TeslaIcon}
        alt='Australian Shepard Dog'
      />
      <CardContent>
        <Typography variant='body2' color='text.secondary'>
          This impressive paella is a perfect party dish and a fun meal to cook
          together with your guests. Add 1 cup of frozen peas along with the
          mussels, if you like.
        </Typography>
      </CardContent>
    </Card>
  );
}
