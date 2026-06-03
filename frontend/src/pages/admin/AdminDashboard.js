import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Pill,
  StatCard,
  Tabs,
  Empty,
  scoreTone,
  statusLabel,
} from '../../components/ui';

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [queue, setQueue] = useState([]);

  const load = useCallback(async () => {
    try {
      const [s, p, q] = await Promise.all([
        axios.get('/api/admin/dashboard-stats'),
        axios.get('/api/admin/pending-requests'),
        axios.get('/api/applications'),
      ]);
      setStats(s.data);
      setPending(p.data);
      setQueue(q.data);
    } catch {
      toast.error('Failed to load admin data');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openQueue = queue.filter((a) =>
    ['applied', 'shortlisted', 'interview'].includes(a.status)
  );

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'approvals', label: 'Approvals', count: pending.length },
    { key: 'drives', label: 'Drives' },
    { key: 'applications', label: 'Applications', count: openQueue.length },
    { key: 'students', label: 'Students' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Placement Cell Portal</h1>
          <p className="text-sm text-slate-500">
            Approve students, post drives, move applications through the pipeline.
          </p>
        </div>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && <Overview stats={stats} />}
      {tab === 'approvals' && <Approvals pending={pending} reload={load} />}
      {tab === 'drives' && <Drives />}
      {tab === 'applications' && <ReviewQueue queue={queue} reload={load} />}
      {tab === 'students' && <Students />}
    </div>
  );
};

const Overview = ({ stats }) => {
  if (!stats) return <div className="text-slate-400">Loading…</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Students" value={stats.totalStudents} />
      <StatCard label="Active" value={stats.activeStudents} accent="text-emerald-600" />
      <StatCard label="Placed" value={stats.placedStudents} accent="text-emerald-600" />
      <StatCard label="Placement rate" value={`${stats.placementRate}%`} accent="text-brand-600" />
      <StatCard label="Pending approvals" value={stats.pendingRequests} accent="text-amber-600" />
      <StatCard label="Drives" value={stats.totalDrives} />
      <StatCard label="Applications" value={stats.applications} accent="text-sky-600" />
      <StatCard label="Offers made" value={stats.offered} accent="text-emerald-600" />
    </div>
  );
};

const Approvals = ({ pending, reload }) => {
  const act = async (id, type) => {
    try {
      if (type === 'approve') {
        await axios.post(`/api/admin/approve-request/${id}`);
        toast.success('Student approved');
      } else {
        await axios.post(`/api/admin/reject-request/${id}`, {
          reason: 'Rejected by placement cell',
        });
        toast.success('Request rejected');
      }
      reload();
    } catch {
      toast.error('Action failed');
    }
  };

  if (!pending.length) return <Empty>No pending registrations 🎉</Empty>;
  return (
    <div className="space-y-3">
      {pending.map((r) => (
        <Card key={r._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{r.username}</p>
            <p className="text-sm text-slate-500">
              {r.email} · {r.phone}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="success" onClick={() => act(r._id, 'approve')}>
              Approve
            </Button>
            <Button variant="danger" onClick={() => act(r._id, 'reject')}>
              Reject
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

const emptyDrive = {
  company: '',
  role: '',
  description: '',
  requiredSkills: '',
  minCgpa: 7,
  eligibleBranches: '',
  ctc: '',
  location: 'Remote',
  type: 'full-time',
};

const Drives = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyDrive);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await axios.get('/api/drives');
    setList(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post('/api/drives', { ...form, minCgpa: Number(form.minCgpa) });
      toast.success('Drive posted');
      setForm(emptyDrive);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`/api/drives/${id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="p-5 lg:col-span-2">
        <h3 className="font-bold">Post a new drive</h3>
        <form onSubmit={create} className="mt-4 space-y-3">
          <Input label="Company" name="company" value={form.company} onChange={set} required />
          <Input label="Role" name="role" value={form.role} onChange={set} placeholder="Software Engineer" required />
          <Textarea label="Description" name="description" rows={3} value={form.description} onChange={set} required />
          <Input label="Required skills (comma separated)" name="requiredSkills" value={form.requiredSkills} onChange={set} placeholder="JavaScript, React, Node.js" />
          <Input label="Eligible branches (comma separated, blank = all)" name="eligibleBranches" value={form.eligibleBranches} onChange={set} placeholder="CSE, IT" />
          <div className="grid grid-cols-3 gap-2">
            <Input label="Min CGPA" type="number" step="0.1" name="minCgpa" value={form.minCgpa} onChange={set} />
            <Input label="CTC" name="ctc" value={form.ctc} onChange={set} placeholder="12 LPA" />
            <Input label="Location" name="location" value={form.location} onChange={set} />
          </div>
          <Select label="Type" name="type" value={form.type} onChange={set}>
            <option value="full-time">Full-time</option>
            <option value="internship">Internship</option>
          </Select>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Posting…' : 'Post drive'}
          </Button>
        </form>
      </Card>

      <div className="space-y-3 lg:col-span-3">
        {list.length ? (
          list.map((d) => (
            <Card key={d._id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="brand">{d.type}</Pill>
                  {d.ctc && <Pill tone="slate">{d.ctc}</Pill>}
                  <span className="text-xs text-slate-400">Min CGPA {d.minCgpa}</span>
                </div>
                <h4 className="mt-1 font-semibold">
                  {d.role} · {d.company}
                </h4>
                <p className="text-sm text-slate-500">{d.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Skills: {(d.requiredSkills || []).join(', ') || '—'} · Branches:{' '}
                  {(d.eligibleBranches || []).join(', ') || 'All'}
                </p>
              </div>
              <Button variant="danger" onClick={() => remove(d._id)}>
                Delete
              </Button>
            </Card>
          ))
        ) : (
          <Empty>No drives yet — post the first one.</Empty>
        )}
      </div>
    </div>
  );
};

const ReviewQueue = ({ queue, reload }) => {
  const [filter, setFilter] = useState('open');
  const shown = queue.filter((a) =>
    filter === 'open'
      ? ['applied', 'shortlisted', 'interview'].includes(a.status)
      : filter === 'all'
      ? true
      : a.status === filter
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['open', 'applied', 'shortlisted', 'interview', 'offered', 'rejected', 'all'].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {f}
            </button>
          )
        )}
      </div>
      {shown.length ? (
        shown.map((a) => <ReviewCard key={a._id} a={a} reload={reload} />)
      ) : (
        <Empty>Nothing here for this filter.</Empty>
      )}
    </div>
  );
};

const ReviewCard = ({ a, reload }) => {
  const [feedback, setFeedback] = useState(a.feedback || '');
  const [busy, setBusy] = useState(false);

  const review = async (action) => {
    setBusy(true);
    try {
      const res = await axios.patch(`/api/applications/${a._id}/review`, {
        action,
        feedback,
      });
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const done = ['offered', 'rejected'].includes(a.status);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {a.student?.username}{' '}
            <span className="text-sm font-normal text-slate-500">
              applied to {a.drive?.role} · {a.drive?.company}
            </span>
          </p>
          <p className="text-sm text-slate-500">
            {a.student?.branch} · CGPA {a.student?.cgpa} ·{' '}
            {(a.student?.skills || []).join(', ')}
          </p>
          {a.coverNote && (
            <p className="mt-1 text-sm text-slate-500">“{a.coverNote}”</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-xl font-bold ${scoreTone(a.matchScore)}`}>
              {a.matchScore}
            </span>
            <p className="text-[10px] uppercase text-slate-400">match</p>
          </div>
          <Pill tone={a.status}>{statusLabel(a.status)}</Pill>
        </div>
      </div>

      {a.matchBreakdown?.skillsMissing?.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          Missing skills: {a.matchBreakdown.skillsMissing.join(', ')}
        </p>
      )}

      {!done && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4 dark:border-slate-800">
          <div className="min-w-[200px] flex-1">
            <Input
              label="Feedback (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Notes for the student…"
            />
          </div>
          {a.status === 'applied' && (
            <Button variant="primary" disabled={busy} onClick={() => review('shortlist')}>
              Shortlist
            </Button>
          )}
          {['applied', 'shortlisted'].includes(a.status) && (
            <Button variant="ghost" disabled={busy} onClick={() => review('interview')}>
              → Interview
            </Button>
          )}
          <Button variant="success" disabled={busy} onClick={() => review('offer')}>
            Offer
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => review('reject')}>
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
};

const Students = () => {
  const [users, setUsers] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  const load = useCallback(async () => {
    const res = await axios.get('/api/admin/all-users');
    setUsers(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (id) => {
    try {
      await axios.post(`/api/admin/toggle-user-status/${id}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const students = users.filter((u) => u.role === 'student');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Students ({students.length})</h3>
        <Button variant="ghost" onClick={() => setShowAdmin((s) => !s)}>
          {showAdmin ? 'Close' : '+ Create admin'}
        </Button>
      </div>

      {showAdmin && <CreateAdmin onDone={() => setShowAdmin(false)} />}

      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {students.map((u) => (
          <div key={u._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-semibold">
                {u.username}{' '}
                {u.placementStatus === 'placed' && (
                  <Pill tone="offered">Placed</Pill>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {u.email} · {u.branch || '—'} · CGPA {u.cgpa || '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone={u.isActive ? 'offered' : 'rejected'}>
                {u.isActive ? 'Active' : 'Inactive'}
              </Pill>
              <Button variant="ghost" onClick={() => toggle(u._id)}>
                {u.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
        {!students.length && <div className="p-6"><Empty>No students yet.</Empty></div>}
      </Card>
    </div>
  );
};

const CreateAdmin = ({ onDone }) => {
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post('/api/admin/create-admin', form);
      toast.success('Admin created');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <h4 className="font-semibold">New admin</h4>
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input label="Username" name="username" value={form.username} onChange={set} required />
        <Input label="Email" type="email" name="email" value={form.email} onChange={set} required />
        <Input label="Phone" name="phone" value={form.phone} onChange={set} required />
        <Input label="Password" type="password" name="password" value={form.password} onChange={set} required />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create admin'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AdminDashboard;
