import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '🎯', title: 'AI Match Score', desc: 'Every drive shows a 0-100 fit score from your skills, CGPA and branch — apply where you stand out.' },
  { icon: '🏢', title: 'Placement Drives', desc: 'The placement cell posts company drives; you browse, check eligibility and apply in one click.' },
  { icon: '📊', title: 'Application Pipeline', desc: 'Track every application live: applied → shortlisted → interview → offer.' },
  { icon: '🧭', title: 'Skill-Gap Analysis', desc: 'See exactly which required skills you are missing for a role and what to learn next.' },
  { icon: '💬', title: 'AI Interview Prep', desc: 'Generate likely interview questions and prep tips tailored to each drive.' },
  { icon: '📝', title: 'AI Resume Feedback', desc: 'Paste your resume and get concrete, role-specific suggestions to improve it.' },
];

const Landing = () => (
  <div className="mx-auto max-w-6xl px-4">
    <section className="py-16 text-center sm:py-24">
      <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
        AI-Powered Placement Management
      </span>
      <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
        Land the right role with a{' '}
        <span className="text-brand-600 dark:text-brand-400">smarter</span> placement cell.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
        PlaceIQ runs the full campus placement loop — drives, applications and a
        hiring pipeline — and layers AI on top: match scoring, skill-gap analysis,
        interview prep and resume feedback, so you apply where you truly fit.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          to="/register"
          className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          I have an account
        </Link>
      </div>
    </section>

    <section className="grid gap-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="text-3xl">{f.icon}</div>
          <h3 className="mt-3 font-bold text-slate-900 dark:text-slate-100">{f.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
        </div>
      ))}
    </section>
  </div>
);

export default Landing;
