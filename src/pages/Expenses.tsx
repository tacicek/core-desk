import { GeneralExpenseManager } from '@/components/expense/GeneralExpenseManager';
import { useTranslation } from 'react-i18next';

export default function Expenses() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-clamp-2xl font-bold">{t('pages.expenses.title')}</h1>
          <p className="text-clamp-base text-muted-foreground">
            {t('pages.expenses.subtitle')}
          </p>
        </div>
      </div>

      <GeneralExpenseManager />
    </div>
  );
}