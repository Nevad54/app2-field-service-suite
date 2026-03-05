export const AUTH_STORAGE_KEY = 'app2_auth';
export const CLIENT_AUTH_STORAGE_KEY = 'app2_client_auth';
export const DARK_MODE_KEY = 'app2_dark_mode';

export const loadStoredDarkMode = () => {
  try {
    const raw = localStorage.getItem(DARK_MODE_KEY);
    return raw === 'true';
  } catch (e) {
    return false;
  }
};

export const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token || !parsed.user) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

export const loadStoredClientAuth = () => {
  try {
    const raw = localStorage.getItem(CLIENT_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token || !parsed.user) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};
