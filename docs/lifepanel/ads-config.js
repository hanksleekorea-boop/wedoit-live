// Public advertising configuration only. Never place secrets, tax, payment, or identity data here.
globalThis.LIFEPANEL_ADS_CONFIG = Object.freeze({
  provider: "google-adsense",
  enabled: false,
  publisherId: "",
  slots: Object.freeze({ resourceLibrary: "" }),
  googleCertifiedCmp: false,
  siteApproved: false,
  personalizedAds: false,
  allowedOrigins: Object.freeze([
    "https://hanksleekorea-boop.github.io",
    "http://127.0.0.1:8880",
  ]),
});
