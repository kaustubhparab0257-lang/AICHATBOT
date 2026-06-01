const AUTH_EVENT = "chatgen-auth-change";

export function subscribeToAuth(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT, callback);
  };
}

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAuthToken() {
  return localStorage.getItem("token");
}

export function getStoredUser() {
  return localStorage.getItem("user");
}

export function setAuthSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  notifyAuthChange();
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  notifyAuthChange();
}
