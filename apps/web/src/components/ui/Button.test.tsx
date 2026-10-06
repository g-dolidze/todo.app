import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('is disabled and marked busy while loading', () => {
    render(<Button loading>შენახვა</Button>);
    const button = screen.getByRole('button', { name: 'შენახვა' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
