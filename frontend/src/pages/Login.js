import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../components/RouteGuards';
import { Card, Input, Button } from '../components/ui';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(dashboardPath(data.user));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Log in</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back to PlaceIQ.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-600">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
