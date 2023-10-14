import { NavigationContainer } from '@react-navigation/native';
import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import Loading from '../components/loading';
import { onAuthStateChanged, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth/react-native';

import AuthStack from './authStack';
import HomeStack from './homeStack';
import { AuthContext } from './authProvider';

export default function Routes() {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  function onAuthStateChangedd(user) {
     
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        setUser(user);
        if (initializing) setInitializing(false);
        setLoading(false);
        // ...
      } else {
        // User is signed out
        // ...
        setUser(user);
        setLoading(false);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, [initializing, setUser]);

  if (loading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      {user ? <HomeStack /> : <AuthStack />}
    </NavigationContainer>
  );
}