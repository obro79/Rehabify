'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OrganicBlob } from '@/components/ui/organic-blob';
import { GradientMesh } from '@/components/ui/gradient-mesh';
import { authClient } from '@/lib/auth/client';
import { clientEnv } from '@/lib/env';

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
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

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-redirect to dashboard in demo mode
  useEffect(() => {
    if (isMounted && clientEnv.NEXT_PUBLIC_DEMO_MODE) {
      router.push('/dashboard');
    }
  }, [router, isMounted]);

  function validateForm(): boolean {
    const newErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
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
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setErrors({ form: result.error.message || 'Failed to sign in' });
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to continue your rehabilitation journey
            </p>
          </div>

          {errors.form && (
            <div className="p-4 rounded-xl bg-coral-50 border border-coral-200">
              <p className="text-sm text-coral-700 font-medium">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validateForm}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                autoComplete="current-password"
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-coral-600" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="text-right">
              <Link
                href="#"
                className="text-sm text-sage-600 hover:text-sage-700 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset functionality coming soon!');
                }}
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="terracotta" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-sage-600 font-medium hover:text-sage-700 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-sage-50 via-sage-100 to-terracotta-50 overflow-hidden">
        <GradientMesh variant="mixed" intensity={0.4} position="center" />
        <OrganicBlob size={400} color="sage" position={{ top: '10%', right: '10%' }} variant={0} />
        <OrganicBlob
          size={300}
          color="terracotta"
          position={{ bottom: '15%', left: '15%' }}
          variant={2}
        />
        <div className="relative z-10 text-center px-12">
          <h2 className="text-4xl font-bold text-sage-800 mb-4">Your Recovery Journey</h2>
          <p className="text-lg text-sage-600 max-w-md">
            AI-powered guidance for personalized rehabilitation exercises with real-time form
            feedback.
          </p>
        </div>
      </div>
    </div>
  );
}
