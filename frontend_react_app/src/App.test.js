import { render, screen } from '@testing-library/react';
import App from './App';

test('renders status text', () => {
  render(<App />);
  const status = screen.getByText(/Status:/i);
  expect(status).toBeInTheDocument();
});
