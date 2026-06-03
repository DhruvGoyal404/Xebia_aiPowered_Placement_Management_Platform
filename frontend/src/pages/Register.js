import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Card, Input, Textarea, Button } from '../components/ui';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    branch: '',
    graduationYear: '',
    cgpa: '',
    skills: '',
    resumeText: '',
    profilePicFile: null,
  });
  const [preview, setPreview] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return toast.error('Please choose an image file');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5MB');
    }
    setForm({ ...form, profilePicFile: file });
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    try {
      // Send skills as an array; the backend also accepts a comma string.
      const payload = {
        ...form,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await register(payload);
      toast.success('Registration submitted! Awaiting admin approval.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-12">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Register as a student. The placement cell approves you before first login.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Username" name="username" value={form.username} onChange={onChange} placeholder="dhruv" required />
            <Input label="Phone" name="phone" value={form.phone} onChange={onChange} placeholder="9876543210" required />
          </div>
          <Input label="Email" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
          <Input label="Password" type="password" name="password" value={form.password} onChange={onChange} placeholder="At least 6 characters" required />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Branch" name="branch" value={form.branch} onChange={onChange} placeholder="CSE" />
            <Input label="Grad year" type="number" name="graduationYear" value={form.graduationYear} onChange={onChange} placeholder="2026" />
            <Input label="CGPA" type="number" step="0.01" name="cgpa" value={form.cgpa} onChange={onChange} placeholder="8.2" />
          </div>

          <Input
            label="Skills (comma separated)"
            name="skills"
            value={form.skills}
            onChange={onChange}
            placeholder="JavaScript, React, Node.js, MongoDB"
          />
          <Textarea
            label="Resume summary (optional — used for AI feedback)"
            name="resumeText"
            rows={3}
            value={form.resumeText}
            onChange={onChange}
            placeholder="Paste a short resume / project summary…"
          />

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Profile picture (optional)
            </span>
            <div className="flex items-center gap-3">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-100"
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  📷
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onFile}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:text-slate-400 dark:file:bg-brand-500/20 dark:file:text-brand-400"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting…' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
