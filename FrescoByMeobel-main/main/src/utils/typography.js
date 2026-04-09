// Nuptial Mobile Typography Specification
// Primary Typeface: Inter

export const typography = {
  // Font families
  fontFamily: {
    primary: 'Inter, system-ui, sans-serif',
  },

  // Typography tokens with semantic mapping
  tokens: {
    display: {
      className: 'text-display font-inter font-semibold',
      size: '28px',
      lineHeight: '34px',
      weight: '600',
      usage: 'Dashboard hero metrics, KPI banners'
    },
    h1: {
      className: 'text-h1 font-inter font-semibold',
      size: '22px',
      lineHeight: '28px',
      weight: '600',
      usage: 'Screen titles, modal headers'
    },
    h2: {
      className: 'text-h2 font-inter font-medium',
      size: '18px',
      lineHeight: '24px',
      weight: '500',
      usage: 'Section headers, card titles'
    },
    body: {
      className: 'text-body font-inter font-normal',
      size: '15px',
      lineHeight: '22px',
      weight: '400',
      usage: 'Default paragraphs, list content'
    },
    caption: {
      className: 'text-caption font-inter font-normal text-caption-color',
      size: '13px',
      lineHeight: '18px',
      weight: '400',
      usage: 'Metadata, helper text (lower opacity)'
    },
    micro: {
      className: 'text-micro font-inter font-normal',
      size: '11px',
      lineHeight: '16px',
      weight: '400',
      usage: 'Inline labels, input hints'
    }
  },

  // Button typography
  button: {
    className: 'font-inter font-medium',
    weight: '500',
    usage: 'Primary, secondary button labels'
  },

  // Numeric emphasis
  numeric: {
    className: 'font-semibold',
    weight: '600',
    usage: 'Budget totals, counts, progress values'
  }
};

// Helper functions for applying typography
export const getTypographyClass = (token) => {
  return typography.tokens[token]?.className || '';
};

export const getButtonTypographyClass = () => {
  return typography.button.className;
};

export const getNumericTypographyClass = () => {
  return typography.numeric.className;
};

// Usage rules and validation
export const typographyRules = {
  // Never center body text
  bodyAlignment: 'text-left',
  
  // No italics allowed
  noItalics: true,
  
  // Spacing rules
  spacing: {
    beforeH2: '24px',
    paragraph: '12px'
  },
  
  // Color opacity for caption text
  captionOpacity: '0.7',
  
  // Minimum body text size
  minBodySize: '15px'
};
