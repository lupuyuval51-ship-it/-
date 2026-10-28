import { Modal } from '../../components/ui';
import { useI18n } from '../../i18n';
import { BodyWeightForm } from './BodyWeightForm';

export function LogBodyWeightModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('progress.bodyWeight.formTitle')} size="sm">
      <BodyWeightForm autoFocus onSaved={onClose} />
    </Modal>
  );
}
