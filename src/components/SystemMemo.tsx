import React from 'react';

type SystemMemoProps = {
  content: string;
};

function getStylesForContent(content: string) {
  const normalized = content.toLowerCase();
  if (normalized.includes('agreed')) {
    // zielony - zgoda
    return {
      border: '1px solid #34d399',
      background: '#d1fae5',
      color: '#065f46',
    };
  }
  if (normalized.includes('refused')) {
    // czerwony - odrzucenie
    return {
      border: '1px solid #ef4444',
      background: '#fee2e2',
      color: '#991b1b',
    };
  }
  if (normalized.includes('closed')) {
    // szary - zamknięcie dyskusji
    return {
      border: '1px solid #e5e7eb',
      background: '#f8fafc',
      color: '#334155',
    };
  }
  if (normalized.startsWith('requested rent period')) {
    // niebieski - informacyjne
    return {
      border: '1px solid #93c5fd',
      background: '#dbeafe',
      color: '#1e3a8a',
    };
  }
  // domyślny (delikatnie szary)
  return {
    border: '1px solid #e5e7eb',
    background: '#f8fafc',
    color: '#334155',
  };
}

const SystemMemo: React.FC<SystemMemoProps> = ({ content }) => {
  const palette = getStylesForContent(content);
  return (
    <div style={{
      borderRadius: 12,
      padding: 10,
      ...palette
    }}>
      <strong style={{ display: 'block', marginBottom: 4 }}>System</strong>
      <div>{content}</div>
    </div>
  );
};

export default SystemMemo;

