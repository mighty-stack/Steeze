import { TextField, TextAreaField, SelectField, ChipGroup, PasswordField, SocialsEditor } from './fields.jsx';

/* Reusable groups of fields. The registration wizard shows them one step at a time; the member
   and admin edit screens stack them on a single page. `form` comes from useForm. */

export function BrandBusinessFields({ form, options }) {
  return (
    <>
      <TextField label="Brand or business name" {...form.bind('brandName')} autoComplete="organization" maxLength={80} />
      <SelectField label="Business category" {...form.bind('category')} options={options.category} />
      <SelectField label="Location" {...form.bind('location')} options={options.location} hint="Where the business is based. Not listed? Choose Other." />
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
      <SelectField label="Location" {...form.bind('location')} options={options.location} hint="Where you are based. Not listed? Choose Other." />
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
