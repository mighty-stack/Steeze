import { rules, clean, cleanHandle, socialErrors } from './validation.js';

/* Validation rules grouped by the step/section they belong to. */
export const brandRules = {
  business: {
    brandName: rules.text('Brand name', 2, 80),
    category: rules.choice,
    location: rules.choice,
  },
  contact: {
    contactPerson: rules.text('Contact person', 2, 80),
    contactEmail: rules.email,
    phone: rules.phone,
    website: rules.website,
    productsServices: rules.longText('Products or services', 10, 1000),
  },
  interests: { accessCode: () => undefined, collaborationInterests: rules.interests },
};

export const creatorRules = {
  about: {
    fullName: rules.text('Full name', 2, 80),
    creatorName: rules.text('Creator name', 2, 80),
    niche: rules.choice,
    location: rules.choice,
  },
  audience: {
    socials: (v) => (socialErrors(v).socials ? socialErrors(v).socials : undefined),
    audienceNotes: rules.optionalLongText('Audience details', 300),
    contentDescription: rules.longText('Content description', 10, 1000),
  },
  interests: { accessCode: () => undefined, collaborationInterests: rules.interests },
};

export const accountRules = {
  email: rules.email,
  password: rules.password,
  confirm: (v, all) => (!v ? 'Confirm your password.' : v !== all.password ? 'Passwords do not match.' : undefined),
};

/* Empty starting values. */
export const emptyBrand = {
  accessCode: '', brandName: '', category: '', location: '', contactPerson: '', contactEmail: '', phone: '', website: '',
  productsServices: '', collaborationInterests: [],
};
export const emptyCreator = {
  accessCode: '', fullName: '', creatorName: '', niche: '', location: '', socials: [{ platform: '', handle: '', followers: '' }],
  audienceNotes: '', contentDescription: '', collaborationInterests: [],
};

/* Turn form values into the API payload. */
export function brandPayload(v) {
  return {
    ...(v.accessCode.trim() ? { accessCode: v.accessCode.trim() } : {}),
    brandName: clean(v.brandName), category: v.category, location: v.location,
    contactPerson: clean(v.contactPerson), contactEmail: v.contactEmail.trim(), phone: v.phone,
    website: v.website.trim(), productsServices: v.productsServices.trim(),
    collaborationInterests: v.collaborationInterests,
  };
}
export function creatorPayload(v) {
  return {
    ...(v.accessCode.trim() ? { accessCode: v.accessCode.trim() } : {}),
    fullName: clean(v.fullName), creatorName: clean(v.creatorName), niche: v.niche, location: v.location,
    socials: v.socials.map((s) => ({ platform: s.platform, handle: cleanHandle(s.handle), followers: Number(s.followers) })),
    audienceNotes: v.audienceNotes.trim(), contentDescription: v.contentDescription.trim(),
    collaborationInterests: v.collaborationInterests,
  };
}

/* Turn a saved profile (from the API) back into editable form values. */
export function brandFromProfile(p) {
  return {
    brandName: p.brandName, category: p.category?.id || '', location: p.location?.id || '',
    contactPerson: p.contactPerson, contactEmail: p.contactEmail, phone: p.phone, website: p.website || '',
    productsServices: p.productsServices, collaborationInterests: (p.collaborationInterests || []).map((o) => o.id),
  };
}
export function creatorFromProfile(p) {
  return {
    fullName: p.fullName, creatorName: p.creatorName, niche: p.niche?.id || '', location: p.location?.id || '',
    socials: p.socials.map((s) => ({ platform: s.platform, handle: s.handle, followers: String(s.followers) })),
    audienceNotes: p.audienceNotes || '', contentDescription: p.contentDescription,
    collaborationInterests: (p.collaborationInterests || []).map((o) => o.id),
  };
}

// Full check of a set of rule groups; returns { field: message }. Socials get per-row messages too.
export function validateGroups(groups, values) {
  const errors = {};
  for (const group of groups) {
    for (const [field, rule] of Object.entries(group)) {
      const msg = rule(values[field], values);
      if (msg) errors[field] = msg;
    }
  }
  if (groups.some((g) => 'socials' in g)) {
    delete errors.socials;
    Object.assign(errors, socialErrors(values.socials));
  }
  return errors;
}
