// AI match engine — deterministic, pure, and testable (the `gamify.js` of PlaceIQ).
// No DB/IO: given a student and a drive it returns a 0-100 fit score plus a
// breakdown. Kept small on purpose so it is easy to reason about and unit-test.

const norm = (s) => String(s || '').trim().toLowerCase();

// Weights (must sum to 100): skills dominate, eligibility gates the rest.
const W_SKILLS = 60;
const W_CGPA = 20;
const W_BRANCH = 20;

const computeMatch = (student, drive) => {
  const required = (drive.requiredSkills || []).map(norm).filter(Boolean);
  const haveSet = new Set((student.skills || []).map(norm).filter(Boolean));

  // Preserve the drive's original casing in the returned skill lists.
  const origByNorm = {};
  (drive.requiredSkills || []).forEach((s) => {
    origByNorm[norm(s)] = s;
  });

  const matchedNorm = required.filter((s) => haveSet.has(s));
  const missingNorm = required.filter((s) => !haveSet.has(s));

  // Skill overlap (60%). No required skills => treat as a full skill match.
  const skillPct = required.length ? matchedNorm.length / required.length : 1;

  // CGPA eligibility (20%).
  const cgpaEligible = Number(student.cgpa || 0) >= Number(drive.minCgpa || 0);

  // Branch eligibility (20%). Empty list => open to all branches.
  const branches = (drive.eligibleBranches || []).map(norm).filter(Boolean);
  const branchEligible =
    branches.length === 0 || branches.includes(norm(student.branch));

  const score = Math.round(
    skillPct * W_SKILLS +
      (cgpaEligible ? W_CGPA : 0) +
      (branchEligible ? W_BRANCH : 0)
  );

  return {
    score,
    skillsMatched: matchedNorm.map((s) => origByNorm[s] || s),
    skillsMissing: missingNorm.map((s) => origByNorm[s] || s),
    cgpaEligible,
    branchEligible,
    eligible: cgpaEligible && branchEligible,
  };
};

// Convenience wrapper used by the skill-gap endpoint.
const skillGap = (student, drive) => {
  const m = computeMatch(student, drive);
  return { have: m.skillsMatched, missing: m.skillsMissing };
};

// A short, deterministic fit summary — used as the fallback whenever the
// optional Claude enrichment is unavailable.
const matchSummary = (student, drive, match = computeMatch(student, drive)) => {
  const lines = [];
  const total = (drive.requiredSkills || []).length;
  lines.push(
    `You match ${match.skillsMatched.length} of ${total} required skill${
      total === 1 ? '' : 's'
    } for ${drive.role} at ${drive.company}.`
  );
  if (match.skillsMatched.length) {
    lines.push(`Strengths: ${match.skillsMatched.join(', ')}.`);
  }
  if (match.skillsMissing.length) {
    lines.push(`To improve your fit, pick up: ${match.skillsMissing.join(', ')}.`);
  }
  lines.push(
    match.cgpaEligible
      ? `Your CGPA meets the ${drive.minCgpa || 0} cutoff.`
      : `Heads up: your CGPA is below the ${drive.minCgpa} cutoff for this drive.`
  );
  lines.push(
    match.branchEligible
      ? `Your branch is eligible.`
      : `Note: this drive is restricted to ${(drive.eligibleBranches || []).join(', ')}.`
  );
  return lines.join(' ');
};

module.exports = { computeMatch, skillGap, matchSummary, W_SKILLS, W_CGPA, W_BRANCH };
