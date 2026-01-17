import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VoiceIndicator, VoiceState } from '@/components/ui/voice-indicator'

describe('VoiceIndicator', () => {
  describe('state rendering', () => {
    it('renders idle state', () => {
      render(<VoiceIndicator state="idle" />)
      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    it('renders connecting state', () => {
      render(<VoiceIndicator state="connecting" />)
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('renders listening state', () => {
      render(<VoiceIndicator state="listening" />)
      expect(screen.getByText('Listening...')).toBeInTheDocument()
    })

    it('renders thinking state', () => {
      render(<VoiceIndicator state="thinking" />)
      expect(screen.getByText('Thinking...')).toBeInTheDocument()
    })

    it('renders speaking state', () => {
      render(<VoiceIndicator state="speaking" />)
      expect(screen.getByText('Speaking...')).toBeInTheDocument()
    })
  })

  describe('accessibility labels', () => {
    const states: VoiceState[] = ['idle', 'connecting', 'listening', 'thinking', 'speaking']
    const expectedLabels: Record<VoiceState, string> = {
      idle: 'Offline',
      connecting: 'Connecting...',
      listening: 'Listening...',
      thinking: 'Thinking...',
      speaking: 'Speaking...',
    }

    states.forEach(state => {
      it(`has accessible label for ${state} state`, () => {
        render(<VoiceIndicator state={state} />)
        expect(screen.getByText(expectedLabels[state])).toBeInTheDocument()
      })
    })

    it('hides label when showLabel is false', () => {
      render(<VoiceIndicator state="idle" showLabel={false} />)
      expect(screen.queryByText('Offline')).not.toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders small size', () => {
      const { container } = render(<VoiceIndicator state="idle" size="sm" />)
      const outerDiv = container.querySelector('[style*="width: 56px"]')
      expect(outerDiv).toBeInTheDocument()
    })

    it('renders medium size by default', () => {
      const { container } = render(<VoiceIndicator state="idle" />)
      const outerDiv = container.querySelector('[style*="width: 96px"]')
      expect(outerDiv).toBeInTheDocument()
    })

    it('renders large size', () => {
      const { container } = render(<VoiceIndicator state="idle" size="lg" />)
      const outerDiv = container.querySelector('[style*="width: 140px"]')
      expect(outerDiv).toBeInTheDocument()
    })

    it('applies correct font size for label in small size', () => {
      render(<VoiceIndicator state="idle" size="sm" />)
      const label = screen.getByText('Offline')
      expect(label).toHaveClass('text-[10px]')
    })

    it('applies correct font size for label in medium size', () => {
      render(<VoiceIndicator state="idle" size="md" />)
      const label = screen.getByText('Offline')
      expect(label).toHaveClass('text-xs')
    })

    it('applies correct font size for label in large size', () => {
      render(<VoiceIndicator state="idle" size="lg" />)
      const label = screen.getByText('Offline')
      expect(label).toHaveClass('text-sm')
    })
  })

  describe('visual state indicators', () => {
    it('shows audio bars when speaking', () => {
      const { container } = render(<VoiceIndicator state="speaking" />)
      const audioBars = container.querySelectorAll('.animate-\\[wave-bar_0\\.5s_ease-in-out_infinite\\]')
      expect(audioBars.length).toBe(7)
    })

    it('shows bouncing dots when thinking', () => {
      const { container } = render(<VoiceIndicator state="thinking" />)
      const dots = container.querySelectorAll('.animate-\\[bounce-dot_1s_ease-in-out_infinite\\]')
      expect(dots.length).toBe(3)
    })

    it('shows expanding rings when listening', () => {
      const { container } = render(<VoiceIndicator state="listening" />)
      const rings = container.querySelectorAll('.animate-\\[listening-ring_2s_ease-out_infinite\\]')
      expect(rings.length).toBeGreaterThan(0)
    })

    it('does not show special indicators when idle', () => {
      const { container } = render(<VoiceIndicator state="idle" />)
      const audioBars = container.querySelectorAll('.animate-\\[wave-bar_0\\.5s_ease-in-out_infinite\\]')
      const dots = container.querySelectorAll('.animate-\\[bounce-dot_1s_ease-in-out_infinite\\]')
      const rings = container.querySelectorAll('.animate-\\[listening-ring_2s_ease-out_infinite\\]')
      expect(audioBars.length).toBe(0)
      expect(dots.length).toBe(0)
      expect(rings.length).toBe(0)
    })
  })

  describe('label colors', () => {
    it('applies muted color for idle state', () => {
      render(<VoiceIndicator state="idle" />)
      const label = screen.getByText('Offline')
      expect(label).toHaveClass('text-muted-foreground')
    })

    it('applies sage color for listening state', () => {
      render(<VoiceIndicator state="listening" />)
      const label = screen.getByText('Listening...')
      expect(label).toHaveClass('text-sage-500')
    })

    it('applies coral color for speaking state', () => {
      render(<VoiceIndicator state="speaking" />)
      const label = screen.getByText('Speaking...')
      expect(label).toHaveClass('text-coral-500')
    })
  })

  describe('custom props', () => {
    it('applies custom className', () => {
      const { container } = render(<VoiceIndicator state="idle" className="custom-class" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-class')
    })
  })

  describe('active state glow', () => {
    it('shows glow effect when active (not idle)', () => {
      const { container } = render(<VoiceIndicator state="listening" />)
      const glowElement = container.querySelector('.blur-md')
      expect(glowElement).toBeInTheDocument()
    })

    it('does not show glow effect when idle', () => {
      const { container } = render(<VoiceIndicator state="idle" />)
      const glowElement = container.querySelector('.blur-md')
      expect(glowElement).not.toBeInTheDocument()
    })
  })
})
