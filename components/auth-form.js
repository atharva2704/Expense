'use client';

import React, { useState } from 'react';
import { Button, Card, Input } from './ui';
import { api } from './api';
import { useRouter } from 'next/navigation';

export function AuthForm({ mode = 'login' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      await api(path, { method: 'POST', body: form });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{mode === 'login' ? 'Sign in to your private tracker.' : 'Start a private workspace for your own records.'}</p>
        </div>

        {mode !== 'login' ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" />
        </div>

        {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</div> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
    </Card>
  );
}
