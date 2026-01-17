'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { OrganicBlob } from '@/components/ui/organic-blob';
import { GradientMesh } from '@/components/ui/gradient-mesh';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth/client';
import { clientEnv } from '@/lib/env';

type PasswordStrength = 'weak' | 'medium' | 'strong';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  form?: string;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';

  let score = 0;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score >= 3) return 'strong';
  if (score >= 1) return 'medium';
  return 'weak';
}

function PasswordStrengthIndicator({ strength }: { strength: PasswordStrength }): React.JSX.Element {
  const config = {
    weak: { label: 'Weak', color: 'bg-coral-500', width: 'w-1/3' },
    medium: { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' },
    strong: { label: 'Strong', color: 'bg-sage-500', width: 'w-full' },
  }[strength];

  return (
    <div className="space-y-1">
      <div className="flex gap-1 h-1">
        <div className={cn('h-full rounded-full transition-all', config.color, config.width)} />
        {strength !== 'strong' && <div className="flex-1 h-full rounded-full bg-sage-100" />}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{config.label}</span>
      </p>
    </div>
  );
}

function validateEmail(email: string): string | undefined {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  // Auto-redirect to dashboard in demo mode
  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
      router.push('/dashboard');
    }
  }, [router]);

  function validateForm(): boolean {
    const newErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: !confirmPassword
        ? 'Please confirm your password'
        : password !== confirmPassword
          ? 'Passwords do not match'
          : undefined,
      terms: !agreedToTerms ? 'You must agree to the terms and privacy policy' : undefined,
    };
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, v]) => v !== undefined)
    ) as FormErrors;
    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    // Skip auth in demo mode
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
      router.push('/dashboard');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
      });
      if (result.error) {
        setErrors({ form: result.error.message || 'Failed to create account' });
        return;
      }
      router.push('/dashboard');
    } catch {
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Logo size="lg" className="mx-auto mb-6" />
            <h1 className="text-3xl font-bold tracking-tight">Create Your Account</h1>
            <p className="text-muted-foreground mt-2">
              Start your personalized rehabilitation journey
            </p>
          </div>

          {errors.form && (
            <div className="p-4 rounded-xl bg-coral-50 border border-coral-200">
              <p className="text-sm text-coral-700 font-medium">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateForm}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-coral-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validateForm}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                autoComplete="new-password"
              />
              {password && <PasswordStrengthIndicator strength={passwordStrength} />}
              {errors.password && (
                <p id="password-error" className="text-sm text-coral-600" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" required>
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={validateForm}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-coral-600" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                label={
                  <span className="text-sm">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-sage-600 hover:text-sage-700 hover:underline"
                    >
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-sage-600 hover:text-sage-700 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                }
                aria-invalid={!!errors.terms}
                aria-describedby={errors.terms ? 'terms-error' : undefined}
              />
              {errors.terms && (
                <p id="terms-error" className="text-sm text-coral-600" role="alert">
                  {errors.terms}
                </p>
              )}
            </div>

            <Button type="submit" variant="terracotta" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-sage-600 font-medium hover:text-sage-700 hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-terracotta-50 via-sage-50 to-sage-100 overflow-hidden">
        <GradientMesh variant="mixed" intensity={0.4} position="center" />
        <OrganicBlob size={350} color="terracotta" position={{ top: '15%', left: '10%' }} variant={1} />
        <OrganicBlob size={300} color="sage" position={{ bottom: '10%', right: '15%' }} variant={3} />
        <div className="relative z-10 text-center px-12">
          <h2 className="text-4xl font-bold text-sage-800 mb-4">Begin Your Healing</h2>
          <p className="text-lg text-sage-600 max-w-md">
            Join thousands recovering smarter with personalized exercise plans and real-time AI
            coaching.
          </p>
        </div>
      </div>
    </div>
  );
}
