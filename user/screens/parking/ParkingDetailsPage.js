import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import * as bookingService from '../../services/bookingService';
import * as vehicleService from '../../services/vehicleService';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker } from 'react-native-maps';
import { palette, fontStacks } from '../../theme';

const { width } = Dimensions.get('window');

// Duration options for booking
const durationOptions = [
  { id: 'hourly', label: 'Hourly', icon: 'clock' },
  { id: 'daily', label: 'Daily', icon: 'calendar' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar' },
  { id: 'monthly', label: 'Monthly', icon: 'calendar' },
];

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Cash', subtitle: 'Pay at the spot', icon: 'dollar-sign' },
  { id: 'online', label: 'Online', subtitle: 'Confirm instantly', icon: 'globe' },
];

// Generate time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const displayTime = hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
    slots.push({ value: time, label: displayTime });
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Generate next 30 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      date: date,
      day: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    });
  }
  return dates;
};

const ADD_VEHICLE_TYPES = [
  { apiType: 'car', label: 'Car' },
  { apiType: 'suv', label: 'SUV' },
  { apiType: 'van', label: 'Van' },
  { apiType: 'motorcycle', label: 'Moto' },
  { apiType: 'truck', label: 'Truck' },
];

const SPACE_TYPE_ICONS = {
  garage: 'garage',
  covered: 'home-roof',
  outdoor: 'weather-sunny',
  driveway: 'road',
  carport: 'car-side',
  street: 'road-variant',
};
const SPACE_TYPE_LABELS = {
  garage: 'Garage',
  covered: 'Covered',
  outdoor: 'Outdoor',
  driveway: 'Driveway',
  carport: 'Carport',
  street: 'Street',
};

const ParkingDetailsPage = ({ navigation, route }) => {
  const { parkingData } = route.params || {};
  const scrollViewRef = useRef(null);
  const dates = useMemo(() => generateDates(), []);
  const auth = useAuth();

  // Property mode: parkingData.spaces[] was passed from grouped homepage
  const isPropertyMode = Array.isArray(parkingData?.spaces) && parkingData.spaces.length > 0;
  const [selectedSpace, setSelectedSpace] = useState(
    isPropertyMode && parkingData.spaces.length === 1 ? parkingData.spaces[0] : null
  );

  // State
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState('hourly');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dates[0].date);
  const [selectedStartTime, setSelectedStartTime] = useState('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState('10:00');
  const [selectedHours, setSelectedHours] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeModalType, setTimeModalType] = useState('start');
  const [isLoading, setIsLoading] = useState(false);

  // Booking state
  const [userVehicles, setUserVehicles] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Add vehicle inline modal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [addVehicleReg, setAddVehicleReg] = useState('');
  const [addVehicleType, setAddVehicleType] = useState('');
  const [addVehicleSaving, setAddVehicleSaving] = useState(false);
  const [addVehicleError, setAddVehicleError] = useState('');

  // Online payment confirm modal
  const [showOnlineConfirmModal, setShowOnlineConfirmModal] = useState(false);

  // Load user's vehicles so we can use the default one when booking
  useEffect(() => {
    const userId = auth?.user?.id;
    if (!userId) return;
    bookingService.getUserVehicles(userId)
      .then((res) => setUserVehicles(res.vehicles || []))
      .catch(() => setUserVehicles([]));
  }, [auth?.user?.id]);

  // Default parking data
  const defaultParkingData = {
    id: '1',
    name: 'Central Parking',
    address: '123 Main St, Bergenfield, NJ 07621',
    latitude: 40.9276,
    longitude: -73.9973,
    pricePerHour: 5,
    pricePerDay: 35,
    pricePerWeek: 200,
    pricePerMonth: 700,
    rating: 4.5,
    totalReviews: 128,
    available: 12,
    spots: 45,
    distance: '0.3 mi',
    type: 'car',
    spaceType: 'Covered',
    dimensions: { width: '8.5 ft', length: '18 ft', height: '7 ft' },
    amenities: ['security', 'cctv', 'ev_charging', 'covered', 'accessible'],
    maxVehicleSize: 'SUVs and Sedans',
    bookingType: 'instant',
    operatingHours: '24/7',
    owner: {
      name: 'ParkSmart LLC',
      rating: 4.8,
      responseTime: '< 1 hour',
    },
    images: [],
    serviceFee: 1.50,
    taxRate: 0.08,
  };

  const resolvedImages = (() => {
    const candidates = [
      selectedSpace?.spaceImages,
      parkingData?.spaceImages,
      parkingData?.propertyImages,
      parkingData?.images,
    ];
    const hit = candidates.find((arr) => Array.isArray(arr) && arr.length > 0);
    return (hit || []).filter((u) => typeof u === 'string' && u.length > 0);
  })();

  const parking = {
    ...defaultParkingData,
    ...parkingData,
    images: resolvedImages,
    owner: {
      ...defaultParkingData.owner,
      ...(parkingData?.owner || {}),
    },
    dimensions: {
      ...defaultParkingData.dimensions,
      ...(parkingData?.dimensions || {}),
    },
  };

  // Calculate pricing based on duration — uses selectedSpace when available
  const calculatePricing = useMemo(() => {
    // In property mode, use the selected space's prices; otherwise fall back to parking (single-space)
    const priceSource = selectedSpace ?? parking;
    let basePrice = 0;
    let durationText = '';

    switch (selectedDuration) {
      case 'hourly':
        basePrice = (priceSource.pricePerHour || parking.pricePerHour) * selectedHours;
        durationText = `${selectedHours} hour${selectedHours > 1 ? 's' : ''}`;
        break;
      case 'daily':
        basePrice = priceSource.pricePerDay || priceSource.pricePerHour * 8 || parking.pricePerHour * 8;
        durationText = '1 day';
        break;
      case 'weekly':
        basePrice = priceSource.pricePerWeek || priceSource.pricePerMonth || priceSource.pricePerHour * 56 || parking.pricePerHour * 56;
        durationText = '1 week';
        break;
      case 'monthly':
        basePrice = priceSource.pricePerMonth || priceSource.pricePerHour * 240 || parking.pricePerHour * 240;
        durationText = '1 month';
        break;
      default:
        basePrice = priceSource.pricePerHour || parking.pricePerHour;
    }

    const serviceFee = parking.serviceFee || 1.50;
    const tax = basePrice * (parking.taxRate || 0.08);
    const total = basePrice + serviceFee + tax;

    return {
      basePrice: basePrice.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      durationText,
    };
  }, [selectedDuration, selectedHours, parking, selectedSpace]);

  // Validation
  const isFormValid = useMemo(() => {
    const spaceSelected = !isPropertyMode || selectedSpace !== null;
    return selectedPaymentMethod !== null && agreedToTerms && selectedDate !== null && spaceSelected;
  }, [selectedPaymentMethod, agreedToTerms, selectedDate, isPropertyMode, selectedSpace]);

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this parking spot: ${parking.name} at ${parking.address}. Only ₹${parking.pricePerHour}/hr!`,
        title: parking.name,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Handle directions
  const handleDirections = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${parking.latitude},${parking.longitude}`;
    const label = parking.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    Linking.openURL(url);
  };

  // Build ISO start/end times from the picker selections
  const buildBookingTimes = useCallback(() => {
    const [startH] = selectedStartTime.split(':').map(Number);

    const start = new Date(selectedDate);
    start.setHours(startH, 0, 0, 0);

    let end;
    if (selectedDuration === 'hourly') {
      end = new Date(start);
      end.setHours(startH + selectedHours, 0, 0, 0);
    } else if (selectedDuration === 'daily') {
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else if (selectedDuration === 'weekly') {
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else {
      // monthly
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    }

    return { startTime: start.toISOString(), endTime: end.toISOString() };
  }, [selectedDate, selectedStartTime, selectedHours, selectedDuration]);

  // Core booking logic — call this with a resolved vehicle object
  const doBooking = async (vehicle) => {
    setIsLoading(true);
    setBookingError('');
    const spaceId = selectedSpace?.id ?? parking.id;
    try {
      const { startTime, endTime } = buildBookingTimes();
      const response = await bookingService.createBooking(
        spaceId,
        startTime,
        endTime,
        vehicle.id,
        selectedPaymentMethod,
      );
      setShowOnlineConfirmModal(false);
      setConfirmedBooking(response.booking);
      setShowSuccessModal(true);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'BIZ_CONFLICT') {
        setBookingError('This space is already booked for the selected time. Please choose a different time.');
      } else if (code === 'BIZ_VALIDATION' && err?.message?.includes('past')) {
        setBookingError('Start time cannot be in the past. Please select a future time.');
      } else if (code === 'NETWORK_ERROR' || code === 'NETWORK_TIMEOUT') {
        setBookingError('No internet connection. Please try again.');
      } else {
        setBookingError(err?.message || 'Booking failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve vehicle then route by payment method
  const handleBookNow = async () => {
    if (!isFormValid || isLoading) return;

    // In property mode, user must select a specific space first
    if (isPropertyMode && !selectedSpace) {
      setBookingError('Please select a parking spot below before booking.');
      return;
    }

    // Must have at least one registered vehicle — show inline modal if not
    const vehicle = userVehicles.find((v) => v.isDefault) || userVehicles[0];
    if (!vehicle) {
      setAddVehicleReg('');
      setAddVehicleType('');
      setAddVehicleError('');
      setShowAddVehicleModal(true);
      return;
    }

    if (selectedPaymentMethod === 'online') {
      // Show price breakdown confirm modal
      setBookingError('');
      setShowOnlineConfirmModal(true);
    } else {
      // Cash — book directly
      await doBooking(vehicle);
    }
  };

  // Called from inside the online confirm modal
  const handleOnlineConfirm = async () => {
    const vehicle = userVehicles.find((v) => v.isDefault) || userVehicles[0];
    if (vehicle) {
      await doBooking(vehicle);
    }
  };

  // Save new vehicle then auto-proceed to booking
  const handleAddVehicleSave = async () => {
    if (!addVehicleReg.trim()) {
      setAddVehicleError('Registration number is required.');
      return;
    }
    if (!addVehicleType) {
      setAddVehicleError('Please select a vehicle type.');
      return;
    }
    const userId = auth?.user?.id;
    if (!userId) return;
    setAddVehicleSaving(true);
    setAddVehicleError('');
    try {
      const reg = addVehicleReg.trim().toUpperCase();
      await vehicleService.addVehicle(userId, {
        licensePlate: reg,
        vehicleType: addVehicleType,
        make: reg,
        model: addVehicleType,
        isDefault: true,
      });
      const res = await vehicleService.getUserVehicles(userId);
      const vehicles = res.vehicles || [];
      setUserVehicles(vehicles);
      setShowAddVehicleModal(false);
      const vehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
      if (vehicle) {
        await doBooking(vehicle);
      }
    } catch (err) {
      setAddVehicleError(err?.message || 'Failed to add vehicle. Please try again.');
    } finally {
      setAddVehicleSaving(false);
    }
  };

  // Open time picker modal
  const openTimePicker = (type) => {
    setTimeModalType(type);
    setShowTimeModal(true);
  };

  // Select time
  const selectTime = (time) => {
    if (timeModalType === 'start') {
      setSelectedStartTime(time);
      // Auto-adjust end time
      const startHour = parseInt(time.split(':')[0]);
      const endHour = Math.min(startHour + selectedHours, 23);
      setSelectedEndTime(`${endHour.toString().padStart(2, '0')}:00`);
    } else {
      setSelectedEndTime(time);
      // Calculate hours
      const startHour = parseInt(selectedStartTime.split(':')[0]);
      const endHour = parseInt(time.split(':')[0]);
      if (endHour > startHour) {
        setSelectedHours(endHour - startHour);
      }
    }
    setShowTimeModal(false);
  };

  // Get amenity icon
  const getAmenityIcon = (amenity) => {
    const icons = {
      security: { icon: 'shield-check', label: '24/7 Security' },
      cctv: { icon: 'cctv', label: 'CCTV' },
      ev_charging: { icon: 'ev-station', label: 'EV Charging' },
      covered: { icon: 'home-roof', label: 'Covered' },
      accessible: { icon: 'wheelchair-accessibility', label: 'Accessible' },
      valet: { icon: 'account-tie', label: 'Valet' },
      lighting: { icon: 'lightbulb-on', label: 'Well Lit' },
    };
    return icons[amenity] || { icon: 'check-circle', label: amenity };
  };

  // Format date for display
  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get display time
  const getDisplayTime = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Parking Space</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <MaterialIcon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#EF4444' : '#1A1A2E'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Icon name="share-2" size={22} color="#1A1A2E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <View style={styles.mainImageContainer}>
            {parking.images.length > 0 ? (
              <Image
                source={{ uri: parking.images[Math.min(selectedImageIndex, parking.images.length - 1)] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcon name="parking" size={60} color="#1A73E8" />
                <Text style={styles.imagePlaceholderText}>{parking.name}</Text>
              </View>
            )}
            <View style={styles.availabilityBadge}>
              <View style={styles.availabilityDot} />
              <Text style={styles.availabilityText}>
                {selectedSpace
                  ? `${Math.max(0, (selectedSpace.totalSpots || 1) - (selectedSpace.activeBookingCount || 0))} spot${(selectedSpace.totalSpots || 1) > 1 ? 's' : ''} available`
                  : `${parking.available} spot${parking.available !== 1 ? 's' : ''} available`}
              </Text>
            </View>
            {parking.images.length > 0 && (
              <View style={styles.imageCounter}>
                <Icon name="image" size={14} color="#FFFFFF" />
                <Text style={styles.imageCounterText}>{selectedImageIndex + 1}/{parking.images.length}</Text>
              </View>
            )}
          </View>

          {parking.images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
              {parking.images.map((uri, index) => (
                <TouchableOpacity
                  key={`${uri}-${index}`}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.thumbnailActive,
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Parking Space Details */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.parkingName}>{parking.name}</Text>
              <View style={styles.ratingRow}>
                <Icon name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{parking.rating}</Text>
                <Text style={styles.reviewCount}>({parking.totalReviews} reviews)</Text>
              </View>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceAmount}>
                {isPropertyMode && !selectedSpace
                  ? parking.minPrice === parking.maxPrice
                    ? `₹${parking.minPrice}`
                    : `₹${parking.minPrice}–₹${parking.maxPrice}`
                  : `₹${selectedSpace?.pricePerHour ?? parking.pricePerHour}`}
              </Text>
              <Text style={styles.priceUnit}>/hr</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addressRow} onPress={handleDirections}>
            <Icon name="map-pin" size={16} color="#6B7280" />
            <Text style={styles.addressText}>{parking.address}</Text>
            <Icon name="navigation" size={14} color="#1A73E8" />
          </TouchableOpacity>

          {/* Quick Info Cards */}
          <View style={styles.quickInfoGrid}>
            <View style={styles.quickInfoCard}>
              <MaterialIcon name="map-marker-distance" size={20} color="#1A73E8" />
              <Text style={styles.quickInfoLabel}>Distance</Text>
              <Text style={styles.quickInfoValue}>{parking.distance}</Text>
            </View>
            <View style={styles.quickInfoCard}>
              <MaterialIcon name={parking.spaceType === 'Covered' ? 'home-roof' : 'weather-sunny'} size={20} color="#1A73E8" />
              <Text style={styles.quickInfoLabel}>Type</Text>
              <Text style={styles.quickInfoValue}>{parking.spaceType}</Text>
            </View>
            <View style={styles.quickInfoCard}>
              <MaterialIcon name="clock-outline" size={20} color="#1A73E8" />
              <Text style={styles.quickInfoLabel}>Hours</Text>
              <Text style={styles.quickInfoValue}>{parking.operatingHours}</Text>
            </View>
          </View>

          {/* Space Dimensions */}
          <View style={styles.dimensionsCard}>
            <Text style={styles.dimensionsTitle}>Space Dimensions</Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionItem}>
                <MaterialIcon name="arrow-left-right" size={18} color="#6B7280" />
                <Text style={styles.dimensionLabel}>Width</Text>
                <Text style={styles.dimensionValue}>{parking.dimensions.width}</Text>
              </View>
              <View style={styles.dimensionDivider} />
              <View style={styles.dimensionItem}>
                <MaterialIcon name="arrow-up-down" size={18} color="#6B7280" />
                <Text style={styles.dimensionLabel}>Length</Text>
                <Text style={styles.dimensionValue}>{parking.dimensions.length}</Text>
              </View>
              <View style={styles.dimensionDivider} />
              <View style={styles.dimensionItem}>
                <MaterialIcon name="arrow-collapse-up" size={18} color="#6B7280" />
                <Text style={styles.dimensionLabel}>Height</Text>
                <Text style={styles.dimensionValue}>{parking.dimensions.height}</Text>
              </View>
            </View>
          </View>

          {/* Amenities */}
          <Text style={styles.subsectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {parking.amenities.map((amenity, index) => {
              const amenityInfo = getAmenityIcon(amenity);
              return (
                <View key={index} style={styles.amenityItem}>
                  <MaterialIcon name={amenityInfo.icon} size={18} color="#1A73E8" />
                  <Text style={styles.amenityLabel}>{amenityInfo.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Space Selector — shown when multiple spaces exist for this property */}
        {isPropertyMode && parkingData.spaces.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Spot</Text>
            <Text style={styles.spaceSelectorSubtitle}>
              {parkingData.spaces.length} space types available at this location
            </Text>
            {parkingData.spaces.map((space) => {
              const spaceAvailable = Math.max(0, (space.totalSpots || 1) - (space.activeBookingCount || 0));
              const isFullyBooked = spaceAvailable === 0;
              const isSelected = selectedSpace?.id === space.id;

              return (
                <TouchableOpacity
                  key={space.id}
                  style={[
                    styles.spaceCard,
                    isSelected && styles.spaceCardSelected,
                    isFullyBooked && styles.spaceCardDisabled,
                  ]}
                  onPress={() => {
                    if (!isFullyBooked) setSelectedSpace(isSelected ? null : space);
                  }}
                  activeOpacity={isFullyBooked ? 1 : 0.8}
                >
                  <View style={styles.spaceCardLeft}>
                    <View style={[styles.spaceIconCircle, isSelected && { backgroundColor: '#0D7377' }]}>
                      <MaterialIcon
                        name={SPACE_TYPE_ICONS[space.spaceType] || 'parking'}
                        size={22}
                        color={isSelected ? '#FFFFFF' : '#0D7377'}
                      />
                    </View>
                  </View>
                  <View style={styles.spaceCardBody}>
                    <View style={styles.spaceCardHeader}>
                      <Text style={[styles.spaceCardType, isFullyBooked && { color: '#9CA3AF' }]}>
                        {SPACE_TYPE_LABELS[space.spaceType] || space.spaceType}
                      </Text>
                      <Text style={[styles.spaceCardPrice, isFullyBooked && { color: '#9CA3AF' }]}>
                        ₹{space.pricePerHour}/hr
                      </Text>
                    </View>
                    <View style={styles.spaceCardMeta}>
                      {isFullyBooked ? (
                        <View style={styles.spaceFullBadge}>
                          <Text style={styles.spaceFullText}>Fully Booked</Text>
                        </View>
                      ) : (
                        <Text style={styles.spaceAvailableText}>
                          {spaceAvailable} of {space.totalSpots || 1} spot{(space.totalSpots || 1) > 1 ? 's' : ''} available
                        </Text>
                      )}
                      {space.hasEvCharging && (
                        <View style={styles.spaceBadge}>
                          <MaterialIcon name="ev-station" size={12} color="#10B981" />
                          <Text style={styles.spaceBadgeText}>EV</Text>
                        </View>
                      )}
                      {space.bookingMode === 'request' && (
                        <View style={[styles.spaceBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[styles.spaceBadgeText, { color: '#92400E' }]}>On Request</Text>
                        </View>
                      )}
                    </View>
                    {(space.allowedVehicleTypes || []).length > 0 && (
                      <Text style={styles.spaceVehicleTypes} numberOfLines={1}>
                        {(space.allowedVehicleTypes || []).slice(0, 3).join(', ')}
                        {(space.allowedVehicleTypes || []).length > 3 ? ' +more' : ''}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <View style={styles.spaceCheckmark}>
                      <Icon name="check-circle" size={22} color="#1A73E8" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateRow}>
              {dates.map((dateItem, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    selectedDate.toDateString() === dateItem.date.toDateString() && styles.dateCardActive,
                  ]}
                  onPress={() => setSelectedDate(dateItem.date)}
                >
                  <Text style={[
                    styles.dateDayName,
                    selectedDate.toDateString() === dateItem.date.toDateString() && styles.dateTextActive,
                  ]}>
                    {dateItem.isToday ? 'Today' : dateItem.dayName}
                  </Text>
                  <Text style={[
                    styles.dateDay,
                    selectedDate.toDateString() === dateItem.date.toDateString() && styles.dateTextActive,
                  ]}>
                    {dateItem.day}
                  </Text>
                  <Text style={[
                    styles.dateMonth,
                    selectedDate.toDateString() === dateItem.date.toDateString() && styles.dateTextActive,
                  ]}>
                    {dateItem.month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Duration & Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Duration</Text>

          {/* Duration Type Selector */}
          <View style={styles.durationTypeRow}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.durationTypeButton,
                  selectedDuration === option.id && styles.durationTypeButtonActive,
                ]}
                onPress={() => setSelectedDuration(option.id)}
              >
                <Icon
                  name={option.icon}
                  size={16}
                  color={selectedDuration === option.id ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[
                  styles.durationTypeText,
                  selectedDuration === option.id && styles.durationTypeTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hourly Time Selection */}
          {selectedDuration === 'hourly' && (
            <View style={styles.timeSelectionContainer}>
              <View style={styles.timePickerRow}>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('start')}
                >
                  <Text style={styles.timePickerLabel}>Start Time</Text>
                  <View style={styles.timePickerValue}>
                    <Icon name="clock" size={18} color="#1A73E8" />
                    <Text style={styles.timePickerText}>{getDisplayTime(selectedStartTime)}</Text>
                    <Icon name="chevron-down" size={18} color="#6B7280" />
                  </View>
                </TouchableOpacity>

                <View style={styles.timeArrow}>
                  <Icon name="arrow-right" size={20} color="#9CA3AF" />
                </View>

                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('end')}
                >
                  <Text style={styles.timePickerLabel}>End Time</Text>
                  <View style={styles.timePickerValue}>
                    <Icon name="clock" size={18} color="#1A73E8" />
                    <Text style={styles.timePickerText}>{getDisplayTime(selectedEndTime)}</Text>
                    <Icon name="chevron-down" size={18} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Hours Selector */}
              <View style={styles.hoursSelectorContainer}>
                <Text style={styles.hoursSelectorLabel}>Duration</Text>
                <View style={styles.hoursSelector}>
                  <TouchableOpacity
                    style={styles.hoursButton}
                    onPress={() => setSelectedHours(Math.max(1, selectedHours - 1))}
                  >
                    <Icon name="minus" size={20} color="#1A73E8" />
                  </TouchableOpacity>
                  <View style={styles.hoursDisplay}>
                    <Text style={styles.hoursValue}>{selectedHours}</Text>
                    <Text style={styles.hoursUnit}>hour{selectedHours > 1 ? 's' : ''}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.hoursButton}
                    onPress={() => setSelectedHours(Math.min(24, selectedHours + 1))}
                  >
                    <Icon name="plus" size={20} color="#1A73E8" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceBreakdownCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>
                Base Price ({calculatePricing.durationText})
              </Text>
              <Text style={styles.priceRowValue}>₹{calculatePricing.basePrice}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Service Fee</Text>
              <Text style={styles.priceRowValue}>₹{calculatePricing.serviceFee}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Tax</Text>
              <Text style={styles.priceRowValue}>₹{calculatePricing.tax}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRowTotal}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>₹{calculatePricing.total}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptionsRow}>
            {PAYMENT_OPTIONS.map((opt) => {
              const active = selectedPaymentMethod === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.paymentOptionCard, active && styles.paymentOptionCardActive]}
                  onPress={() => setSelectedPaymentMethod(opt.id)}
                >
                  {active && (
                    <View style={styles.paymentOptionCheckBadge}>
                      <Icon name="check-circle" size={16} color="#1A73E8" />
                    </View>
                  )}
                  <Icon name={opt.icon} size={30} color={active ? '#0D7377' : '#6B7280'} />
                  <Text style={[styles.paymentOptionLabel, active && styles.paymentOptionLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.paymentOptionSubtitle}>{opt.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: parking.latitude,
                longitude: parking.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: parking.latitude,
                  longitude: parking.longitude,
                }}
              >
                <View style={styles.mapMarker}>
                  <MaterialIcon name="parking" size={20} color="#FFFFFF" />
                </View>
              </Marker>
            </MapView>
            <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
              <Icon name="navigation" size={18} color="#FFFFFF" />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <TouchableOpacity
            style={styles.termsCheckbox}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[
              styles.checkbox,
              agreedToTerms && styles.checkboxChecked,
            ]}>
              {agreedToTerms && <Icon name="check" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>,{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>, and{' '}
              <Text style={styles.termsLink}>Refund Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Cancellation Policy */}
          <View style={styles.cancellationCard}>
            <Icon name="info" size={18} color="#1A73E8" />
            <Text style={styles.cancellationText}>
              Free cancellation up to 2 hours before your booking starts
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>Total</Text>
          {isPropertyMode && !selectedSpace ? (
            <Text style={[styles.bottomPriceValue, { fontSize: 13, color: '#6B7280' }]}>
              Select a spot
            </Text>
          ) : (
            <>
              <Text style={styles.bottomPriceValue}>₹{calculatePricing.total}</Text>
              <Text style={styles.bottomPriceDuration}>{calculatePricing.durationText}</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!isFormValid || isLoading) && styles.bookButtonDisabled,
          ]}
          onPress={handleBookNow}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.bookButtonText}>
                {isPropertyMode && !selectedSpace ? 'Select a Spot' : 'Book Now'}
              </Text>
              <Icon name="arrow-right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Booking error shown above the bottom bar */}
      {bookingError ? (
        <View style={styles.bookingErrorBanner}>
          <Text style={styles.bookingErrorText}>{bookingError}</Text>
        </View>
      ) : null}

      {/* Booking Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={56} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            {confirmedBooking?.bookingNumber ? (
              <Text style={styles.successBookingNumber}>
                Booking #{confirmedBooking.bookingNumber}
              </Text>
            ) : null}
            <Text style={styles.successSubtitle}>
              Your parking space has been reserved.{'\n'}
              {confirmedBooking?.bookingMode === 'request'
                ? 'The owner will confirm your request shortly.'
                : 'You\'re all set — see you there!'}
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Online Payment Confirm Modal */}
      <Modal
        visible={showOnlineConfirmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOnlineConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.onlineConfirmModalContent}>
            <View style={styles.onlineConfirmHeader}>
              <Text style={styles.onlineConfirmTitle}>Confirm Booking</Text>
              <TouchableOpacity onPress={() => setShowOnlineConfirmModal(false)}>
                <Icon name="x" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            {/* Price breakdown */}
            <View style={styles.confirmBreakdownCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>
                  Base Price ({calculatePricing.durationText})
                </Text>
                <Text style={styles.priceRowValue}>₹{calculatePricing.basePrice}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Service Fee</Text>
                <Text style={styles.priceRowValue}>₹{calculatePricing.serviceFee}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Tax</Text>
                <Text style={styles.priceRowValue}>₹{calculatePricing.tax}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRowTotal}>
                <Text style={styles.priceTotalLabel}>Total</Text>
                <Text style={styles.priceTotalValue}>₹{calculatePricing.total}</Text>
              </View>
            </View>

            <View style={styles.onlineConfirmNote}>
              <Icon name="info" size={13} color="#6B7280" />
              <Text style={styles.onlineConfirmNoteText}>
                Online payment gateway coming soon. Your booking will be confirmed directly.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.addVehicleSaveButton, isLoading && styles.bookButtonDisabled]}
              onPress={handleOnlineConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.addVehicleSaveText}>
                  Confirm & Book  ·  ₹{calculatePricing.total}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal
        visible={showAddVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addVehicleModalContent}>
            <View style={styles.addVehicleHeader}>
              <Text style={styles.addVehicleTitle}>Add a Vehicle</Text>
              <TouchableOpacity onPress={() => setShowAddVehicleModal(false)}>
                <Icon name="x" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>
            <Text style={styles.addVehicleSubtitle}>
              You need a registered vehicle to make a booking.
            </Text>

            <Text style={styles.addVehicleLabel}>Registration Number</Text>
            <TextInput
              style={styles.addVehicleInput}
              placeholder="e.g. MH12AB1234"
              placeholderTextColor="#9CA3AF"
              value={addVehicleReg}
              onChangeText={(v) => setAddVehicleReg(v.toUpperCase())}
              autoCapitalize="characters"
              returnKeyType="done"
            />

            <Text style={styles.addVehicleLabel}>Vehicle Type</Text>
            <View style={styles.vehicleTypePills}>
              {ADD_VEHICLE_TYPES.map((vt) => (
                <TouchableOpacity
                  key={vt.apiType}
                  style={[
                    styles.vehicleTypePill,
                    addVehicleType === vt.apiType && styles.vehicleTypePillSelected,
                  ]}
                  onPress={() => setAddVehicleType(vt.apiType)}
                >
                  <Text
                    style={[
                      styles.vehicleTypePillText,
                      addVehicleType === vt.apiType && styles.vehicleTypePillTextSelected,
                    ]}
                  >
                    {vt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {addVehicleError ? (
              <Text style={styles.addVehicleError}>{addVehicleError}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.addVehicleSaveButton,
                addVehicleSaving && styles.bookButtonDisabled,
              ]}
              onPress={handleAddVehicleSave}
              disabled={addVehicleSaving}
            >
              {addVehicleSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.addVehicleSaveText}>Save & Book</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timeModalContent}>
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle}>
                Select {timeModalType === 'start' ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Icon name="x" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.timeSlotsList}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.value}
                  style={[
                    styles.timeSlotItem,
                    (timeModalType === 'start' ? selectedStartTime : selectedEndTime) === slot.value && styles.timeSlotItemActive,
                  ]}
                  onPress={() => selectTime(slot.value)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    (timeModalType === 'start' ? selectedStartTime : selectedEndTime) === slot.value && styles.timeSlotTextActive,
                  ]}>
                    {slot.label}
                  </Text>
                  {(timeModalType === 'start' ? selectedStartTime : selectedEndTime) === slot.value && (
                    <Icon name="check" size={20} color="#1A73E8" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontStacks.regular,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.4,
    color: palette.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },

  // Image Gallery
  imageGallery: {
    backgroundColor: '#F9FAFB',
  },
  mainImageContainer: {
    height: 220,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  thumbnailRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#0D7377',
    backgroundColor: '#E8F5F4',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },

  // Sections
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 12,
  },

  // Main Info
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  parkingName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  reviewCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#E8F5F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D7377',
  },
  priceUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },

  // Quick Info Grid
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 2,
  },

  // Dimensions
  dimensionsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  dimensionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimensionItem: {
    flex: 1,
    alignItems: 'center',
  },
  dimensionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  dimensionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 2,
  },
  dimensionDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },

  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  amenityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D7377',
  },

  // Date Selection
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCard: {
    width: 70,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  dateCardActive: {
    backgroundColor: '#0D7377',
  },
  dateDayName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginVertical: 4,
  },
  dateMonth: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateTextActive: {
    color: '#FFFFFF',
  },

  // Duration Type
  durationTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  durationTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  durationTypeButtonActive: {
    backgroundColor: '#0D7377',
  },
  durationTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  durationTypeTextActive: {
    color: '#FFFFFF',
  },

  // Time Selection
  timeSelectionContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePickerButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePickerLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  timePickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  timeArrow: {
    paddingHorizontal: 4,
  },
  hoursSelectorContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  hoursSelectorLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  hoursSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hoursButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoursDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  hoursValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0D7377',
  },
  hoursUnit: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Price Breakdown
  priceBreakdownCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceRowLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  priceRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D7377',
  },

  // Payment Options (Cash / Online)
  paymentOptionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOptionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  paymentOptionCardActive: {
    borderColor: '#0D7377',
    backgroundColor: '#E8F5F4',
  },
  paymentOptionCheckBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  paymentOptionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 10,
  },
  paymentOptionLabelActive: {
    color: '#0D7377',
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },

  // Online confirm modal
  onlineConfirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  onlineConfirmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  onlineConfirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  confirmBreakdownCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  onlineConfirmNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 20,
  },
  onlineConfirmNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Map
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D7377',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  directionsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D7377',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Terms
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0D7377',
    borderColor: '#0D7377',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  termsLink: {
    color: '#0D7377',
    fontWeight: '500',
  },
  cancellationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F4',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  cancellationText: {
    flex: 1,
    fontSize: 13,
    color: '#0D7377',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D7377',
  },
  bottomPriceDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D7377',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Booking error banner
  bookingErrorBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
  },
  bookingErrorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },

  // Success modal
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  successBookingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Time Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  timeSlotsList: {
    padding: 16,
  },
  timeSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  timeSlotItemActive: {
    backgroundColor: '#E8F5F4',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  timeSlotTextActive: {
    fontWeight: '600',
    color: '#0D7377',
  },

  // Space Selector
  spaceSelectorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: -4,
  },
  spaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  spaceCardSelected: {
    borderColor: '#0D7377',
    backgroundColor: '#E8F5F4',
  },
  spaceCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  spaceCardLeft: {
    marginRight: 14,
  },
  spaceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceCardBody: {
    flex: 1,
  },
  spaceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spaceCardType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  spaceCardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D7377',
  },
  spaceCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  spaceAvailableText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  spaceFullBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  spaceFullText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  spaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  spaceBadgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  spaceVehicleTypes: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  spaceCheckmark: {
    marginLeft: 10,
  },

  // Add Vehicle Modal
  addVehicleModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  addVehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addVehicleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  addVehicleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  addVehicleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  addVehicleInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  vehicleTypePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  vehicleTypePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  vehicleTypePillSelected: {
    borderColor: '#0D7377',
    backgroundColor: '#EBF3FD',
  },
  vehicleTypePillText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  vehicleTypePillTextSelected: {
    color: '#0D7377',
    fontWeight: '600',
  },
  addVehicleError: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 12,
  },
  addVehicleSaveButton: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVehicleSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ParkingDetailsPage;
