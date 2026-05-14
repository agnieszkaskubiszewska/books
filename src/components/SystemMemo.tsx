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

function formatDate(dateStr: string, _lang: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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

const EN_TO_KEY: Array<{ match: RegExp; pl: string; en: string }> = [
  {
    match: /owner confirmed the book was returned/i,
    pl: 'Książka została zwrócona. Dziękujemy!',
    en: 'The book has been returned. Thank you!',
  },
  {
    match: /please contact the owner to agree on a new return date/i,
    pl: 'Skontaktuj się z właścicielem w sprawie nowej daty zwrotu.',
    en: 'Please contact the owner to agree on a new return date.',
  },
  {
    match: /we asked the borrower to contact you/i,
    pl: 'Wysłaliśmy prośbę do wypożyczającego o kontakt w sprawie daty zwrotu.',
    en: 'We asked the borrower to contact you about the return date.',
  },
  {
    match: /owner agreed to rent this book/i,
    pl: 'Właściciel zgodził się na wypożyczenie książki.',
    en: 'The owner agreed to lend you this book.',
  },
  {
    match: /owner refused to rent this book/i,
    pl: 'Właściciel nie wyraził zgody na wypożyczenie książki.',
    en: 'The owner declined the borrow request.',
  },
  {
    match: /owner closed the discussion/i,
    pl: 'Właściciel zamknął dyskusję.',
    en: 'The owner closed the discussion.',
  },
];

function translateLegacyContent(content: string, lang: string): string | null {
  for (const entry of EN_TO_KEY) {
    if (entry.match.test(content)) {
      return lang === 'pl' ? entry.pl : entry.en;
    }
  }
  return null;
}

const SystemMemo: React.FC<SystemMemoProps> = ({ content }) => {
  const { t, i18n } = useTranslation();
  const palette = getStylesForContent(content);
  const formatted =
    formatRentPeriodContent(content, i18n.language) ??
    translateLegacyContent(content, i18n.language);
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

