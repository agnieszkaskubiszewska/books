import React from 'react';

type SystemMemoProps = {
  content: string;
};

const SystemMemo: React.FC<SystemMemoProps> = ({ content }) => {
  return (
    <div style={{
      borderRadius: 12,
      padding: 10,
      border: '1px solid #ef4444',
      background: '#fee2e2',
      color: '#991b1b'
    }}>
      <strong style={{ display: 'block', marginBottom: 4 }}>System</strong>
      <div>{content}</div>
    </div>
  );
};

export default SystemMemo;

