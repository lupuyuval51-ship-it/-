import { useParams } from 'react-router';
import { ReadyDetail } from '../../features/ready/ReadyDetail';

/** /workouts/ready/:readyId - a ready-made workout, the sport question and the start button. */
export default function ReadyDetailPage() {
  const { readyId = '' } = useParams();
  return <ReadyDetail readyId={readyId} />;
}
