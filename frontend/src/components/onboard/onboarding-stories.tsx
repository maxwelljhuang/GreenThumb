import type { Meta, StoryObj } from '@storybook/react'
import { OnboardingSteps } from './onboarding-steps'
import { OnboardingComplete } from './onboarding-complete'
import { MoodboardSelection } from './moodboard-grid'
import { MOODBOARDS } from '@/data/moodboards'

const meta: Meta<typeof OnboardingSteps> = {
  title: 'Onboarding/OnboardingFlow',
  component: OnboardingSteps,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const OnboardingFlow: Story = {
  render: () => <OnboardingSteps />,
}

export const OnboardingComplete: Story = {
  render: () => (
    <OnboardingComplete
      selectedMoodboards={['minimal', 'cottagecore', 'tech']}
      onRestart={() => console.log('Restart onboarding')}
    />
  ),
}

export const MoodboardSelection: Story = {
  render: () => (
    <div className="p-8 bg-sand min-h-screen">
      <MoodboardSelection
        moodboards={MOODBOARDS.slice(0, 8)}
        selectedIds={['minimal', 'cottagecore']}
        onToggle={(id) => console.log('Toggle moodboard:', id)}
        validation={{
          isValid: true,
          canSelectMore: true,
          needsMore: false,
          count: 2,
          min: 2,
          max: 4,
        }}
      />
    </div>
  ),
}
