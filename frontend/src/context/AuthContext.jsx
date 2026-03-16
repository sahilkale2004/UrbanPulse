import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local token
    const loadUser = async () => {
      const savedToken = localStorage.getItem('up_token');
      if (savedToken) {
        setToken(savedToken);
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.data);
          }
        } catch (error) {
          console.error("Local token invalid or expired", error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();

    // Supabase Auth Listener (for Google OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
           // We have a google session, send email to backend to get standard JWT
           const googleUser = session.user;
           const intendedRole = localStorage.getItem('up_google_role') || 'citizen';
           const backendRes = await authService.googleLogin({
             email: googleUser.email,
             name: googleUser.user_metadata?.full_name || googleUser.email.split('@')[0],
             role: intendedRole 
           });
           
           if (backendRes.success) {
             localStorage.removeItem('up_google_role');
             setAuthData(backendRes);
           }
        } catch (error) {
           console.error("Failed to sync Google login with backend", error);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const setAuthData = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('up_token', data.token);
  };

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success) setAuthData(res);
    return res;
  };

  const register = async (name, email, password, role) => {
    const res = await authService.register({ name, email, password, role });
    if (res.success) setAuthData(res);
    return res;
  };

  const loginWithGoogle = async (selectedRole) => {
    if (selectedRole) {
      localStorage.setItem('up_google_role', selectedRole);
    }
    // Redirects to Google
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('up_token');
    localStorage.removeItem('municipal_pass');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const value = {
    user,
    token,
    loading,
    role: user?.role || null,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
