import React from 'react';
import { useTranslation } from 'react-i18next';

type SystemMemoProps = {
  content: string;
};

function getStylesForContent(content: string) {
  const normalized = content.toLowerCase();
  if (normalized.includes('agreed') || normalized.includes('zgodził się')) {
    return {
      border: '1px solid #34d399',
      background: '#d1fae5',
      color: '#065f46',
    };
  }
  if (normalized.includes('refused') || normalized.includes('nie wyraził zgody')) {
    return {
      border: '1px solid #ef4444',
      background: '#fee2e2',
      color: '#991b1b',
    };
  }
  if (normalized.includes('closed')) {
    return {
      border: '1px solid #e5e7eb',
      background: '#f8fafc',
      color: '#334155',
    };
  }
  if (normalized.startsWith('requested rent period')) {
    return {
      border: '1px solid #93c5fd',
      background: '#dbeafe',
      color: '#1e3a8a',
    };
  }
  return {
    border: '1px solid #e5e7eb',
    background: '#f8fafc',
    color: '#334155',
  };
}

function formatDate(dateStr: string, lang: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatRentPeriodContent(content: string, lang: string): string | null {
  const match = content.match(
    /^Requested rent period(?:\s+from\s+(\d{4}-\d{2}-\d{2}))?(?:\s+to\s+(\d{4}-\d{2}-\d{2}))?\.?$/i
  );
  if (!match) return null;
  const from = match[1] ? formatDate(match[1], lang) : null;
  const to = match[2] ? formatDate(match[2], lang) : null;
  if (lang === 'pl') {
    if (from && to) return `Prośba o wypożyczenie od ${from} do ${to}.`;
    if (from) return `Prośba o wypożyczenie od ${from}.`;
    if (to) return `Prośba o wypożyczenie do ${to}.`;
  } else {
    if (from && to) return `Borrow request from ${from} to ${to}.`;
    if (from) return `Borrow request from ${from}.`;
    if (to) return `Borrow request until ${to}.`;
  }
  return null;
}

const SystemMemo: React.FC<SystemMemoProps> = ({ content }) => {
  const { t, i18n } = useTranslation();
  const palette = getStylesForContent(content);
  const formatted = formatRentPeriodContent(content, i18n.language);
  return (
    <div style={{
      borderRadius: 12,
      padding: 10,
      ...palette
    }}>
      <strong style={{ display: 'block', marginBottom: 4 }}>{t('systemMemo.systemLabel')}</strong>
      <div>{formatted ?? content}</div>
    </div>
  );
};

export default SystemMemo;

