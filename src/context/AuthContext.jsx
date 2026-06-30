import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [gym, setGym] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyGymTheme = (gymData) => {
    if (!gymData) return;
    const root = document.documentElement;
    if (gymData.primaryColor) root.style.setProperty('--color-primary', gymData.primaryColor);
    if (gymData.secondaryColor) root.style.setProperty('--color-secondary', gymData.secondaryColor);
  };

  useEffect(() => {
    const token = localStorage.getItem('gymvip_token');
    const savedUser = localStorage.getItem('gymvip_user');
    const savedGym = localStorage.getItem('gymvip_gym');
    const savedRole = localStorage.getItem('gymvip_role');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedGym) {
          const gymData = JSON.parse(savedGym);
          setGym(gymData);
          applyGymTheme(gymData);
        }
        if (savedRole) setRole(savedRole);
      } catch (e) {
        localStorage.removeItem('gymvip_token');
        localStorage.removeItem('gymvip_user');
        localStorage.removeItem('gymvip_gym');
        localStorage.removeItem('gymvip_role');
        localStorage.removeItem('gymvip_slug');
      }
    }
    setLoading(false);
  }, []);

  const login = async (cedula, password, gymSlug) => {
    const res = await authAPI.login({ cedula, password, gym: gymSlug });
    const { token, user: u, gym: g } = res.data;
    const r = res.data.role || u?.role;

    localStorage.setItem('gymvip_token', token);
    localStorage.setItem('gymvip_user', JSON.stringify(u));
    localStorage.setItem('gymvip_role', r);
    if (g) {
      localStorage.setItem('gymvip_gym', JSON.stringify(g));
      localStorage.setItem('gymvip_slug', g.slug);
      applyGymTheme(g);
    }

    setUser(u);
    setGym(g);
    setRole(r);
    return res.data;
  };

const logout = () => {
  const slug = localStorage.getItem('gymvip_slug');
  const currentRole = localStorage.getItem('gymvip_role');
  localStorage.removeItem('gymvip_token');
  localStorage.removeItem('gymvip_user');
  localStorage.removeItem('gymvip_gym');
  localStorage.removeItem('gymvip_role');
  localStorage.removeItem('gymvip_slug');
  setUser(null);
  setGym(null);
  setRole(null);
  if (currentRole === 'super_admin' || !slug) {
    window.location.href = '/login';
  } else {
    window.location.href = `/login?gym=${slug}`;
  }
};

  const isSuperAdmin = user?.isSuperAdmin || role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isReceptionist = role === 'recepcionista';
  const isInstructor = role === 'instructor';
  const isUser = role === 'user';

  return (
    <AuthContext.Provider value={{
      user, gym, role, loading,
      login, logout, applyGymTheme,
      isSuperAdmin, isAdmin, isReceptionist, isInstructor, isUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
