import { Text, View } from 'react-native';
import { AiRequestSchema } from '@domain/ai-api';
import { PLAN_SECTION_KEYS } from '@domain/plan';
export default function Index() {
  const ok = AiRequestSchema.safeParse({ action: 'finance.propose', businessId: '00000000-0000-4000-8000-000000000000', locale: 'he' }).success;
  return (<View><Text>{String(ok)} {PLAN_SECTION_KEYS.length}</Text></View>);
}
