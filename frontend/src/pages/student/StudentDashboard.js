import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import {
  Card,
  Button,
  Input,
  Textarea,
  Pill,
  StatCard,
  Tabs,
  Empty,
  MatchBadge,
  scoreTone,
  statusLabel,
} from '../../components/ui';

const StudentDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [me, setMe] = useState(null);
  const [drives, setDrives] = useState([]);
  const [apps, setApps] = useState([]);

  const load = useCallback(async () => {
    try {
      const [meRes, dRes, aRes] = await Promise.all([
        axios.get('/api/auth/me'),
        axios.get('/api/drives'),
        axios.get('/api/applications/mine'),
      ]);
      setMe(meRes.data);
      setDrives(dRes.data);
      setApps(aRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!me) return <div className="p-10 text-center text-slate-400">Loading…</div>;

  const offers = apps.filter((a) => a.status === 'offered').length;
  const bestMatch = drives.reduce((m, d) => Math.max(m, d.match?.score || 0), 0);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'drives', label: 'Drives', count: drives.length },
    { key: 'applications', label: 'My Applications', count: apps.length },
    { key: 'resume', label: 'Resume Feedback' },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hi, {me.username} 👋</h1>
          <p className="text-sm text-slate-500">
            {me.branch || 'Branch —'} · CGPA {me.cgpa || '—'} ·{' '}
            {me.placementStatus === 'placed' ? (
              <span className="font-semibold text-emerald-600">Placed 🎉</span>
            ) : (
              'Seeking'
            )}
          </p>
        </div>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Open drives" value={drives.length} />
            <StatCard label="Applications" value={apps.length} accent="text-sky-600" />
            <StatCard label="Offers" value={offers} accent="text-emerald-600" />
            <StatCard label="Best match" value={bestMatch} accent={scoreTone(bestMatch)} />
          </div>
          <Card className="p-6">
            <h3 className="font-bold">Top matches for you</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[...drives]
                .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))
                .slice(0, 2)
                .map((d) => (
                  <DriveCard key={d._id} d={d} onApplied={load} compact />
                ))}
              {!drives.length && <Empty>No open drives yet.</Empty>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'drives' && (
        <div className="grid gap-4 md:grid-cols-2">
          {drives.length ? (
            drives.map((d) => <DriveCard key={d._id} d={d} onApplied={load} />)
          ) : (
            <Empty>No open drives right now.</Empty>
          )}
        </div>
      )}

      {tab === 'applications' && <MyApplications apps={apps} reload={load} />}
      {tab === 'resume' && <ResumeFeedback me={me} />}
      {tab === 'profile' && <Profile me={me} onSaved={load} />}
    </div>
  );
};

// ---- Drive card with match score + AI helpers -------------------------------
const DriveCard = ({ d, onApplied, compact }) => {
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState(null); // 'gap' | 'interview' | 'fit'
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const applied = d.myApplication;

  const apply = async () => {
    setBusy(true);
    try {
      await axios.post('/api/applications', { driveId: d._id });
      toast.success('Applied! Your match score is on record.');
      onApplied();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not apply');
    } finally {
      setBusy(false);
    }
  };

  const openPanel = async (kind) => {
    if (panel === kind) {
      setPanel(null);
      return;
    }
    setPanel(kind);
    setAi(null);
    setAiLoading(true);
    try {
      if (kind === 'gap') {
        const res = await axios.get(`/api/ai/skill-gap/${d._id}`);
        setAi(res.data);
      } else if (kind === 'interview') {
        const res = await axios.get(`/api/ai/interview-prep/${d._id}`);
        setAi(res.data);
      } else if (kind === 'fit') {
        const res = await axios.get(`/api/ai/match/${d._id}`);
        setAi(res.data);
      }
    } catch {
      toast.error('AI assist failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="brand">{d.type}</Pill>
            {d.ctc && <Pill tone="slate">{d.ctc}</Pill>}
            <Pill tone="slate">{d.location}</Pill>
          </div>
          <h3 className="mt-2 font-bold text-slate-900 dark:text-slate-100">
            {d.role}
          </h3>
          <p className="text-sm font-semibold text-slate-500">{d.company}</p>
        </div>
        <MatchBadge score={d.match?.score ?? 0} />
      </div>

      <p className="mt-3 flex-1 text-sm text-slate-600 dark:text-slate-400">
        {d.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(d.requiredSkills || []).map((s) => {
          const have = d.match?.skillsMatched?.includes(s);
          return (
            <span
              key={s}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                have
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 line-through dark:bg-slate-800'
              }`}
            >
              {s}
            </span>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-400">
        Min CGPA {d.minCgpa || 0}
        {!d.match?.cgpaEligible && (
          <span className="ml-1 font-semibold text-rose-500">· below cutoff</span>
        )}
        {!d.match?.branchEligible && (
          <span className="ml-1 font-semibold text-rose-500">· branch not eligible</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4 dark:border-slate-800">
        {applied ? (
          <Pill tone={applied.status}>{statusLabel(applied.status)}</Pill>
        ) : (
          <Button onClick={apply} disabled={busy}>
            {busy ? 'Applying…' : 'Apply'}
          </Button>
        )}
        {!compact && (
          <>
            <Button variant="ghost" onClick={() => openPanel('fit')}>
              ✨ Fit
            </Button>
            <Button variant="ghost" onClick={() => openPanel('gap')}>
              🧭 Skill gap
            </Button>
            <Button variant="ghost" onClick={() => openPanel('interview')}>
              💬 Interview prep
            </Button>
          </>
        )}
      </div>

      {panel && !compact && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
          {aiLoading && <p className="text-slate-400">Thinking…</p>}
          {!aiLoading && ai && panel === 'fit' && (
            <div>
              <p className="font-semibold">Fit analysis</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{ai.analysis}</p>
              {!ai.ai && <AiNote enabled={ai.aiEnabled} />}
            </div>
          )}
          {!aiLoading && ai && panel === 'gap' && (
            <div>
              <p className="font-semibold">Skill gap</p>
              {ai.missing?.length ? (
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Missing: <strong>{ai.missing.join(', ')}</strong>
                </p>
              ) : (
                <p className="mt-1 text-emerald-600">You cover all required skills! ✅</p>
              )}
              <p className="mt-2 text-slate-600 dark:text-slate-300">{ai.advice}</p>
              {!ai.ai && <AiNote enabled={ai.aiEnabled} />}
            </div>
          )}
          {!aiLoading && ai && panel === 'interview' && (
            <div>
              <p className="font-semibold">Likely interview questions</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                {ai.questions?.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
              {ai.tips?.length > 0 && (
                <>
                  <p className="mt-3 font-semibold">Tips</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                    {ai.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </>
              )}
              {!ai.ai && <AiNote enabled={ai.aiEnabled} />}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const AiNote = ({ enabled }) => (
  <p className="mt-2 text-xs text-slate-400">
    {enabled
      ? 'Generated with a quick heuristic (AI fallback).'
      : 'Heuristic suggestion — set ANTHROPIC_API_KEY for AI-generated guidance.'}
  </p>
);

// ---- My applications --------------------------------------------------------
const MyApplications = ({ apps, reload }) => {
  if (!apps.length) return <Empty>You haven’t applied to any drives yet.</Empty>;

  const withdraw = async (id) => {
    try {
      await axios.delete(`/api/applications/${id}`);
      toast.success('Application withdrawn');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not withdraw');
    }
  };

  return (
    <div className="space-y-3">
      {apps.map((a) => (
        <Card key={a._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {a.drive?.role}{' '}
              <span className="font-normal text-slate-500">· {a.drive?.company}</span>
            </p>
            <p className="text-sm text-slate-500">
              {a.drive?.type} · {a.drive?.location} · {a.drive?.ctc}
            </p>
            {a.feedback && (
              <p className="mt-1 text-sm text-slate-500">“{a.feedback}”</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className={`text-lg font-bold ${scoreTone(a.matchScore)}`}>
                {a.matchScore}
              </span>
              <p className="text-[10px] uppercase text-slate-400">match</p>
            </div>
            <Pill tone={a.status}>{statusLabel(a.status)}</Pill>
            {['applied', 'shortlisted'].includes(a.status) && (
              <Button variant="ghost" onClick={() => withdraw(a._id)}>
                Withdraw
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

// ---- Resume feedback --------------------------------------------------------
const ResumeFeedback = ({ me }) => {
  const [text, setText] = useState(me.resumeText || '');
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await axios.post('/api/ai/resume-feedback', {
        resumeText: text,
        targetRole: role,
      });
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get feedback');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="font-bold">AI resume feedback</h3>
        <p className="mt-1 text-sm text-slate-500">
          Paste your resume (or summary) and get concrete, role-specific suggestions.
        </p>
        <div className="mt-4 space-y-3">
          <Input
            label="Target role (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Software Engineer"
          />
          <Textarea
            label="Resume text"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your resume here…"
          />
          <Button onClick={run} disabled={busy} className="w-full">
            {busy ? 'Analyzing…' : 'Get feedback'}
          </Button>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-bold">Suggestions</h3>
        {result ? (
          <>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <AiNote enabled={result.aiEnabled} />
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Your suggestions will appear here.
          </p>
        )}
      </Card>
    </div>
  );
};

// ---- Profile ----------------------------------------------------------------
const Profile = ({ me, onSaved }) => {
  const [form, setForm] = useState({
    branch: me.branch || '',
    graduationYear: me.graduationYear || '',
    cgpa: me.cgpa || '',
    skills: (me.skills || []).join(', '),
    resumeText: me.resumeText || '',
    resumeLink: me.resumeLink || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.put('/api/auth/profile', {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Profile updated — match scores refreshed');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-2xl p-6">
      <div className="flex items-center gap-4">
        {me.profilePic ? (
          <img
            src={me.profilePic}
            alt={me.username}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-500/30"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-2xl font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            {me.username?.[0]?.toUpperCase() || '👤'}
          </span>
        )}
        <div>
          <h3 className="text-lg font-bold">{me.username}</h3>
          <p className="text-sm text-slate-500">{me.email}</p>
        </div>
      </div>

      <h3 className="mt-6 font-bold">Placement profile</h3>
      <p className="mt-1 text-sm text-slate-500">
        Keep this current — your match scores are computed from it.
      </p>
      <form onSubmit={save} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Branch" name="branch" value={form.branch} onChange={set} placeholder="CSE" />
          <Input label="Grad year" type="number" name="graduationYear" value={form.graduationYear} onChange={set} />
          <Input label="CGPA" type="number" step="0.01" name="cgpa" value={form.cgpa} onChange={set} />
        </div>
        <Input label="Skills (comma separated)" name="skills" value={form.skills} onChange={set} placeholder="JavaScript, React, Node.js" />
        <Input label="Resume link (optional)" name="resumeLink" value={form.resumeLink} onChange={set} placeholder="https://drive.google.com/…" />
        <Textarea label="Resume summary" name="resumeText" rows={5} value={form.resumeText} onChange={set} />
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </Card>
  );
};

export default StudentDashboard;
