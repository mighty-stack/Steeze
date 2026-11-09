import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { Button, Splash } from '../../components/ui.jsx';
import { track } from '../../lib/analytics/track.js';

const formatMoney = (minor, currency = 'NGN') => {
  const amount = Number(minor || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function ResourceCard({ item, selected, onToggle, onOpenLibrary }) {
  const owned = Boolean(item.owned);
  const price = formatMoney(item.priceMinor, item.currency);
  const compareAt = item.compareAtMinor ? formatMoney(item.compareAtMinor, item.currency) : null;
  const viewed = useRef(false);
  const toggleSelection = () => {
    if (!selected) track('cart_add', { id: item.id });
    onToggle(item.id);
  };

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    track('resource_view', { id: item.id });
  }, [item.id]);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700">
          {item.category?.label || 'Resource'}
        </span>
        {owned ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
            Owned
          </span>
        ) : (
          <button
            type="button"
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 text-slate-700'}`}
            onClick={toggleSelection}
            disabled={owned}
          >
            {selected ? 'Selected' : 'Add to cart'}
          </button>
        )}
      </div>

      {item.coverImageUrl ? (
        <img src={item.coverImageUrl} alt={item.title} className="mb-4 h-40 w-full rounded-2xl object-cover" />
      ) : (
        <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-white to-slate-100 text-lg font-semibold text-slate-500">
          {item.title.slice(0, 2).toUpperCase()}
        </div>
      )}

      <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
      {item.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>}

      <div className="mt-4 flex items-end gap-2">
        <strong className="text-2xl font-extrabold text-slate-900">{price}</strong>
        {compareAt && <span className="text-sm text-slate-400 line-through">{compareAt}</span>}
      </div>

      {Array.isArray(item.includes) && item.includes.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-slate-600">
          {item.includes.slice(0, 4).map((entry) => (
            <li key={entry} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span>{entry}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-xs uppercase tracking-[0.12em] text-slate-400">{item.status}</span>
        {owned ? (
          <Button className="primary sm" onClick={onOpenLibrary}>Open in library</Button>
        ) : (
          <Button className="primary sm" onClick={toggleSelection}>{selected ? 'Remove' : 'Select'}</Button>
        )}
      </div>
    </article>
  );
}

export default function MemberResources() {
  const { orderNumber } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [library, setLibrary] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('catalog');
  const [order, setOrder] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const refresh = async () => {
    try {
      const [catalogRes, libraryRes] = await Promise.all([
        api('/resources'),
        api('/resources/library').catch(() => ({ items: [] })),
      ]);
      setCatalog(catalogRes.items || []);
      setLibrary(libraryRes.items || []);
    } catch (error) {
      console.error('Failed to load resources.', error);
      toast(error.message || 'Unable to load resources right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      setTab('library');
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  useEffect(() => {
    if (!orderNumber) return;
    let active = true;
    api(`/resources/orders/${orderNumber}`)
      .then(({ order: details }) => {
        if (active) setOrder(details);
      })
      .catch(() => {
        if (active) setOrder(null);
      });
    return () => { active = false; };
  }, [orderNumber]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    if (!reference) return;
    api(`/resources/verify?reference=${encodeURIComponent(reference)}`)
      .then(({ ok, paid, orderNumber: returnedOrder }) => {
        if (ok && paid) {
          setStatusMessage(`Payment confirmed. Your order ${returnedOrder || 'is ready'} has been unlocked.`);
          navigate('/app/resources', { replace: true });
        } else {
          setStatusMessage('Payment is still processing. Check back in a few moments.');
        }
      })
      .catch(() => {
        setStatusMessage('Payment verification is still pending.');
      });
  }, [navigate]);

  const cartItems = useMemo(() =>
    catalog.filter((item) => selected.includes(item.id) && !item.owned),
    [catalog, selected]);

  const toggleItem = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const checkout = async () => {
    if (!cartItems.length) return;
    track('checkout_start', {});
    try {
      const result = await api('/resources/checkout', {
        method: 'POST',
        body: { ids: cartItems.map((item) => item.id) },
      });

      if (result?.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }

      if (result?.status === 'paid') {
        toast('Your resources are ready in your library.', 'ok');
        setSelected([]);
        refresh();
        navigate('/app/resources', { replace: true });
        return;
      }

      toast('Your order was created successfully.', 'ok');
      setSelected([]);
      refresh();
      if (result?.orderNumber) navigate(`/app/resources/orders/${result.orderNumber}`);
    } catch (error) {
      toast(error.message || 'Checkout could not be completed.', 'error');
    }
  };

  const totalMinor = cartItems.reduce((sum, item) => sum + Number(item.priceMinor || 0), 0);

  if (loading) {
    return <Splash />;
  }

  if (orderNumber) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Order</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">{order?.orderNumber || orderNumber}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {order?.status === 'paid'
              ? 'Payment confirmed and the resources are now available in your library.'
              : 'Your payment is still being processed. Check back in a moment.'}
          </p>
          {order && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Total</p>
                <strong className="mt-2 block text-lg font-bold text-slate-900">{formatMoney(order.totalMinor, order.currency)}</strong>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Currency</p>
                <strong className="mt-2 block text-lg font-bold text-slate-900">{order.currency}</strong>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Status</p>
                <strong className="mt-2 block text-lg font-bold text-slate-900">{order.status}</strong>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="primary" onClick={() => { setTab('catalog'); navigate('/app/resources'); }}>Back to store</Button>
            <Button className="line" onClick={() => { setTab('library'); navigate('/app/resources'); }}>View library</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Creator resources</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Marketplace</h2>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{selected.length}</span> item{selected.length === 1 ? '' : 's'} selected
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setTab('catalog')} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'catalog' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
          Storefront
        </button>
        <button type="button" onClick={() => setTab('library')} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'library' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
          My library ({library.length})
        </button>
      </div>

      {tab === 'catalog' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {catalog.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                No resources are live yet. Check back soon.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {catalog.map((item) => (
                  <ResourceCard
                    key={item.id}
                    item={item}
                    selected={selected.includes(item.id)}
                    onToggle={toggleItem}
                    onOpenLibrary={() => setTab('library')}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Cart</h3>
            <div className="mt-4 space-y-3">
              {cartItems.length === 0 ? (
                <p className="text-sm text-slate-500">Select a few resources to see your total.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.category?.label || 'Resource'}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{formatMoney(item.priceMinor, item.currency)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <strong className="text-lg text-slate-900">{formatMoney(totalMinor, cartItems[0]?.currency || 'NGN')}</strong>
              </div>
              <Button className="primary mt-5 w-full" onClick={checkout} loading={false} disabled={cartItems.length === 0}>
                Proceed to checkout
              </Button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {library.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 md:col-span-2">
              You have not purchased any resources yet.
            </div>
          ) : (
            library.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Owned</span>
                  <span className="text-xs text-slate-500">{new Date(item.grantedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary || item.description}</p>
                {item.deliveryNote && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{item.deliveryNote}</p>}
                {item.deliveryUrl ? (
                  <a href={item.deliveryUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
                    Open resource
                  </a>
                ) : (
                  <div className="mt-5 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">No direct delivery link provided.</div>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
