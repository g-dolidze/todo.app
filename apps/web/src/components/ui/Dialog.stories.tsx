import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { PasswordField } from './TextField';

const meta = {
  title: 'UI/Dialog',
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          ანგარიშის წაშლა
        </Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="ნამდვილად გინდა ანგარიშის წაშლა?"
          description="ამ მოქმედების გაუქმება შეუძლებელია. დასადასტურებლად შეიყვანე პაროლი."
        >
          <div className="space-y-5">
            <PasswordField label="პაროლი" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                გაუქმება
              </Button>
              <Button variant="danger">სამუდამოდ წაშლა</Button>
            </div>
          </div>
        </Dialog>
      </>
    );
  },
} satisfies Meta;
export default meta;

export const ConfirmDelete: StoryObj = {};
