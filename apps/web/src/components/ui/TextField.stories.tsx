import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordField, TextField } from './TextField';

const meta = {
  title: 'UI/TextField',
  component: TextField,
  args: { label: 'ელფოსტა', type: 'email', placeholder: 'name@example.com' },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = {
  args: { label: 'პაროლი', type: 'password', hint: 'მინიმუმ 8 სიმბოლო, ერთი ასო და ერთი ციფრი.' },
};
/** `error` is a translation key under `validation.`. */
export const WithError: Story = { args: { error: 'email.invalid', defaultValue: 'nope' } };
export const Disabled: Story = {
  args: { disabled: true, value: 'giorgi@example.com', readOnly: true },
};
export const Password: StoryObj<typeof PasswordField> = {
  render: () => <PasswordField label="პაროლი" defaultValue="secret123" />,
};
