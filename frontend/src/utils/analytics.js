/**
 * Event Tracking Utility for QR Menu Platform Conversion Funnel
 */
export const trackEvent = (eventName, eventData = {}) => {
  const timestamp = new Date().toISOString();
  const payload = {
    event: eventName,
    data: eventData,
    timestamp,
  };

  // Log in development environment for verification
  if (import.meta.env.DEV) {
    console.log(`[Analytics Event Tracked]: ${eventName}`, payload);
  }

  // Push to dataLayer if Google Tag Manager / Analytics is configured
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(payload);
  }
};
