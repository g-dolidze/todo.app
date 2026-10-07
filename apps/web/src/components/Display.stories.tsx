import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { ProgressRing } from './ProgressRing';

const meta = { title: 'Display' } satisfies Meta;
export default meta;

const user = { firstName: 'Giorgi', lastName: 'Dolidze', avatar: null };

export const Avatars: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar user={null} />
      <Avatar user={user} />
      <Avatar user={{ ...user, avatar: 'leaf' }} />
      <Avatar user={user} size="md" />
      <Avatar user={{ ...user, avatar: 'dumbbell' }} size="lg" />
    </div>
  ),
};

export const ProgressRings: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {[0, 40, 100].map((value) => (
        <ProgressRing key={value} value={value} label={`${value}%`} />
      ))}
    </div>
  ),
};

export const EmptyStates: StoryObj = {
  render: () => (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <EmptyState
          icon="habits"
          title="დღეს დავალება არ გაქვს"
          text="დაამატე ჩვევა — მაგ. ვარჯიში, კითხვა ან რაიმე ახლის სწავლა."
          comingSoon
        />
      </Card>
      <Card>
        <EmptyState
          icon="missions"
          tone="mission"
          title="მისია ჯერ არ გაქვს"
          text="მისია არის მიზანი დასაწყისითა და დასასრულით."
        />
      </Card>
    </div>
  ),
};
