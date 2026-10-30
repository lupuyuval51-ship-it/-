import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { CustomFoodInput } from '@shared/schemas/nutrition';
import type { FoodDTO } from '@shared/types';
import { Card, EmptyState, IconButton, Modal, QueryState, useConfirm, useToast } from '../../../components/ui';
import { useClearDraft } from '../../../hooks/useDraft';
import { useIdempotentMutation } from '../../../hooks/useIdempotentMutation';
import { useI18n } from '../../../i18n';
import { errorMessage } from '../../../lib/errors';
import { createFood, deleteFood, fetchMyFoods, nk, updateFood } from '../api';
import { CustomFoodForm } from '../CustomFoodForm';
import { FoodListItem } from '../FoodBits';
import { useNutritionInvalidation } from '../hooks';

/** Create a food from a package label (then log it), and manage the user's own foods. */
export function CustomFoodTab({ onSelect, prefillBarcode }: { onSelect(food: FoodDTO): void; prefillBarcode?: string }) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const clearDraft = useClearDraft();
  const invalidate = useNutritionInvalidation();
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<FoodDTO | null>(null);
  const mine = useQuery({ queryKey: nk.myFoods, queryFn: fetchMyFoods });

  const refreshFoods = () => void queryClient.invalidateQueries({ queryKey: ['foods'] });

  const create = useIdempotentMutation((input: CustomFoodInput, key: string) => createFood(input, key), {
    onSuccess: (food) => {
      refreshFoods();
      toast.success(t('nutrition.custom.created', { name: lt(food.name) }));
      clearDraft('nutrition.customFood');
      setFormKey((k) => k + 1);
      onSelect(food);
    },
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomFoodInput }) => updateFood(id, input),
    onSuccess: () => {
      refreshFoods();
      invalidate();
      toast.success(t('nutrition.custom.updated'));
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: () => {
      refreshFoods();
      invalidate();
      toast.success(t('nutrition.custom.deleted'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  return (
    <div className="stack-lg">
      <Card title={t('nutrition.custom.title')} subtitle={t('nutrition.custom.intro')}>
        <CustomFoodForm
          key={formKey}
          prefillBarcode={prefillBarcode}
          submitLabel={t('nutrition.custom.create')}
          pending={create.isPending}
          serverError={create.error}
          onSubmit={(input) => create.mutate(input)}
        />
      </Card>

      <section className="stack-sm">
        <h2 className="section-title">{t('nutrition.custom.myFoods')}</h2>
        <QueryState query={mine} isEmpty={(d) => d.length === 0} empty={<EmptyState compact icon="list" title={t('nutrition.custom.myFoodsEmpty')} />}>
          {(foods) => (
            <ul className="list">
              {foods.map((food) => {
                const name = lt(food.name);
                return (
                  <FoodListItem
                    key={food.id}
                    food={food}
                    onSelect={onSelect}
                    actions={
                      <>
                        <IconButton icon="edit" size="sm" label={t('nutrition.custom.edit', { name })} onClick={() => setEditing(food)} />
                        <IconButton
                          icon="trash"
                          size="sm"
                          label={t('nutrition.custom.delete', { name })}
                          loading={remove.isPending && remove.variables === food.id}
                          onClick={async () => {
                            const ok = await confirm({
                              title: t('nutrition.custom.deleteTitle'),
                              body: t('nutrition.custom.deleteBody', { name }),
                              confirmLabel: t('common.actions.delete'),
                              danger: true,
                            });
                            if (ok) remove.mutate(food.id);
                          }}
                        />
                      </>
                    }
                  />
                );
              })}
            </ul>
          )}
        </QueryState>
      </section>

      <Modal open={editing != null} onClose={() => setEditing(null)} title={t('nutrition.custom.editTitle')} size="lg">
        {editing && (
          <CustomFoodForm
            key={editing.id}
            food={editing}
            submitLabel={t('nutrition.custom.save')}
            pending={update.isPending}
            serverError={update.error}
            onSubmit={(input) => update.mutate({ id: editing.id, input })}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
