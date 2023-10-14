import React, { createContext, useState } from 'react';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth/react-native';
import { auth } from '../firebase';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        login: async (email, password) => {
          setLoading(true);

          try {
            const userCredential = await signInWithEmailAndPassword(auth,
              email, password);

            // Signed-in Firebase user
            const currentUser = userCredential.user;
 
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
        register: async (displayName, email, password) => {
          setLoading(true);

          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth, email, password);
 
 
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
        logout: async () => {
          // TODO
          try {
            await signOut(auth);
          } catch (e) {
            console.error(e);
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};