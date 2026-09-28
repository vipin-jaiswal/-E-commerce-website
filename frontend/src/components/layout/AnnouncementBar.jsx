import { useEffect, useState } from 'react';
import { getStorefrontContent } from '../../services/storefrontContent';

const decodeMessage = (message) => {
  if (typeof message !== 'string' || !message.includes('&')) return message || '';

  const decoder = document.createElement('textarea');
  let decoded = message;
  // Shopify content can be HTML-encoded more than once; decode a few safe text layers.
  for (let i = 0; i < 3 && decoded.includes('&'); i += 1) {
    decoder.innerHTML = decoded;
    const next = decoder.value;
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
};

const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const loadAnnouncement = () => getStorefrontContent().then((content) => {
      if (!active) return;
      setAnnouncement(content.announcement);
      setContentLoaded(true);
    });

    loadAnnouncement();
    const refresh = window.setInterval(loadAnnouncement, 30000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  if (!contentLoaded) return null;

  const message = decodeMessage(announcement?.message);

  if (!message.trim()) {
    return (
      <div className="border-b border-pink-100 bg-white py-2 text-center text-sm font-medium text-primary dark:border-[#2A2A2A] dark:bg-black">
        Announcement is not available
      </div>
    );
  }

  const content = (
    <div className="whitespace-nowrap animate-marquee hover:[animation-play-state:paused] text-sm font-semibold sm:text-base">
      {message}
    </div>
  );

  return (
    <div className="overflow-hidden border-b border-pink-100 bg-white py-2 text-primary dark:border-[#2A2A2A] dark:bg-black">
      {announcement.link ? <a href={announcement.link}>{content}</a> : content}
    </div>
  );
};

export default AnnouncementBar;
