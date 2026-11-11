import { useEffect, useState } from 'react';
import { Modal, Button } from '../../components/ui.jsx';
import { TextField } from '../../components/fields.jsx';
import { useForm, focusFirstError } from '../../components/useForm.js';
import {
  BrandBusinessFields, BrandContactFields, CreatorAboutFields, CreatorAudienceFields, InterestFields,
} from '../../components/sections.jsx';
import { api, ApiError } from '../../api/client.js';
import {
  brandEditRules, creatorEditRules, brandFromProfile, creatorFromProfile, brandPayload, creatorPayload, validateGroups, accountRules,
} from '../../lib/schemas.js';

export default function EditProfileModal({ user, profile, options, onClose, onSaved }) {
  const isBrand = user.role === 'brand';
  const form = useForm(isBrand ? brandFromProfile(profile) : creatorFromProfile(profile));
  useEffect(() => {
    form.setValues(isBrand ? brandFromProfile(profile) : creatorFromProfile(profile));
    form.setErrors({});
  }, [isBrand, profile, user.id]);
  const [email, setEmail] = useState(user.email);
  useEffect(() => setEmail(user.email), [user.email]);
  const [emailErr, setEmailErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const rules = isBrand ? brandEditRules : creatorEditRules;

  const submit = async (e) => {
    e.preventDefault();
    setBanner(''); setEmailErr('');
    const errors = validateGroups(Object.values(rules), form.values);
    const emailMsg = email.trim() !== user.email ? accountRules.email(email) : undefined;
    if (emailMsg) setEmailErr(emailMsg);
    if (Object.keys(errors).length || emailMsg) { form.setErrors(errors); focusFirstError(document.querySelector('.modal')); return; }

    setBusy(true);
    try {
      const payload = isBrand ? brandPayload(form.values) : creatorPayload(form.values);
      if (email.trim() !== user.email) payload.email = email.trim();
      const { user: u, profile: p } = await api(`/admin/users/${user.id}`, { method: 'PATCH', body: payload });
      onSaved(u, p);
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('Admin profile update failed:', err);
        setBanner('Could not save this profile. Please try again.');
        return;
      }
      const fields = err.fields || {};
      if (fields.email) setEmailErr(fields.email);
      if (Object.keys(fields).length) {
        form.setErrors(fields);
        if (fields._form) setBanner(fields._form);
        focusFirstError(document.querySelector('.modal'));
      }
      else setBanner(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Edit ${isBrand ? 'brand' : 'creator'}: ${user.displayName}`} wide onClose={onClose}
      footer={
        <button className="btn line" onClick={onClose} disabled={busy}>Cancel</button>
      }
    >
      <form id="admin-edit-form" onSubmit={submit} noValidate className="form-grid">
        {banner && <div className="form-error" role="alert">{banner}</div>}
        <TextField label="Login email" type="email" name="email" value={email} onChange={setEmail} error={emailErr} />
        {isBrand ? <BrandBusinessFields form={form} options={options} /> : <CreatorAboutFields form={form} options={options} />}
        {isBrand ? <BrandContactFields form={form} /> : <CreatorAudienceFields form={form} />}
        <InterestFields form={form} options={options} label="Collaboration interests" />
        <div className="actions">
          <Button className="primary" loading={busy} type="button" onClick={submit}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
