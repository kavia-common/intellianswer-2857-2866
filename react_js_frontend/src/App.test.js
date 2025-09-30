import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Ocean Q&A brand', () => {
  render(<App />);
  const brand = screen.getByText(/Ocean Q&A/i);
  expect(brand).toBeInTheDocument();
});
