import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTPVerification = ({ navigation, route }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  const email = route?.params?.email || 'your email id';

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    const otpValue = otp.join('');
    console.log('OTP entered:', otpValue);
    // Navigate to User Onboarding screen
    navigation.navigate('UserOnboarding');
  };

  const handleResend = () => {
    console.log('Resend OTP');
  };

  const isOtpComplete = otp.every((d) => d);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeTopRight}>
          <View style={styles.blobLarge} />
          <View style={styles.blobSmall} />
        </View>
        <View style={styles.decorativeTopLeft}>
          <View style={styles.blobMedium} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter Code</Text>
          <Text style={styles.subtitle}>code will be sent to {email}</Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend Link */}
        <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>

        {/* Let's Go Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isOtpComplete && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isOtpComplete}
        >
          <Text style={styles.continueButtonText}>Let's Go!</Text>
        </TouchableOpacity>

        {/* Bottom Decorative */}
        <View style={styles.decorativeBottom}>
          <View style={styles.blobBottomRight} />
          <View style={styles.blobBottomSmall} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  decorativeTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
  },
  blobLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5F4',
  },
  blobSmall: {
    position: 'absolute',
    top: 70,
    right: 80,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0D7377',
  },
  decorativeTopLeft: {
    position: 'absolute',
    top: 60,
    left: -20,
  },
  blobMedium: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5F4',
  },
  header: {
    marginTop: 120,
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#0D7377',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A2E',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: {
    backgroundColor: '#E8F5F4',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#0D7377',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: 40,
    right: -20,
  },
  blobBottomRight: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5F4',
  },
  blobBottomSmall: {
    position: 'absolute',
    bottom: 60,
    right: 70,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#0D7377',
  },
});

export default OTPVerification;
