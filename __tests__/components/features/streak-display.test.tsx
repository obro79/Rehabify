import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StreakDisplay } from '@/components/ui/streak-display'

describe('StreakDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-09T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('current streak display', () => {
    it('displays current streak number', () => {
      render(<StreakDisplay currentStreak={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays singular "day" for streak of 1', () => {
      render(<StreakDisplay currentStreak={1} />)
      expect(screen.getByText('day')).toBeInTheDocument()
      expect(screen.queryByText('days')).not.toBeInTheDocument()
    })

    it('displays plural "days" for streak greater than 1', () => {
      render(<StreakDisplay currentStreak={5} />)
      expect(screen.getByText('days')).toBeInTheDocument()
    })

    it('displays plural "days" for streak of 0', () => {
      render(<StreakDisplay currentStreak={0} />)
      expect(screen.getByText('days')).toBeInTheDocument()
    })
  })

  describe('best streak display', () => {
    it('shows best streak when greater than current', () => {
      render(<StreakDisplay currentStreak={3} bestStreak={10} />)
      expect(screen.getByText('Best: 10 days')).toBeInTheDocument()
    })

    it('hides best streak when equal to current', () => {
      render(<StreakDisplay currentStreak={10} bestStreak={10} />)
      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument()
    })

    it('hides best streak when less than current', () => {
      render(<StreakDisplay currentStreak={10} bestStreak={5} />)
      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument()
    })

    it('hides best streak when undefined', () => {
      render(<StreakDisplay currentStreak={5} />)
      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument()
    })
  })

  describe('fire animation', () => {
    it('shows filled flame when streak is active', () => {
      const { container } = render(<StreakDisplay currentStreak={5} />)
      const flame = container.querySelector('svg')
      expect(flame).toHaveClass('text-coral-500')
      expect(flame).toHaveAttribute('fill', 'currentColor')
    })

    it('shows unfilled flame when streak is zero', () => {
      const { container } = render(<StreakDisplay currentStreak={0} />)
      const flame = container.querySelector('svg')
      expect(flame).toHaveClass('text-muted-foreground')
      expect(flame).toHaveAttribute('fill', 'none')
    })

    it('shows pulse animation for active streak', () => {
      const { container } = render(<StreakDisplay currentStreak={5} />)
      const flame = container.querySelector('svg')
      expect(flame).toHaveClass('motion-safe:animate-pulse-flame')
    })

    it('does not show pulse animation for zero streak', () => {
      const { container } = render(<StreakDisplay currentStreak={0} />)
      const flame = container.querySelector('svg')
      expect(flame).not.toHaveClass('motion-safe:animate-pulse-flame')
    })
  })

  describe('streak at risk warning', () => {
    it('shows warning when last active over 20 hours ago', () => {
      const twentyOneHoursAgo = new Date('2025-01-08T14:00:00Z')
      render(<StreakDisplay currentStreak={5} lastActiveDate={twentyOneHoursAgo} />)
      expect(screen.getByText("Don't lose your streak!")).toBeInTheDocument()
    })

    it('does not show warning when last active less than 20 hours ago', () => {
      const tenHoursAgo = new Date('2025-01-09T02:00:00Z')
      render(<StreakDisplay currentStreak={5} lastActiveDate={tenHoursAgo} />)
      expect(screen.queryByText("Don't lose your streak!")).not.toBeInTheDocument()
    })

    it('shows pulsing flame when at risk', () => {
      const twentyOneHoursAgo = new Date('2025-01-08T14:00:00Z')
      const { container } = render(<StreakDisplay currentStreak={5} lastActiveDate={twentyOneHoursAgo} />)
      const flame = container.querySelector('svg')
      expect(flame).toHaveClass('animate-pulse')
      expect(flame).toHaveClass('text-coral-400')
    })

    it('does not show warning when lastActiveDate is undefined', () => {
      render(<StreakDisplay currentStreak={5} />)
      expect(screen.queryByText("Don't lose your streak!")).not.toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders default size', () => {
      render(<StreakDisplay currentStreak={5} />)
      const streakNumber = screen.getByText('5')
      expect(streakNumber).toHaveClass('text-3xl')
    })

    it('renders small size', () => {
      render(<StreakDisplay currentStreak={5} size="sm" />)
      const streakNumber = screen.getByText('5')
      expect(streakNumber).toHaveClass('text-xl')
    })

    it('renders large size', () => {
      render(<StreakDisplay currentStreak={5} size="lg" />)
      const streakNumber = screen.getByText('5')
      expect(streakNumber).toHaveClass('text-5xl')
    })
  })

  describe('custom props', () => {
    it('applies custom className', () => {
      render(<StreakDisplay currentStreak={5} className="custom-class" data-testid="streak" />)
      const container = screen.getByTestId('streak')
      expect(container).toHaveClass('custom-class')
    })

    it('passes through data attributes', () => {
      render(<StreakDisplay currentStreak={5} data-testid="my-streak" />)
      expect(screen.getByTestId('my-streak')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles zero streak', () => {
      render(<StreakDisplay currentStreak={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles very large streak', () => {
      render(<StreakDisplay currentStreak={365} />)
      expect(screen.getByText('365')).toBeInTheDocument()
    })
  })
})
