import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import * as msg91Service from '../../services/msg91Service';
import { maskPhone } from '../../utils/validateForm';

const { Msg91Error } = msg91Service;

const RESEND_COOLDOWN = 30; // seconds

/**
 * After MSG91 verifies the OTP we still need a backend JWT, so we call the
 * existing /api/auth/otp/verify endpoint with a known magic code. The backend
 * accepts this code in non-production builds and issues a JWT — OTP correctness
 * has already been guaranteed by MSG91. Once the backend is updated to accept
 * MSG91's access-token directly, replace this constant with that flow.
 *
 * NOTE: in a production backend (NODE_ENV === 'production') the magic code is
 * rejected, so this flow will fail until the proper exchange endpoint exists.
 */
const BACKEND_SESSION_MAGIC_CODE = '1234';

if (!__DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[OTPVerification] Using mock magic-code path to mint backend JWT. ' +
      'This will not work against a production backend — implement an MSG91 ' +
      'token exchange endpoint before shipping.',
  );
}

const OTPVerification = ({ navigation, route }) => {
  const { identifier = '', channel = 'sms' } = route?.params || {};
  const auth = useAuth();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false); // true after max attempts
  const [timerSeconds, setTimerSeconds] = useState(RESEND_COOLDOWN);
  const [isResendActive, setIsResendActive] = useState(false);

  const inputRefs = useRef([]);

  // ─── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timerSeconds <= 0) {
      setIsResendActive(true);
      return;
    }
    const t = setTimeout(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerSeconds]);

  // ─── OTP input handling ────────────────────────────────────────────────────
  const handleOtpChange = (value, index) => {
    if (isDisabled || isLoading) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last char (handles paste)
    setOtp(newOtp);
    setErrorMessage('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every((d) => d !== '');

  // ─── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (!isOtpComplete || isLoading || isDisabled) return;

    const otpString = otp.join('');
    setIsLoading(true);
    setErrorMessage('');

    // Tracks whether the MSG91 step succeeded so the catch block can tell
    // which side failed. If MSG91 verified the OTP but the backend then failed
    // to mint a JWT, the OTP is already consumed — the user must request a
    // fresh code via "Resend".
    let msg91Verified = false;

    try {
      // MOCK OTP (backend) — replaced by MSG91 verify below. Commented out, not removed.
      // const response = await authService.verifyOtp(identifier, otpString);

      // 1) Verify the OTP with MSG91 (real verification). The service tracks
      //    the active reqId from sendOtp internally — no need to pass phone.
      await msg91Service.verifyOtp(otpString);
      msg91Verified = true;

      // 2) Mint a backend JWT. MSG91 has already verified the user, so we ask
      //    the backend to issue a session via its accepted magic code.
      const response = await authService.verifyOtp(identifier, BACKEND_SESSION_MAGIC_CODE);
      // response: { user, owner, token, isNewUser }
      await auth.signIn(response.token, response.user);

      // No navigation.reset here — RootNavigator in App.tsx swaps the auth
      // stack for either UserOnboarding or MainApp based on auth state +
      // user.onboardingStep. Calling reset here would target the OUTGOING
      // auth stack (which doesn't contain MainApp/UserOnboarding) and emit
      // "action 'RESET' was not handled by any navigator" warnings.
    } catch (err) {
      const code = err?.code || '';
      let keepDigits = false;

      if (msg91Verified) {
        // eslint-disable-next-line no-console
        console.error('[OTPVerification] Backend session-mint failed:', {
          name: err?.name,
          code: err?.code,
          http: err?.http,
          message: err?.message,
          details: err?.details,
        });

        const isNetworkIssue =
          err?.code === 'NETWORK_ERROR' || err?.code === 'NETWORK_TIMEOUT';

        if (isNetworkIssue) {
          // Backend unreachable but MSG91 already verified the code.
          // MSG91 sessions stay valid for a few minutes and verify is
          // idempotent within the window — so let the user simply tap
          // "Verify" again once the network is restored. Keep the digits,
          // don't disable input, don't unlock resend (resend won't help).
          keepDigits = true;
          setErrorMessage(
            err?.code === 'NETWORK_TIMEOUT'
              ? "Server didn't respond. Check your connection and tap Verify to try again."
              : "Can't reach the server. Check your connection and tap Verify to try again.",
          );
        } else {
          // Backend was reached but rejected the request (4xx/5xx, etc.).
          // The MSG91 OTP is consumed; the user must request a fresh code.
          const debugSuffix = __DEV__
            ? ` [${err?.code || err?.name || 'unknown'}${err?.http ? ` ${err.http}` : ''}]`
            : '';
          setErrorMessage(
            `Verified, but we could not start your session. Tap "Resend Code" to try again.${debugSuffix}`,
          );
          setIsDisabled(true);
          setIsResendActive(true);
          setTimerSeconds(0);
        }
      } else if (err instanceof Msg91Error) {
        if (code === 'NETWORK_ERROR') {
          setErrorMessage('No internet connection. Please try again.');
          keepDigits = true;
        } else {
          setErrorMessage(err.message || 'Incorrect code. Please try again.');
        }
      } else if (code === 'AUTH_OTP_INVALID') {
        const remaining = err?.details?.attemptsRemaining;
        setErrorMessage(
          remaining !== undefined
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Incorrect code. Please try again.'
        );
      } else if (code === 'AUTH_OTP_EXPIRED') {
        setErrorMessage('This code has expired. Please request a new one.');
        setIsResendActive(true);
      } else if (code === 'AUTH_OTP_MAX_ATTEMPTS') {
        setErrorMessage('Too many incorrect attempts. Please request a new code.');
        setIsDisabled(true);
        setIsResendActive(true);
      } else if (code === 'NETWORK_ERROR' || code === 'NETWORK_TIMEOUT') {
        setErrorMessage('No internet connection. Please try again.');
        keepDigits = true;
      } else {
        setErrorMessage(err?.message || 'Verification failed. Please try again.');
      }

      // Clear OTP on every error path except transient network failures —
      // for those we keep the entry so the user can retry the same code on
      // reconnect without re-typing.
      if (!keepDigits) {
        setOtp(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } finally {
      setIsLoading(false);
    }
  }, [otp, identifier, isOtpComplete, isLoading, isDisabled, auth, navigation]);

  // Auto-verify when all 4 digits entered
  useEffect(() => {
    if (isOtpComplete && !isLoading && !isDisabled) {
      handleVerify();
    }
  }, [isOtpComplete]); // intentionally only on completion change

  // ─── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!isResendActive || isLoading) return;

    try {
      // MOCK OTP (backend) — replaced by MSG91 retry. Commented out, not removed.
      // await authService.resendOtp(identifier, channel);

      await msg91Service.resendOtp();
      setOtp(['', '', '', '']);
      setErrorMessage('');
      setIsDisabled(false);
      setIsResendActive(false);
      setTimerSeconds(RESEND_COOLDOWN);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      const code = err?.code || '';
      if (err instanceof Msg91Error) {
        setErrorMessage(err.message || 'Failed to resend code. Please try again.');
      } else if (code === 'AUTH_OTP_RATE_LIMITED') {
        setErrorMessage('Too many requests. Please wait before requesting again.');
      } else {
        setErrorMessage('Failed to resend code. Please try again.');
      }
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  const maskedPhone = identifier ? maskPhone(identifier) : '';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Decorative Elements */}
        <View style={styles.decorativeTopRight}>
          <View style={styles.blobLarge} />
          <View style={styles.blobSmall} />
        </View>
        <View style={styles.decorativeTopLeft}>
          <View style={styles.blobMedium} />
        </View>

        {/* Back button — lets the user go back to SignIn to fix a typo
            in their phone number. Wrapped in a top-anchored View so it
            sits above the decorative blobs and the header copy. */}
        <View style={styles.backRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back to edit phone number"
            accessibilityRole="button"
          >
            <Icon name="chevron-left" size={22} color="#0F172A" />
            <Text style={styles.backBtnText}>Edit number</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter Code</Text>
          <Text style={styles.subtitle}>
            A 4-digit code was sent to{'\n'}
            <Text style={styles.phoneHighlight}>{maskedPhone || identifier}</Text>
          </Text>
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
                errorMessage ? styles.otpInputError : null,
                isDisabled ? styles.otpInputDisabled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isDisabled && !isLoading}
            />
          ))}
        </View>

        {/* Error message */}
        {errorMessage ? (
          <Text
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {errorMessage}
          </Text>
        ) : null}

        {/* Resend */}
        <View style={styles.resendContainer}>
          {isResendActive ? (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={styles.resendActiveText}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimerText}>
              Resend in <Text style={styles.timerHighlight}>{timerSeconds}s</Text>
            </Text>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!isOtpComplete || isDisabled) && styles.continueButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={!isOtpComplete || isLoading || isDisabled}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Decorative — pinned to the SafeAreaView (outside the
          KeyboardAvoidingView) so it doesn't ride up over the Verify
          button when the keyboard opens. The keyboard simply covers it. */}
      <View style={styles.decorativeBottom} pointerEvents="none">
        <View style={styles.blobBottomRight} />
        <View style={styles.blobBottomSmall} />
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
    paddingHorizontal: 24,
  },
  backRow: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    marginLeft: 4,
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
    marginBottom: 48,
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
    lineHeight: 22,
  },
  phoneHighlight: {
    color: '#0D7377',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
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
  otpInputError: {
    borderColor: '#EF4444',
  },
  otpInputDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendActiveText: {
    fontSize: 14,
    color: '#0D7377',
    fontWeight: '600',
  },
  resendTimerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timerHighlight: {
    color: '#0D7377',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
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
