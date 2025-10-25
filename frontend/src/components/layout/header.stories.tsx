import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './header'

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
  },
}

export const WithUser: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?u=1',
    },
  },
}

export const WithoutSearch: Story = {
  args: {},
}

export const LoggedOut: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
    user: undefined,
  },
}
