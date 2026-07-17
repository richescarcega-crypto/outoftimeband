/**
 * Out of Time flyer template pack (r968).
 * Canonical authored source: OOT_FLYER_TEMPLATE_RECORDS.
 * Legacy FLYER_* maps are derived shims for transition compatibility.
 * Does not change template IDs, artwork sources, names, zones, or versions.
 */

var FLYER_DIMS = {
  square: {w:1080, h:1080},
  story:  {w:1080, h:1920}
};

// Per-template text-overlay zones. y_frac is fraction of canvas height where text BASELINE sits.
var OOT_FLYER_TEMPLATE_RECORDS = [
  {
    id: 'hollywood-square',
    name: 'Flyer 1',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_01_r512.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.815, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true, hideRule: true},
      address: {y_frac: 0.875, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.930, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: '2026-05-12-flyer1-square-clean-stack-r512',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'hollywood-story',
    name: 'Flyer 1',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_01_r513.png',
    textZones: {
      venue: {y_frac: 0.760, x_frac: 0.50, size: 82, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumRule: true, premiumRuleY_frac: 0.820},
      address: {y_frac: 0.833, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.887, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif', premiumBottomRule: true, premiumBottomRuleY_frac: 0.943}
    },
    assetVersion: '2026-05-13-flyer1-story-gold-serif-r517',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'neon-square',
    name: 'Flyer 2',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_02_r473.png',
    textZones: {
      announcement: {y_frac: 0.786, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.798, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.858, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.908, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_02_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'neon-story',
    name: 'Flyer 2',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_02_r464.png',
    textZones: {
      venue: {y_frac: 0.758, x_frac: 0.515, size: 76, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumRule: true, premiumRuleY_frac: 0.824},
      address: {y_frac: 0.846, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.904, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif', premiumBottomRule: true, premiumBottomRuleY_frac: 0.956}
    },
    assetVersion: '2026-05-13-flyer2-story-venue-optical-center-r519',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'skyline-square',
    name: 'Flyer 3',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_03_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.774, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.834, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.884, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_03_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'skyline-story',
    name: 'Flyer 3',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_03_r464.png',
    textZones: {
      venue: {y_frac: 0.715, x_frac: 0.50, size: 82, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumRule: true, premiumRuleY_frac: 0.776},
      address: {y_frac: 0.792, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.848, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif', premiumBottomRule: true, premiumBottomRuleY_frac: 0.900}
    },
    assetVersion: '2026-05-13-flyer3-story-gold-serif-r520',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'deco-square',
    name: 'Flyer 4',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_04_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.767, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.827, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.877, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_04_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'deco-story',
    name: 'Flyer 4',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_04_r464.png',
    textZones: {
      venue: {y_frac: 0.720, x_frac: 0.507, size: 78, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true},
      address: {y_frac: 0.802, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.866, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif'},
      bottomRuleShift: {oldY_frac: 0.958, newY_frac: 0.958, xInset: 118, sampleYOffset: -62, coverHeight: 44, removeOnly: true}
    },
    assetVersion: '2026-05-13-flyer4-story-center-cleanup-r523',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'disco-square',
    name: 'Flyer 5',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_05_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.749, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.809, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.859, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_05_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'disco-story',
    name: 'Flyer 5',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_05_r464.png',
    textZones: {
      venue: {y_frac: 0.736, x_frac: 0.507, size: 74, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true},
      address: {y_frac: 0.818, x_frac: 0.502, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.886, x_frac: 0.502, size: 58, color: '#ffd777', bold: true, font: 'premium-serif'},
      bottomRuleShift: {oldY_frac: 0.835, newY_frac: 0.835, xInset: 118, sampleYOffset: 58, coverHeight: 44, removeOnly: true}
    },
    assetVersion: '2026-05-13-flyer5-story-centering-refine-r525',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'comic-square',
    name: 'Flyer 6',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_06_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.776, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.836, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.886, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_06_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'comic-story',
    name: 'Flyer 6',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_06_r464.png',
    textZones: {
      venue: {y_frac: 0.772, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
      address: {y_frac: 0.844, x_frac: 0.50, size: 32, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.891, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
      bottomRuleShift: {oldY_frac: 0.952, newY_frac: 0.952, xInset: 120, sampleYOffset: 26, coverHeight: 58, removeOnly: true}
    },
    assetVersion: '2026-05-13-flyer6-story-spacing-rebalance-r532',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'metropolis-square',
    name: 'Flyer 7',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_07_r473.png',
    textZones: {
      venue: {y_frac: 0.757, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.817, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.867, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_07_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'metropolis-story',
    name: 'Flyer 7',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_07_r464.png',
    textZones: {
      venue: {y_frac: 0.696, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
      address: {y_frac: 0.775, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.835, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
      bottomRuleShift: {oldY_frac: 0.808, newY_frac: 0.808, xInset: 140, sampleYOffset: 96, coverHeight: 52, removeOnly: true}
    },
    assetVersion: '2026-05-13-flyer7-story-premium-spacing-cleanup-r531',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'boardwalk-square',
    name: 'Flyer 8',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_08_r473.png',
    textZones: {
      venue: {y_frac: 0.756, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.816, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.866, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_08_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'boardwalk-story',
    name: 'Flyer 8',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_08_r464.png',
    textZones: {
      venue: {y_frac: 0.758, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
      address: {y_frac: 0.834, x_frac: 0.50, size: 32, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.898, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
      bottomRuleShift: {oldY_frac: 0.835, newY_frac: 0.835, xInset: 118, sampleYOffset: -62, coverHeight: 54, removeOnly: true}
    },
    assetVersion: '2026-05-13-flyer8-story-premium-artifact-cleanup-r533',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot09-square',
    name: 'Flyer 9',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_09_r473.png',
    textZones: {
      tagline: {y_frac: 0.650, x_frac: 0.50, size: 42, color: '#f5c66b'},
      announcement: {y_frac: 0.699, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.762, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.822, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.872, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_09_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot09-story',
    name: 'Flyer 9',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_09_r464.png',
    textZones: {
      venue: {y_frac: 0.714, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
      address: {y_frac: 0.794, x_frac: 0.50, size: 32, color: '#f6df9f', bold: false, font: 'premium-serif'},
      date: {y_frac: 0.858, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
      bottomRuleShift: {oldY_frac: 0.772, newY_frac: 0.772, xInset: 120, sampleYOffset: 68, coverHeight: 48, removeOnly: true}
    },
    assetVersion: '2026-05-13-flyer9-story-premium-separator-cleanup-r534',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot10-square',
    name: 'Flyer 10',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_10_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.758, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.818, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.868, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_10_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot10-story',
    name: 'Flyer 10',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_10_r464.png',
    textZones: {
      venue: {y_frac: 0.708, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true},
      address: {y_frac: 0.788, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.832, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_story_10_r464.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot11-square',
    name: 'Flyer 11',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_11_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.800, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.860, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.910, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_11_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot11-story',
    name: 'Flyer 11',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_11_r464.png',
    textZones: {
      venue: {y_frac: 0.708, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true},
      address: {y_frac: 0.772, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.800, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_story_11_r464.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot12-square',
    name: 'Flyer 12',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_12_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.764, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.824, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.874, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_12_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot12-story',
    name: 'Flyer 12',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_12_r464.png',
    textZones: {
      venue: {y_frac: 0.708, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true},
      address: {y_frac: 0.810, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.852, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_story_12_r464.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot13-square',
    name: 'Flyer 13',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_13_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.780, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.840, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.890, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_13_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot13-story',
    name: 'Flyer 13',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_13_r504.png',
    textZones: {
      venue: {y_frac: 0.760, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true, ruleY_frac: 0.895, hideRule: true},
      address: {y_frac: 0.818, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.858, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true}
    },
    assetVersion: '2026-05-12-story13-asset-clean-r504',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot14-square',
    name: 'Flyer 14',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_14_r473.png',
    textZones: {
      announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
      venue: {y_frac: 0.788, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.848, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.898, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_14_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot14-story',
    name: 'Flyer 14',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_14_r507.png',
    textZones: {
      venue: {y_frac: 0.724, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true, hideRule: true},
      address: {y_frac: 0.786, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.864, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true}
    },
    assetVersion: '2026-05-12-story14-clean-centered-r507',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot15-square',
    name: 'Flyer 15',
    format: 'square',
    width: 1080,
    height: 1080,
    backgroundSrc: 'oot_flyer_square_15_r473.png',
    textZones: {
      venue: {y_frac: 0.745, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
      address: {y_frac: 0.805, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.855, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true}
    },
    assetVersion: 'oot_flyer_square_15_r473.png',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  },
  {
    id: 'oot15-story',
    name: 'Flyer 15',
    format: 'story',
    width: 1080,
    height: 1920,
    backgroundSrc: 'oot_flyer_story_15_r507.png',
    textZones: {
      venue: {y_frac: 0.735, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true, hideRule: true},
      address: {y_frac: 0.805, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
      date: {y_frac: 0.883, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true}
    },
    assetVersion: '2026-05-12-story15-clean-centered-r507',
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } }
  }
];

function _ootFlyerBuildLegacyShims(records){
  var templates = {};
  var zones = {};
  var names = {};
  var forceRefresh = {};
  (records || []).forEach(function(rec){
    if(!rec || !rec.id) return;
    if(rec.backgroundSrc != null) templates[rec.id] = rec.backgroundSrc;
    if(rec.textZones != null) zones[rec.id] = rec.textZones;
    if(rec.name != null) names[rec.id] = rec.name;
    // Preserve prior force-refresh subset: only when version token differs from src.
    if(rec.assetVersion != null && String(rec.assetVersion) !== String(rec.backgroundSrc || '')){
      forceRefresh[rec.id] = rec.assetVersion;
    }
  });
  return { templates: templates, zones: zones, names: names, forceRefresh: forceRefresh };
}

var _ootFlyerLegacy = _ootFlyerBuildLegacyShims(OOT_FLYER_TEMPLATE_RECORDS);
var FLYER_TEMPLATES = _ootFlyerLegacy.templates;
var FLYER_ZONES = _ootFlyerLegacy.zones;
var FLYER_NAMES = _ootFlyerLegacy.names;
var FLYER_FORCE_REFRESH_TEMPLATES = _ootFlyerLegacy.forceRefresh;

// State (shared with inline flyer generator; inline redefines after load)
var _flyerCtx = {
  format: 'square',
  template: null,
  gig: null,
  venue: '',
  address: '',
  date: '',
  announce: '',
  loadedImages: {},
  loadedImageSrc: {},
  staleSavedRender: false
};

if (typeof window !== 'undefined') {
  window.OOT_FLYER_TEMPLATE_RECORDS = OOT_FLYER_TEMPLATE_RECORDS;
  window.OOT_FLYER_MANIFEST = {
    schemaVersion: 2,
    dims: FLYER_DIMS,
    records: OOT_FLYER_TEMPLATE_RECORDS,
    templates: FLYER_TEMPLATES,
    zones: FLYER_ZONES,
    names: FLYER_NAMES,
    forceRefresh: FLYER_FORCE_REFRESH_TEMPLATES
  };
}
