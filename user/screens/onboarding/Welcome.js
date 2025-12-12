import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Welcome = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Decorative Elements */}
      <View style={styles.decorativeTopRight}>
        <View style={styles.blobLarge} />
      </View>
      <View style={styles.decorativeTopLeft}>
        <View style={styles.blobMedium} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* House Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.houseIcon}>
            <View style={styles.houseRoof} />
            <View style={styles.houseBody}>
              <View style={styles.houseDoor} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Home Sync</Text>

        {/* Description */}
        <Text style={styles.description}>
          Control your home from the palm of your hand, no matter where life takes you.
        </Text>

        {/* Get It Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.buttonText}>Get It</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Decorative */}
      <View style={styles.decorativeBottom}>
        <View style={styles.blobBottomLeft} />
        <View style={styles.blobBottomRight} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  decorativeTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
  },
  blobLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5F4',
  },
  decorativeTopLeft: {
    position: 'absolute',
    top: 80,
    left: -30,
  },
  blobMedium: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0D7377',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  houseIcon: {
    alignItems: 'center',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 45,
    borderRightWidth: 45,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0D7377',
  },
  houseBody: {
    width: 70,
    height: 50,
    backgroundColor: '#0D7377',
    marginTop: -2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  houseDoor: {
    width: 20,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0D7377',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#0D7377',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5F4',
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0D7377',
  },
});

export default Welcome;
