import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentPosition, reverseGeocode } from '../../utils/geocoding';

export default function LocationButton({ onLocate }) {
  const [status, setStatus] = useState('idle'); // idle | locating | resolving

  const handleClick = async () => {
    try {
      setStatus('locating');
      const coords = await getCurrentPosition();

      setStatus('resolving');
      const resolved = await reverseGeocode(coords.latitude, coords.longitude);

      onLocate(resolved);
      toast.success('Location detected');
    } catch (err) {
      const message = err?.message || 'Could not detect your location';
      toast.error(message);
    } finally {
      setStatus('idle');
    }
  };

  const isBusy = status !== 'idle';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isBusy ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {status === 'locating' ? 'Getting your location…' : 'Finding your address…'}
        </>
      ) : (
        <>
          <MapPin size={16} />
          Use Current Location
        </>
      )}
    </button>
  );
}
