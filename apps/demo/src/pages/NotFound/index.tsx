import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation('notFound');
  return (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-md border border-border text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground">{t('message')}</p>
      </div>
    </div>
  );
};
