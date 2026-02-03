import React from 'react';
import { useSearchParams } from 'react-router-dom';

type SingleBookReqProps = {
  bookTitle?: string | null;
  requesterName?: string | null;
  periodFrom?: string | null;
  periodTo?: string | null;
  createdAt?: string | null;
};

const SingleBookReq: React.FC<SingleBookReqProps> = (props) => {
  const [searchParams] = useSearchParams();
  const bookTitle = props.bookTitle ?? searchParams.get('bookTitle');
  const requesterName = props.requesterName ?? searchParams.get('requesterName');
  const periodFrom = props.periodFrom ?? searchParams.get('periodFrom');
  const periodTo = props.periodTo ?? searchParams.get('periodTo');
  const createdAt = props.createdAt ?? searchParams.get('createdAt');
return (
    <div>
      <h1>Book: <strong>{bookTitle}</strong></h1>
  <p><strong>Requester:</strong> {requesterName}</p>
      <p><strong>Period:</strong> {periodFrom} - {periodTo}</p>
      <p><strong>Created At:</strong> {createdAt}</p>
    </div>
  );
};

export default SingleBookReq;