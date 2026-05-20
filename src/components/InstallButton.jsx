import { useEffect, useState, useCallback } from 'react';

export default function InstallButton() {
  const [installable, setInstallable] = useState(false);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    let deferredPrompt = null;

    const handler = () => {
      setInstallable(true);
      triggerBounce();
    };

    window.addEventListener('pwa-install-available', handler);

    return () => {
      window.removeEventListener('pwa-install-available', handler);
    };
  }, []);

  const triggerBounce = useCallback(() => {
    setBounce(true);
    const timer = setTimeout(() => setBounce(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    const outcome = await window.installPWA();
    if (outcome === 'accepted') {
      setInstallable(false);
    }
  };

  if (!installable) return null;

  return (
    <div
      role="dialog"
      aria-label="Install HappyMoment app"
      className={[
        'fixed bottom-20 right-5 z-50',
        'flex items-center gap-3 p-3 pr-5',
        'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600',
        'text-white rounded-full shadow-2xl cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_8px_32px_rgba(236,72,153,0.6)]',
        'hover:scale-105 active:scale-95',
        bounce ? 'animate-bounce-in' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleInstall}
    >
      <img
        src="https://res.cloudinary.com/djjgkezui/image/upload/v1778959179/IMG-20260516-WA0050_zegaok.jpg"
        alt="HappyMoment"
        className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
      />
      <span className="text-sm font-semibold tracking-wide">
        Install App
      </span>
    </div>
  );
}
