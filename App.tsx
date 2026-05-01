/**
 * Parking App
 * @format
 */
import "./global.css";
import React from 'react';
import { LogBox, StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Every one of our screens already imports SafeAreaView from
// `react-native-safe-area-context`. The deprecation warning fires once at
// startup from a third-party library that reads `RN.SafeAreaView` via the
// (deprecated) getter on the react-native module. Silence it so the dev
// console isn't polluted on every reload.
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import Welcome from './user/screens/onboarding/Welcome';
import Onboarding from './user/screens/onboarding/Onboarding';
import UserOnboarding from './user/screens/onboarding/UserOnboarding';
import SignIn from './user/screens/auth/SignIn';
import OTPVerification from './user/screens/auth/OTPVerification';
import BottomTabNavigator from './user/navigation/BottomTabNavigator';
import ParkingDetailsPage from './user/screens/parking/ParkingDetailsPage';
import SubscriptionPage from './user/screens/premium/SubscriptionPage';
import HelpSupportPage from './user/screens/support/HelpSupportPage';
import AboutPage from './user/screens/about/AboutPage';

// Auth
import { AuthProvider, useAuth } from './user/context/AuthContext';
import { initializeMsg91 } from './user/services/msg91Service';
import { AppAlertProvider } from './user/components/AppAlert';

// Initialize the MSG91 OTP SDK at module load (before first render).
// Idempotent — safe even though msg91Service guards calls with the same init.
initializeMsg91();

const Stack = createNativeStackNavigator();

const navigationTheme = {
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
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#FFFFFF' },
  animation: 'none' as const,
};

/**
 * Root navigator — driven by auth state from AuthContext.
 *
 * Routing logic:
 *  isLoading           → Splash (ActivityIndicator)
 *  !isAuthenticated    → Auth stack (Welcome → Onboarding → SignIn → OTPVerification)
 *  onboardingStep      → 'completed': MainApp
 *                      → anything else: UserOnboarding
 */
function RootNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" translucent={false} />
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Onboarding" component={Onboarding} />
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="OTPVerification" component={OTPVerification} />
        </Stack.Navigator>
      </>
    );
  }

  if (user?.onboardingStep !== 'completed') {
    return (
      <>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" translucent={false} />
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="UserOnboarding" component={UserOnboarding} />
        </Stack.Navigator>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Navigator screenOptions={screenOptions}>
        {/* Main app with bottom tabs */}
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />

        {/* Modal / detail screens accessible from main app */}
        <Stack.Screen name="ParkingDetails" component={ParkingDetailsPage} />
        <Stack.Screen name="Subscription" component={SubscriptionPage} />
        <Stack.Screen name="HelpSupport" component={HelpSupportPage} />
        <Stack.Screen name="About" component={AboutPage} />
      </Stack.Navigator>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: '#FFFFFF' }}>
      <AppAlertProvider>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </AppAlertProvider>
    </SafeAreaProvider>
  );
}

export default App;
