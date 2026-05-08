import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { palette, fontStacks } from '../../theme';

const { width, height } = Dimensions.get('window');

// Sample parking data
const parkingSpots = [
  {
    id: '1',
    name: 'Central Mall Parking',
    address: '123 Main Street, Downtown',
    distance: '0.5 km',
    price: 5,
    priceUnit: 'hr',
    spots: 45,
    rating: 4.5,
    reviews: 128,
    type: 'commercial',
    amenities: ['cctv', 'covered', '24/7'],
    vehicleTypes: ['sedan', 'suv', 'ev'],
    image: null,
    latitude: 37.7849,
    longitude: -122.4094,
    available: true,
  },
  {
    id: '2',
    name: 'Downtown Garage',
    address: '456 Oak Avenue, Business District',
    distance: '0.8 km',
    price: 4,
    priceUnit: 'hr',
    spots: 120,
    rating: 4.2,
    reviews: 89,
    type: 'commercial',
    amenities: ['cctv', '24/7', 'security'],
    vehicleTypes: ['sedan', 'suv', 'truck'],
    image: null,
    latitude: 37.7899,
    longitude: -122.4034,
    available: true,
  },
  {
    id: '3',
    name: 'Airport Parking',
    address: '789 Airport Road',
    distance: '2.5 km',
    price: 8,
    priceUnit: 'hr',
    spots: 200,
    rating: 4.8,
    reviews: 256,
    type: 'commercial',
    amenities: ['cctv', 'covered', 'ev-charging', '24/7', 'security'],
    vehicleTypes: ['sedan', 'suv', 'ev', 'truck'],
    image: null,
    latitude: 37.7749,
    longitude: -122.4194,
    available: true,
  },
  {
    id: '4',
    name: 'Beach Parking Lot',
    address: '321 Beach Drive, Oceanside',
    distance: '1.2 km',
    price: 3,
    priceUnit: 'hr',
    spots: 80,
    rating: 4.0,
    reviews: 67,
    type: 'individual',
    amenities: ['cctv'],
    vehicleTypes: ['sedan', 'suv'],
    image: null,
    latitude: 37.7799,
    longitude: -122.4144,
    available: false,
  },
  {
    id: '5',
    name: 'Stadium Parking',
    address: '654 Sports Lane',
    distance: '1.8 km',
    price: 10,
    priceUnit: 'hr',
    spots: 500,
    rating: 4.3,
    reviews: 189,
    type: 'commercial',
    amenities: ['cctv', 'covered', '24/7', 'security', 'ev-charging'],
    vehicleTypes: ['sedan', 'suv', 'ev', 'truck', 'van'],
    image: null,
    latitude: 37.7699,
    longitude: -122.4244,
    available: true,
  },
  {
    id: '6',
    name: 'Residential Driveway',
    address: '88 Pine Street',
    distance: '0.3 km',
    price: 2,
    priceUnit: 'hr',
    spots: 2,
    rating: 4.9,
    reviews: 23,
    type: 'residential',
    amenities: ['covered'],
    vehicleTypes: ['sedan'],
    image: null,
    latitude: 37.7819,
    longitude: -122.4074,
    available: true,
  },
];

// AI Recommendations
const aiRecommendations = [
  {
    id: 'ai1',
    name: 'Central Mall Parking',
    reason: 'Based on your frequent visits',
    price: 5,
    distance: '0.5 km',
    rating: 4.5,
  },
  {
    id: 'ai2',
    name: 'Downtown Garage',
    reason: 'Best value near your location',
    price: 4,
    distance: '0.8 km',
    rating: 4.2,
  },
  {
    id: 'ai3',
    name: 'Residential Driveway',
    reason: 'Closest to you',
    price: 2,
    distance: '0.3 km',
    rating: 4.9,
  },
];

// Filter options
const durationOptions = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
const vehicleTypeOptions = [
  { id: 'sedan', label: 'Sedan', icon: 'truck' },
  { id: 'suv', label: 'SUV', icon: 'truck' },
  { id: 'ev', label: 'Electric', icon: 'battery-charging' },
  { id: 'truck', label: 'Truck', icon: 'truck' },
  { id: 'van', label: 'Van', icon: 'truck' },
  { id: 'motorcycle', label: 'Motorcycle', icon: 'navigation' },
];
const amenityOptions = [
  { id: 'cctv', label: 'CCTV', icon: 'video' },
  { id: 'covered', label: 'Covered', icon: 'home' },
  { id: 'ev-charging', label: 'EV Charging', icon: 'battery-charging' },
  { id: '24/7', label: '24/7 Access', icon: 'clock' },
  { id: 'security', label: 'Security', icon: 'shield' },
];
const ownerTypeOptions = ['All', 'Individual', 'Commercial', 'Residential'];

const SearchPage = ({ navigation }) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 20]);
  const [selectedDuration, setSelectedDuration] = useState('Hourly');
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedOwnerType, setSelectedOwnerType] = useState('All');
  const [sortBy, setSortBy] = useState('distance'); // distance, price, rating

  // Quick filter chips
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const quickFilters = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'nearby', label: 'Nearby', icon: 'navigation' },
    { id: 'cheapest', label: 'Cheapest', icon: 'dollar-sign' },
    { id: 'top-rated', label: 'Top Rated', icon: 'star' },
    { id: 'available', label: 'Available', icon: 'check-circle' },
  ];

  // Animation refs
  const filterAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);

  // Map region
  const [region, setRegion] = useState({
    latitude: 37.7849,
    longitude: -122.4094,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // Simulate search loading
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    // TODO: replace with real API results; mock data commented out
    // let results = [...parkingSpots];
    let results = [];

    // Apply search query
    if (searchQuery.trim()) {
      results = results.filter(
        spot =>
          spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          spot.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price range
    results = results.filter(
      spot => spot.price >= priceRange[0] && spot.price <= priceRange[1]
    );

    // Apply vehicle type filter
    if (selectedVehicleTypes.length > 0) {
      results = results.filter(spot =>
        selectedVehicleTypes.some(type => spot.vehicleTypes.includes(type))
      );
    }

    // Apply amenities filter
    if (selectedAmenities.length > 0) {
      results = results.filter(spot =>
        selectedAmenities.every(amenity => spot.amenities.includes(amenity))
      );
    }

    // Apply owner type filter
    if (selectedOwnerType !== 'All') {
      results = results.filter(
        spot => spot.type.toLowerCase() === selectedOwnerType.toLowerCase()
      );
    }

    // Apply quick filter
    switch (activeQuickFilter) {
      case 'nearby':
        results = results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
      case 'cheapest':
        results = results.sort((a, b) => a.price - b.price);
        break;
      case 'top-rated':
        results = results.sort((a, b) => b.rating - a.rating);
        break;
      case 'available':
        results = results.filter(spot => spot.available);
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'price':
        results = results.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        results = results.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
      default:
        results = results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }

    return results;
  }, [searchQuery, priceRange, selectedVehicleTypes, selectedAmenities, selectedOwnerType, activeQuickFilter, sortBy]);

  // Toggle filter modal animation
  useEffect(() => {
    Animated.timing(filterAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showFilters]);

  // Toggle vehicle type selection
  const toggleVehicleType = (typeId) => {
    setSelectedVehicleTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  // Toggle amenity selection
  const toggleAmenity = (amenityId) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(a => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setPriceRange([0, 20]);
    setSelectedDuration('Hourly');
    setSelectedVehicleTypes([]);
    setSelectedAmenities([]);
    setSelectedOwnerType('All');
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (priceRange[0] > 0 || priceRange[1] < 20) count++;
    if (selectedDuration !== 'Hourly') count++;
    if (selectedVehicleTypes.length > 0) count++;
    if (selectedAmenities.length > 0) count++;
    if (selectedOwnerType !== 'All') count++;
    return count;
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.locationButton}>
          <Icon name="map-pin" size={18} color="#FF2E40" />
          <Text style={styles.locationText}>Current Location</Text>
          <Icon name="chevron-down" size={16} color="#A1A1AA" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="user" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for parking"
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.gpsButton}>
            <Icon name="crosshair" size={18} color="#FF2E40" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, getActiveFilterCount() > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="sliders" size={20} color={getActiveFilterCount() > 0 ? '#FFFFFF' : '#FF2E40'} />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render quick filters
  const renderQuickFilters = () => (
    <View style={styles.quickFiltersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFiltersContent}
      >
        {quickFilters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.quickFilterChip,
              activeQuickFilter === filter.id && styles.quickFilterChipActive,
            ]}
            onPress={() => setActiveQuickFilter(filter.id)}
          >
            <Icon
              name={filter.icon}
              size={14}
              color={activeQuickFilter === filter.id ? '#FFFFFF' : '#A1A1AA'}
            />
            <Text
              style={[
                styles.quickFilterText,
                activeQuickFilter === filter.id && styles.quickFilterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render AI recommendations
  const renderAIRecommendations = () => (
    <View style={styles.aiSection}>
      <View style={styles.aiHeader}>
        <View style={styles.aiTitleContainer}>
          <Icon name="zap" size={18} color="#F59E0B" />
          <Text style={styles.aiTitle}>Recommended for You</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.aiCardsContainer}
      >
        {aiRecommendations.map((rec) => (
          <TouchableOpacity key={rec.id} style={styles.aiCard}>
            <View style={styles.aiCardIcon}>
              <Icon name="map-pin" size={20} color="#FF2E40" />
            </View>
            <Text style={styles.aiCardName} numberOfLines={1}>{rec.name}</Text>
            <Text style={styles.aiCardReason} numberOfLines={1}>{rec.reason}</Text>
            <View style={styles.aiCardMeta}>
              <Text style={styles.aiCardPrice}>₹{rec.price}/hr</Text>
              <View style={styles.aiCardRating}>
                <Icon name="star" size={12} color="#F59E0B" />
                <Text style={styles.aiCardRatingText}>{rec.rating}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render view toggle
  const renderViewToggle = () => (
    <View style={styles.viewToggleContainer}>
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsCount}>{filteredResults.length} parking spots</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Icon name="arrow-up-down" size={14} color="#A1A1AA" />
          <Text style={styles.sortText}>Sort</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Icon name="list" size={18} color={viewMode === 'list' ? '#FFFFFF' : '#A1A1AA'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Icon name="map" size={18} color={viewMode === 'map' ? '#FFFFFF' : '#A1A1AA'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render parking card
  const renderParkingCard = ({ item }) => (
    <TouchableOpacity
      style={styles.parkingCard}
      onPress={() => navigation.navigate('ParkingDetails', { parking: item })}
    >
      <View style={styles.parkingCardImage}>
        <Icon name="image" size={32} color="rgba(255,255,255,0.10)" />
        {!item.available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableBadgeText}>Full</Text>
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
            <Icon name="navigation" size={12} color="#A1A1AA" />
            <Text style={styles.metaText}>{item.distance}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="car" size={12} color="#A1A1AA" />
            <Text style={styles.metaText}>{item.spots} spots</Text>
          </View>
        </View>
        <View style={styles.parkingCardAmenities}>
          {item.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityBadge}>
              <Text style={styles.amenityBadgeText}>{amenity}</Text>
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
            <Text style={styles.parkingCardPrice}>₹{item.price}</Text>
            <Text style={styles.parkingCardPriceUnit}>per {item.priceUnit}</Text>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, !item.available && styles.bookButtonDisabled]}
            disabled={!item.available}
          >
            <Text style={styles.bookButtonText}>
              {item.available ? 'Book Now' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Get 6 parking spots for map view
  const mapViewSpots = filteredResults.slice(0, 6);

  // Handle card press in map view
  const handleMapCardPress = (spot) => {
    setSelectedSpot(spot);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: spot.latitude,
        longitude: spot.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  // Render map view
  const renderMapView = () => (
    <View style={styles.mapContainer}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
      >
        {mapViewSpots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={() => setSelectedSpot(spot)}
          >
            <View style={[
              styles.mapMarker,
              selectedSpot?.id === spot.id && styles.mapMarkerSelected,
              !spot.available && styles.mapMarkerUnavailable,
            ]}>
              <Text style={[
                styles.mapMarkerText,
                selectedSpot?.id === spot.id && styles.mapMarkerTextSelected,
              ]}>₹{spot.price}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Map Loading Overlay */}
      {!mapReady && (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="large" color="#FF2E40" />
        </View>
      )}

      {/* Top Overlay - Search Bar & Filters */}
      <View style={styles.mapOverlayTop}>
        {/* Search Bar */}
        <View style={styles.mapSearchSection}>
          <View style={styles.mapSearchBar}>
            <Icon name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.mapSearchInput}
              placeholder="Search parking spots..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.mapFilterButton, getActiveFilterCount() > 0 && styles.mapFilterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="sliders" size={20} color={getActiveFilterCount() > 0 ? '#FFFFFF' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapFiltersContent}
        >
          {quickFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.mapFilterChip,
                activeQuickFilter === filter.id && styles.mapFilterChipActive,
              ]}
              onPress={() => setActiveQuickFilter(filter.id)}
            >
              <Icon
                name={filter.icon}
                size={14}
                color={activeQuickFilter === filter.id ? '#FFFFFF' : '#A1A1AA'}
              />
              <Text
                style={[
                  styles.mapFilterChipText,
                  activeQuickFilter === filter.id && styles.mapFilterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControlsContainer}>
        <TouchableOpacity style={styles.myLocationButton}>
          <Icon name="crosshair" size={20} color="#FF2E40" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapListToggleButton}
          onPress={() => setViewMode('list')}
        >
          <Icon name="list" size={20} color="#FF2E40" />
        </TouchableOpacity>
      </View>

      {/* Bottom - 6 Parking Spots */}
      <View style={styles.mapSpotsSection}>
        <View style={styles.mapSpotsHeader}>
          <Text style={styles.mapSpotsTitle}>{mapViewSpots.length} Parking Spots</Text>
          <TouchableOpacity
            style={styles.mapViewAllButton}
            onPress={() => setViewMode('list')}
          >
            <Text style={styles.mapViewAllText}>View All</Text>
            <Icon name="chevron-right" size={16} color="#FF2E40" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapSpotsScrollContent}
        >
          {mapViewSpots.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={[
                styles.mapSpotCard,
                selectedSpot?.id === spot.id && styles.mapSpotCardSelected,
              ]}
              onPress={() => handleMapCardPress(spot)}
              activeOpacity={0.9}
            >
              {/* Card Image */}
              <View style={styles.mapSpotImage}>
                <Icon name="map-pin" size={24} color="#FF2E40" />
                {!spot.available && (
                  <View style={styles.mapSpotUnavailableBadge}>
                    <Text style={styles.mapSpotUnavailableBadgeText}>Full</Text>
                  </View>
                )}
              </View>

              {/* Card Content */}
              <View style={styles.mapSpotContent}>
                <View style={styles.mapSpotHeader}>
                  <Text style={styles.mapSpotName} numberOfLines={1}>{spot.name}</Text>
                  <View style={styles.mapSpotRating}>
                    <Icon name="star" size={10} color="#F59E0B" />
                    <Text style={styles.mapSpotRatingText}>{spot.rating}</Text>
                  </View>
                </View>

                <View style={styles.mapSpotMeta}>
                  <Icon name="navigation" size={12} color="#A1A1AA" />
                  <Text style={styles.mapSpotDistance}>{spot.distance}</Text>
                  <Text style={styles.mapSpotDot}>•</Text>
                  <Text style={styles.mapSpotSpots}>{spot.spots} spots</Text>
                </View>

                <View style={styles.mapSpotFooter}>
                  <View>
                    <Text style={styles.mapSpotPrice}>₹{spot.price}</Text>
                    <Text style={styles.mapSpotPriceUnit}>/hour</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.mapSpotBookButton, !spot.available && styles.mapSpotBookButtonDisabled]}
                    onPress={() => navigation.navigate('ParkingDetails', { parking: spot })}
                    disabled={!spot.available}
                  >
                    <Text style={styles.mapSpotBookButtonText}>
                      {spot.available ? 'Book' : 'Full'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Render list header (AI recommendations only)
  const renderListHeader = () => (
    <View>
      {renderAIRecommendations()}
    </View>
  );

  // Render list view
  const renderListView = () => (
    <FlatList
      data={filteredResults}
      renderItem={renderParkingCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderListHeader}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Icon name="search" size={40} color="#6B7280" />
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

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filters</Text>
            <TouchableOpacity
              style={styles.filterModalClose}
              onPress={() => setShowFilters(false)}
            >
              <Icon name="x" size={24} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceInputLabel}>Min</Text>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceInputPrefix}>₹</Text>
                    <Text style={styles.priceInputValue}>{priceRange[0]}</Text>
                  </View>
                </View>
                <View style={styles.priceRangeDivider}>
                  <Text style={styles.priceRangeDividerText}>to</Text>
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceInputLabel}>Max</Text>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceInputPrefix}>₹</Text>
                    <Text style={styles.priceInputValue}>{priceRange[1]}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.priceButtons}>
                {[5, 10, 15, 20].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.priceButton,
                      priceRange[1] === price && styles.priceButtonActive,
                    ]}
                    onPress={() => setPriceRange([0, price])}
                  >
                    <Text style={[
                      styles.priceButtonText,
                      priceRange[1] === price && styles.priceButtonTextActive,
                    ]}>Up to ₹{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Parking Duration</Text>
              <View style={styles.durationContainer}>
                {durationOptions.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      selectedDuration === duration && styles.durationButtonActive,
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      selectedDuration === duration && styles.durationButtonTextActive,
                    ]}>{duration}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Vehicle Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Vehicle Type</Text>
              <View style={styles.vehicleTypeContainer}>
                {vehicleTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.vehicleTypeButton,
                      selectedVehicleTypes.includes(type.id) && styles.vehicleTypeButtonActive,
                    ]}
                    onPress={() => toggleVehicleType(type.id)}
                  >
                    <Icon
                      name={type.icon}
                      size={20}
                      color={selectedVehicleTypes.includes(type.id) ? '#FFFFFF' : '#A1A1AA'}
                    />
                    <Text style={[
                      styles.vehicleTypeText,
                      selectedVehicleTypes.includes(type.id) && styles.vehicleTypeTextActive,
                    ]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Amenities</Text>
              <View style={styles.amenitiesContainer}>
                {amenityOptions.map((amenity) => (
                  <TouchableOpacity
                    key={amenity.id}
                    style={[
                      styles.amenityButton,
                      selectedAmenities.includes(amenity.id) && styles.amenityButtonActive,
                    ]}
                    onPress={() => toggleAmenity(amenity.id)}
                  >
                    <Icon
                      name={amenity.icon}
                      size={16}
                      color={selectedAmenities.includes(amenity.id) ? '#FF2E40' : '#A1A1AA'}
                    />
                    <Text style={[
                      styles.amenityButtonText,
                      selectedAmenities.includes(amenity.id) && styles.amenityButtonTextActive,
                    ]}>{amenity.label}</Text>
                    {selectedAmenities.includes(amenity.id) && (
                      <Icon name="check" size={14} color="#FF2E40" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Owner Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Owner Type</Text>
              <View style={styles.ownerTypeContainer}>
                {ownerTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.ownerTypeButton,
                      selectedOwnerType === type && styles.ownerTypeButtonActive,
                    ]}
                    onPress={() => setSelectedOwnerType(type)}
                  >
                    <Text style={[
                      styles.ownerTypeText,
                      selectedOwnerType === type && styles.ownerTypeTextActive,
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterModalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>
                Show {filteredResults.length} Results
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading overlay
  const renderLoading = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#FF2E40" />
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#FFFFFF" />

      {/* Fixed Header Section - Only show in List View */}
      {viewMode === 'list' && (
        <View style={styles.fixedHeader}>
          {renderHeader()}
          {renderQuickFilters()}
          {renderViewToggle()}
        </View>
      )}

      {/* Content Section */}
      {viewMode === 'list' && renderListView()}

      {/* Map View - Always mounted but hidden when in list mode */}
      <View style={[styles.mapViewWrapper, viewMode !== 'map' && styles.hiddenView]}>
        {renderMapView()}
      </View>

      {renderFilterModal()}
      {renderLoading()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },

  // Fixed Header Container
  fixedHeader: {
    backgroundColor: 'transparent',
  },

  // Header
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
    marginRight: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  gpsButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF2E40',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Quick Filters
  quickFiltersContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  quickFilterChipActive: {
    backgroundColor: '#FF2E40',
  },
  quickFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
    marginLeft: 6,
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },

  // AI Recommendations
  aiSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF2E40',
  },
  aiCardsContainer: {
    paddingHorizontal: 16,
  },
  aiCard: {
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  aiCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  aiCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiCardReason: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 2,
  },
  aiCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  aiCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF2E40',
  },
  aiCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiCardRatingText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginLeft: 4,
  },

  // View Toggle
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sortText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginLeft: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: '#FF2E40',
  },

  // List Content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Parking Card
  parkingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  parkingCardImage: {
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unavailableBadgeText: {
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
    color: '#FFFFFF',
  },
  parkingCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242,181,60,0.12)',
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
    color: '#A1A1AA',
    marginTop: 4,
  },
  parkingCardMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginLeft: 4,
  },
  parkingCardAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  amenityBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  amenityBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FF2E40',
    textTransform: 'uppercase',
  },
  parkingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  parkingCardPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF2E40',
  },
  parkingCardPriceUnit: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  bookButton: {
    backgroundColor: '#FF2E40',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B0F0C',
  },

  // Map View Container
  mapViewContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mapViewWrapper: {
    flex: 1,
  },
  hiddenView: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },

  // Map View
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  map: {
    flex: 1,
    backgroundColor: '#E8E8E8',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  mapMarker: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF2E40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapMarkerSelected: {
    backgroundColor: '#FF2E40',
    borderColor: '#FF2E40',
  },
  mapMarkerUnavailable: {
    borderColor: 'rgba(255,255,255,0.10)',
    opacity: 0.6,
  },
  mapMarkerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF2E40',
  },
  mapMarkerTextSelected: {
    color: '#FFFFFF',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedSpotCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedSpotClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  selectedSpotContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  selectedSpotImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSpotInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedSpotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedSpotAddress: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 2,
  },
  selectedSpotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  selectedSpotPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF2E40',
    marginRight: 12,
  },
  selectedSpotRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedSpotRatingText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginLeft: 4,
  },
  selectedSpotButton: {
    backgroundColor: '#FF2E40',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedSpotButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B0F0C',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#FF2E40',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B0F0C',
  },

  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  // Price Range
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    marginBottom: 4,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceInputPrefix: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  priceInputValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  priceRangeDivider: {
    paddingHorizontal: 16,
  },
  priceRangeDividerText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  priceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  priceButtonActive: {
    backgroundColor: '#FF2E40',
  },
  priceButtonText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  priceButtonTextActive: {
    color: '#0B0F0C',
    fontWeight: '600',
  },

  // Duration
  durationContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  durationButtonText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  durationButtonTextActive: {
    color: '#FF2E40',
    fontWeight: '600',
  },

  // Vehicle Type
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#FF2E40',
  },
  vehicleTypeText: {
    fontSize: 13,
    color: '#A1A1AA',
    marginLeft: 8,
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Amenities
  amenitiesContainer: {
    gap: 8,
  },
  amenityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  amenityButtonActive: {
    backgroundColor: '#E0F2F1',
    borderColor: '#FF2E40',
  },
  amenityButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#A1A1AA',
    marginLeft: 10,
  },
  amenityButtonTextActive: {
    color: '#FF2E40',
    fontWeight: '600',
  },

  // Owner Type
  ownerTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ownerTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ownerTypeButtonActive: {
    backgroundColor: '#FF2E40',
  },
  ownerTypeText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  ownerTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Filter Modal Footer
  filterModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#FF2E40',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B0F0C',
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#A1A1AA',
    marginTop: 12,
  },

  // ========== MAP VIEW STYLES ==========

  // Map Overlay Top (Search + Filters)
  mapOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 12,
  },
  mapSearchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  mapSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  mapFilterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF2E40',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2E40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  mapFilterButtonActive: {
    backgroundColor: '#FF2E40',
  },
  mapFiltersContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  mapFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapFilterChipActive: {
    backgroundColor: '#FF2E40',
  },
  mapFilterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
    marginLeft: 6,
  },
  mapFilterChipTextActive: {
    color: '#FFFFFF',
  },

  // Map Controls Container
  mapControlsContainer: {
    position: 'absolute',
    right: 16,
    top: 140,
    gap: 10,
  },
  myLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapListToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // Map Spots Section (Bottom)
  mapSpotsSection: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  mapSpotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  mapSpotsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapViewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF2E40',
  },
  mapSpotsScrollContent: {
    paddingHorizontal: 16,
  },

  // Map Spot Card
  mapSpotCard: {
    width: width * 0.36,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  mapSpotCardSelected: {
    borderColor: '#FF2E40',
    borderWidth: 2,
  },
  mapSpotImage: {
    height: 60,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapSpotUnavailableBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapSpotUnavailableBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapSpotContent: {
    padding: 8,
  },
  mapSpotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mapSpotName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  mapSpotRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242,181,60,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapSpotRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 2,
  },
  mapSpotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapSpotDistance: {
    fontSize: 11,
    color: '#A1A1AA',
    marginLeft: 4,
  },
  mapSpotDot: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.10)',
    marginHorizontal: 4,
  },
  mapSpotSpots: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  mapSpotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  mapSpotPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF2E40',
  },
  mapSpotPriceUnit: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  mapSpotBookButton: {
    backgroundColor: '#FF2E40',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  mapSpotBookButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  mapSpotBookButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0B0F0C',
  },
});

export default SearchPage;
