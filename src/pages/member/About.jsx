import { ABOUT, HOW_IT_WORKS } from '../../lib/content.js';

export default function About() {
  return (
    <div className="card">
      <h2>About Clout</h2>
      {ABOUT.map((p) => <p key={p} className="card-lede mt-2.5">{p}</p>)}
      <div className="section-title mt-7">How it works</div>
      <div className="grid gap-4 mt-3">
        {HOW_IT_WORKS.map((s, i) => (
          <div key={s.title} className="flex gap-3.5">
            <div className="font-extrabold text-[22px] text-blue flex-none w-7">{i + 1}</div>
            <div><strong>{s.title}</strong><p className="muted mt-0.5">{s.text}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
