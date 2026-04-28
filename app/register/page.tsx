'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Eye, Lock, Mail, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { register, saveSession } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await register(name, email, password);
      saveSession(session);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1fr_520px]">
      <section className="hidden lg:flex flex-col justify-between border-r border-border p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">VolunteerIQ</h1>
            <p className="text-sm text-muted-foreground">Volunteer Ops</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary mb-3">New Coordinator</p>
          <h2 className="text-5xl font-bold leading-tight mb-5">Create your operations account.</h2>
          <p className="text-lg text-muted-foreground">
            Register a demo coordinator profile and continue directly into the dashboard.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">Use any email and a password with at least 6 characters.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-card/50 border-border p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Register</h2>
            <p className="text-sm text-muted-foreground">Create a coordinator account for this prototype.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="pl-9 bg-input border-border"
                  placeholder="Team coordinator"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9 bg-input border-border"
                  placeholder="coordinator@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-9 bg-input border-border"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/" className="text-muted-foreground hover:text-primary">
              Continue to demo
            </Link>
            <Link href="/login" className="text-primary hover:underline">
              Login instead
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
