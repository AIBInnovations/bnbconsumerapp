import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const vehicleTypes = [
  { id: '1', name: 'Car', icon: 'truck' },
  { id: '2', name: 'SUV', icon: 'truck' },
  { id: '3', name: 'Van', icon: 'truck' },
  { id: '4', name: 'Motorcycle', icon: 'truck' },
  { id: '5', name: 'Truck', icon: 'truck' },
];

const UserOnboarding = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form states
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [location, setLocation] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Modal state
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Error states
  const [errors, setErrors] = useState({});

  // Form validation
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [fullName, vehicleType, registrationNumber, termsAgreed]);

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      newErrors.fullName = 'Name should only contain letters';
    }

    if (!vehicleType) {
      newErrors.vehicleType = 'Please select a vehicle type';
    }

    if (!registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    } else if (registrationNumber.length < 4) {
      newErrors.registrationNumber = 'Invalid registration number';
    }

    setErrors(newErrors);

    if (
      fullName.trim() &&
      /^[a-zA-Z\s]+$/.test(fullName) &&
      vehicleType &&
      registrationNumber.trim() &&
      registrationNumber.length >= 4 &&
      termsAgreed
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  };

  const handleImagePicker = () => {
    setImageModalVisible(true);
  };

  const pickImageFromGallery = () => {
    setImageModalVisible(false);
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 500,
        maxWidth: 500,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else if (response.assets && response.assets[0]) {
          setProfileImage(response.assets[0].uri);
        }
      }
    );
  };

  const takePhoto = () => {
    setImageModalVisible(false);
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 500,
        maxWidth: 500,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
        } else if (response.error) {
          console.log('Camera Error: ', response.error);
        } else if (response.assets && response.assets[0]) {
          setProfileImage(response.assets[0].uri);
        }
      }
    );
  };

  const handleContinue = () => {
    if (isFormValid) {
      // Save user data and navigate to main app
      console.log('User data:', {
        profileImage,
        fullName,
        vehicleType,
        registrationNumber,
        location,
        emailNotifications,
        smsNotifications,
        pushNotifications,
      });
      // Navigate to Main App
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can complete your profile later from settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        }) },
      ]
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );

  const renderVehicleModal = () => (
    <Modal
      visible={vehicleModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setVehicleModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Vehicle Type</Text>
            <TouchableOpacity onPress={() => setVehicleModalVisible(false)}>
              <Icon name="x" size={24} color="#1A1A2E" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={vehicleTypes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.vehicleOption,
                  vehicleType === item.name && styles.vehicleOptionSelected,
                ]}
                onPress={() => {
                  setVehicleType(item.name);
                  setVehicleModalVisible(false);
                }}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  color={vehicleType === item.name ? '#FFFFFF' : '#0D7377'}
                />
                <Text
                  style={[
                    styles.vehicleOptionText,
                    vehicleType === item.name && styles.vehicleOptionTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
                {vehicleType === item.name && (
                  <Icon name="check" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderImagePickerModal = () => (
    <Modal
      visible={imageModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setImageModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.imageModalContent}>
          <Text style={styles.modalTitle}>Choose Photo</Text>
          <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
            <Icon name="camera" size={24} color="#0D7377" />
            <Text style={styles.imageOptionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageOption} onPress={pickImageFromGallery}>
            <Icon name="image" size={24} color="#0D7377" />
            <Text style={styles.imageOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeTopRight}>
          <View style={styles.blobLarge} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Help us personalize your experience</Text>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Icon name="user" size={40} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.uploadText}>Tap to upload photo</Text>
        </View>

        {/* Full Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <View style={styles.inputWrapper}>
            <Icon name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        </View>

        {/* Vehicle Type Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Vehicle Type *</Text>
          <TouchableOpacity
            style={styles.selectWrapper}
            onPress={() => setVehicleModalVisible(true)}
          >
            <Icon name="truck" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <Text style={[styles.selectText, !vehicleType && styles.placeholderText]}>
              {vehicleType || 'Select vehicle type'}
            </Text>
            <Icon name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          {errors.vehicleType && <Text style={styles.errorText}>{errors.vehicleType}</Text>}
        </View>

        {/* Vehicle Registration Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Vehicle Registration Number *</Text>
          <View style={styles.inputWrapper}>
            <Icon name="hash" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter registration number"
              placeholderTextColor="#9CA3AF"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              autoCapitalize="characters"
            />
          </View>
          {errors.registrationNumber && (
            <Text style={styles.errorText}>{errors.registrationNumber}</Text>
          )}
        </View>

        {/* Location Input (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location (Optional)</Text>
          <View style={styles.inputWrapper}>
            <Icon name="map-pin" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your city or area"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Communication Preferences */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Communication Preferences</Text>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => setEmailNotifications(!emailNotifications)}
          >
            <View style={styles.preferenceInfo}>
              <Icon name="mail" size={20} color="#0D7377" />
              <Text style={styles.preferenceText}>Email Notifications</Text>
            </View>
            <View style={[styles.toggle, emailNotifications && styles.toggleActive]}>
              <View style={[styles.toggleCircle, emailNotifications && styles.toggleCircleActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => setSmsNotifications(!smsNotifications)}
          >
            <View style={styles.preferenceInfo}>
              <Icon name="message-square" size={20} color="#0D7377" />
              <Text style={styles.preferenceText}>SMS Notifications</Text>
            </View>
            <View style={[styles.toggle, smsNotifications && styles.toggleActive]}>
              <View style={[styles.toggleCircle, smsNotifications && styles.toggleCircleActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => setPushNotifications(!pushNotifications)}
          >
            <View style={styles.preferenceInfo}>
              <Icon name="bell" size={20} color="#0D7377" />
              <Text style={styles.preferenceText}>Push Notifications</Text>
            </View>
            <View style={[styles.toggle, pushNotifications && styles.toggleActive]}>
              <View style={[styles.toggleCircle, pushNotifications && styles.toggleCircleActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Terms Agreement */}
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setTermsAgreed(!termsAgreed)}
        >
          <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
            {termsAgreed && <Icon name="check" size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text>
          </Text>
        </TouchableOpacity>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!isFormValid}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderVehicleModal()}
      {renderImagePickerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  decorativeTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
  },
  blobLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5F4',
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8F5F4',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0D7377',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'right',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D7377',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  preferencesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 14,
    color: '#1A1A2E',
    marginLeft: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#0D7377',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
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
  },
  checkboxChecked: {
    backgroundColor: '#0D7377',
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  termsLink: {
    color: '#0D7377',
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vehicleOptionSelected: {
    backgroundColor: '#0D7377',
  },
  vehicleOptionText: {
    fontSize: 15,
    color: '#1A1A2E',
    marginLeft: 12,
    flex: 1,
  },
  vehicleOptionTextSelected: {
    color: '#FFFFFF',
  },
  imageModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  imageOptionText: {
    fontSize: 15,
    color: '#1A1A2E',
    marginLeft: 16,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default UserOnboarding;
