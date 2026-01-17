import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProgressRing } from '@/components/ui/progress-ring'

describe('ProgressRing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders as a progressbar', () => {
      render(<ProgressRing value={50} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('sets correct aria attributes', () => {
      render(<ProgressRing value={75} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '75')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('score display', () => {
    it('displays value by default', () => {
      render(<ProgressRing value={50} />)

      act(() => {
        vi.advanceTimersByTime(1100)
      })

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('hides value when showValue is false', () => {
      render(<ProgressRing value={50} showValue={false} />)

      act(() => {
        vi.advanceTimersByTime(1100)
      })

      expect(screen.queryByText('50%')).not.toBeInTheDocument()
    })

    it('displays custom children instead of value', () => {
      render(<ProgressRing value={50}><span>Custom</span></ProgressRing>)
      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.queryByText('50%')).not.toBeInTheDocument()
    })

    it('animates value from 0 to target', () => {
      render(<ProgressRing value={100} />)

      expect(screen.getByText('0%')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(500)
      })

      const valueElement = screen.getByText(/%$/)
      const currentValue = parseInt(valueElement.textContent || '0')
      expect(currentValue).toBeGreaterThan(0)
      expect(currentValue).toBeLessThanOrEqual(100)

      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders default size with correct dimensions', () => {
      const { container } = render(<ProgressRing value={50} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '80px', height: '80px' })
    })

    it('renders small size with correct dimensions', () => {
      const { container } = render(<ProgressRing value={50} size="sm" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '48px', height: '48px' })
    })

    it('renders large size with correct dimensions', () => {
      const { container } = render(<ProgressRing value={50} size="lg" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '120px', height: '120px' })
    })

    it('applies correct font size for default size', () => {
      render(<ProgressRing value={50} />)

      act(() => {
        vi.advanceTimersByTime(1100)
      })

      const valueElement = screen.getByText('50%')
      expect(valueElement).toHaveClass('text-lg')
    })

    it('applies correct font size for small size', () => {
      render(<ProgressRing value={50} size="sm" />)

      act(() => {
        vi.advanceTimersByTime(1100)
      })

      const valueElement = screen.getByText('50%')
      expect(valueElement).toHaveClass('text-xs')
    })

    it('applies correct font size for large size', () => {
      render(<ProgressRing value={50} size="lg" />)

      act(() => {
        vi.advanceTimersByTime(1100)
      })

      const valueElement = screen.getByText('50%')
      expect(valueElement).toHaveClass('text-2xl')
    })
  })

  describe('colors', () => {
    it('uses sage color by default', () => {
      const { container } = render(<ProgressRing value={50} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('accepts coral color variant', () => {
      const { container } = render(<ProgressRing value={50} color="coral" />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('custom props', () => {
    it('applies custom className', () => {
      const { container } = render(<ProgressRing value={50} className="custom-class" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-class')
    })

    it('accepts custom strokeWidth', () => {
      const { container } = render(<ProgressRing value={50} strokeWidth={12} />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(2)
      circles.forEach(circle => {
        expect(circle).toHaveAttribute('stroke-width', '12')
      })
    })
  })

  describe('edge cases', () => {
    it('handles 0% value', () => {
      render(<ProgressRing value={0} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    })

    it('handles 100% value', () => {
      render(<ProgressRing value={100} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    })
  })
})
