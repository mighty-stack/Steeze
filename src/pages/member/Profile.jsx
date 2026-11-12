import { useState } from 'react';
import { useAuth } from '../../context/Auth.jsx';
import { useToast } from '../../context/Toast.jsx';
import { useOptions } from '../../lib/useOptions.js';
import { useForm, focusFirstError } from '../../components/useForm.js';
import { Button, Pill, Splash, cx } from '../../components/ui.jsx';
import {
  BrandBusinessFields, BrandContactFields, CreatorAboutFields, CreatorAudienceFields, InterestFields,
} from '../../components/sections.jsx';
import { PasswordField, TextField } from '../../components/fields.jsx';
import { api, ApiError } from '../../api/client.js';
import { Link } from 'react-router-dom';
import { setMemberAnalyticsOptOut } from '../../lib/analytics/consent.js';
import { platformLabel, compactNumber, fullNumber, STATUS, formatDate } from '../../lib/format.js';
import {
  brandEditRules, creatorEditRules, brandFromProfile, creatorFromProfile, brandPayload, creatorPayload, validateGroups, accountRules,
} from '../../lib/schemas.js';

function BrandView({ profile }) {
  return (
    <dl className="kv">
      <div><dt>Brand name</dt><dd>{profile.brandName}</dd></div>
      <div><dt>Category</dt><dd>{profile.category.label}</dd></div>
      <div><dt>Location</dt><dd>{profile.location.label}</dd></div>
      <div><dt>Contact</dt><dd>{profile.contactPerson}<br />{profile.contactEmail}<br />{profile.phone}</dd></div>
      {profile.website && <div><dt>Website</dt><dd><a className="link" href={profile.website} target="_blank" rel="noreferrer">{profile.website.replace(/^https?:\/\//, '')}</a></dd></div>}
      <div><dt>Offers</dt><dd>{profile.productsServices}</dd></div>
      <div><dt>Interested in</dt><dd><span className="chip-list">{profile.collaborationInterests.map((o) => <span key={o.id} className="chip-static">{o.label}</span>)}</span></dd></div>
    </dl>
  );
}

function CreatorView({ profile }) {
  return (
    <dl className="kv">
      <div><dt>Full name</dt><dd>{profile.fullName}</dd></div>
      <div><dt>Creator name</dt><dd>{profile.creatorName}</dd></div>
      {profile.phone && <div><dt>Phone number</dt><dd>{profile.phone}</dd></div>}
      <div><dt>Niche</dt><dd>{profile.niche.label}</dd></div>
      <div><dt>Location</dt><dd>{profile.location.label}</dd></div>
      <div><dt>Social accounts</dt><dd>{profile.socials.map((s) => (
        <div key={s.platform}>{platformLabel(s.platform)}: @{s.handle} &middot; <span title={`${fullNumber(s.followers)} followers`}>{compactNumber(s.followers)} followers</span></div>
      ))}</dd></div>
      {profile.audienceNotes && <div><dt>Audience</dt><dd>{profile.audienceNotes}</dd></div>}
      <div><dt>Content</dt><dd>{profile.contentDescription}</dd></div>
      <div><dt>Interested in</dt><dd><span className="chip-list">{profile.collaborationInterests.map((o) => <span key={o.id} className="chip-static">{o.label}</span>)}</span></dd></div>
    </dl>
  );
}

function EditForm({ user, profile, options, onSaved, onCancel }) {
  const isBrand = user.role === 'brand';
  const form = useForm(isBrand ? brandFromProfile(profile) : creatorFromProfile(profile));
  const [emailField, setEmailField] = useState(user.email);
  const [emailErr, setEmailErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const toast = useToast();
  const rules = isBrand ? brandEditRules : creatorEditRules;

  const submit = async (e) => {
    e.preventDefault();
    setBanner(''); setEmailErr('');
    const errors = validateGroups(Object.values(rules), form.values);
    const emailMsg = emailField.trim() !== user.email ? accountRules.email(emailField) : undefined;
    if (emailMsg) setEmailErr(emailMsg);
    if (Object.keys(errors).length || emailMsg) { form.setErrors(errors); focusFirstError(); return; }

    setBusy(true);
    try {
      const payload = isBrand ? brandPayload(form.values) : creatorPayload(form.values);
      if (emailField.trim() !== user.email) payload.email = emailField.trim();
      const { user: updatedUser, profile: updatedProfile } = await api('/profile', { method: 'PATCH', body: payload });
      toast('Profile updated.');
      onSaved(updatedUser, updatedProfile);
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      const fields = err.fields || {};
      if (fields.email) setEmailErr(fields.email);
      if (Object.keys(fields).length) { form.setErrors(fields); focusFirstError(); }
      else setBanner(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="form-grid mt-5">
      {banner && <div className="form-error" role="alert">{banner}</div>}
      <TextField label="Login email" type="email" name="email" value={emailField} onChange={setEmailField} error={emailErr} autoComplete="email" />
      {isBrand ? <BrandBusinessFields form={form} options={options} /> : <CreatorAboutFields form={form} options={options} />}
      <div className="section-title">{isBrand ? 'Contact and offer' : 'Audience'}</div>
      {isBrand ? <BrandContactFields form={form} /> : <CreatorAudienceFields form={form} />}
      <div className="section-title">Collaboration preferences</div>
      <InterestFields form={form} options={options} />
      <div className="actions">
        <button type="button" className="btn line" onClick={onCancel} disabled={busy}>Cancel</button>
        <Button type="submit" className="primary" loading={busy}>Save changes</Button>
      </div>
    </form>
  );
}

function ChangePassword() {
  const form = useForm({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setBanner('');
    const errors = {};
    if (!form.values.currentPassword) errors.currentPassword = 'Enter your current password.';
    const p = accountRules.password(form.values.newPassword);
    if (p) errors.newPassword = p;
    const c = form.values.confirm !== form.values.newPassword ? 'Passwords do not match.' : undefined;
    if (c) errors.confirm = c;
    if (Object.keys(errors).length) { form.setErrors(errors); focusFirstError(); return; }
    setBusy(true);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: form.values.currentPassword, newPassword: form.values.newPassword } });
      toast('Password changed.');
      form.setValues({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      if (Object.keys(err.fields || {}).length) form.setErrors(err.fields);
      else setBanner(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Password</h2>
      <p className="card-lede">Change the password you use to log in.</p>
      <form onSubmit={submit} noValidate className="form-grid mt-4.5 max-w-[420px]">
        {banner && <div className="form-error" role="alert">{banner}</div>}
        <PasswordField label="Current password" {...form.bind('currentPassword')} autoComplete="current-password" />
        <PasswordField label="New password" meter {...form.bind('newPassword')} />
        <PasswordField label="Confirm new password" {...form.bind('confirm')} />
        <Button type="submit" className="primary justify-self-start">Update password</Button>
      </form>
    </div>
  );
}

function VisibilitySettings({ user, setUser }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const toast = useToast();

  const update = async (field, value) => {
    const previousValue = user[field];
    setUser((current) => ({ ...current, [field]: value }));
    setBusy(field);
    setError('');
    try {
      const result = await api('/profile/settings', { method: 'PATCH', body: { [field]: value } });
      setUser(result.user);
      toast('Profile settings updated.');
    } catch (err) {
      setUser((current) => ({ ...current, [field]: previousValue }));
      setError(err.message || 'Could not update your visibility settings.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="card creator-visibility-card">
      <h2>Visibility</h2>
      <p className="card-lede">Verified brands and creators can only see the profile details you choose to share. Your email and phone are never listed.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="creator-visibility-row">
        <input
          type="checkbox"
          checked={user.discoverable !== false}
          disabled={Boolean(busy)}
          onChange={(event) => update('discoverable', event.target.checked)}
        />
        <span><b>Show my profile in the creator directory</b><small>Turn this off to remove your profile from search.</small></span>
      </label>
      <label className="creator-visibility-row">
        <input
          type="checkbox"
          checked={user.acceptsCollabRequests !== false}
          disabled={Boolean(busy)}
          onChange={(event) => update('acceptsCollabRequests', event.target.checked)}
        />
        <span><b>Accept collaboration requests</b><small>You can still browse creators when this is off.</small></span>
      </label>
      <label className="creator-visibility-row">
        <input
          type="checkbox"
          checked={user.emailReminders !== false}
          disabled={Boolean(busy)}
          onChange={(event) => update('emailReminders', event.target.checked)}
        />
        <span><b>Send me reminder emails</b><small>Get resumption and campaign updates directly in your inbox.</small></span>
      </label>
      <Link className="link" to={`/app/creators/${user.id}`}>Preview my directory profile</Link>
    </section>
  );
}

function AnalyticsPrivacySettings({ user, setUser }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const update = async (optOut) => {
    const previous = Boolean(user.analyticsOptOut);
    setBusy(true);
    setError('');
    if (optOut) setMemberAnalyticsOptOut(true);
    try {
      const result = await api('/profile/settings', { method: 'PATCH', body: { analyticsOptOut: optOut } });
      setUser(result.user);
      setMemberAnalyticsOptOut(result.user.analyticsOptOut);
      toast('Privacy setting updated.');
    } catch (err) {
      setMemberAnalyticsOptOut(previous);
      setError(err.message || 'Could not update your analytics preference.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card creator-visibility-card">
      <h2>Privacy</h2>
      <p className="card-lede">Choose whether your account activity is included in CloutLabs’ aggregate analytics. Essential account activity is unaffected.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="creator-visibility-row">
        <input
          type="checkbox"
          checked={user.analyticsOptOut !== true}
          disabled={busy}
          onChange={(event) => update(!event.target.checked)}
        />
        <span><b>Include my activity in anonymous analytics</b><small>When unchecked, future activity is excluded from product analytics.</small></span>
      </label>
    </section>
  );
}

export default function Profile() {
  const { user, profile, setProfile, setUser, profileLoading, profileError, refreshProfile } = useAuth();
  const { options } = useOptions();
  const [editing, setEditing] = useState(false);

  if (profileLoading || (!profile && !profileError)) return <div className="card"><Splash /></div>;
  if (!profile) return <div className="card profile-load-error"><p className="form-error" role="alert">{profileError || 'Your profile could not be loaded.'}</p><Button className="primary" onClick={refreshProfile}>Try again</Button></div>;
  const status = STATUS[user.verificationStatus];

  return (
    <>
      <div className="grid-2">
        <div className="card">
          <div className="flex justify-between items-start gap-3">
            <div><h2>Your profile</h2><p className="card-lede">What brands and the CloutLabs team see about you.</p></div>
            {!editing && <button className="btn line sm" onClick={() => setEditing(true)} disabled={!options}>Edit</button>}
          </div>
          {editing ? (
            <EditForm
              user={user} profile={profile} options={options}
              onCancel={() => setEditing(false)}
              onSaved={(updatedUser, updatedProfile) => {
                setUser(updatedUser);
                setProfile(updatedProfile);
                setEditing(false);
              }}
            />
          ) : user.role === 'brand' ? <BrandView profile={profile} /> : <CreatorView profile={profile} />}
        </div>

        <div>
          <div className="card">
            <h2>Account status</h2>
            <div className="status-card mt-3.5">
              <div className={cx('avatar', user.role === 'brand' ? 'b' : 'c')}>{(user.displayName || '?')[0]?.toUpperCase()}</div>
              <div>
                <b>{user.displayName}</b>
                <Pill tone={status.tone}>{status.label}</Pill>
              </div>
            </div>
            <dl className="kv mt-4.5">
              <div><dt>Account type</dt><dd>{user.role === 'brand' ? 'Brand' : 'Creator'}</dd></div>
              <div><dt>Login email</dt><dd>{user.email}</dd></div>
              <div><dt>Registered</dt><dd>{formatDate(user.createdAt)}</dd></div>
              {user.verifiedAt && <div><dt>Verified on</dt><dd>{formatDate(user.verifiedAt)}</dd></div>}
            </dl>
          </div>
          <ChangePassword />
        </div>
      </div>
      {user.role === 'creator' && <VisibilitySettings user={user} setUser={setUser} />}
      <AnalyticsPrivacySettings user={user} setUser={setUser} />
    </>
  );
}
