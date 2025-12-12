import React, { useState, useRef, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker } from 'react-native-maps';

const { width } = Dimensions.get('window');

// Duration options for booking
const durationOptions = [
  { id: 'hourly', label: 'Hourly', icon: 'clock' },
  { id: 'daily', label: 'Daily', icon: 'calendar' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar' },
  { id: 'monthly', label: 'Monthly', icon: 'calendar' },
];

// Payment methods
const paymentMethods = [
  { id: 'card', label: 'Credit/Debit Card', icon: 'credit-card', brand: 'Visa •••• 4242' },
  { id: 'paypal', label: 'PayPal', icon: 'paypal', brand: null },
  { id: 'apple', label: 'Apple Pay', icon: 'apple', brand: null },
  { id: 'google', label: 'Google Pay', icon: 'google', brand: null },
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

const ParkingDetailsPage = ({ navigation, route }) => {
  const { parkingData } = route.params || {};
  const scrollViewRef = useRef(null);
  const dates = useMemo(() => generateDates(), []);

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
    images: [1, 2, 3, 4],
    serviceFee: 1.50,
    taxRate: 0.08,
  };

  const parking = {
    ...defaultParkingData,
    ...parkingData,
    owner: {
      ...defaultParkingData.owner,
      ...(parkingData?.owner || {}),
    },
    dimensions: {
      ...defaultParkingData.dimensions,
      ...(parkingData?.dimensions || {}),
    },
  };

  // Calculate pricing based on duration
  const calculatePricing = useMemo(() => {
    let basePrice = 0;
    let durationText = '';

    switch (selectedDuration) {
      case 'hourly':
        basePrice = parking.pricePerHour * selectedHours;
        durationText = `${selectedHours} hour${selectedHours > 1 ? 's' : ''}`;
        break;
      case 'daily':
        basePrice = parking.pricePerDay || parking.pricePerHour * 8;
        durationText = '1 day';
        break;
      case 'weekly':
        basePrice = parking.pricePerWeek || parking.pricePerHour * 56;
        durationText = '1 week';
        break;
      case 'monthly':
        basePrice = parking.pricePerMonth || parking.pricePerHour * 240;
        durationText = '1 month';
        break;
      default:
        basePrice = parking.pricePerHour;
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
  }, [selectedDuration, selectedHours, parking]);

  // Validation
  const isFormValid = useMemo(() => {
    return selectedPaymentMethod !== null && agreedToTerms && selectedDate !== null;
  }, [selectedPaymentMethod, agreedToTerms, selectedDate]);

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

  // Handle booking
  const handleBookNow = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('BookingConfirmation', {
        parkingData: parking,
        duration: selectedDuration,
        hours: selectedHours,
        date: selectedDate.toISOString(),
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        pricing: calculatePricing,
        paymentMethod: selectedPaymentMethod,
      });
    }, 1500);
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <View style={styles.imagePlaceholder}>
              <MaterialIcon name="parking" size={60} color="#1A73E8" />
              <Text style={styles.imagePlaceholderText}>{parking.name}</Text>
            </View>
            <View style={styles.availabilityBadge}>
              <View style={styles.availabilityDot} />
              <Text style={styles.availabilityText}>{parking.available} spots available</Text>
            </View>
            {/* Image Counter */}
            <View style={styles.imageCounter}>
              <Icon name="image" size={14} color="#FFFFFF" />
              <Text style={styles.imageCounterText}>{selectedImageIndex + 1}/{parking.images.length}</Text>
            </View>
          </View>

          {/* Thumbnail Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
            {parking.images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.thumbnailActive
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <MaterialIcon name="image" size={24} color={selectedImageIndex === index ? '#1A73E8' : '#9CA3AF'} />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
              <Text style={styles.priceAmount}>₹{parking.pricePerHour}</Text>
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
          <View style={styles.paymentMethodsContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === method.id && styles.paymentMethodCardActive,
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <View style={styles.paymentMethodIcon}>
                  <Icon
                    name={method.icon}
                    size={24}
                    color={selectedPaymentMethod === method.id ? '#1A73E8' : '#6B7280'}
                  />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodLabel,
                    selectedPaymentMethod === method.id && styles.paymentMethodLabelActive,
                  ]}>
                    {method.label}
                  </Text>
                  {method.brand && (
                    <Text style={styles.paymentMethodBrand}>{method.brand}</Text>
                  )}
                </View>
                <View style={[
                  styles.paymentMethodRadio,
                  selectedPaymentMethod === method.id && styles.paymentMethodRadioActive,
                ]}>
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.paymentMethodRadioDot} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addPaymentButton}>
            <Icon name="plus-circle" size={20} color="#1A73E8" />
            <Text style={styles.addPaymentText}>Add New Payment Method</Text>
          </TouchableOpacity>
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
          <Text style={styles.bottomPriceValue}>₹{calculatePricing.total}</Text>
          <Text style={styles.bottomPriceDuration}>{calculatePricing.durationText}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            !isFormValid && styles.bookButtonDisabled,
          ]}
          onPress={handleBookNow}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <Text style={styles.bookButtonText}>Processing...</Text>
          ) : (
            <>
              <Text style={styles.bookButtonText}>Book Now</Text>
              <Icon name="arrow-right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
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
    borderColor: '#1A73E8',
    backgroundColor: '#EBF5FF',
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
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A73E8',
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
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  amenityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A73E8',
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
    backgroundColor: '#1A73E8',
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
    backgroundColor: '#1A73E8',
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
    backgroundColor: '#EBF5FF',
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
    color: '#1A73E8',
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
    color: '#1A73E8',
  },

  // Payment Methods
  paymentMethodsContainer: {
    gap: 10,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodCardActive: {
    borderColor: '#1A73E8',
    backgroundColor: '#EBF5FF',
  },
  paymentMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  paymentMethodLabelActive: {
    color: '#1A73E8',
  },
  paymentMethodBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentMethodRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodRadioActive: {
    borderColor: '#1A73E8',
  },
  paymentMethodRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1A73E8',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1A73E8',
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 8,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
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
    backgroundColor: '#1A73E8',
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
    backgroundColor: '#1A73E8',
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
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  termsLink: {
    color: '#1A73E8',
    fontWeight: '500',
  },
  cancellationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  cancellationText: {
    flex: 1,
    fontSize: 13,
    color: '#1A73E8',
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
    color: '#1A73E8',
  },
  bottomPriceDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
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
    backgroundColor: '#EBF5FF',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  timeSlotTextActive: {
    fontWeight: '600',
    color: '#1A73E8',
  },
});

export default ParkingDetailsPage;
