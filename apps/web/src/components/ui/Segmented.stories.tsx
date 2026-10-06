import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Segmented } from './Segmented';

const meta = {
  title: 'UI/Segmented',
  render: function Render() {
    const [value, setValue] = useState<'LIGHT' | 'DARK' | 'SYSTEM'>('LIGHT');
    return (
      <div className="max-w-sm">
        <Segmented
          legend="თემა"
          value={value}
          onChange={setValue}
          options={[
            { value: 'LIGHT', label: 'ღია', icon: 'sun' },
            { value: 'DARK', label: 'მუქი', icon: 'moon' },
            { value: 'SYSTEM', label: 'სისტემური', icon: 'monitor' },
          ]}
        />
      </div>
    );
  },
} satisfies Meta;
export default meta;

export const ThemePicker: StoryObj = {};
