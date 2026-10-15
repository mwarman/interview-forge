import { JSX } from 'react';

import { RadioGroup, RadioGroupItem } from '@/common/components/shadcn/radio-group';
import { Label } from '@/common/components/shadcn/label';

interface LikertRatingProps {
  value?: number;
  onChange: (rating: number) => void;
}

const LIKERT_SCALE = [
  { value: 1, label: '1 - Poor' },
  { value: 2, label: '2 - Fair' },
  { value: 3, label: '3 - Good' },
  { value: 4, label: '4 - Very Good' },
  { value: 5, label: '5 - Excellent' },
];

/**
 * LikertRating component - a keyboard-accessible 1-5 scale rating control.
 * Uses shadcn/ui RadioGroup for accessibility.
 *
 * @param value - Current rating value (1-5)
 * @param onChange - Callback when rating changes
 * @returns {JSX.Element} The LikertRating component
 */
export const LikertRating = ({ value, onChange }: LikertRatingProps): JSX.Element => {
  return (
    <RadioGroup
      value={value?.toString() || ''}
      onValueChange={(val) => onChange(parseInt(val, 10))}
      data-testid="likert-rating-group"
    >
      <div className="flex flex-wrap gap-4">
        {LIKERT_SCALE.map((item) => (
          <div key={item.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={item.value.toString()}
              id={`rating-${item.value}`}
              data-testid={`rating-option-${item.value}`}
            />
            <Label
              htmlFor={`rating-${item.value}`}
              className="cursor-pointer font-normal"
              data-testid={`rating-label-${item.value}`}
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
};
