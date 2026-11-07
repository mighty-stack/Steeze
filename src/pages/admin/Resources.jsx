import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client.js';
import { Button, Splash } from '../../components/ui.jsx';
import { useToast } from '../../context/Toast.jsx';

const emptyForm = {
  title: '',
  summary: '',
  description: '',
  category: '',
  includes: '',
  coverImageUrl: '',
  price: '',
  compareAt: '',
  currency: 'NGN',
  status: 'draft',
  deliveryUrl: '',
  deliveryNote: '',
  featured: false,
};

export default function AdminResources() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadCategories = async () => {
    try {
      const { items: options } = await api('/admin/options?type=resourceCategory');
      setCategories((options || []).filter((item) => item.active !== false));
    } catch (error) {
      console.error('Failed to load categories.', error);
    }
  };

  const loadResources = async () => {
    try {
      const { items: result } = await api('/admin/resources');
      setItems(result || []);
    } catch (error) {
      console.error('Failed to load resources.', error);
      toast(error.message || 'Unable to load resources.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const rawBody = {
        ...form,
        category: form.category || undefined,
        includes: form.includes.split(',').map((entry) => entry.trim()).filter(Boolean),
        price: Number(form.price || 0),
        compareAt: form.compareAt ? Number(form.compareAt) : undefined,
      };

      await api('/admin/resources', { method: 'POST', body: rawBody });
      setForm(emptyForm);
      toast('Resource created.', 'ok');
      loadResources();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'The resource could not be created.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/admin/resources/${id}`, { method: 'DELETE' });
      toast('Resource deleted.', 'ok');
      loadResources();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Unable to delete the resource.', 'error');
    }
  };

  if (loading) return <Splash />;

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Admin</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Resources</h1>
          </div>
          <p className="text-sm text-slate-600">Manage the verified creator storefront catalog.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Catalog</h2>
          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No resources yet.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{item.status} · {item.currency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{item.priceMinor / 100}</span>
                    <Button className="danger sm" onClick={() => handleDelete(item.id)}>Delete</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">New resource</h2>
          <div className="mt-5 space-y-4">
            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
              <input name="title" className="input" value={form.title} onChange={handleChange} required />
            </div>

            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Summary</label>
              <input name="summary" className="input" value={form.summary} onChange={handleChange} />
            </div>

            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
              <textarea name="description" className="input" rows="4" value={form.description} onChange={handleChange} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                <select name="category" className="input" value={form.category} onChange={handleChange}>
                  <option value="">Select a category</option>
                  {categories.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Currency</label>
                <select name="currency" className="input" value={form.currency} onChange={handleChange}>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                  <option value="GHS">GHS</option>
                  <option value="ZAR">ZAR</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Price</label>
                <input name="price" type="number" min="0" step="1" className="input" value={form.price} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Compare at</label>
                <input name="compareAt" type="number" min="0" step="1" className="input" value={form.compareAt} onChange={handleChange} />
              </div>
            </div>

            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Included items</label>
              <input name="includes" className="input" value={form.includes} onChange={handleChange} placeholder="Checklist, one per comma" />
            </div>

            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Cover image URL</label>
              <input name="coverImageUrl" className="input" value={form.coverImageUrl} onChange={handleChange} />
            </div>

            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Delivery URL</label>
              <input name="deliveryUrl" className="input" value={form.deliveryUrl} onChange={handleChange} />
            </div>

            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Delivery note</label>
              <textarea name="deliveryNote" className="input" rows="3" value={form.deliveryNote} onChange={handleChange} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
                <select name="status" className="input" value={form.status} onChange={handleChange}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
                Featured
              </label>
            </div>

            <Button type="submit" className="primary w-full" loading={submitting}>Create resource</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
