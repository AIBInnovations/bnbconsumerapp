/**
 * Parking App
 * @format
 */
import "./global.css";
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Welcome from './user/screens/onboarding/Welcome';
import Onboarding from './user/screens/onboarding/Onboarding';
import UserOnboarding from './user/screens/onboarding/UserOnboarding';
import SignIn from './user/screens/auth/SignIn';
import SignUp from './user/screens/auth/SignUp';
import OTPVerification from './user/screens/auth/OTPVerification';
import BottomTabNavigator from './user/navigation/BottomTabNavigator';
import ParkingDetailsPage from './user/screens/parking/ParkingDetailsPage';
import SubscriptionPage from './user/screens/premium/SubscriptionPage';
import HelpSupportPage from './user/screens/support/HelpSupportPage';
import AboutPage from './user/screens/about/AboutPage';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider style={{ backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer
        theme={{
          dark: false,
          colors: {
            primary: '#0D7377',
            background: '#FFFFFF',
            card: '#FFFFFF',
            text: '#1A1A2E',
            border: '#F3F4F6',
            notification: '#EF4444',
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '800' },
          },
        }}
      >
        <Stack.Navigator
          initialRouteName="MainApp"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' },
            animation: 'none',
          }}
        >
          {/* Onboarding Flow */}
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Onboarding" component={Onboarding} />

          {/* Auth Flow */}
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="OTPVerification" component={OTPVerification} />
          <Stack.Screen name="UserOnboarding" component={UserOnboarding} />

          {/* Main App with Bottom Tabs */}
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />

          {/* Parking Details */}
          <Stack.Screen name="ParkingDetails" component={ParkingDetailsPage} />

          {/* Premium Features */}
          <Stack.Screen name="Subscription" component={SubscriptionPage} />

          {/* Support */}
          <Stack.Screen name="HelpSupport" component={HelpSupportPage} />

          {/* About */}
          <Stack.Screen name="About" component={AboutPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
