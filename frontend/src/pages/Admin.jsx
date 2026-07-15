import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Pencil, Plus, RefreshCcw, Search, Trash2, Package, Star, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/adminService';
import { CATEGORIES, REGION_OPTIONS, SUBCATEGORIES } from '../utils/constants';
import BannerManager from '../components/admin/BannerManager';
import OrdersManager from '../components/admin/OrdersManager';

const emptyForm = {
  name: '',
  brand: 'DYVA',
  description: '',
  categories: [],
  subCategories: [],
  price: '',
  salePrice: '',
  stock: '',
  comingSoon: false,
  images: [],
  availableRegions: REGION_OPTIONS.map((region) => region.key),
};

const formFromProduct = (product) => ({
  name: product?.name || '',
  brand: 'DYVA',
  description: product?.description || '',
  categories: Array.isArray(product?.categories) && product.categories.length > 0
    ? product.categories
    : product?.category
      ? [product.category]
      : [],
  subCategories: Array.isArray(product?.subCategories) && product.subCategories.length > 0
    ? product.subCategories
    : product?.subCategory
      ? [product.subCategory]
      : [],
  price: product?.price ?? '',
  salePrice: product?.salePrice ?? '',
  stock: product?.stock ?? '',
  comingSoon: Boolean(product?.comingSoon),
  images: Array.isArray(product?.images) ? product.images : [],
  availableRegions: Array.isArray(product?.availableRegions) && product.availableRegions.length > 0
    ? product.availableRegions
    : REGION_OPTIONS.map((region) => region.key),
});

const isPresetCategory = (value) => CATEGORIES.some((item) => item.key === value);

const uniqueValues = (items) => [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];

const selectedPrimaryCategory = (categories) => categories[0] || '';

const toPayload = (form, images) => ({
  name: form.name.trim(),
  brand: 'DYVA',
  description: form.description.trim(),
  category: selectedPrimaryCategory(form.categories),
  categories: uniqueValues(form.categories),
  subCategory: form.subCategories[0] || '',
  subCategories: uniqueValues(form.subCategories),
  price: form.price,
  salePrice: form.salePrice,
  stock: form.stock,
  comingSoon: form.comingSoon,
  images,
  availableRegions: form.availableRegions,
});

export default function Admin() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('products');
  const [bannerSummary, setBannerSummary] = useState({ total: 0, live: 0, upcoming: 0 });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [subCategoryDraft, setSubCategoryDraft] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const selectedPreviews = useMemo(
    () => selectedFiles.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      selectedPreviews.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [selectedPreviews]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const list = await adminService.listProducts({ limit: 0, sort: 'newest' });
      setProducts(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      return [product.name, product.brand, product.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [products, search]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCategoryDraft('');
    setSubCategoryDraft('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm(formFromProduct(product));
    setCategoryDraft('');
    setSubCategoryDraft('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFilesChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setSelectedFiles(nextFiles);
  };

  const toggleCategory = (categoryKey) => {
    setForm((current) => {
      const exists = current.categories.includes(categoryKey);
      return {
        ...current,
        categories: exists
          ? current.categories.filter((item) => item !== categoryKey)
          : [...current.categories, categoryKey],
      };
    });
  };

  const addCustomCategory = () => {
    const value = categoryDraft.trim();
    if (!value) return;

    setForm((current) => ({
      ...current,
      categories: uniqueValues([...current.categories, value]),
    }));
    setCategoryDraft('');
  };

  const removeCategory = (categoryKey) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.filter((item) => item !== categoryKey),
      subCategories: current.subCategories,
    }));
  };

  const availableSubcategories = useMemo(() => {
    const next = [];
    form.categories.forEach((categoryKey) => {
      const items = SUBCATEGORIES[categoryKey] || [];
      items.forEach((item) => next.push(item));
    });
    return next;
  }, [form.categories]);

  const toggleSubCategory = (subcategoryKey) => {
    setForm((current) => {
      const exists = current.subCategories.includes(subcategoryKey);
      return {
        ...current,
        subCategories: exists
          ? current.subCategories.filter((item) => item !== subcategoryKey)
          : [...current.subCategories, subcategoryKey],
      };
    });
  };

  const toggleRegion = (regionKey) => {
    setForm((current) => ({
      ...current,
      availableRegions: current.availableRegions.includes(regionKey)
        ? current.availableRegions.filter((item) => item !== regionKey)
        : [...current.availableRegions, regionKey],
    }));
  };

  const addCustomSubCategory = () => {
    const value = subCategoryDraft.trim();
    if (!value) return;

    setForm((current) => ({
      ...current,
      subCategories: uniqueValues([...current.subCategories, value]),
    }));
    setSubCategoryDraft('');
  };

  const removeSubCategory = (subcategoryKey) => {
    setForm((current) => ({
      ...current,
      subCategories: current.subCategories.filter((item) => item !== subcategoryKey),
    }));
  };

  const removeExistingImage = (imageUrl) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((item) => item !== imageUrl),
    }));
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error('Product name and price are required');
      return;
    }

    if (form.categories.length === 0) {
      toast.error('Select at least one category');
      return;
    }

    if (form.availableRegions.length === 0) {
      toast.error('Select at least one delivery region');
      return;
    }

    setSaving(true);
    try {
      let uploadedImages = form.images;
      if (selectedFiles.length > 0) {
        uploadedImages = await adminService.uploadImages(selectedFiles);
      }

      const payload = toPayload(form, uploadedImages);
      if (editingId) {
        await adminService.updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await adminService.createProduct(payload);
        toast.success('Product created');
      }

      await loadProducts();
      startCreate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete ${product.name}?`);
    if (!confirmed) return;

    try {
      await adminService.deleteProduct(product.id);
      toast.success('Product deleted');
      await loadProducts();
      if (editingId === product.id) {
        startCreate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete product');
    }
  };

  const productStats = [
    { label: 'Products', value: products.length, icon: Package },
    { label: 'Featured', value: products.filter((item) => item.featured).length, icon: Sparkles },
    { label: 'Top Rated', value: products.filter((item) => Number(item.rating) >= 4.5).length, icon: Star },
  ];
  const stats = activeSection === 'products'
    ? productStats
    : [
        { label: 'Banners', value: bannerSummary.total, icon: ImagePlus },
        { label: 'Live now', value: bannerSummary.live, icon: Sparkles },
        { label: 'Upcoming', value: bannerSummary.upcoming, icon: RefreshCcw },
      ];

  if (!user?.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-pink-600 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-300">
              DYVA house brand
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-pink-500">Admin panel</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {activeSection === 'products' ? 'Manage DYVA products in one place' : activeSection === 'banners' ? 'Manage homepage banners' : 'Manage customer orders'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              {activeSection === 'products'
                ? 'Create products, organize them by category, edit inventory, and keep the storefront synced with the backend.'
                : activeSection === 'banners'
                  ? 'Add a banner, edit an existing campaign, or schedule an upcoming banner for the homepage.'
                  : 'View orders by delivery region and update fulfilment status.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Icon size={16} />
                    <span className="text-xs font-semibold uppercase tracking-[0.3em]">{item.label}</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveSection('products')}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeSection === 'products' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:text-pink-500 dark:text-slate-400'}`}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('banners')}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeSection === 'banners' ? 'bg-pink-500 text-white' : 'text-slate-500 hover:text-pink-500 dark:text-slate-400'}`}
          >
            Banners
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('orders')}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeSection === 'orders' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:text-pink-500 dark:text-slate-400'}`}
          >
            Orders
          </button>
        </div>

        {activeSection === 'products' ? (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Products</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Search, edit, or remove products.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products"
                    className="w-56 rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={loadProducts}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-pink-500 hover:text-pink-500 dark:border-white/10 dark:text-slate-200"
                >
                  <RefreshCcw size={16} /> Refresh
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10">
              {loading ? (
                <div className="p-8 text-sm text-slate-500 dark:text-slate-400">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-sm text-slate-500 dark:text-slate-400">No products found.</div>
              ) : (
                <div className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-slate-950">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/5">
                          <img
                            src={product.images?.[0] || '/banners/banner1.png'}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{product.name}</h3>
                            {product.featured && (
                              <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-600 dark:bg-pink-500/20 dark:text-pink-300">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {product.brand || 'No brand'} · {product.category || 'No category'}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                            ₹{Number(product.salePrice ?? product.price ?? 0).toLocaleString('en-IN')}
                            {product.salePrice ? (
                              <span className="ml-2 text-xs font-medium text-slate-400 line-through">
                                ₹{Number(product.price ?? 0).toLocaleString('en-IN')}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/products/${product.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-pink-500 hover:text-pink-500 dark:border-white/10 dark:text-slate-200"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {editingId ? 'Edit product' : 'Create product'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Fill in the product details and save to update the storefront.
                </p>
              </div>

              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-pink-500 hover:text-pink-500 dark:border-white/10 dark:text-slate-200"
              >
                <Plus size={16} /> New
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['name', 'Name'],
                  ['price', 'Price'],
                  ['salePrice', 'Sale price'],
                  ['stock', 'Stock'],
                ].map(([field, label]) => (
                  <label key={field} className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</span>
                    <input
                      name={field}
                      value={form[field]}
                      onChange={handleChange}
                      type={field === 'name' ? 'text' : 'number'}
                      min={field === 'name' ? undefined : '0'}
                      step={field === 'name' ? undefined : '1'}
                      placeholder={field === 'name' ? 'Product name' : undefined}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                    />
                  </label>
                ))}
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Coming soon</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Show this product on the website but prevent customers from buying it.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.comingSoon}
                  onChange={(event) => setForm((current) => ({ ...current, comingSoon: event.target.checked }))}
                  className="h-5 w-5 accent-pink-500"
                />
              </label>

              <div className="rounded-3xl border border-pink-200 bg-pink-50 px-4 py-4 dark:border-pink-500/30 dark:bg-pink-500/10">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600 dark:text-pink-300">Brand</span>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Brand is locked to DYVA for every product saved from this panel.
                  </p>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-pink-600 shadow-sm dark:bg-slate-950 dark:text-pink-300">
                    DYVA
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Categories</span>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Select one or more categories for the same product.
                      </p>
                    </div>
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600 dark:bg-pink-500/20 dark:text-pink-300">
                      {form.categories.length} selected
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {CATEGORIES.map((item) => {
                      const active = form.categories.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleCategory(item.key)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            active
                              ? 'border-pink-500 bg-pink-500 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-pink-400 hover:text-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={categoryDraft}
                      onChange={(event) => setCategoryDraft(event.target.value)}
                      placeholder="Add custom category"
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950"
                    >
                      Add category
                    </button>
                  </div>

                  {form.categories.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {form.categories.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => removeCategory(item)}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"
                        >
                          {item}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Subcategories</span>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Choose subcategories that belong to the selected categories.
                      </p>
                    </div>
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600 dark:bg-pink-500/20 dark:text-pink-300">
                      {form.subCategories.length} selected
                    </span>
                  </div>

                  {availableSubcategories.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {availableSubcategories.map((item) => {
                        const active = form.subCategories.includes(item.key);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleSubCategory(item.key)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              active
                                ? 'border-pink-500 bg-pink-500 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-pink-400 hover:text-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
                      Pick a category first to unlock matching subcategories.
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={subCategoryDraft}
                      onChange={(event) => setSubCategoryDraft(event.target.value)}
                      placeholder="Add custom subcategory"
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomSubCategory}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950"
                    >
                      Add subcategory
                    </button>
                  </div>

                  {form.subCategories.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {form.subCategories.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => removeSubCategory(item)}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"
                        >
                          {item}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Delivery availability</span>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Choose the Indian regions where this product can be ordered.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, availableRegions: REGION_OPTIONS.map((region) => region.key) }))}
                    className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600 dark:bg-pink-500/20 dark:text-pink-300"
                  >
                    All India
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {REGION_OPTIONS.map((region) => {
                    const active = form.availableRegions.includes(region.key);
                    return (
                      <button
                        key={region.key}
                        type="button"
                        onClick={() => toggleRegion(region.key)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? 'border-pink-500 bg-pink-500 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-pink-400 hover:text-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200'
                        }`}
                      >
                        {region.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="space-y-2 block">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <div className="space-y-3">
                <label className="block rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-5 py-6 transition hover:border-pink-400 hover:bg-pink-50/60 dark:border-white/10 dark:bg-white/5 dark:hover:border-pink-400/80">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                    onChange={handleFilesChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
                    <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900">
                      <ImagePlus size={22} className="text-pink-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Store product images</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select JPG, PNG, GIF, WEBP, BMP or SVG files. You can add multiple images at once.
                      </p>
                    </div>
                  </div>
                </label>

                {(form.images.length > 0 || selectedFiles.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.images.map((imageUrl) => (
                      <div key={imageUrl} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
                        <img src={imageUrl} alt="Current product" className="h-36 w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                          <span>Current image</span>
                          <button type="button" onClick={() => removeExistingImage(imageUrl)} className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-white">
                            <X size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedPreviews.map(({ file, preview }, index) => (
                      <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
                        <img src={preview} alt={file.name} className="h-36 w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="truncate">{file.name}</span>
                          <button type="button" onClick={() => removeSelectedFile(index)} className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-white">
                            <X size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
                </button>
              </div>
            </form>
          </section>
        </div>
        ) : activeSection === 'banners' ? (
          <BannerManager onBannersChange={(banners) => {
            const now = Date.now();
            setBannerSummary({
              total: banners.length,
              live: banners.filter((banner) => banner.isActive && (!banner.startsAt || new Date(banner.startsAt).getTime() <= now) && (!banner.endsAt || new Date(banner.endsAt).getTime() >= now)).length,
              upcoming: banners.filter((banner) => banner.isActive && banner.startsAt && new Date(banner.startsAt).getTime() > now).length,
            });
          }} />
        ) : (
          <OrdersManager />
        )}
      </div>
    </div>
  );
}
