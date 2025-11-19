import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import IncidentsList from './screens/IncidentsList';
import IncidentDetail from './screens/IncidentDetail';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="IncidentsList"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="IncidentsList"
            component={IncidentsList}
            options={{
              title: 'Incidents',
            }}
          />
          <Stack.Screen
            name="IncidentDetail"
            component={IncidentDetail}
            options={{
              title: 'Incident Details',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
