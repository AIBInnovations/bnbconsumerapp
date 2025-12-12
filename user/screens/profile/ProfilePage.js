import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Sample user data
const initialUserData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@email.com',
  phone: '+1 (555) 123-4567',
  profileImage: null,
};

// Sample vehicles data
const initialVehicles = [
  {
    id: '1',
    type: 'Sedan',
    make: 'Toyota',
    model: 'Camry',
    year: '2022',
    color: 'Silver',
    size: 'Mid-size',
    registrationNumber: 'ABC 1234',
    isDefault: true,
  },
];

// Sample payment methods
const initialPaymentMethods = [
  {
    id: '1',
    type: 'visa',
    last4: '4242',
    expiry: '12/25',
    isDefault: true,
  },
  {
    id: '2',
    type: 'mastercard',
    last4: '8888',
    expiry: '06/26',
    isDefault: false,
  },
];

// Notification settings
const initialNotifications = {
  bookingReminders: true,
  paymentConfirmations: true,
  promotions: false,
  parkingAlerts: true,
  expiryReminders: true,
  newsletter: false,
};

const ProfilePage = ({ navigation }) => {
  // State management
  const [userData, setUserData] = useState(initialUserData);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(initialUserData);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate profile completion
  const calculateCompletion = () => {
    let completed = 0;
    const total = 6;

    if (userData.firstName && userData.lastName) completed++;
    if (userData.email) completed++;
    if (userData.phone) completed++;
    if (userData.profileImage) completed++;
    if (vehicles.length > 0) completed++;
    if (paymentMethods.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  // Handle save profile
  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setUserData(editedData);
      setIsEditing(false);
      setIsSaving(false);
      showSuccessMessage();
    }, 1000);
  };

  // Show success message
  const showSuccessMessage = () => {
    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSuccess(false));
  };

  // Handle notification toggle
  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle remove vehicle
  const handleRemoveVehicle = (vehicleId) => {
    Alert.alert(
      'Remove Vehicle',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setVehicles(vehicles.filter(v => v.id !== vehicleId));
          },
        },
      ]
    );
  };

  // Handle remove payment method
  const handleRemovePayment = (paymentId) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(p => p.id !== paymentId));
          },
        },
      ]
    );
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          },
        },
      ]
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Subscription')}
      >
        <MaterialIcon name="ticket-percent" size={22} color="#F59E0B" />
      </TouchableOpacity>
    </View>
  );

  // Render profile completion
  const renderProfileCompletion = () => {
    const completion = calculateCompletion();
    return (
      <View style={styles.completionContainer}>
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Profile Completion</Text>
          <Text style={styles.completionPercentage}>{completion}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${completion}%` }]} />
        </View>
        {completion < 100 && (
          <Text style={styles.completionHint}>
            Complete your profile to unlock all features
          </Text>
        )}
      </View>
    );
  };

  // Render profile section
  const renderProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditedData(userData);
              setIsEditing(true);
            }}
          >
            <Icon name="edit-2" size={16} color="#1A73E8" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsEditing(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Picture */}
      <View style={styles.profilePictureContainer}>
        <TouchableOpacity style={styles.profilePicture}>
          {userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
          ) : (
            <Icon name="user" size={48} color="#1A73E8" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePictureButton}>
          <Icon name="camera" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.changePictureText}>Tap to change photo</Text>
      </View>

      {/* Personal Info Fields */}
      <View style={styles.fieldsContainer}>
        {isEditing ? (
          <>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedData.firstName}
                  onChangeText={(text) => setEditedData({ ...editedData, firstName: text })}
                  placeholder="First Name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedData.lastName}
                  onChangeText={(text) => setEditedData({ ...editedData, lastName: text })}
                  placeholder="Last Name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editedData.email}
                onChangeText={(text) => setEditedData({ ...editedData, email: text })}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editedData.phone}
                onChangeText={(text) => setEditedData({ ...editedData, phone: text })}
                placeholder="Phone Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Icon name="user" size={18} color="#1A73E8" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{userData.firstName} {userData.lastName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Icon name="mail" size={18} color="#1A73E8" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Icon name="phone" size={18} color="#1A73E8" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{userData.phone}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );

  // Render vehicles section
  const renderVehiclesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Vehicles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingVehicle(null);
            setShowVehicleModal(true);
          }}
        >
          <Icon name="plus" size={16} color="#1A73E8" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Icon name="truck" size={32} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Vehicles Added</Text>
          <Text style={styles.emptySubtitle}>
            Add your vehicle details for faster parking bookings
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowVehicleModal(true)}
          >
            <Icon name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleIconContainer}>
              <Icon name="truck" size={24} color="#7C3AED" />
            </View>
            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleHeader}>
                <Text style={styles.vehicleName}>
                  {vehicle.make} {vehicle.model}
                </Text>
                {vehicle.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.vehicleDetails}>
                {vehicle.type} • {vehicle.color} • {vehicle.year}
              </Text>
              <Text style={styles.vehicleRegistration}>
                {vehicle.registrationNumber}
              </Text>
            </View>
            <View style={styles.vehicleActions}>
              <TouchableOpacity
                style={styles.vehicleActionButton}
                onPress={() => {
                  setEditingVehicle(vehicle);
                  setShowVehicleModal(true);
                }}
              >
                <Icon name="edit-2" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.vehicleActionButton}
                onPress={() => handleRemoveVehicle(vehicle.id)}
              >
                <Icon name="trash-2" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  // Render payment methods section
  const renderPaymentSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <Icon name="plus" size={16} color="#1A73E8" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {paymentMethods.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Icon name="credit-card" size={32} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Payment Methods</Text>
          <Text style={styles.emptySubtitle}>
            Add a payment method for seamless transactions
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowPaymentModal(true)}
          >
            <Icon name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      ) : (
        paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentCard}>
            <View style={[
              styles.paymentIconContainer,
              { backgroundColor: method.type === 'visa' ? '#1A1F7115' : '#EB001B15' }
            ]}>
              <Icon
                name="credit-card"
                size={20}
                color={method.type === 'visa' ? '#1A1F71' : '#EB001B'}
              />
            </View>
            <View style={styles.paymentInfo}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentType}>
                  {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ****{method.last4}
                </Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.paymentExpiry}>Expires {method.expiry}</Text>
            </View>
            <TouchableOpacity
              style={styles.paymentRemoveButton}
              onPress={() => handleRemovePayment(method.id)}
            >
              <Icon name="trash-2" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.manageButton}>
        <Icon name="settings" size={18} color="#1A73E8" />
        <Text style={styles.manageButtonText}>Manage Payment Methods</Text>
      </TouchableOpacity>
    </View>
  );

  // Render notifications section
  const renderNotificationsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
      </View>

      <View style={styles.notificationsList}>
        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Icon name="calendar" size={20} color="#1A73E8" />
            <Text style={styles.notificationText}>Booking Reminders</Text>
          </View>
          <Switch
            value={notifications.bookingReminders}
            onValueChange={() => toggleNotification('bookingReminders')}
            trackColor={{ false: '#E5E7EB', true: '#1A73E850' }}
            thumbColor={notifications.bookingReminders ? '#1A73E8' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Icon name="check-circle" size={20} color="#1A73E8" />
            <Text style={styles.notificationText}>Payment Confirmations</Text>
          </View>
          <Switch
            value={notifications.paymentConfirmations}
            onValueChange={() => toggleNotification('paymentConfirmations')}
            trackColor={{ false: '#E5E7EB', true: '#1A73E850' }}
            thumbColor={notifications.paymentConfirmations ? '#1A73E8' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Icon name="bell" size={20} color="#1A73E8" />
            <Text style={styles.notificationText}>Parking Alerts</Text>
          </View>
          <Switch
            value={notifications.parkingAlerts}
            onValueChange={() => toggleNotification('parkingAlerts')}
            trackColor={{ false: '#E5E7EB', true: '#1A73E850' }}
            thumbColor={notifications.parkingAlerts ? '#1A73E8' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Icon name="clock" size={20} color="#1A73E8" />
            <Text style={styles.notificationText}>Expiry Reminders</Text>
          </View>
          <Switch
            value={notifications.expiryReminders}
            onValueChange={() => toggleNotification('expiryReminders')}
            trackColor={{ false: '#E5E7EB', true: '#1A73E850' }}
            thumbColor={notifications.expiryReminders ? '#1A73E8' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Icon name="gift" size={20} color="#1A73E8" />
            <Text style={styles.notificationText}>Promotions & Offers</Text>
          </View>
          <Switch
            value={notifications.promotions}
            onValueChange={() => toggleNotification('promotions')}
            trackColor={{ false: '#E5E7EB', true: '#1A73E850' }}
            thumbColor={notifications.promotions ? '#1A73E8' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Icon name="mail" size={20} color="#1A73E8" />
            <Text style={styles.notificationText}>Newsletter</Text>
          </View>
          <Switch
            value={notifications.newsletter}
            onValueChange={() => toggleNotification('newsletter')}
            trackColor={{ false: '#E5E7EB', true: '#1A73E850' }}
            thumbColor={notifications.newsletter ? '#1A73E8' : '#9CA3AF'}
          />
        </View>
      </View>
    </View>
  );

  // Render quick links section
  const renderQuickLinks = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>More Options</Text>
      </View>

      <TouchableOpacity
        style={styles.quickLinkItem}
        onPress={() => navigation.navigate('Subscription')}
      >
        <View style={[styles.quickLinkIcon, { backgroundColor: '#8B5CF615' }]}>
          <Icon name="award" size={20} color="#8B5CF6" />
        </View>
        <View style={styles.quickLinkContent}>
          <Text style={styles.quickLinkTitle}>Subscription</Text>
          <Text style={styles.quickLinkSubtitle}>Manage your premium plan</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickLinkItem}>
        <View style={[styles.quickLinkIcon, { backgroundColor: '#059669 15' }]}>
          <Icon name="shield" size={20} color="#059669" />
        </View>
        <View style={styles.quickLinkContent}>
          <Text style={styles.quickLinkTitle}>Security</Text>
          <Text style={styles.quickLinkSubtitle}>Password & authentication</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickLinkItem}
        onPress={() => navigation.navigate('HelpSupport')}
      >
        <View style={[styles.quickLinkIcon, { backgroundColor: '#2563EB15' }]}>
          <Icon name="help-circle" size={20} color="#2563EB" />
        </View>
        <View style={styles.quickLinkContent}>
          <Text style={styles.quickLinkTitle}>Help & Support</Text>
          <Text style={styles.quickLinkSubtitle}>FAQs and contact us</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickLinkItem}
        onPress={() => navigation.navigate('About')}
      >
        <View style={[styles.quickLinkIcon, { backgroundColor: '#6B728015' }]}>
          <Icon name="info" size={20} color="#6B7280" />
        </View>
        <View style={styles.quickLinkContent}>
          <Text style={styles.quickLinkTitle}>About</Text>
          <Text style={styles.quickLinkSubtitle}>App info & terms</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  // Render logout button
  const renderLogout = () => (
    <View style={styles.logoutSection}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </View>
  );

  // Render vehicle modal
  const renderVehicleModal = () => (
    <Modal
      visible={showVehicleModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowVehicleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowVehicleModal(false)}
            >
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Make</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Toyota"
                placeholderTextColor="#9CA3AF"
                defaultValue={editingVehicle?.make}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Model</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Camry"
                placeholderTextColor="#9CA3AF"
                defaultValue={editingVehicle?.model}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2022"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  defaultValue={editingVehicle?.year}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Silver"
                  placeholderTextColor="#9CA3AF"
                  defaultValue={editingVehicle?.color}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <View style={styles.vehicleTypeContainer}>
                {['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.vehicleTypeButton,
                      editingVehicle?.type === type && styles.vehicleTypeButtonActive,
                    ]}
                  >
                    <Text style={[
                      styles.vehicleTypeText,
                      editingVehicle?.type === type && styles.vehicleTypeTextActive,
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Registration Number</Text>
              <TextInput
                style={styles.input}
                placeholder="ABC 1234"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                defaultValue={editingVehicle?.registrationNumber}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowVehicleModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setShowVehicleModal(false)}
            >
              <Text style={styles.modalSaveText}>
                {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render payment modal
  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.secureNote}>
              <Icon name="lock" size={16} color="#059669" />
              <Text style={styles.secureNoteText}>
                Your payment information is encrypted and secure
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalSaveText}>Add Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render success toast
  const renderSuccessToast = () => {
    if (!showSuccess) return null;

    return (
      <Animated.View style={[styles.successToast, { opacity: fadeAnim }]}>
        <Icon name="check-circle" size={20} color="#FFFFFF" />
        <Text style={styles.successToastText}>Profile Updated Successfully</Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {renderHeader()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderProfileCompletion()}
        {renderProfileSection()}
        {renderVehiclesSection()}
        {renderPaymentSection()}
        {renderNotificationsSection()}
        {renderQuickLinks()}
        {renderLogout()}
      </ScrollView>

      {renderVehicleModal()}
      {renderPaymentModal()}
      {renderSuccessToast()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 45,
  },

  // Profile Completion
  completionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  completionPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A73E8',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1A73E8',
    borderRadius: 4,
  },
  completionHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },

  // Section styles
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 4,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 4,
  },

  // Profile Picture
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePictureButton: {
    position: 'absolute',
    bottom: 20,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePictureText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },

  // Fields Container
  fieldsContainer: {
    marginTop: 8,
  },

  // Info Row (View mode)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Input styles (Edit mode)
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Vehicle Card
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#7C3AED15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  vehicleDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  vehicleRegistration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A73E8',
    marginTop: 4,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Default Badge
  defaultBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Payment Card
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentExpiry: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentRemoveButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A73E8',
    marginTop: 4,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 8,
  },

  // Notifications
  notificationsList: {
    marginTop: -8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
  },

  // Quick Links
  quickLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkContent: {
    flex: 1,
    marginLeft: 12,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  quickLinkSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Logout
  logoutSection: {
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Vehicle Type Selection
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#1A73E8',
  },
  vehicleTypeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Secure Note
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  secureNoteText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 8,
  },

  // Success Toast
  successToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  successToastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default ProfilePage;
