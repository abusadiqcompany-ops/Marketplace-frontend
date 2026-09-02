import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Listing } from '../types';

export type ListingFormValues = {
  title: string;
  description: string;
  price: string;
  discountEnabled: boolean;
  discountPercentage: string;
  category: string;
  location: string;
  images: string[];
  condition: 'New' | 'Like New' | 'Used' | 'Refurbished';
};

type NewListingFormProps = {
  onCancel?: () => void;
  onPublish?: (values: ListingFormValues) => Promise<boolean> | boolean | void;
  editingListing?: Listing | null;
};

const categories = ['Electronics', 'Phone&Accessories', 'Fashion', 'Shoes', 'Clothes', 'Caps', 'Furniture', 'perfume', 'Vehicles', 'Food & Drinks', 'Real Estate', 'Services', 'Agriculture', 'Sports', 'Books', 'Health & Beauty', 'Pharmercy', 'Home & Garden', 'Others'];
const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Kaduna', 'Benin City', 'Abeokuta', 'Owerri', 'Jos', 'Akure', 'Ilorin', 'Uyo', 'Maiduguri', 'Sokoto', 'Katsina', 'Bauchi', 'Gombe', 'Yola'];
const conditions = ['New', 'Like New', 'Used', 'Refurbished'] as const;

const normalizeLocationValue = (location: Listing['location'] | undefined) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const record = location as Record<string, unknown>;
    if (typeof record.city === 'string' && typeof record.state === 'string') {
      return `${record.city}, ${record.state}`;
    }
    if (typeof record.state === 'string') {
      return record.state;
    }
    if (typeof record.country === 'string') {
      return record.country;
    }
  }
  return '';
};

const createInitialFormValues = (listing?: Listing | null): ListingFormValues => ({
  title: listing?.title ?? '',
  description: listing?.description ?? '',
  price: listing?.originalPrice ? String(listing.originalPrice) : listing?.price?.toString() ?? '',
  discountEnabled: Boolean(listing?.discountEnabled ?? false),
  discountPercentage: listing?.discountPercentage ? String(listing.discountPercentage) : '0',
  category: listing?.category ?? categories[0],
  location: normalizeLocationValue(listing?.location) || locations[0],
  images: listing?.images ?? [],
  condition: listing?.condition ?? 'New',
});

export function NewListingForm({ onCancel, onPublish, editingListing }: NewListingFormProps) {
  const [form, setForm] = useState<ListingFormValues>(() => createInitialFormValues(editingListing));
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(createInitialFormValues(editingListing));
    setSubmitError(null);
  }, [editingListing]);

  const previewPrice = useMemo(() => {
    const parsed = Number(form.price);
    const discountValue = form.discountEnabled ? Number(form.discountPercentage || 0) : 0;
    const validDiscount = Number.isFinite(parsed) && parsed > 0 && Number.isFinite(discountValue) && discountValue > 0 && discountValue <= 90;
    const nextPrice = validDiscount ? parsed * (1 - discountValue / 100) : parsed;
    return Number.isFinite(nextPrice) && nextPrice > 0 ? nextPrice.toLocaleString() : '0';
  }, [form.price, form.discountEnabled, form.discountPercentage]);

  const handleFieldChange = (field: keyof ListingFormValues, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (condition: ListingFormValues['condition']) => {
    setForm(prev => ({ ...prev, condition }));
  };

  const handleFiles = async (files: FileList | null) => {
    const picked = Array.from(files || []).slice(0, 5 - form.images.length);
    if (!picked.length) return;

    const nextImages = await Promise.all(picked.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));

    setForm(prev => ({ ...prev, images: [...prev.images, ...nextImages] }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(event.target.files);
    event.target.value = '';
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    void handleFiles(event.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleDropzoneClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('label, input')) return;
    openPicker();
  };

  const handleDropzoneKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const resetForm = () => {
    setForm(createInitialFormValues());
  };

  const handlePublish = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Use requestAnimationFrame to ensure button feedback is immediate
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const result = await Promise.resolve(onPublish?.(form));
      if (result !== false) {
        resetForm();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to publish listing';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{editingListing ? 'Edit listing' : 'Create new listing'}</h1>
              <p className="mt-2 text-sm text-slate-500">Add your listing details, upload images, and preview how it will appear.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="listing-title" className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                <input
                  id="listing-title"
                  value={form.title}
                  onChange={e => handleFieldChange('title', e.target.value)}
                  placeholder="e.g. Apple iPhone 14 in excellent condition"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label htmlFor="listing-description" className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  id="listing-description"
                  value={form.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  placeholder="Describe the item, features and condition clearly."
                  className="min-h-[160px] w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-[16px] leading-6 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="listing-price" className="mb-2 block text-sm font-medium text-slate-700">Original Price (NGN)</label>
                  <input
                    id="listing-price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={e => handleFieldChange('price', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Condition</label>
                  <div className="grid grid-cols-2 gap-2">
                    {conditions.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleConditionChange(option)}
                        className={`rounded-3xl border px-4 py-3 text-sm font-medium transition ${form.condition === option ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-700">Add discount</label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, discountEnabled: !prev.discountEnabled, discountPercentage: prev.discountEnabled ? '0' : prev.discountPercentage || '10' }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${form.discountEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    aria-label="Toggle discount"
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${form.discountEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {form.discountEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="listing-discount-percentage" className="mb-2 block text-sm font-medium text-slate-700">Discount Percentage (%)</label>
                      <input
                        id="listing-discount-percentage"
                        type="number"
                        min="1"
                        max="90"
                        step="0.01"
                        value={form.discountPercentage}
                        onChange={e => handleFieldChange('discountPercentage', e.target.value)}
                        placeholder="10"
                        className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="w-full rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Preview</div>
                        <div className="mt-1 font-semibold">₦{previewPrice}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="listing-category" className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                  <select
                    id="listing-category"
                    value={form.category}
                    onChange={e => handleFieldChange('category', e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="listing-location" className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                  <select
                    id="listing-location"
                    value={form.location}
                    onChange={e => handleFieldChange('location', e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500"
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Images</h2>
                <p className="text-sm text-slate-500">Upload up to 5 photos. Drag and drop or browse from your device.</p>
              </div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Max 5 files</div>
            </div>

            <div
              data-testid="image-dropzone"
              onClick={handleDropzoneClick}
              onDrop={handleImageDrop}
              onDragOver={event => {
                event.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragEnter={event => {
                event.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={event => {
                event.preventDefault();
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDraggingOver(false);
                }
              }}
              className={`rounded-[28px] border border-dashed p-8 text-center transition ${isDraggingOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-white'}`}
            >
              <label
                htmlFor="listing-images"
                tabIndex={0}
                role="button"
                onKeyDown={handleDropzoneKeyDown}
                className="flex cursor-pointer flex-col items-center justify-center gap-3"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">Drag & drop images here</div>
                <div className="text-sm text-slate-500">or <span className="text-emerald-600">browse files</span></div>
                <input ref={fileInputRef} id="listing-images" type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} />
              </label>
            </div>

            {form.images.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {form.images.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                    <img src={image} alt={`preview-${index}`} width="600" height="400" loading="lazy" decoding="async" className="h-40 w-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">×</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="w-full max-w-xl space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Listing preview</div>
            <div className="overflow-hidden rounded-[28px] bg-slate-100">
              {form.images.length > 0 ? (
                <img src={form.images[0]} alt="Preview" width="600" height="400" decoding="async" className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-slate-400">Image preview appears here</div>
              )}
            </div>
            <div className="mt-5 space-y-3">
              <div className="text-lg font-semibold text-slate-900">{form.title || 'Your listing title'}</div>
              <div className="space-y-1">
                {form.discountEnabled && Number(form.discountPercentage || 0) > 0 && (
                  <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">-{Number(form.discountPercentage).toFixed(0)}%</div>
                )}
                <div className="text-2xl font-semibold text-slate-900">₦{previewPrice}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{form.condition}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{form.category}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{form.location}</span>
              </div>
              <p className="text-sm leading-6 text-slate-600">{form.description || 'A quick summary of your listing will show here while you build it.'}</p>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            {submitError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
              <button type="button" onClick={handlePublish} disabled={isSubmitting} className="flex-1 rounded-3xl bg-emerald-600 px-5 py-4 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                {isSubmitting ? 'Publishing...' : editingListing ? 'Update listing' : 'Publish listing'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
