import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'შენახვა' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: (
      <>
        <Icon name="trash" size={18} /> ანგარიშის წაშლა
      </>
    ),
  },
};
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const FullWidth: Story = { args: { fullWidth: true } };
