import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import { parseIndianPhone } from '../../utils/validateForm';
import * as authService from '../../services/authService';
import * as msg91Service from '../../services/msg91Service';

const { Msg91Error } = msg91Service;

const SignIn = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Derive parsed phone whenever input changes
  const parsedPhone = parseIndianPhone(phone);
  const isPhoneValid = !!parsedPhone;
  const canSubmit = isPhoneValid && acceptTerms && !isLoading;

  const handleSendOtp = async () => {
    if (!canSubmit) return;
    setErrorMessage('');
    setIsLoading(true);

    try {
      // MOCK OTP (backend) — replaced by MSG91 widget. Kept here, commented out,
      // so the legacy mock flow can be re-enabled if needed.
      // await authService.sendOtp(parsedPhone, 'sms');

      await msg91Service.sendOtp(parsedPhone);
      navigation.navigate('OTPVerification', {
        identifier: parsedPhone,
        channel: 'sms',
      });
    } catch (err) {
      const code = err?.code || '';
      if (err instanceof Msg91Error) {
        if (code === 'NETWORK_ERROR') {
          setErrorMessage('Check your internet connection and try again.');
        } else {
          setErrorMessage(err.message || 'Failed to send OTP. Please try again.');
        }
      } else if (code === 'AUTH_OTP_RATE_LIMITED') {
        setErrorMessage('Too many attempts. Please try again later.');
      } else if (code === 'REQ_INVALID_FORMAT' || code === 'REQ_MISSING_FIELD') {
        setErrorMessage('Enter a valid 10-digit mobile number.');
      } else if (code === 'NETWORK_ERROR' || code === 'NETWORK_TIMEOUT') {
        setErrorMessage('Check your internet connection and try again.');
      } else {
        setErrorMessage(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Decorative Elements */}
          <View style={styles.decorativeTop}>
            <View style={styles.blobLarge} />
            <View style={styles.blobSmall} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Enter your mobile number to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, errorMessage ? styles.inputWrapperError : null]}>
                {/* Country Code */}
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={styles.divider} />
                <TextInput
                  style={styles.input}
                  placeholder="Mobile number"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    setErrorMessage('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={15}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                />
                {isPhoneValid && (
                  <Icon name="check-circle" size={18} color="#0D7377" style={styles.validIcon} />
                )}
              </View>
              {errorMessage ? (
                <Text
                  style={styles.errorText}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                >
                  {errorMessage}
                </Text>
              ) : null}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Icon name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text style={styles.checkboxLink}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
              onPress={handleSendOtp}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Decorative — pinned to the SafeAreaView (outside the
          KeyboardAvoidingView) so it doesn't ride up over the Send OTP
          button when the keyboard opens. The keyboard simply covers it. */}
      <View style={styles.decorativeBottom} pointerEvents="none">
        <View style={styles.blobBottomLeft} />
      </View>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  decorativeTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
  },
  blobLarge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5F4',
  },
  blobSmall: {
    position: 'absolute',
    top: 80,
    right: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D7377',
  },
  header: {
    marginTop: 80,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  countryCode: {
    paddingRight: 12,
    paddingVertical: 16,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: '#1A1A2E',
  },
  validIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  maskedText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0D7377',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0D7377',
    borderColor: '#0D7377',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  checkboxLink: {
    color: '#0D7377',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: -30,
    left: -30,
  },
  blobBottomLeft: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5F4',
  },
});

export default SignIn;
