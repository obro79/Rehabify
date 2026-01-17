import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RepCounter } from '@/components/ui/rep-counter'

describe('RepCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('displays current count correctly', () => {
      render(<RepCounter current={5} target={10} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays target count correctly', () => {
      render(<RepCounter current={5} target={10} />)
      expect(screen.getByText('/ 10')).toBeInTheDocument()
    })

    it('displays reps label when not complete', () => {
      render(<RepCounter current={5} target={10} />)
      expect(screen.getByText('reps')).toBeInTheDocument()
    })

    it('displays completion state when current equals target', () => {
      render(<RepCounter current={10} target={10} />)
      expect(screen.getByText('Complete!')).toBeInTheDocument()
    })

    it('displays completion state when current exceeds target', () => {
      render(<RepCounter current={12} target={10} />)
      expect(screen.getByText('Complete!')).toBeInTheDocument()
    })

    it('hides reps label when complete', () => {
      render(<RepCounter current={10} target={10} />)
      expect(screen.queryByText('reps')).not.toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders default size', () => {
      render(<RepCounter current={5} target={10} data-testid="counter" />)
      const currentText = screen.getByText('5')
      expect(currentText).toHaveClass('text-2xl')
    })

    it('renders small size', () => {
      render(<RepCounter current={5} target={10} size="sm" data-testid="counter" />)
      const currentText = screen.getByText('5')
      expect(currentText).toHaveClass('text-lg')
    })

    it('renders large size', () => {
      render(<RepCounter current={5} target={10} size="lg" data-testid="counter" />)
      const currentText = screen.getByText('5')
      expect(currentText).toHaveClass('text-4xl')
    })
  })

  describe('animation on change', () => {
    it('triggers pulse animation when count increases', () => {
      const { rerender } = render(<RepCounter current={5} target={10} />)

      rerender(<RepCounter current={6} target={10} />)

      const currentText = screen.getByText('6')
      expect(currentText).toHaveClass('animate-[pulse-scale_0.3s_ease-out]')
    })

    it('removes pulse animation after timeout', () => {
      const { rerender } = render(<RepCounter current={5} target={10} />)

      rerender(<RepCounter current={6} target={10} />)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      const currentText = screen.getByText('6')
      expect(currentText).not.toHaveClass('animate-[pulse-scale_0.3s_ease-out]')
    })

    it('does not animate when count stays the same', () => {
      const { rerender } = render(<RepCounter current={5} target={10} />)

      rerender(<RepCounter current={5} target={10} />)

      const currentText = screen.getByText('5')
      expect(currentText).not.toHaveClass('animate-[pulse-scale_0.3s_ease-out]')
    })

    it('does not animate when count decreases', () => {
      const { rerender } = render(<RepCounter current={5} target={10} />)

      rerender(<RepCounter current={4} target={10} />)

      const currentText = screen.getByText('4')
      expect(currentText).not.toHaveClass('animate-[pulse-scale_0.3s_ease-out]')
    })
  })

  describe('custom props', () => {
    it('applies custom className', () => {
      render(<RepCounter current={5} target={10} className="custom-class" data-testid="counter" />)
      const counter = screen.getByTestId('counter')
      expect(counter).toHaveClass('custom-class')
    })

    it('passes through data attributes', () => {
      render(<RepCounter current={5} target={10} data-testid="my-counter" />)
      expect(screen.getByTestId('my-counter')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles zero count', () => {
      render(<RepCounter current={0} target={10} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles zero target with zero current', () => {
      render(<RepCounter current={0} target={0} />)
      expect(screen.getByText('Complete!')).toBeInTheDocument()
    })
  })
})
