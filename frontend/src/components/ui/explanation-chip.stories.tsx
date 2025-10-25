import type { Meta, StoryObj } from '@storybook/react'
import { ExplanationChip } from './explanation-chip'
import { Explanation } from '@/types'

const meta: Meta<typeof ExplanationChip> = {
  title: 'UI/ExplanationChip',
  component: ExplanationChip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const BecauseYouLiked: Story = {
  args: {
    explanation: {
      type: 'because',
      becauseOfPinId: 'pin-123',
      score: 0.85,
    },
  },
}

export const MatchedTags: Story = {
  args: {
    explanation: {
      type: 'matched',
      matchedTags: [
        { tag: 'vintage', contribution: 0.82 },
        { tag: 'leather', contribution: 0.76 },
        { tag: 'jacket', contribution: 0.71 },
      ],
    },
  },
}

export const Trending: Story = {
  args: {
    explanation: {
      type: 'trending',
    },
  },
}

export const CustomReason: Story = {
  args: {
    explanation: {
      type: 'matched',
      reason: 'Similar to your style preferences',
    },
  },
}

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-forest mb-2">Because you liked</h3>
        <ExplanationChip
          explanation={{
            type: 'because',
            becauseOfPinId: 'pin-123',
            score: 0.85,
          }}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-forest mb-2">Matched tags</h3>
        <ExplanationChip
          explanation={{
            type: 'matched',
            matchedTags: [
              { tag: 'vintage', contribution: 0.82 },
              { tag: 'leather', contribution: 0.76 },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-forest mb-2">Trending</h3>
        <ExplanationChip
          explanation={{
            type: 'trending',
          }}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-forest mb-2">Custom reason</h3>
        <ExplanationChip
          explanation={{
            type: 'matched',
            reason: 'Similar to your style preferences',
          }}
        />
      </div>
    </div>
  ),
}
