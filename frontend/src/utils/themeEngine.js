// Theme Engine for QR Menu Platform
// Centralized theme generator and dynamic CSS variable injector

export const DEFAULT_GARDEN_THEME = {
  name: 'Garden Minimal',
  primary: '#173D32',
  primaryHover: '#102B23',
  secondary: '#53685C',
  accent: '#D7B56D',
  background: '#F7F4EC',
  surface: '#FFFFFF',
  text: '#18211D',
  muted: '#6F7772',
  border: 'rgba(23, 61, 50, 0.10)',
  fontHeading: "'Playfair Display', Georgia, serif",
  fontBody: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
  radius: '18px',
  cardShadow: '0 4px 20px -2px rgba(23, 61, 50, 0.05)'
};

/**
 * Resolve theme tokens from cafe branding or defaults
 */
export const resolveCafeTheme = (cafe) => {
  const branding = cafe?.branding || {};
  return {
    primary: branding.primaryColor || DEFAULT_GARDEN_THEME.primary,
    primaryHover: branding.primaryHover || '#102B23',
    secondary: branding.secondaryColor || DEFAULT_GARDEN_THEME.secondary,
    accent: branding.accentColor || DEFAULT_GARDEN_THEME.accent,
    background: branding.backgroundColor || DEFAULT_GARDEN_THEME.background,
    surface: branding.surfaceColor || DEFAULT_GARDEN_THEME.surface,
    text: branding.textColor || DEFAULT_GARDEN_THEME.text,
    muted: branding.mutedColor || DEFAULT_GARDEN_THEME.muted,
    border: branding.borderColor || DEFAULT_GARDEN_THEME.border,
    fontHeading: branding.fontFamily ? `'${branding.fontFamily}', serif` : DEFAULT_GARDEN_THEME.fontHeading,
    fontBody: DEFAULT_GARDEN_THEME.fontBody,
    radius: branding.borderRadius || DEFAULT_GARDEN_THEME.radius,
    cardShadow: DEFAULT_GARDEN_THEME.cardShadow
  };
};

/**
 * Apply dynamic CSS variables to target element (defaults to document.documentElement)
 */
export const applyCafeTheme = (cafe, targetElement = document.documentElement) => {
  const theme = resolveCafeTheme(cafe);

  targetElement.style.setProperty('--cafe-primary', theme.primary);
  targetElement.style.setProperty('--cafe-primary-hover', theme.primaryHover);
  targetElement.style.setProperty('--cafe-secondary', theme.secondary);
  targetElement.style.setProperty('--cafe-accent', theme.accent);
  targetElement.style.setProperty('--cafe-background', theme.background);
  targetElement.style.setProperty('--cafe-surface', theme.surface);
  targetElement.style.setProperty('--cafe-text', theme.text);
  targetElement.style.setProperty('--cafe-muted', theme.muted);
  targetElement.style.setProperty('--cafe-border', theme.border);
  targetElement.style.setProperty('--cafe-font-heading', theme.fontHeading);
  targetElement.style.setProperty('--cafe-font-body', theme.fontBody);
  targetElement.style.setProperty('--cafe-radius', theme.radius);
  targetElement.style.setProperty('--cafe-shadow', theme.cardShadow);

  return theme;
};
