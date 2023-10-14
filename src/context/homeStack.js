import { createStackNavigator, HeaderButton } from '@react-navigation/stack';
import React, { useContext } from 'react';
import { TouchableOpacity, Text } from 'react-native';

import HomeScreen from '../screens/homeScreen';
import ChatScreen from '../screens/chatScreen';
import { AuthContext } from '../context/authProvider';

import FormButton from '../components/formButton';
const Stack = createStackNavigator();

export default function HomeStack() {

  const { logout } = useContext(AuthContext);
  const CustomHeaderButton = ({ onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <Text>Button</Text>
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator>
      <Stack.Screen name='chatScreen' component={ChatScreen} options={{
        title: 'Chad',
        headerRight: () => (
          
          <TouchableOpacity style={{paddingRight: 20}}
          onPress={() => logout()}>
      <Text style={{fontSize:16}}>Logout</Text>
    </TouchableOpacity>
          
        ),
      }} />
    </Stack.Navigator>
  );
}