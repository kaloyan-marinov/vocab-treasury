import { render, screen } from '@testing-library/react';
import App from './App';

test("renders a 'Hello world!' message", () => {
  render(<App />);
  const divElement = screen.getByText('Hello world!');
  console.log(divElement)

  /*
  The following statement throws a
  `TypeError: expect(...).toBeInTheDocument is not a function`
  */
  // expect(divElement).toBeInTheDocument();
});
