import { useEffect, useMemo, useState } from 'react';
import { TextField, TextAreaField, SelectField, ChipGroup, PasswordField, SocialsEditor } from './fields.jsx';

/* Reusable groups of fields. The registration wizard shows them one step at a time; the member
   and admin edit screens stack them on a single page. `form` comes from useForm. */

const LEGACY_COUNTRY_ALIASES = new Map([
  ['Cote d\'Ivoire', 'Côte d\'Ivoire'],
]);

function locationCountry(label) {
  const separator = label.lastIndexOf(' — ');
  if (separator >= 0) return label.slice(separator + 3).trim();

  const legacySeparator = label.lastIndexOf(',');
  const country = legacySeparator < 0 ? 'Other' : label.slice(legacySeparator + 1).trim();
  return LEGACY_COUNTRY_ALIASES.get(country) || country;
}

function locationName(label) {
  const separator = label.lastIndexOf(' — ');
  if (separator >= 0) return label.slice(0, separator).trim();

  const legacySeparator = label.lastIndexOf(',');
  return legacySeparator < 0 ? label : label.slice(0, legacySeparator).trim();
}

function LocationFields({ form, options, hint }) {
  const locations = options.location || [];
  const countries = useMemo(
    () => [...new Set(locations.map((location) => locationCountry(location.label)))].sort((a, b) => a.localeCompare(b))
      .map((country) => ({ id: country, label: country })),
    [locations],
  );
  const [country, setCountry] = useState(() => {
    const selected = locations.find((location) => location.id === form.values.location);
    return selected ? locationCountry(selected.label) : '';
  });

  useEffect(() => {
    const selected = locations.find((location) => location.id === form.values.location);
    if (selected) setCountry(locationCountry(selected.label));
  }, [form.values.location, locations]);

  const countryLocations = locations.filter((location) => country && locationCountry(location.label) === country);
  const regionNames = new Set(
    countryLocations
      .filter((location) => location.label.includes(' — '))
      .map((location) => locationName(location.label).toLowerCase()),
  );
  const stateOptions = countryLocations.map((location) => {
    const name = locationName(location.label);
    const isLegacyCity = !location.label.includes(' — ') && regionNames.has(name.toLowerCase());
    return { ...location, label: isLegacyCity ? `${name} (city)` : name };
  });

  return (
    <>
      <SelectField
        label="Country"
        name="country"
        value={country}
        onChange={(value) => {
          setCountry(value);
          if (form.values.location) form.set('location', '');
        }}
        options={countries}
        placeholder="Choose a country"
      />
      <SelectField
        label="State / location"
        {...form.bind('location')}
        options={stateOptions}
        placeholder={country ? 'Choose a state or location' : 'Choose a country first'}
        hint={hint}
      />
    </>
  );
}

export function BrandBusinessFields({ form, options }) {
  return (
    <>
      <TextField label="Brand or business name" {...form.bind('brandName')} autoComplete="organization" maxLength={80} />
      <SelectField label="Business category" {...form.bind('category')} options={options.category} />
      <LocationFields form={form} options={options} hint="Where the business is based." />
    </>
  );
}

export function BrandContactFields({ form }) {
  return (
    <>
      <TextField label="Contact person" {...form.bind('contactPerson')} autoComplete="name" maxLength={80} />
      <div className="two">
        <TextField label="Contact email" type="email" {...form.bind('contactEmail')} autoComplete="email" inputMode="email" />
        <TextField label="Phone number" type="tel" {...form.bind('phone')} autoComplete="tel" placeholder="+234 801 234 5678" />
      </div>
      <TextField label="Website or Instagram page" optional {...form.bind('website')} placeholder="example.com" autoCapitalize="none" />
      <TextAreaField label="Products or services" {...form.bind('productsServices')} maxLength={1000} hint="What do you sell or offer? A few sentences is enough." />
    </>
  );
}

export function CreatorAboutFields({ form, options }) {
  return (
    <>
      <TextField label="Full name" {...form.bind('fullName')} autoComplete="name" maxLength={80} />
      <TextField label="Creator or content name" {...form.bind('creatorName')} maxLength={80} hint="The name your audience knows you by." />
      <SelectField label="Content niche" {...form.bind('niche')} options={options.niche} />
      <LocationFields form={form} options={options} hint="Where you are based." />
    </>
  );
}

export function CreatorAudienceFields({ form, contentPlaceholder }) {
  return (
    <>
      <SocialsEditor value={form.values.socials} onChange={(v) => form.set('socials', v)} errors={form.errors} />
      <TextAreaField
        label="Audience details" optional {...form.bind('audienceNotes')} maxLength={300} className="min-h-[84px]"
        hint="For example: mostly women aged 18 to 34, based in Lagos."
      />
      <TextAreaField label="What you create" {...form.bind('contentDescription')} maxLength={1000} placeholder={contentPlaceholder} hint="Describe your content and style in a few sentences." />
    </>
  );
}

export function InterestFields({ form, options, label = 'What kind of collaborations interest you?' }) {
  return (
    <ChipGroup
      label={label} name="collaborationInterests" options={options.collabInterest}
      value={form.values.collaborationInterests} onChange={(v) => form.set('collaborationInterests', v)}
      error={form.errors.collaborationInterests} hint="Choose all that apply."
    />
  );
}

export function AccountFields({ form, emailHint }) {
  return (
    <>
      <TextField label="Login email" type="email" {...form.bind('email')} autoComplete="email" inputMode="email" hint={emailHint} />
      <PasswordField label="Password" meter {...form.bind('password')} hint="At least 8 characters, with a letter and a number." />
      <PasswordField label="Confirm password" {...form.bind('confirm')} />
    </>
  );
}
