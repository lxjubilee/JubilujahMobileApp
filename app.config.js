// Dynamic Expo config: starts from app.json and injects secrets from the
// environment (Expo auto-loads .env) into `extra`, so credentials never live in
// the committed app.json. Non-secret config stays in app.json.
//
// `config` is the resolved app.json content passed in by Expo.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    jiServiceClientSecret:
      process.env.JI_SERVICE_CLIENT_SECRET || config.extra?.jiServiceClientSecret || '',
    authMobileClientKey:
      process.env.AUTH_MOBILE_CLIENT_KEY || config.extra?.authMobileClientKey || '',
  },
});
