import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  PermissionsAndroid,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';

// Vehicle category filters
const categories = [
  { id: 'all', icon: 'view-grid', label: 'All', color: '#1A73E8' },
  { id: 'car', icon: 'car', label: 'Car', color: '#EC4899' },
  { id: 'bike', icon: 'motorbike', label: 'Bike', color: '#10B981' },
  { id: 'bus', icon: 'bus', label: 'Bus', color: '#F59E0B' },
  { id: 'truck', icon: 'truck', label: 'Truck', color: '#EF4444' },
];

// Filter options
const priceRanges = [
  { id: 'all', label: 'All Prices', min: 0, max: 100 },
  { id: 'budget', label: '₹0 - ₹3', min: 0, max: 3 },
  { id: 'mid', label: '₹4 - ₹8', min: 4, max: 8 },
  { id: 'premium', label: '₹9+', min: 9, max: 100 },
];

const durationOptions = [
  { id: 'all', label: 'All', icon: 'clock' },
  { id: 'hourly', label: 'Hourly', icon: 'clock' },
  { id: 'daily', label: 'Daily', icon: 'calendar' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar' },
];

const amenityOptions = [
  { id: 'ev_charging', label: 'EV Charging', icon: 'battery-charging' },
  { id: 'security', label: '24/7 Security', icon: 'shield' },
  { id: 'covered', label: 'Covered', icon: 'home' },
  { id: 'accessible', label: 'Accessible', icon: 'users' },
  { id: 'cctv', label: 'CCTV', icon: 'video' },
  { id: 'valet', label: 'Valet', icon: 'user-check' },
];

// Base parking spot templates (will be positioned around user's location)
const baseParkingSpots = [
  // Car parking spots
  { id: '1', type: 'car', price: '₹2', pricePerHour: 2, latOffset: 0.003, lngOffset: 0.002, name: 'Central Parking', address: 'Near City Center', spots: 45, available: 12, rating: 4.5, distance: '0.3 km', duration: ['hourly', 'daily'], amenities: ['security', 'cctv'] },
  { id: '2', type: 'car', price: '₹4', pricePerHour: 4, latOffset: -0.002, lngOffset: 0.004, name: 'Metro Parking Lot', address: 'Metro Station Road', spots: 80, available: 23, rating: 4.2, distance: '0.5 km', duration: ['hourly', 'daily', 'weekly'], amenities: ['ev_charging', 'security', 'covered'] },
  { id: '3', type: 'car', price: '₹5', pricePerHour: 5, latOffset: 0.001, lngOffset: -0.003, name: 'Plaza Parking', address: 'Shopping Plaza', spots: 60, available: 8, rating: 4.8, distance: '0.4 km', duration: ['hourly', 'daily'], amenities: ['ev_charging', 'security', 'accessible', 'valet'] },

  // Bike parking spots
  { id: '4', type: 'bike', price: '₹1', pricePerHour: 1, latOffset: -0.001, lngOffset: -0.002, name: 'Bike Station A', address: 'Park Boulevard', spots: 30, available: 15, rating: 4.6, distance: '0.2 km', duration: ['hourly', 'daily'], amenities: ['security', 'covered'] },
  { id: '5', type: 'bike', price: '₹2', pricePerHour: 2, latOffset: 0.004, lngOffset: 0.001, name: 'Bike Hub Central', address: 'Center Street', spots: 25, available: 10, rating: 4.4, distance: '0.3 km', duration: ['hourly'], amenities: ['cctv'] },
  { id: '6', type: 'bike', price: '₹1', pricePerHour: 1, latOffset: -0.003, lngOffset: 0.003, name: 'Two Wheeler Zone', address: 'South Avenue', spots: 40, available: 20, rating: 4.2, distance: '0.5 km', duration: ['hourly', 'daily'], amenities: ['security'] },

  // Bus parking spots
  { id: '7', type: 'bus', price: '₹8', pricePerHour: 8, latOffset: 0.005, lngOffset: -0.001, name: 'Bus Terminal Lot', address: 'Bus Stand Road', spots: 20, available: 8, rating: 4.3, distance: '0.6 km', duration: ['hourly', 'daily', 'weekly'], amenities: ['security', 'accessible', 'cctv'] },
  { id: '8', type: 'bus', price: '₹10', pricePerHour: 10, latOffset: -0.004, lngOffset: -0.004, name: 'Coach Parking Area', address: 'Highway Service Road', spots: 15, available: 5, rating: 4.5, distance: '0.4 km', duration: ['daily', 'weekly'], amenities: ['security', 'covered', 'accessible'] },

  // Truck parking spots
  { id: '9', type: 'truck', price: '₹12', pricePerHour: 12, latOffset: 0.002, lngOffset: 0.005, name: 'Truck Stop Plaza', address: 'Industrial Area', spots: 25, available: 12, rating: 4.1, distance: '0.7 km', duration: ['hourly', 'daily', 'weekly'], amenities: ['security', 'cctv'] },
  { id: '10', type: 'truck', price: '₹15', pricePerHour: 15, latOffset: -0.005, lngOffset: 0.002, name: 'Heavy Vehicle Lot', address: 'Outer Ring Road', spots: 30, available: 18, rating: 4.0, distance: '0.8 km', duration: ['daily', 'weekly'], amenities: ['security', 'accessible'] },
  { id: '11', type: 'truck', price: '₹10', pricePerHour: 10, latOffset: 0.003, lngOffset: -0.005, name: 'Freight Parking', address: 'Commerce District', spots: 20, available: 7, rating: 4.2, distance: '0.5 km', duration: ['hourly', 'daily'], amenities: ['ev_charging', 'security', 'covered', 'cctv'] },
];

// Function to generate parking spots around a location
const generateParkingSpotsAroundLocation = (latitude, longitude) => {
  return baseParkingSpots.map(spot => ({
    ...spot,
    latitude: latitude + spot.latOffset,
    longitude: longitude + spot.lngOffset,
  }));
};

// Default to Delhi, India for demo
const initialRegion = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Custom map style for light, clean appearance
const mapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#dadada' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9c9c9' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
];

const HomePage = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedParkingData, setSelectedParkingData] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [allRecommendationsVisible, setAllRecommendationsVisible] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Geolocation state
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('Getting location...');
  const [mapRegion, setMapRegion] = useState(initialRegion);
  const mapRef = useRef(null);

  // Dynamic parking spots based on user location
  const [parkingSpots, setParkingSpots] = useState(() =>
    generateParkingSpotsAroundLocation(initialRegion.latitude, initialRegion.longitude)
  );

  // Hide/show bottom tab bar based on search focus
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: isSearchFocused
        ? { display: 'none' }
        : {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 65,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
          },
    });
  }, [isSearchFocused, navigation]);

  // Request location permission and get current location on mount
  useEffect(() => {
    const getCurrentLocation = () => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };

          setUserLocation({ latitude, longitude });
          setMapRegion(newRegion);
          setParkingSpots(generateParkingSpotsAroundLocation(latitude, longitude));

          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }

          // Reverse geocode to get location name
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data.address) {
                const { city, town, village, suburb, county } = data.address;
                setLocationName(city || town || village || suburb || county || 'Current Location');
              }
            })
            .catch(() => setLocationName('Current Location'));
        },
        (error) => {
          console.warn('Location error:', error);
          // Keep showing parking spots at initial region
          setLocationName('Demo Location');
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
      );
    };

    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location to show nearby parking spots.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            getCurrentLocation();
          } else {
            setLocationName('Demo Location');
          }
        } catch (err) {
          console.warn(err);
          setLocationName('Demo Location');
        }
      } else {
        getCurrentLocation();
      }
    };

    requestLocationPermission();
  }, []);

  // Handle user location update from MapView
  const handleUserLocationChange = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    if (!userLocation) {
      // First time getting location - animate to it and generate parking spots nearby
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setUserLocation({ latitude, longitude });
      setMapRegion(newRegion);

      // Generate parking spots around user's current location
      setParkingSpots(generateParkingSpotsAroundLocation(latitude, longitude));

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      // Reverse geocode to get location name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data.address) {
          const { city, town, village, suburb, county } = data.address;
          const locationText = city || town || village || suburb || county || 'Current Location';
          setLocationName(locationText);
        }
      } catch (error) {
        setLocationName('Current Location');
      }
    } else {
      setUserLocation({ latitude, longitude });
    }
  };

  // Function to center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  // Function to open directions to a parking spot
  const openDirections = (destination) => {
    const { latitude, longitude } = destination;

    // Use Google Maps URL which works reliably on both platforms
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application');
    });
  };

  // Search for location and center map
  const handleLocationSearch = async () => {
    if (searchQuery.trim() === '') return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newRegion = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setMapRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.log('Location search error:', error);
    }
  };

  // Toggle amenity selection
  const toggleAmenity = (amenityId) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedPriceRange('all');
    setSelectedDuration('all');
    setSelectedAmenities([]);
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedPriceRange !== 'all') count++;
    if (selectedDuration !== 'all') count++;
    count += selectedAmenities.length;
    return count;
  }, [selectedPriceRange, selectedDuration, selectedAmenities]);

  // Filter parking spots based on all criteria
  const filteredSpots = useMemo(() => {
    return parkingSpots.filter(spot => {
      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = spot.name.toLowerCase().includes(query);
        const matchesAddress = spot.address.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress) {
          return false;
        }
      }

      // Filter by vehicle type
      if (selectedCategory !== 'all' && spot.type !== selectedCategory) {
        return false;
      }

      // Filter by price range
      if (selectedPriceRange !== 'all') {
        const priceRange = priceRanges.find(p => p.id === selectedPriceRange);
        if (priceRange && (spot.pricePerHour < priceRange.min || spot.pricePerHour > priceRange.max)) {
          return false;
        }
      }

      // Filter by duration
      if (selectedDuration !== 'all' && !spot.duration.includes(selectedDuration)) {
        return false;
      }

      // Filter by amenities
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every(amenity =>
          spot.amenities.includes(amenity)
        );
        if (!hasAllAmenities) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedPriceRange, selectedDuration, selectedAmenities]);

  const handleSpotPress = (spot) => {
    setSelectedSpot(spot.id === selectedSpot ? null : spot.id);
    setSelectedParkingData(spot);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedSpot(null);
  };

  // Render list view header with search bar and map toggle
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Search Bar */}
      <View style={styles.listSearchSection}>
        <View style={styles.listSearchBar}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.listSearchInput}
            placeholder="Search Location"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmitEditing={handleLocationSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.gpsButton} onPress={centerOnUserLocation}>
            <Icon name="crosshair" size={18} color="#1A73E8" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.listFilterButton} onPress={() => setFilterModalVisible(true)}>
          <Icon name="sliders" size={20} color="#FFFFFF" />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Results count and view toggle tabs */}
      <View style={styles.listResultsRow}>
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>{filteredSpots.length} parking spots</Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Icon name="list" size={18} color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Icon name="map" size={18} color={viewMode === 'map' ? '#FFFFFF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render parking card for list view
  const renderParkingCard = ({ item }) => (
    <TouchableOpacity
      style={styles.parkingCard}
      onPress={() => handleSpotPress(item)}
    >
      <View style={styles.parkingCardImage}>
        <MaterialIcon name="parking" size={32} color="#1A73E8" />
        {item.available < 5 && (
          <View style={styles.lowAvailabilityBadgeCard}>
            <Text style={styles.lowAvailabilityTextCard}>{item.available} left</Text>
          </View>
        )}
      </View>
      <View style={styles.parkingCardContent}>
        <View style={styles.parkingCardHeader}>
          <Text style={styles.parkingCardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.parkingCardRating}>
            <Icon name="star" size={12} color="#F59E0B" />
            <Text style={styles.parkingCardRatingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.parkingCardAddress} numberOfLines={1}>{item.address}</Text>
        <View style={styles.parkingCardMeta}>
          <View style={styles.metaItem}>
            <Icon name="navigation" size={12} color="#6B7280" />
            <Text style={styles.metaText}>{item.distance}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcon name={item.type === 'car' ? 'car' : item.type === 'bike' ? 'motorbike' : item.type === 'bus' ? 'bus' : 'truck'} size={12} color="#6B7280" />
            <Text style={styles.metaText}>{item.available} spots</Text>
          </View>
        </View>
        <View style={styles.parkingCardAmenities}>
          {item.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityBadge}>
              <Text style={styles.amenityBadgeText}>{amenity.replace('_', ' ')}</Text>
            </View>
          ))}
          {item.amenities.length > 3 && (
            <View style={styles.amenityBadge}>
              <Text style={styles.amenityBadgeText}>+{item.amenities.length - 3}</Text>
            </View>
          )}
        </View>
        <View style={styles.parkingCardFooter}>
          <View>
            <Text style={styles.parkingCardPrice}>{item.price}<Text style={styles.parkingCardPriceUnit}>/hr</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.parkingCardBookButton}
            onPress={() => navigation.navigate('ParkingDetails', { parkingData: item })}
          >
            <Text style={styles.parkingCardBookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render recommendations section for list view
  const renderListRecommendations = () => (
    <View style={styles.listRecommendationsSection}>
      <View style={styles.listRecommendationsHeader}>
        <View style={styles.recommendationsTitleRow}>
          <Icon name="zap" size={18} color="#F59E0B" />
          <Text style={styles.recommendationsTitle}>Nearby Parking</Text>
        </View>
        <TouchableOpacity onPress={() => setAllRecommendationsVisible(true)}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listRecommendationsScrollContent}
      >
        {filteredSpots.slice(0, 6).map((spot) => (
          <TouchableOpacity
            key={spot.id}
            style={[
              styles.listRecommendationCard,
              selectedSpot === spot.id && styles.recommendationCardSelected,
            ]}
            onPress={() => handleSpotPress(spot)}
            activeOpacity={0.9}
          >
            <View style={styles.recommendationImageLeft}>
              <MaterialIcon name="parking" size={24} color="#1A73E8" />
              {spot.available < 5 && (
                <View style={styles.lowAvailabilityBadge}>
                  <Text style={styles.lowAvailabilityText}>{spot.available} left</Text>
                </View>
              )}
            </View>

            <View style={styles.recommendationContent}>
              <View style={styles.recommendationCardHeader}>
                <Text style={styles.recommendationName} numberOfLines={1}>{spot.name}</Text>
              </View>

              <View style={styles.recommendationMeta}>
                <Icon name="navigation" size={12} color="#6B7280" />
                <Text style={styles.recommendationDistance}>{spot.distance}</Text>
                <Text style={styles.recommendationDot}>•</Text>
                <Text style={styles.recommendationSpots}>{spot.available} spots</Text>
              </View>

              <View style={styles.recommendationFooter}>
                <Text style={styles.recommendationPrice}>{spot.price}<Text style={styles.recommendationPriceUnit}>/hr</Text></Text>
                <TouchableOpacity
                  style={styles.recommendationBookButton}
                  onPress={() => {
                    navigation.navigate('ParkingDetails', { parkingData: spot });
                  }}
                >
                  <Text style={styles.recommendationBookButtonText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render "All Parking" section title
  const renderAllParkingTitle = () => (
    <View style={styles.allParkingTitleContainer}>
      <Icon name="grid" size={18} color="#1A73E8" />
      <Text style={styles.allParkingTitle}>All Parking</Text>
    </View>
  );

  // Render list view
  const renderListView = () => (
    <FlatList
      data={filteredSpots}
      renderItem={renderParkingCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          {renderListHeader()}
          {!isSearchFocused && renderListRecommendations()}
          {renderAllParkingTitle()}
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Icon name="search" size={40} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Parking Found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your filters or search in a different area
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={resetFilters}>
            <Text style={styles.emptyButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']} mode="padding">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.locationContainer} onPress={centerOnUserLocation}>
          <View style={styles.locationIconWrapper}>
            <Icon name="map-pin" size={18} color="#1A73E8" />
          </View>
          <View>
            <Text style={styles.locationLabel}>Current Location</Text>
            <Text style={styles.locationName}>{locationName}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="bell" size={22} color="#1A1A2E" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.subscriptionButton} onPress={() => navigation.navigate('Subscription')}>
            <MaterialIcon name="ticket-percent" size={22} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container - Always Mounted to prevent black flash on Android */}
      <View
        style={[
          styles.mapContainerAlwaysMounted,
          viewMode !== 'map' && styles.hiddenContainer
        ]}
        pointerEvents={viewMode === 'map' ? 'auto' : 'none'}
      >
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={true}
            onUserLocationChange={handleUserLocationChange}
            customMapStyle={mapStyle}
            loadingEnabled={true}
            loadingIndicatorColor="#1A73E8"
            loadingBackgroundColor="#FFFFFF"
            renderToHardwareTextureAndroid={true}
            moveOnMarkerPress={false}
          >
          {/* User Location Marker */}
          {userLocation && (
            <>
              {/* Outer pulsing circle */}
              <Circle
                center={userLocation}
                radius={100}
                strokeColor="rgba(26, 115, 232, 0.3)"
                fillColor="rgba(26, 115, 232, 0.1)"
              />
              {/* User location marker */}
              <Marker
                coordinate={userLocation}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationOuter}>
                    <View style={styles.userLocationInner} />
                  </View>
                </View>
              </Marker>
            </>
          )}
          {filteredSpots.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: spot.latitude,
                longitude: spot.longitude,
              }}
              onPress={() => handleSpotPress(spot)}
              tracksViewChanges={Platform.OS === 'ios'}
            >
              <View style={styles.pinWrapper}>
                <View style={[styles.pinContainer, selectedSpot === spot.id && styles.pinContainerActive]}>
                  <View style={[styles.pinCircle, selectedSpot === spot.id && styles.pinCircleActive]}>
                    <Text style={[styles.pinPrice, selectedSpot === spot.id && styles.pinPriceActive]}>
                      {spot.price}
                    </Text>
                  </View>
                  <View style={[styles.pinTail, selectedSpot === spot.id && styles.pinTailActive]} />
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
        </View>

        {/* Search Section - Floating on Map */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Location"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onSubmitEditing={handleLocationSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.gpsButtonMap} onPress={centerOnUserLocation}>
              <Icon name="crosshair" size={18} color="#1A73E8" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={() => setFilterModalVisible(true)}>
            <Icon name="sliders" size={20} color="#FFFFFF" />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Filters - Floating on Map */}
        <View style={styles.categorySection}>
          <View style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                  { backgroundColor: selectedCategory === category.id ? category.color : '#FFFFFF' },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialIcon
                  name={category.icon}
                  size={20}
                  color={selectedCategory === category.id ? '#FFFFFF' : category.color}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* List View Toggle Button */}
        {!isSearchFocused && (
          <TouchableOpacity
            style={styles.listToggleButton}
            onPress={() => setViewMode('list')}
          >
            <Icon name="list" size={20} color="#1A73E8" />
          </TouchableOpacity>
        )}

        {/* My Location Button */}
        {!isSearchFocused && (
          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={centerOnUserLocation}
          >
            <Icon name="navigation" size={20} color="#1A73E8" />
          </TouchableOpacity>
        )}

        {/* Parking Recommendations Section */}
        {!isSearchFocused && (
        <View style={styles.recommendationsSection}>
          <View style={styles.recommendationsHeader}>
            <View style={styles.recommendationsTitleRow}>
              <Icon name="zap" size={18} color="#F59E0B" />
              <Text style={styles.recommendationsTitle}>Nearby Parking</Text>
            </View>
            <TouchableOpacity onPress={() => setAllRecommendationsVisible(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendationsScrollContent}
          >
            {filteredSpots.slice(0, 6).map((spot) => (
              <TouchableOpacity
                key={spot.id}
                style={[
                  styles.recommendationCard,
                  selectedSpot === spot.id && styles.recommendationCardSelected,
                ]}
                onPress={() => handleSpotPress(spot)}
                activeOpacity={0.9}
              >
                {/* Card Image */}
                <View style={styles.recommendationImageLeft}>
                  <MaterialIcon name="parking" size={24} color="#1A73E8" />
                  {spot.available < 5 && (
                    <View style={styles.lowAvailabilityBadge}>
                      <Text style={styles.lowAvailabilityText}>{spot.available} left</Text>
                    </View>
                  )}
                </View>

                {/* Card Content */}
                <View style={styles.recommendationContent}>
                  <View style={styles.recommendationCardHeader}>
                    <Text style={styles.recommendationName} numberOfLines={1}>{spot.name}</Text>
                  </View>

                  <View style={styles.recommendationMeta}>
                    <Icon name="navigation" size={12} color="#6B7280" />
                    <Text style={styles.recommendationDistance}>{spot.distance}</Text>
                    <Text style={styles.recommendationDot}>•</Text>
                    <Text style={styles.recommendationSpots}>{spot.available} spots</Text>
                  </View>

                  <View style={styles.recommendationFooter}>
                    <Text style={styles.recommendationPrice}>{spot.price}<Text style={styles.recommendationPriceUnit}>/hr</Text></Text>
                    <TouchableOpacity
                      style={styles.recommendationBookButton}
                      onPress={() => {
                        navigation.navigate('ParkingDetails', { parkingData: spot });
                      }}
                    >
                      <Text style={styles.recommendationBookButtonText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        )}
      </View>

      {/* List View - Rendered on top when active */}
      {viewMode === 'list' && renderListView()}

      {/* Parking Details Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedParkingData && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalDragIndicator} />
                </View>
                <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                  <View style={styles.closeButtonCircle}>
                    <Icon name="x" size={18} color="#1A1A2E" />
                  </View>
                </TouchableOpacity>

                {/* Parking Image */}
                <View style={styles.parkingImageContainer}>
                  <View style={styles.parkingImagePlaceholder}>
                    <MaterialIcon name="parking" size={40} color="#1A73E8" />
                  </View>
                  <View style={styles.availabilityBadge}>
                    <Text style={styles.availabilityText}>{selectedParkingData.available} spots left</Text>
                  </View>
                </View>

                {/* Parking Info */}
                <View style={styles.parkingInfo}>
                  <View style={styles.parkingTitleRow}>
                    <Text style={styles.parkingName}>{selectedParkingData.name}</Text>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{selectedParkingData.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.parkingAddressRow}>
                    <Icon name="map-pin" size={14} color="#6B7280" />
                    <Text style={styles.parkingAddress}>{selectedParkingData.address}</Text>
                  </View>

                  <View style={styles.parkingDetailsRow}>
                    <TouchableOpacity style={styles.detailItem} onPress={() => openDirections(selectedParkingData)}>
                      <Icon name="navigation" size={14} color="#1A73E8" />
                      <Text style={styles.detailText}>{selectedParkingData.distance}</Text>
                    </TouchableOpacity>
                    <View style={styles.detailItem}>
                      <MaterialIcon name="car-outline" size={16} color="#1A73E8" />
                      <Text style={styles.detailText}>{selectedParkingData.spots} spots</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="clock" size={14} color="#1A73E8" />
                      <Text style={styles.detailText}>24/7</Text>
                    </View>
                  </View>
                </View>

                {/* Price and Book Button */}
                <View style={styles.modalFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <Text style={styles.priceValue}>₹{selectedParkingData.pricePerHour}<Text style={styles.priceUnit}>/hr</Text></Text>
                  </View>
                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={styles.directionsButton}
                      onPress={() => openDirections(selectedParkingData)}
                    >
                      <Icon name="navigation" size={18} color="#1A73E8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => {
                        closeModal();
                        navigation.navigate('ParkingDetails', { parkingData: selectedParkingData });
                      }}
                    >
                      <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            {/* Filter Header */}
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <View style={styles.closeButtonCircle}>
                  <Icon name="x" size={18} color="#1A1A2E" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.filterOptionsRow}>
                  {priceRanges.map((range) => (
                    <TouchableOpacity
                      key={range.id}
                      style={[
                        styles.filterChip,
                        selectedPriceRange === range.id && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedPriceRange(range.id)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedPriceRange === range.id && styles.filterChipTextActive,
                        ]}
                      >
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duration Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Duration</Text>
                <View style={styles.filterOptionsRow}>
                  {durationOptions.map((duration) => (
                    <TouchableOpacity
                      key={duration.id}
                      style={[
                        styles.filterChip,
                        selectedDuration === duration.id && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedDuration(duration.id)}
                    >
                      <Icon
                        name={duration.icon}
                        size={14}
                        color={selectedDuration === duration.id ? '#FFFFFF' : '#6B7280'}
                        style={styles.filterChipIcon}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedDuration === duration.id && styles.filterChipTextActive,
                        ]}
                      >
                        {duration.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Amenities Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {amenityOptions.map((amenity) => (
                    <TouchableOpacity
                      key={amenity.id}
                      style={[
                        styles.amenityChip,
                        selectedAmenities.includes(amenity.id) && styles.amenityChipActive,
                      ]}
                      onPress={() => toggleAmenity(amenity.id)}
                    >
                      <Icon
                        name={amenity.icon}
                        size={16}
                        color={selectedAmenities.includes(amenity.id) ? '#FFFFFF' : '#1A73E8'}
                      />
                      <Text
                        style={[
                          styles.amenityChipText,
                          selectedAmenities.includes(amenity.id) && styles.amenityChipTextActive,
                        ]}
                      >
                        {amenity.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>
                  Apply ({filteredSpots.length} results)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* All Recommendations Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={allRecommendationsVisible}
        onRequestClose={() => setAllRecommendationsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.allRecommendationsModalContent}>
            {/* Modal Header */}
            <View style={styles.allRecommendationsHeader}>
              <View style={styles.recommendationsTitleRow}>
                <Icon name="zap" size={20} color="#F59E0B" />
                <Text style={styles.allRecommendationsTitle}>All Nearby Parking</Text>
              </View>
              <TouchableOpacity onPress={() => setAllRecommendationsVisible(false)}>
                <View style={styles.closeButtonCircle}>
                  <Icon name="x" size={18} color="#1A1A2E" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Results Count */}
            <Text style={styles.allRecommendationsCount}>
              {filteredSpots.length} parking spots available
            </Text>

            {/* Recommendations List */}
            <FlatList
              data={filteredSpots}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.allRecommendationsListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.allRecommendationsCard}
                  onPress={() => {
                    setAllRecommendationsVisible(false);
                    handleSpotPress(item);
                  }}
                >
                  <View style={styles.allRecommendationsCardImage}>
                    <MaterialIcon name="parking" size={28} color="#1A73E8" />
                    {item.available < 5 && (
                      <View style={styles.lowAvailabilityBadgeCard}>
                        <Text style={styles.lowAvailabilityTextCard}>{item.available} left</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.allRecommendationsCardContent}>
                    <View style={styles.allRecommendationsCardHeader}>
                      <Text style={styles.allRecommendationsCardName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.parkingCardRating}>
                        <Icon name="star" size={12} color="#F59E0B" />
                        <Text style={styles.parkingCardRatingText}>{item.rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.allRecommendationsCardAddress} numberOfLines={1}>{item.address}</Text>
                    <View style={styles.allRecommendationsCardMeta}>
                      <View style={styles.metaItem}>
                        <Icon name="navigation" size={12} color="#6B7280" />
                        <Text style={styles.metaText}>{item.distance}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialIcon name={item.type === 'car' ? 'car' : item.type === 'bike' ? 'motorbike' : item.type === 'bus' ? 'bus' : 'truck'} size={12} color="#6B7280" />
                        <Text style={styles.metaText}>{item.available} spots</Text>
                      </View>
                    </View>
                    <View style={styles.allRecommendationsCardFooter}>
                      <Text style={styles.allRecommendationsCardPrice}>{item.price}<Text style={styles.parkingCardPriceUnit}>/hr</Text></Text>
                      <TouchableOpacity
                        style={styles.allRecommendationsBookButton}
                        onPress={() => {
                          setAllRecommendationsVisible(false);
                          navigation.navigate('ParkingDetails', { parkingData: item });
                        }}
                      >
                        <Text style={styles.allRecommendationsBookButtonText}>Book</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Icon name="search" size={40} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyTitle}>No Parking Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your filters
                  </Text>
                </View>
              }
            />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  subscriptionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List Header with Search Bar and Map Toggle
  listHeaderContainer: {
    paddingVertical: 12,
    marginBottom: 12,
  },
  listSearchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  listSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    padding: 0,
  },
  gpsButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  gpsButtonMap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  listFilterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  listResultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    width: 36,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#1A73E8',
  },
  mapToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  // List Toggle Button on Map
  listToggleButton: {
    position: 'absolute',
    bottom: 220,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // List View
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listRecommendationsSection: {
    marginBottom: 20,
  },
  listRecommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listRecommendationsScrollContent: {
    paddingRight: 0,
  },
  listRecommendationCard: {
    width: 260,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  allParkingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  allParkingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Parking Card
  parkingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  parkingCardImage: {
    height: 100,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lowAvailabilityBadgeCard: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowAvailabilityTextCard: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  parkingCardContent: {
    padding: 12,
  },
  parkingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parkingCardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  parkingCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  parkingCardRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 4,
  },
  parkingCardAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  parkingCardMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  parkingCardAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  amenityBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  amenityBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  parkingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  parkingCardPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A73E8',
  },
  parkingCardPriceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  parkingCardBookButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  parkingCardBookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  searchSection: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    marginLeft: 10,
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categorySection: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  categoryScroll: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  categoryButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mapContainer: {
    flex: 1,
    marginBottom: 55,
    backgroundColor: '#FFFFFF',
  },
  // Always mounted map container - prevents black flash on Android
  mapContainerAlwaysMounted: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    bottom: 55,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  // Hidden container style - keeps component mounted but invisible
  hiddenContainer: {
    opacity: 0,
    zIndex: -1,
  },
  mapWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 220,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  // Recommendations Section
  recommendationsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recommendationsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
  recommendationsScrollContent: {
    paddingHorizontal: 16,
  },
  recommendationCard: {
    width: 260,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  recommendationCardSelected: {
    borderColor: '#1A73E8',
    borderWidth: 2,
  },
  recommendationImage: {
    height: 80,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lowAvailabilityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowAvailabilityText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recommendationContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    gap: 4,
  },
  recommendationImageRight: {
    width: 120,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  recommendationImageLeft: {
    width: 120,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  recommendationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  recommendationName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  recommendationRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  recommendationRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 2,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  recommendationDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  recommendationDot: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  recommendationSpots: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
    marginTop: 4,
  },
  recommendationPrice: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A73E8',
  },
  recommendationPriceUnit: {
    fontSize: 15,
    color: '#6B7280',
  },
  recommendationBookButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recommendationBookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 115, 232, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.3)',
  },
  userLocationInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1A73E8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pinContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  pinContainerActive: {
    shadowOpacity: 0.2,
    elevation: 5,
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pinCircleActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  pinPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A73E8',
    textAlign: 'center',
  },
  pinPriceActive: {
    color: '#FFFFFF',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1A73E8',
    marginTop: -2,
    zIndex: 1,
  },
  pinTailActive: {
    borderTopColor: '#1A73E8',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkingImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  parkingImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  parkingInfo: {
    marginBottom: 20,
  },
  parkingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parkingName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  parkingAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  parkingAddress: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  parkingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A73E8',
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  directionsButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bookButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Filter Modal Styles
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  filterSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  filterChipIcon: {
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  amenityChipActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  amenityChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A73E8',
  },
  amenityChipTextActive: {
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // All Recommendations Modal Styles
  allRecommendationsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: '90%',
    flex: 1,
    marginTop: 60,
  },
  allRecommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  allRecommendationsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  allRecommendationsCount: {
    fontSize: 14,
    color: '#6B7280',
    paddingVertical: 12,
  },
  allRecommendationsListContent: {
    paddingBottom: 20,
  },
  allRecommendationsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  allRecommendationsCardImage: {
    width: 90,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  allRecommendationsCardContent: {
    flex: 1,
    padding: 12,
  },
  allRecommendationsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allRecommendationsCardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  allRecommendationsCardAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  allRecommendationsCardMeta: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  allRecommendationsCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  allRecommendationsCardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A73E8',
  },
  allRecommendationsBookButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  allRecommendationsBookButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default HomePage;
