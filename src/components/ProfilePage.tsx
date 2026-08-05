import React, { useEffect, useState, useRef } from 'react';
import { getProfile, updateProfile, getProfileStats, uploadProfileAvatar, createAccountDeletionRequest } from '../api/client';
import { User } from '../types';
import { Plus } from 'lucide-react';

interface ProfilePageProps {
  currentUser?: User | null;
  onReport?: () => void;
}

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onReport }) => {
  const formatLocationValue = (value: unknown) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
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
    return String(value);
  };

  const buildFallbackProfile = (user?: User | null) => {
    if (!user) return null;

    return {
      ...user,
      businessName: user.businessName || user.name,
      description: user.description || '',
      phone: user.phone || '',
      location: formatLocationValue(user.location),
      sellerLocation: formatLocationValue(user.sellerLocation),
      role: user.role,
    };
  };

  const [profile, setProfile] = useState<any>(() => buildFallbackProfile(currentUser));
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const profileUserIdRef = useRef<string | null>(currentUser?.id ?? null);
  const profileLoadRef = useRef(0);
  const dirtyRef = useRef(false);
  const [deleteRequestLoading, setDeleteRequestLoading] = useState(false);

  useEffect(() => {
    const fallbackProfile = buildFallbackProfile(currentUser);
    setProfile((prev: any) => (prev && prev.id === currentUser?.id ? prev : fallbackProfile));
    profileUserIdRef.current = currentUser?.id ?? null;

    const load = async () => {
      if (!currentUser) {
        setLoading(false);
        setStats(null);
        return;
      }

      const loadId = ++profileLoadRef.current;
      setLoading(true);
      try {
        const p = await getProfile();
        if (loadId !== profileLoadRef.current) return;
        setProfile((prev: any) => {
          if (dirtyRef.current) return prev;
          return {
            ...(fallbackProfile || {}),
            ...p,
            id: p?.id || currentUser?.id,
            role: p?.role || currentUser?.role,
          };
        });
      } catch (e: any) {
        console.warn('Profile data unavailable, using local fallback profile.', e?.message || String(e));
        setProfile((prev: any) => (dirtyRef.current ? prev : fallbackProfile));
      }
      try {
        const s = await getProfileStats();
        if (loadId !== profileLoadRef.current) return;
        setStats(s);
      } catch (e: any) {
        console.warn('Profile stats unavailable.', e?.message || String(e));
      }
      if (loadId === profileLoadRef.current) {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const onFieldChange = (key: string, value: any) => {
    dirtyRef.current = true;
    setProfile((prev: any) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const validateProfile = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const locationValue = formatLocationValue(profile.location).trim();

    if (isSeller) {
      if (!profile.businessName?.trim()) {
        setSavedMessage('Business name is required.');
        return false;
      }
      if (!profile.phone?.trim()) {
        setSavedMessage('Phone number is required.');
        return false;
      }
      if (!locationValue) {
        setSavedMessage('Location is required.');
        return false;
      }
    } else {
      if (!profile.name?.trim()) {
        setSavedMessage('Full name is required.');
        return false;
      }
      if (!profile.email?.trim() || !emailPattern.test(profile.email)) {
        setSavedMessage('Enter a valid email address.');
        return false;
      }
      if (!profile.phone?.trim()) {
        setSavedMessage('Phone number is required.');
        return false;
      }
      if (!locationValue) {
        setSavedMessage('State is required.');
        return false;
      }
    }

    return true;
  };

  const onSave = async () => {
    if (!validateProfile()) {
      setTimeout(() => setSavedMessage(''), 3000);
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        businessName: profile.businessName,
        description: profile.description,
        phone: profile.phone,
        location: profile.location,
        sellerLocation: profile.sellerLocation,
      };

      if (!isSeller) {
        payload.name = profile.name;
        payload.email = profile.email;
      }

      const updated = await updateProfile(payload);
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setSavedMessage('✅ Changes Saved!');
      dirtyRef.current = false;
      setDirty(false);
      setTimeout(() => setSavedMessage(''), 2200);
    } catch (e: any) {
      console.error(e?.message || e);
      setSavedMessage('Error saving changes');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = () => fileRef.current?.click();

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      e.target.value = '';
      return;
    }

    if (pendingAvatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }

    const previewUrl = URL.createObjectURL(f);
    setPendingAvatarFile(f);
    setPendingAvatarPreview(previewUrl);
    setSavedMessage('📷 Photo selected. Tap Upload photo to save it.');
    setTimeout(() => setSavedMessage(''), 2400);
    e.target.value = '';
  };

  const uploadAvatarFile = async (file: File) => {
    setAvatarUploading(true);
    try {
      const res = await uploadProfileAvatar(file);
      setProfile((prev: any) => ({ ...prev, avatar: res.avatar }));
      setSavedMessage('✅ Avatar updated');
      setDirty(false);
      if (pendingAvatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
      setPendingAvatarFile(null);
      setPendingAvatarPreview(null);
      setTimeout(() => setSavedMessage(''), 2200);
    } catch (err: any) {
      console.error(err?.message || err);
      setSavedMessage(err?.response?.data?.error || 'Unable to upload profile photo.');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setAvatarUploading(false);
    }
  };

  const uploadSelectedAvatar = async () => {
    if (!pendingAvatarFile) return;
    await uploadAvatarFile(pendingAvatarFile);
  };

  if (loading && !profile) return <div className="pt-24 px-6">Loading profile...</div>;
  if (!profile) return <div className="pt-24 px-6">Unable to load profile. Please sign in again.</div>;

  const isSeller = profile.role === 'seller';
  const badgeText = isSeller ? '✦ VERIFIED SELLER' : '✦ ACTIVE MEMBER';
  const summaryLabel = isSeller ? 'Store summary' : 'Personal information';

  return (
    <div className="pt-24 pb-20 bg-[#f0f2f5] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(90deg,#0f1923 0%, #1a3a28 50%, #3a7d44 100%)' }}>
          <div className="p-6 sm:p-8 md:p-12 flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full min-w-0">
              <div className="relative flex-shrink-0">
                <img src={pendingAvatarPreview || profile.avatar || `https://i.pravatar.cc/150?u=${profile.id}`} alt="avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 ring-white object-cover" />
                <button onClick={pickAvatar} className="absolute right-0 bottom-0 bg-white p-2 rounded-full shadow-md -translate-x-2 translate-y-2" aria-label="Upload profile photo">
                  <Plus className="w-4 h-4 text-slate-800" />
                </button>
                <label htmlFor="avatarUpload" className="sr-only">Upload profile photo</label>
                <input id="avatarUpload" name="avatar" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
              </div>
              <div className="text-white min-w-0 w-full">
                <div className="text-2xl md:text-4xl font-semibold break-words">{profile.businessName || profile.name}</div>
                <div className="text-sm text-white/80 mt-1 break-all">{profile.email}</div>
                <div className="mt-3 max-w-xl text-sm leading-6 text-slate-200"></div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a7d44] bg-[#2b6b3b]/20 text-sm">
                    <span className="text-[#3a7d44]">{badgeText}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto md:mt-0">
              <div className="flex flex-wrap gap-2 bg-white/10 rounded-3xl p-2">
                <button className="px-4 py-2 rounded-2xl text-white bg-white/10">Profile</button>
                <button className="px-4 py-2 rounded-2xl text-white/60">Listings</button>
                <button className="px-4 py-2 rounded-2xl text-white/60">Account</button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {isSeller && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Active Listings', value: stats?.activeListings ?? 0 },
              { label: 'Average Rating', value: stats?.avgRating ? `${stats.avgRating.toFixed(1)}/5` : '—' },
              { label: 'Total Reviews', value: stats?.totalReviews ?? 0 },
              { label: 'Sales Done', value: stats?.sales ?? 0 },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition transform hover:-translate-y-1">
                <div className="text-sm text-slate-500">{s.label}</div>
                <div className="text-2xl font-semibold mt-2">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 mt-6">
          {/* Profile form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{isSeller ? 'Store Information' : 'Personal Information'}</h3>
            <div className="space-y-4">
              {isSeller ? (
                <>
                  <div>
                    <label htmlFor="businessName" className="text-sm text-slate-600">Business Name</label>
                    <input id="businessName" name="businessName" value={profile.businessName || ''} onChange={e => onFieldChange('businessName', e.target.value)} className="w-full mt-2 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]" />
                  </div>
                  <div>
                    <label htmlFor="description" className="text-sm text-slate-600">Description <span className="text-xs text-slate-400">(max 300)</span></label>
                    <textarea id="description" name="description" value={profile.description || ''} onChange={e => onFieldChange('description', e.target.value)} maxLength={300} className="w-full mt-2 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8e8] min-h-[120px]" />
                    <div className="text-xs text-slate-400 text-right">{(profile.description || '').length}/300</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="name" className="text-sm text-slate-600">Full Name</label>
                    <input id="name" name="name" value={profile.name || ''} onChange={e => onFieldChange('name', e.target.value)} className="w-full mt-2 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]" />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm text-slate-600">Email</label>
                    <input id="email" name="email" value={profile.email || ''} onChange={e => onFieldChange('email', e.target.value)} className="w-full mt-2 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#3a7d44]" />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="phone" className="text-sm text-slate-600">Phone</label>
                <div className="mt-2 flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg bg-[#fafafa] border border-r-0 border-[#e8e8e8]">🇳🇬 +234</span>
                  <input id="phone" name="phone" value={profile.phone || ''} onChange={e => onFieldChange('phone', e.target.value)} className="flex-1 p-3 rounded-r-lg bg-[#fafafa] border border-[#e8e8e8]" />
                </div>
              </div>
              <div>
                <label htmlFor="location" className="text-sm text-slate-600">{isSeller ? 'Location' : 'State'}</label>
                <select id="location" name="location" value={formatLocationValue(profile.location)} onChange={e => onFieldChange('location', e.target.value)} className="w-full mt-2 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8e8]">
                  <option value="">{isSeller ? 'Select state' : 'Select state'}</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {isSeller && (
                <div>
                  <label htmlFor="sellerLocation" className="text-sm text-slate-600">Seller Location</label>
                  <select id="sellerLocation" name="sellerLocation" value={formatLocationValue(profile.sellerLocation)} onChange={e => onFieldChange('sellerLocation', e.target.value)} className="w-full mt-2 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8e8]">
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <button onClick={onSave} disabled={!dirty || saving} className={`w-full p-3 rounded-lg text-white font-semibold ${dirty ? 'bg-gradient-to-r from-[#2f6936] to-[#3a7d44]' : 'bg-slate-300'}`}>
                  {saving ? '💾 Saving…' : (savedMessage || 'Save Changes')}
                </button>
              </div>

              <div className="flex gap-3 mt-3">
                <button type="button" className="flex-1 p-3 rounded-lg border border-slate-300">Change Password</button>
                <button type="button" onClick={() => setShowDeleteModal(true)} className="flex-1 p-3 rounded-lg border border-rose-300 text-rose-600">Delete Account</button>
              </div>
            </div>
          </div>

          {/* Preview / Summary */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-slate-500">{summaryLabel}</div>
              <div className="mt-3">
                <div className="font-semibold">{isSeller ? (profile.businessName || profile.name) : profile.name}</div>
                <div className="text-sm text-slate-500">{profile.email}</div>
                {isSeller ? (
                  <div className="mt-3 text-sm text-slate-600">{profile.description || 'No description yet.'}</div>
                ) : (
                  <>
                    <div className="mt-3 text-sm text-slate-600">Phone: {profile.phone || 'Not provided'}</div>
                    <div className="text-sm text-slate-600">State: {formatLocationValue(profile.location) || 'Not provided'}</div>
                  </>
                )}
              </div>
            </div>


            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-slate-500">Quick actions</div>
              <div className="mt-3 flex flex-col gap-2">
                <button onClick={pickAvatar} className="w-full p-3 rounded-lg border border-slate-200">Choose Profile Photo</button>
                {pendingAvatarFile && (
                  <button onClick={uploadSelectedAvatar} disabled={avatarUploading} className="w-full p-3 rounded-lg bg-[#3a7d44] text-white font-semibold disabled:opacity-60">
                    {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                  </button>
                )}
                <button type="button" className="w-full p-3 rounded-lg border border-slate-200">View Listings</button>
                {onReport && (
                  <button type="button" onClick={onReport} className="w-full p-3 rounded-lg border border-amber-400 text-amber-700 font-semibold">
                    Report a user
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Request Account Deletion</div>
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteReason(''); }} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">A deletion request will be sent to the admin. Your account remains active until approval.</p>
              <label htmlFor="account-delete-reason" className="text-sm text-slate-600">Reason for deletion</label>
              <textarea
                id="account-delete-reason"
                rows={5}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 p-4 text-sm"
                placeholder="Please describe why you want to delete your account"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteReason(''); }} className="flex-1 rounded-3xl border border-slate-300 px-4 py-3 text-slate-700">Cancel</button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!deleteReason.trim()) {
                      setSavedMessage('Please provide a reason for account deletion.');
                      setTimeout(() => setSavedMessage(''), 3000);
                      return;
                    }

                    setDeleteRequestLoading(true);
                    try {
                      await createAccountDeletionRequest(deleteReason.trim());
                      setSavedMessage('✅ Deletion request sent to admin.');
                      setShowDeleteModal(false);
                      setDeleteReason('');
                    } catch (error: any) {
                      console.error(error?.message || error);
                      setSavedMessage(error?.response?.data?.error || 'Unable to send deletion request.');
                    } finally {
                      setDeleteRequestLoading(false);
                      setTimeout(() => setSavedMessage(''), 3000);
                    }
                  }}
                  disabled={deleteRequestLoading}
                  className="flex-1 rounded-3xl bg-rose-600 px-4 py-3 text-white disabled:opacity-60"
                >
                  {deleteRequestLoading ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {savedMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg">{savedMessage}</div>
      )}
    </div>
  );
};

export default ProfilePage;
