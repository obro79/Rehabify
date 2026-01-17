import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  describe('rendering', () => {
    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders as an input element', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input.tagName).toBe('INPUT')
    })

    it('applies custom className', () => {
      render(<Input data-testid="input" className="custom-class" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('controlled behavior', () => {
    it('displays controlled value', () => {
      render(<Input value="test value" onChange={() => {}} />)
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
    })

    it('calls onChange when value changes', () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'new value' } })

      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('updates display when controlled value changes', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />)
      expect(screen.getByDisplayValue('initial')).toBeInTheDocument()

      rerender(<Input value="updated" onChange={() => {}} />)
      expect(screen.getByDisplayValue('updated')).toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('has disabled attribute when disabled', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('applies disabled styling', () => {
      render(<Input data-testid="input" disabled />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('input types', () => {
    it('defaults to text input behavior', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('renders password type', () => {
      render(<Input type="password" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders email type', () => {
      render(<Input type="email" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders number type', () => {
      render(<Input type="number" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'number')
    })
  })

  describe('icon', () => {
    it('renders with icon', () => {
      render(<Input icon={<span data-testid="icon">*</span>} />)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('adds padding for icon', () => {
      render(<Input data-testid="input" icon={<span>*</span>} />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('ps-10')
    })
  })

  describe('error state', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('sets aria-invalid when error exists', () => {
      render(<Input data-testid="input" error="Error" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('sets aria-describedby when error exists', () => {
      render(<Input data-testid="input" error="Error" />)
      const input = screen.getByTestId('input')
      const errorId = input.getAttribute('aria-describedby')
      expect(errorId).toBeTruthy()
      expect(document.getElementById(errorId!)).toHaveTextContent('Error')
    })

    it('applies error styling', () => {
      render(<Input data-testid="input" error="Error" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-red-500')
    })

    it('error message has correct styling', () => {
      render(<Input error="Error message" />)
      const errorElement = screen.getByText('Error message')
      expect(errorElement).toHaveClass('text-red-600', 'text-sm')
    })
  })

  describe('accessibility', () => {
    it('can have custom id', () => {
      render(<Input id="custom-id" />)
      expect(document.getElementById('custom-id')).toBeInTheDocument()
    })

    it('generates unique id when not provided', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input.id).toBeTruthy()
    })

    it('can have aria-label', () => {
      render(<Input aria-label="Email address" />)
      expect(screen.getByRole('textbox', { name: 'Email address' })).toBeInTheDocument()
    })

    it('supports required attribute', () => {
      render(<Input required data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toBeRequired()
    })

    it('supports readOnly attribute', () => {
      render(<Input readOnly data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('readonly')
    })
  })

  describe('focus behavior', () => {
    it('can receive focus', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      input.focus()
      expect(input).toHaveFocus()
    })

    it('can be focused programmatically', () => {
      render(<Input autoFocus data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveFocus()
    })
  })

  describe('styling', () => {
    it('has rounded corners', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('rounded-3xl')
    })

    it('has consistent height', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('h-11')
    })

    it('has full width', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('w-full')
    })
  })
})
