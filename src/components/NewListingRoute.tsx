import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Listing, User as UserType } from '../types';

export type ListingFormValues = {
  title: string;
  description: string;
  price: string;
  category: string;
  location: string;
  images: string[];
  condition: 'New' | 'Like New' | 'Used' | 'Refurbished';
};

type NewListingRouteProps = {
  currentUser: UserType | null;
  editingListing: Listing | null;
  listingForm: ListingFormValues;
  listingError: string | null;
  createListingTitleRef: React.RefObject<HTMLInputElement | null>;
  handleListingTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleListingDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleListingSelectChange: (field: 'price' | 'category' | 'location', value: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleImageRemove: (index: number) => void;
  saveListing: () => Promise<void>;
  setListingForm: React.Dispatch<React.SetStateAction<ListingFormValues>>;
  navigate: ReturnType<typeof useNavigate>;
  listingSubmitting: boolean;
  listingSuccess: string | null;
  handleConditionChange: (condition: ListingFormValues['condition']) => void;
  listingValidationErrors: Partial<Record<'title' | 'description' | 'price' | 'category' | 'location' | 'condition' | 'images', string>>;
};

export function NewListingRoute({
  currentUser,
  editingListing,
  listingForm,
  listingError,
  createListingTitleRef,
  handleListingTitleChange,
  handleListingDescriptionChange,
  handleListingSelectChange,
  handleImageUpload,
  handleImageDrop,
  handleImageRemove,
  saveListing,
  setListingForm,
  navigate,
  listingSubmitting,
  listingSuccess,
  handleConditionChange,
  listingValidationErrors,
}: NewListingRouteProps) {
  const conditions = ['New', 'Like New', 'Used', 'Refurbished'] as const;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveListing();
  };

  return (
    <div className="pt-24 pb-32 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="sticky top-20 z-30 bg-slate-50 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <button type="button" onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-900">← Back</button>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">{editingListing ? 'Edit listing' : 'Create new listing'}</h1>
              <p className="mt-2 text-slate-500 max-w-2xl">Build a standout listing with clear details, category, location and image previews.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              Quick listing form · mobile friendly · secure publish
            </div>
          </div>
        </div>

        <form id="listing-form" onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">Listing details</div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    id="title"
                    ref={createListingTitleRef}
                    type="text"
                    value={listingForm.title || ''}
                    onChange={handleListingTitleChange}
                    placeholder="e.g. Apple iPhone 14 in excellent condition"
                    name="title"
                    spellCheck={true}
                    autoCapitalize="sentences"
                    autoCorrect="on"
                    autoFocus
                    className={`w-full rounded-3xl border bg-slate-50 px-5 py-4 text-lg text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${listingValidationErrors.title ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  {listingValidationErrors.title && <p className="mt-2 text-sm text-red-600">{listingValidationErrors.title}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    id="description"
                    value={listingForm.description || ''}
                    onChange={handleListingDescriptionChange}
                    placeholder="Describe the item, features and condition clearly."
                    name="description"
                    spellCheck={true}
                    autoCapitalize="sentences"
                    autoCorrect="on"
                    className={`w-full min-h-[160px] rounded-3xl border bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none ${listingValidationErrors.description ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  {listingValidationErrors.description && <p className="mt-2 text-sm text-red-600">{listingValidationErrors.description}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-2">Price (NGN)</label>
                    <input
                      id="price"
                      name="price"
                      type="text"
                      value={listingForm.price}
                      onChange={e => handleListingSelectChange('price', e.target.value)}
                      placeholder="0"
                      className={`w-full rounded-3xl border bg-slate-50 px-5 py-4 text-lg outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${listingValidationErrors.price ? 'border-red-300' : 'border-slate-200'}`}
                    />
                    {listingValidationErrors.price && <p className="mt-2 text-sm text-red-600">{listingValidationErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Condition</label>
                    <div className="grid grid-cols-2 gap-2">
                      {conditions.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleConditionChange(option)}
                          className={`rounded-3xl border px-4 py-3 text-sm font-medium transition ${listingForm.condition === option ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={listingForm.category}
                      onChange={e => handleListingSelectChange('category', e.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition focus:border-emerald-500"
                    >
                      {['Electronics','Fashion','Furniture','Vehicles','Food & Drinks','Real Estate','Services','Agriculture','Sports','Books','Health & Beauty','Pharmercy','Home & Garden','Others'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <select
                      id="location"
                      name="location"
                      value={listingForm.location}
                      onChange={e => handleListingSelectChange('location', e.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition focus:border-emerald-500"
                    >
                      {['Lagos','Abuja','Port Harcourt','Kano','Ibadan','Enugu','Kaduna','Benin City','Abeokuta','Owerri','Jos','Akure','Ilorin','Uyo','Maiduguri','Sokoto','Katsina','Bauchi','Gombe','Yola'].map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    {listingValidationErrors.location && <p className="mt-2 text-sm text-red-600">{listingValidationErrors.location}</p>}
                    {listingValidationErrors.category && <p className="mt-2 text-sm text-red-600">{listingValidationErrors.category}</p>}
                  </div>
                </div>
              </div>
              {listingValidationErrors.condition && <p className="mt-3 text-sm text-red-600">{listingValidationErrors.condition}</p>}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Images</div>
                  <p className="text-sm text-slate-500 mt-1">Upload up to 5 photos. Drag and drop or browse from your device.</p>
                </div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Max 5 files</div>
              </div>
              <div onDrop={handleImageDrop} onDragOver={event => event.preventDefault()} className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-emerald-400 hover:bg-white cursor-pointer">
                <label htmlFor="listingImages" className="cursor-pointer flex flex-col items-center justify-center gap-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">Drag & drop images here</div>
                  <div className="text-sm text-slate-500">or <span className="text-emerald-600">browse files</span></div>
                  <input id="listingImages" name="images" multiple type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                </label>
              </div>

              {listingValidationErrors.images && <p className="mt-3 text-sm text-red-600">{listingValidationErrors.images}</p>}
              {listingForm.images.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {listingForm.images.map((img, index) => (
                    <div key={index} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                      <img src={img} alt={`preview-${index}`} className="h-40 w-full object-cover" />
                      <button type="button" onClick={() => handleImageRemove(index)} className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-md hover:bg-slate-100">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {listingError && <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{listingError}</div>}
            {listingSuccess && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{listingSuccess}</div>}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">Listing preview</div>
              <div className="rounded-3xl overflow-hidden bg-slate-100">
                {listingForm.images.length > 0 ? (
                  <img src={listingForm.images[0]} alt="Preview" className="h-64 w-full object-cover" />
                ) : (
                  <div className="flex h-64 items-center justify-center text-slate-400">Image preview appears here</div>
                )}
              </div>
              <div className="mt-5 space-y-3">
                <div className="text-lg font-semibold text-slate-900">{listingForm.title || 'Your listing title'}</div>
                <div className="text-2xl font-semibold text-slate-900">₦{listingForm.price ? Number(listingForm.price).toLocaleString() : '0'}</div>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{listingForm.condition}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{listingForm.category}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{listingForm.location}</span>
                </div>
                <p className="text-sm leading-6 text-slate-600">{listingForm.description || 'A quick summary of your listing will show here while you build it.'}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">Seller summary</div>
              <div className="space-y-3 text-sm text-slate-600">
                <div><span className="font-semibold text-slate-900">Seller</span>: {currentUser?.name || 'You'}</div>
                <div><span className="font-semibold text-slate-900">Status</span>: {editingListing ? 'Editing draft' : 'Ready to publish'}</div>
                <div><span className="font-semibold text-slate-900">Visibility</span>: Public marketplace</div>
              </div>
            </div>
          </aside>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" form="listing-form" disabled={listingSubmitting} className="flex-1 rounded-3xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400">{listingSubmitting ? 'Publishing...' : editingListing ? 'Save changes' : 'Publish listing'}</button>
        </div>
      </div>
    </div>
  );
}
