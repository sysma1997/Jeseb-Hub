import { render, screen } from '@testing-library/react';
import Form from "../Form.astro";
import { describe, it, expect } from 'vitest';

describe('Form Component', () => {
  it('renders the form correctly', () => {
    render(<Form />);
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
});