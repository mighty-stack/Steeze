import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Button, Splash } from '../components/ui.jsx';
import { useForm, focusFirstError } from '../components/useForm.js';
import {
  BrandBusinessFields, BrandContactFields, CreatorAboutFields, CreatorAudienceFields, InterestFields, AccountFields,
} from '../components/sections.jsx';
import { api, ApiError } from '../api/client.js';
import { useOptions } from '../lib/useOptions.js';
import { TextField } from '../components/fields.jsx';
import { validateGroups, brandRules, creatorRules, accountRules, emptyBrand, emptyCreator, brandPayload, creatorPayload } from '../lib/schemas.js';

const ACCOUNT_INIT = { email: '', password: '', confirm: '' };

/* One wizard drives both registration flows. Each step lists the rules for its own fields, so the
   same table decides what to validate now and which step to jump back to if the server objects. */
const FLOWS = {
  brand: {
    theme: 'brand', heading: 'Register your brand',
    sub: 'Three short steps. Verify your email to activate your account.',
    endpoint: '/auth/register/brand', initial: { ...emptyBrand, ...ACCOUNT_INIT }, payload: brandPayload,
    steps: [
      { label: 'Your business', short: 'Business', title: 'Tell us about your business', lede: 'The basics that identify your brand.', rules: brandRules.business,
        render: (f, o) => <BrandBusinessFields form={f} options={o} /> },
      { label: 'Contact and offer', short: 'Contact', title: 'How can we reach you, and what do you offer?', lede: 'We use this to contact you about your registration and to describe your brand to creators.', rules: brandRules.contact,
        render: (f) => <BrandContactFields form={f} /> },
      { label: 'Interests and login', short: 'Login', title: 'Your interests and login', lede: 'Choose what you are open to, then set up how you will log in.', rules: { ...brandRules.interests, ...accountRules },
        render: (f, o) => (<><TextField
          label="Access code" optional {...f.bind('accessCode')} hint="Enter one if you were given a code."
          autoCapitalize="characters" autoCorrect="off" spellCheck="false" inputClassName="access-code"
        /><InterestFields form={f} options={o} /><AccountFields form={f} emailHint="Prefilled from your contact email. You can use a different one to log in." /></>) },
    ],
  },
  creator: {
    theme: 'creator', heading: 'Register as a creator',
    sub: 'Three short steps. Verify your email to activate your account.',
    endpoint: '/auth/register/creator', initial: { ...emptyCreator, ...ACCOUNT_INIT }, payload: creatorPayload,
    steps: [
      { label: 'About you', short: 'You', title: 'Tell us about you', lede: 'Who you are and what you create.', rules: creatorRules.about,
        render: (f, o) => <CreatorAboutFields form={f} options={o} /> },
      { label: 'Your audience', short: 'Audience', title: 'Where can brands find you?', lede: 'Add the accounts you post on and describe your content.', rules: creatorRules.audience,
        render: (f) => <CreatorAudienceFields form={f} contentPlaceholder="e.g., UGC creator, beauty product reviewer, or food and lifestyle vlogger" /> },
      { label: 'Interests and login', short: 'Login', title: 'Your interests and login', lede: 'Choose what you are open to, then set up how you will log in.', rules: { ...creatorRules.interests, ...accountRules },
        render: (f, o) => (<><TextField
          label="Access code" optional {...f.bind('accessCode')} hint="Enter one if you were given a code."
          autoCapitalize="characters" autoCorrect="off" spellCheck="false" inputClassName="access-code"
        /><InterestFields form={f} options={o} /><AccountFields form={f} /></>) },
    ],
  },
};

const draftKey = (kind) => `clout-draft-${kind}`;
function loadDraft(kind, initial) {
  try {
    const raw = sessionStorage.getItem(draftKey(kind)) || sessionStorage.getItem(`klout-draft-${kind}`);
    if (!raw) return { values: initial, step: 0 };
    const d = JSON.parse(raw);
    return { values: { ...initial, ...d.values, password: '', confirm: '' }, step: Math.min(d.step ?? 0, 2) };
  } catch {
    return { values: initial, step: 0 };
  }
}

export default function Register({ kind }) {
  const flow = FLOWS[kind];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.has('code') ? searchParams.get('code') : null;
  const { options, error: optionsError, reload } = useOptions();
  const draft = useMemo(() => {
    const saved = loadDraft(kind, flow.initial);
    if (urlCode !== null) saved.values = { ...saved.values, accessCode: urlCode };
    return saved;
  }, [kind, flow, urlCode]);
  const form = useForm(draft.values);
  const [step, setStep] = useState(draft.step);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const headingRef = useRef(null);
  const first = useRef(true);
  const last = flow.steps.length - 1;
  const current = flow.steps[step];

  // Keep the draft (never the password) so an accidental refresh does not wipe three steps of typing.
  useEffect(() => {
    const { password, confirm, ...safe } = form.values;
    try {
      sessionStorage.setItem(draftKey(kind), JSON.stringify({ values: safe, step }));
    } catch { /* storage unavailable: no draft, no problem */ }
  }, [form.values, step, kind]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step]);

  if (!options) {
    return (
      <AuthLayout theme={flow.theme} heading={flow.heading} sub={flow.sub}>
        {optionsError ? (
          <div className="formwrap">
            <div className="form-error" role="alert">{optionsError}</div>
            <button type="button" className="btn blue mt-4" onClick={reload}>Try again</button>
          </div>
        ) : <Splash />}
      </AuthLayout>
    );
  }

  const stepOfField = (field) => {
    const base = field.split('.')[0];
    const i = flow.steps.findIndex((s) => base in s.rules);
    return i === -1 ? last : i;
  };

  const goNext = async (e) => {
    e.preventDefault();
    setBanner('');
    const errors = validateGroups([current.rules], form.values);
    if (Object.keys(errors).length) {
      form.setErrors(errors);
      focusFirstError();
      return;
    }
    if (step === last && form.values.accessCode.trim()) {
      setBusy(true);
      try {
        await api('/auth/check-access-code', {
          method: 'POST',
          body: { code: form.values.accessCode.trim() },
        });
      } catch (err) {
        setBusy(false);
        if (!(err instanceof ApiError)) throw err;
        const message = err.fields?.accessCode || err.fields?.code;
        if (message) {
          form.setErrors({ accessCode: message });
          focusFirstError();
        } else {
          setBanner(err.message);
        }
        return;
      }
      setBusy(false);
    }
    if (step < last) {
      // Convenience: login email starts as the contact email.
      if (kind === 'brand' && step === last - 1 && !form.values.email) form.set('email', form.values.contactEmail.trim());
      setStep(step + 1);
      return;
    }
    submit();
  };

  const submit = async () => {
    // Re-check everything: the user may have edited an earlier step from a saved draft.
    const errors = validateGroups(flow.steps.map((s) => s.rules), form.values);
    if (Object.keys(errors).length) {
      form.setErrors(errors);
      setStep(Math.min(...Object.keys(errors).map(stepOfField)));
      focusFirstError();
      return;
    }
    setBusy(true);
    try {
      const body = { ...flow.payload(form.values), email: form.values.email.trim(), password: form.values.password };
      const result = await api(flow.endpoint, { method: 'POST', body });
      sessionStorage.removeItem(draftKey(kind));
      navigate('/registered', {
        replace: true,
        state: {
          email: body.email,
          emailSent: result.emailSent,
          role: kind,
          firstName: kind === 'creator' ? form.values.fullName.trim().split(/\s+/)[0] : '',
        },
      });
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      const fields = err.fields || {};
      if (Object.keys(fields).length) {
        form.setErrors(fields);
        setStep(Math.min(...Object.keys(fields).map(stepOfField)));
        setBanner(err.status === 409 ? 'Some details are already registered. Check the highlighted fields.' : 'Check the highlighted fields.');
        focusFirstError();
      } else {
        setBanner(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const stepper = (
    <ol className="stepper" aria-label="Progress">
      {flow.steps.map((s, i) => (
        <li key={s.label} className={i < step ? 'done' : i === step ? 'now' : ''} aria-current={i === step ? 'step' : undefined}>
          <span className="num">{i < step ? '\u2713' : i + 1}</span>
          <span className="long">{s.label}</span><span className="short">{s.short}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <AuthLayout
      theme={flow.theme} heading={flow.heading} sub={flow.sub} aside={stepper}
      footnote="Your details are only visible to you and the CloutLabs team."
      top={<span>Already registered? <Link to="/login">Log in</Link></span>}
    >
      <div className="formwrap">
        <div className="count">Step {step + 1} of {flow.steps.length}</div>
        <h2 ref={headingRef} tabIndex={-1}>{current.title}</h2>
        <p className="lede">{current.lede}</p>
        <form onSubmit={goNext} noValidate>
          {banner && <div className="form-error" role="alert">{banner}</div>}
          {current.render(form, options)}
          <div className="actions">
            {step > 0 ? <button type="button" className="btn line" onClick={() => { setBanner(''); setStep(step - 1); }} disabled={busy}>Back</button> : <span />}
            <Button type="submit" className={kind === 'creator' ? 'ink' : 'blue'} loading={busy}>
              {step === last ? 'Submit registration' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
