import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("auth"));
      const expiresAt = Number(stored?.expiresAt);
      return stored?.token && (!expiresAt || expiresAt > Date.now()) ? stored : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (auth) localStorage.setItem("auth", JSON.stringify(auth));
    else localStorage.removeItem("auth");
    const expiresAt = Number(auth?.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= 0) return;
    let timer;
    const scheduleExpiry = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        localStorage.removeItem("auth");
        setAuth(null);
      } else {
        timer = setTimeout(scheduleExpiry, Math.min(remaining, 2147483647));
      }
    };
    timer = setTimeout(scheduleExpiry, Math.max(0, Math.min(expiresAt - Date.now(), 2147483647)));
    return () => clearTimeout(timer);
  }, [auth]);

  const login = (data) => {
    localStorage.setItem("auth", JSON.stringify(data));
    setAuth(data);
  };
  const logout = () => {
    localStorage.removeItem("auth");
    setAuth(null);
  };
  const updateUser = (user) => setAuth(current => current ? { ...current, user } : null);

  return (
    <AuthContext.Provider value={{ user: auth?.user, token: auth?.token, login, logout, updateUser, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

// The provider and its consumer hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
