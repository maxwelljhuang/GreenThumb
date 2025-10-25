import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Button } from './button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This is where you would put the main content of your card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const Simple: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent className="p-6">
        <p>Simple card with just content</p>
      </CardContent>
    </Card>
  ),
}

export const WithImage: Story = {
  render: () => (
    <Card className="w-80 overflow-hidden">
      <div className="aspect-video bg-sage/20" />
      <CardHeader>
        <CardTitle>Card with Image</CardTitle>
        <CardDescription>This card has an image placeholder</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content below the image</p>
      </CardContent>
    </Card>
  ),
}

export const ProductCard: Story = {
  render: () => (
    <Card className="w-80">
      <div className="aspect-square bg-sage/20 rounded-t-2xl" />
      <CardHeader>
        <CardTitle>Product Name</CardTitle>
        <CardDescription>$29.99</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Product description goes here</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Save</Button>
        <Button>Buy Now</Button>
      </CardFooter>
    </Card>
  ),
}
