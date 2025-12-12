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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const SignIn = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleLogin = () => {
    console.log('Login pressed');
    navigation.navigate('OTPVerification', { email: emailOrPhone });
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
            <Text style={styles.title}>Sign In</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleText}>New here? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.subtitleLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email/Phone Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Icon name="mail" size={18} color="#9CA3AF" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Phone Number"
                  placeholderTextColor="#9CA3AF"
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Accept Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Icon name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Accept all the Terms & Conditions</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, !acceptTerms && styles.signInButtonDisabled]}
              onPress={handleLogin}
              disabled={!acceptTerms}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* Social Login Icons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialIconButton}>
                <FontAwesome name="google" size={20} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIconButton, styles.appleButton]}>
                <FontAwesome name="apple" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIconButton, styles.facebookButton]}>
                <FontAwesome name="facebook" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Decorative */}
          <View style={styles.decorativeBottom}>
            <View style={styles.blobBottomLeft} />
          </View>
        </ScrollView>
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
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  subtitleLink: {
    fontSize: 14,
    color: '#0D7377',
    fontWeight: '600',
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
  },
  inputIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: '#1A1A2E',
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
  },
  signInButton: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appleButton: {
    backgroundColor: '#1A1A2E',
    borderColor: '#1A1A2E',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
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
