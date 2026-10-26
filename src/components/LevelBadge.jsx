import { cx } from './ui.jsx';
import { LEVEL_LABELS } from '../lib/content.js';

const TONES = {
  intern: 'intern',
  emerging: 'emerging',
  rising: 'rising',
  established: 'established',
  professional: 'professional',
};

export default function LevelBadge({ level, className }) {
  return (
    <span className={cx('standing-level-badge', `standing-level-${TONES[level] || 'intern'}`, className)}>
      {LEVEL_LABELS[level] || LEVEL_LABELS.intern}
    </span>
  );
}
