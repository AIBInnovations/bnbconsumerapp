import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import HomePage from '../screens/home/HomePage';
import BookingManagementPage from '../screens/bookings/BookingManagementPage';
import ProfilePage from '../screens/profile/ProfilePage';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ name, focused, color }) => {
  return (
    <View style={styles.iconContainer}>
      <Icon name={name} size={22} color={color} />
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1A73E8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: styles.tabBarLabel,
        lazy: false,
        freezeOnBlur: false,
        detachInactiveScreens: false,
        sceneStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomePage}
        options={{
          animation: 'none',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingManagementPage}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="calendar" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="user" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A73E8',
  },
});

export default BottomTabNavigator;
