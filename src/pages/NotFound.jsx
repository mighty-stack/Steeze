import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <>
      <title>Page not found | CloutLabs</title>
      <meta name="robots" content="noindex" />
      <div className="min-h-screen flex flex-col items-center justify-center gap-3.5 text-ink-soft">
        <h1 className="text-[28px] font-bold">Page not found</h1>
        <Link className="btn blue" to="/">Back to home</Link>
      </div>
    </>
  );
}
