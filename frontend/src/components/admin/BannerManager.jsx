import { useEffect, useRef, useState } from 'react';
import { CalendarClock, ImagePlus, Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const emptyBanner = { title: '', image: '', link: '/products', isActive: true, sortOrder: 0, startsAt: '', endsAt: '' };
const toLocalInput = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');
const fromBanner = (banner) => ({
  title: banner.title || '', image: banner.image || '', link: banner.link || '/products',
  isActive: Boolean(banner.isActive), sortOrder: banner.sortOrder ?? 0,
  startsAt: toLocalInput(banner.startsAt), endsAt: toLocalInput(banner.endsAt),
});

export default function BannerManager({ onBannersChange }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBanner);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const items = await adminService.listBanners();
      const nextBanners = Array.isArray(items) ? items : [];
      setBanners(nextBanners);
      onBannersChange?.(nextBanners);
    }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to load banners'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBanners(); }, []);

  const reset = () => {
    setEditingId(null); setForm(emptyBanner); setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || (!form.image && !selectedFile)) return toast.error('Banner title and image are required');
    setSaving(true);
    try {
      let image = form.image;
      if (selectedFile) [image] = await adminService.uploadImages([selectedFile]);
      const payload = { ...form, title: form.title.trim(), image, sortOrder: Number(form.sortOrder) || 0, startsAt: form.startsAt || null, endsAt: form.endsAt || null };
      if (editingId) await adminService.updateBanner(editingId, payload);
      else await adminService.createBanner(payload);
      toast.success(editingId ? 'Banner updated' : 'Banner created');
      await loadBanners(); reset();
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to save banner'); }
    finally { setSaving(false); }
  };

  const deleteBanner = async (banner) => {
    if (!window.confirm(`Delete “${banner.title}”?`)) return;
    try {
      await adminService.deleteBanner(banner.id);
      toast.success('Banner deleted');
      await loadBanners();
      if (editingId === banner.id) reset();
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to delete banner'); }
  };

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">Homepage banners</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live banners appear on the homepage; scheduled ones stay queued until their start date.</p></div>
          <button type="button" onClick={loadBanners} className="rounded-full border border-slate-200 p-2 text-slate-600 hover:text-pink-500 dark:border-white/10 dark:text-slate-300" aria-label="Refresh banners"><RefreshCcw size={17} /></button>
        </div>
        <div className="mt-5 space-y-3">
          {loading ? <p className="py-8 text-sm text-slate-500">Loading banners...</p> : banners.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/10">No banners yet. Add one to show it on the homepage.</p> : banners.map((banner) => (
            <div key={banner.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-3 sm:flex-row sm:items-center dark:border-white/10">
              <img src={banner.image} alt={banner.title} className="h-24 w-full rounded-2xl object-cover sm:w-36" />
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-slate-900 dark:text-white">{banner.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{banner.isActive ? 'Active' : 'Hidden'}</span></div><p className="mt-1 truncate text-xs text-slate-500">{banner.link}</p><p className="mt-1 text-xs text-slate-400">Order {banner.sortOrder} {banner.startsAt ? `• Starts ${new Date(banner.startsAt).toLocaleString()}` : '• Live now'}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => { setEditingId(banner.id); setForm(fromBanner(banner)); setSelectedFile(null); }} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:text-pink-500 dark:border-white/10 dark:text-slate-300"><Pencil size={15} /> Edit</button><button type="button" onClick={() => deleteBanner(banner)} className="rounded-full bg-rose-500 p-2 text-white" aria-label="Delete banner"><Trash2 size={16} /></button></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{editingId ? 'Edit banner' : 'Add a banner'}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload a 2048 × 512 (4:1) image under 10MB for the best full-width banner display, then publish or schedule it.</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"><Plus size={15} /> Add banner</button></div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Title</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950" placeholder="Monsoon skin-care sale" /></label>
          <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Destination link</span><input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950" placeholder="/products/category/skin-care" /></label>
          <label className="block rounded-2xl border-2 border-dashed border-slate-200 p-4 dark:border-white/10"><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} /><span className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200"><ImagePlus className="text-pink-500" size={20} />{selectedFile ? selectedFile.name : 'Choose banner image'}</span></label>
          {(selectedFile || form.image) && <img src={selectedFile ? URL.createObjectURL(selectedFile) : form.image} alt="Banner preview" className="h-32 w-full rounded-2xl object-cover" />}
          <div className="grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Display order</span><input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950" /></label><label className="flex items-end gap-3 pb-3 text-sm font-medium text-slate-700 dark:text-slate-200"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-pink-500" />Show on homepage</label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label><span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"><CalendarClock size={13} />Start date</span><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-white/10 dark:bg-slate-950" /></label><label><span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">End date</span><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-white/10 dark:bg-slate-950" /></label></div>
          <button disabled={saving} className="w-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : editingId ? 'Update banner' : 'Publish banner'}</button>
        </form>
      </div>
    </section>
  );
}
