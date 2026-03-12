import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type SingleBookReqProps = {
  bookTitle?: string | null;
  requesterName?: string | null;
  periodFrom?: string | null;
  periodTo?: string | null;
  createdAt?: string | null;
  isMine?: boolean;
};

const SingleBookReq: React.FC<SingleBookReqProps> = (props) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const bookTitle = props.bookTitle ?? searchParams.get('bookTitle');
  const requesterName = props.requesterName ?? searchParams.get('requesterName');
  const periodFrom = props.periodFrom ?? searchParams.get('periodFrom');
  const periodTo = props.periodTo ?? searchParams.get('periodTo');
  const createdAt = props.createdAt ?? searchParams.get('createdAt');
  const counterpartyLabel = props.isMine ? (t('requests.owner') || 'Owner') : (t('requests.requester') || 'Requester');
  return (
    <div>
      <p><strong>{t('requests.book') || 'Requested book'}:</strong> {bookTitle}</p>
      <p><strong>{counterpartyLabel}:</strong> {requesterName}</p>
      <p><strong>{t('requests.period') || 'Period'}:</strong> {periodFrom} - {periodTo}</p>
      <p><strong>{t('requests.createdAt') || 'Created At'}:</strong> {createdAt}</p>
    </div>
  );
};

export default SingleBookReq;