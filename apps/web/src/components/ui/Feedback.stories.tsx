import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { FormAlert } from './FormAlert';
import { useToast } from './Toast';

const meta = { title: 'UI/Feedback' } satisfies Meta;
export default meta;

export const Alert: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <FormAlert>ელფოსტა ან პაროლი არასწორია.</FormAlert>
    </div>
  ),
};

export const Toasts: StoryObj = {
  render: function Render() {
    const toast = useToast();
    return (
      <div className="flex gap-3">
        <Button onClick={() => toast('ცვლილებები შენახულია.')}>Success toast</Button>
        <Button variant="secondary" onClick={() => toast('რაღაც შეცდომა მოხდა.', 'error')}>
          Error toast
        </Button>
      </div>
    );
  },
};
