import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Animated,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Sample bookings data
const sampleBookingsData = {
  active: [
    {
      id: 'BK001',
      parkingName: 'Central Mall Parking',
      address: '123 Main Street, Downtown',
      date: 'Today',
      fullDate: '2024-12-10',
      startTime: '2:00 PM',
      endTime: '5:00 PM',
      spot: 'A-12',
      price: 15.00,
      status: 'active',
      spaceType: 'Covered',
      amenities: ['CCTV', 'Security', '24/7'],
      vehicleType: 'car',
      paymentMethod: 'Visa •••• 4242',
      ownerName: 'ParkSmart LLC',
      ownerPhone: '+1 555-0123',
    },
  ],
  upcoming: [
    {
      id: 'BK002',
      parkingName: 'Downtown Garage',
      address: '456 Oak Avenue, City Center',
      date: 'Tomorrow',
      fullDate: '2024-12-11',
      startTime: '10:00 AM',
      endTime: '2:00 PM',
      spot: 'B-05',
      price: 16.00,
      status: 'confirmed',
      spaceType: 'Open',
      amenities: ['CCTV', 'EV Charging'],
      vehicleType: 'car',
      paymentMethod: 'Visa •••• 4242',
      ownerName: 'City Parking Co.',
      ownerPhone: '+1 555-0456',
    },
    {
      id: 'BK003',
      parkingName: 'Airport Parking',
      address: '789 Airport Road, Terminal 1',
      date: 'Dec 15, 2024',
      fullDate: '2024-12-15',
      startTime: '6:00 AM',
      endTime: '6:00 PM',
      spot: 'C-22',
      price: 96.00,
      status: 'confirmed',
      spaceType: 'Covered',
      amenities: ['CCTV', 'Security', 'Shuttle'],
      vehicleType: 'car',
      paymentMethod: 'PayPal',
      ownerName: 'Airport Services',
      ownerPhone: '+1 555-0789',
    },
  ],
  past: [
    {
      id: 'BK004',
      parkingName: 'Beach Parking Lot',
      address: '321 Beach Drive, Oceanside',
      date: 'Dec 8, 2024',
      fullDate: '2024-12-08',
      startTime: '9:00 AM',
      endTime: '12:00 PM',
      spot: 'D-08',
      price: 9.00,
      status: 'completed',
      spaceType: 'Open',
      amenities: ['Security'],
      vehicleType: 'car',
      paymentMethod: 'Visa •••• 4242',
      ownerName: 'Beach Parking Inc.',
      ownerPhone: '+1 555-0321',
      rating: null,
    },
    {
      id: 'BK005',
      parkingName: 'Stadium Parking',
      address: '654 Sports Lane, Stadium District',
      date: 'Dec 5, 2024',
      fullDate: '2024-12-05',
      startTime: '5:00 PM',
      endTime: '11:00 PM',
      spot: 'E-45',
      price: 60.00,
      status: 'completed',
      spaceType: 'Open',
      amenities: ['CCTV', 'Security'],
      vehicleType: 'car',
      paymentMethod: 'Google Pay',
      ownerName: 'Stadium Services',
      ownerPhone: '+1 555-0654',
      rating: 5,
    },
    {
      id: 'BK006',
      parkingName: 'Shopping Center',
      address: '999 Commerce Blvd',
      date: 'Dec 1, 2024',
      fullDate: '2024-12-01',
      startTime: '1:00 PM',
      endTime: '4:00 PM',
      spot: 'F-12',
      price: 12.00,
      status: 'cancelled',
      spaceType: 'Covered',
      amenities: ['CCTV'],
      vehicleType: 'car',
      paymentMethod: 'Visa •••• 4242',
      ownerName: 'Mall Parking',
      ownerPhone: '+1 555-0999',
    },
  ],
};

const BookingManagementPage = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('active');
  const [bookingsData, setBookingsData] = useState(sampleBookingsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [extendHours, setExtendHours] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');

  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const tabs = [
    { id: 'active', label: 'Active', icon: 'play-circle' },
    { id: 'upcoming', label: 'Upcoming', icon: 'clock' },
    { id: 'past', label: 'Past', icon: 'check-circle' },
  ];

  // Filter bookings based on search and status
  const filteredBookings = useMemo(() => {
    let data = bookingsData[selectedTab] || [];

    if (searchQuery) {
      data = data.filter(
        booking =>
          booking.parkingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      data = data.filter(booking => booking.status === filterStatus);
    }

    return data;
  }, [bookingsData, selectedTab, searchQuery, filterStatus]);

  const handleTabChange = (tabId) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
    }).start();
    setSelectedTab(tabId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'confirmed':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'In Progress';
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    const updatedBookings = { ...bookingsData };
    const tabKey = selectedTab;
    updatedBookings[tabKey] = updatedBookings[tabKey].map(b =>
      b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
    );
    setBookingsData(updatedBookings);
    setShowCancelModal(false);
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  const handleExtendBooking = () => {
    if (!selectedBooking) return;

    const additionalCost = (selectedBooking.price / 3) * extendHours;
    const updatedBookings = { ...bookingsData };
    updatedBookings[selectedTab] = updatedBookings[selectedTab].map(b =>
      b.id === selectedBooking.id
        ? { ...b, price: b.price + additionalCost, endTime: 'Extended' }
        : b
    );
    setBookingsData(updatedBookings);
    setShowExtendModal(false);
    setExtendHours(1);
  };

  const handleSubmitReview = () => {
    if (!selectedBooking || reviewRating === 0) return;

    const updatedBookings = { ...bookingsData };
    updatedBookings.past = updatedBookings.past.map(b =>
      b.id === selectedBooking.id ? { ...b, rating: reviewRating } : b
    );
    setBookingsData(updatedBookings);
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewText('');
  };

  const handleBookAgain = (booking) => {
    navigation.navigate('ParkingDetails', {
      parkingData: {
        name: booking.parkingName,
        address: booking.address,
        pricePerHour: booking.price / 3,
      },
    });
  };

  const renderStars = (rating, interactive = false, size = 20) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && setReviewRating(star)}
          >
            <Icon
              name="star"
              size={size}
              color={star <= rating ? '#F59E0B' : '#E5E7EB'}
              style={{ marginHorizontal: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBookingCard = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.7}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.parkingIconContainer}>
          <MaterialIcon name="parking" size={22} color="#1A73E8" />
        </View>
        <View style={styles.cardTitleSection}>
          <Text style={styles.parkingName} numberOfLines={1}>{item.parkingName}</Text>
          <Text style={styles.bookingId}>Booking #{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Card Details */}
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="map-pin" size={14} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="calendar" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="clock" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.startTime} - {item.endTime}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="hash" size={14} color="#6B7280" />
            <Text style={styles.detailText}>Spot {item.spot}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total:</Text>
            <Text style={styles.priceValue}>₹{item.price.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Card Actions */}
      <View style={styles.cardActions}>
        {item.status === 'active' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="navigation" size={16} color="#1A73E8" />
              <Text style={styles.actionButtonText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                setSelectedBooking(item);
                setShowExtendModal(true);
              }}
            >
              <Icon name="plus-circle" size={16} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Extend</Text>
            </TouchableOpacity>
          </>
        )}
        {(item.status === 'confirmed' || item.status === 'pending') && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="edit-2" size={16} color="#1A73E8" />
              <Text style={styles.actionButtonText}>Modify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setSelectedBooking(item);
                setShowCancelModal(true);
              }}
            >
              <Icon name="x" size={16} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'completed' && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleBookAgain(item)}
            >
              <Icon name="repeat" size={16} color="#1A73E8" />
              <Text style={styles.actionButtonText}>Book Again</Text>
            </TouchableOpacity>
            {!item.rating ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.reviewButton]}
                onPress={() => {
                  setSelectedBooking(item);
                  setShowReviewModal(true);
                }}
              >
                <Icon name="star" size={16} color="#F59E0B" />
                <Text style={[styles.actionButtonText, styles.reviewButtonText]}>Review</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.ratedContainer}>
                {renderStars(item.rating, false, 14)}
              </View>
            )}
          </>
        )}
        {item.status === 'cancelled' && (
          <TouchableOpacity
            style={[styles.actionButton, { flex: 1 }]}
            onPress={() => handleBookAgain(item)}
          >
            <Icon name="repeat" size={16} color="#1A73E8" />
            <Text style={styles.actionButtonText}>Book Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon
          name={selectedTab === 'active' ? 'play-circle' : selectedTab === 'upcoming' ? 'clock' : 'check-circle'}
          size={48}
          color="#9CA3AF"
        />
      </View>
      <Text style={styles.emptyTitle}>
        No {selectedTab === 'active' ? 'Active' : selectedTab === 'upcoming' ? 'Upcoming' : 'Past'} Bookings
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedTab === 'active'
          ? "You don't have any active parking sessions"
          : selectedTab === 'upcoming'
          ? "You don't have any upcoming reservations"
          : "Your completed bookings will appear here"}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Search')}
      >
        <Icon name="search" size={18} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Find Parking</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Icon name="search" size={20} color="#1A1A2E" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Icon name="sliders" size={20} color="#1A1A2E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bookings..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selectedTab === tab.id && styles.tabActive]}
            onPress={() => handleTabChange(tab.id)}
          >
            <Icon
              name={tab.icon}
              size={16}
              color={selectedTab === tab.id ? '#1A73E8' : '#9CA3AF'}
            />
            <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {bookingsData[tab.id]?.length > 0 && (
              <View style={[
                styles.tabBadge,
                selectedTab === tab.id && styles.tabBadgeActive
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  selectedTab === tab.id && styles.tabBadgeTextActive
                ]}>
                  {bookingsData[tab.id].length}
                </Text>
              </View>
            )}
            {selectedTab === tab.id && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {/* FAB - New Booking */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Booking Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Icon name="x" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[
                  styles.statusBanner,
                  { backgroundColor: getStatusColor(selectedBooking.status) + '15' }
                ]}>
                  <Icon
                    name={selectedBooking.status === 'active' ? 'play-circle' : 'check-circle'}
                    size={20}
                    color={getStatusColor(selectedBooking.status)}
                  />
                  <Text style={[styles.statusBannerText, { color: getStatusColor(selectedBooking.status) }]}>
                    {getStatusLabel(selectedBooking.status)}
                  </Text>
                </View>

                {/* Parking Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Parking Space</Text>
                  <View style={styles.parkingInfoCard}>
                    <View style={styles.parkingInfoIcon}>
                      <MaterialIcon name="parking" size={28} color="#1A73E8" />
                    </View>
                    <View style={styles.parkingInfoContent}>
                      <Text style={styles.parkingInfoName}>{selectedBooking.parkingName}</Text>
                      <Text style={styles.parkingInfoAddress}>{selectedBooking.address}</Text>
                      <View style={styles.parkingInfoBadges}>
                        <View style={styles.infoBadge}>
                          <Text style={styles.infoBadgeText}>{selectedBooking.spaceType}</Text>
                        </View>
                        {selectedBooking.amenities.slice(0, 2).map((amenity, idx) => (
                          <View key={idx} style={styles.infoBadge}>
                            <Text style={styles.infoBadgeText}>{amenity}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Booking Timeline */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Booking Timeline</Text>
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Start</Text>
                        <Text style={styles.timelineValue}>{selectedBooking.date}, {selectedBooking.startTime}</Text>
                      </View>
                    </View>
                    <View style={styles.timelineLine} />
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, styles.timelineDotEnd]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>End</Text>
                        <Text style={styles.timelineValue}>{selectedBooking.date}, {selectedBooking.endTime}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Payment Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Payment</Text>
                  <View style={styles.paymentCard}>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Spot Number</Text>
                      <Text style={styles.paymentValue}>{selectedBooking.spot}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Payment Method</Text>
                      <Text style={styles.paymentValue}>{selectedBooking.paymentMethod}</Text>
                    </View>
                    <View style={styles.paymentDivider} />
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentTotalLabel}>Total Paid</Text>
                      <Text style={styles.paymentTotalValue}>₹{selectedBooking.price.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                {/* Owner Contact */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Contact Owner</Text>
                  <View style={styles.ownerCard}>
                    <View style={styles.ownerAvatar}>
                      <Icon name="user" size={20} color="#1A73E8" />
                    </View>
                    <View style={styles.ownerInfo}>
                      <Text style={styles.ownerName}>{selectedBooking.ownerName}</Text>
                      <Text style={styles.ownerPhone}>{selectedBooking.ownerPhone}</Text>
                    </View>
                    <TouchableOpacity style={styles.callButton}>
                      <Icon name="phone" size={18} color="#1A73E8" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.messageButton}>
                      <Icon name="message-circle" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.detailsActions}>
                  {selectedBooking.status === 'active' && (
                    <>
                      <TouchableOpacity style={styles.detailsActionButton}>
                        <Icon name="navigation" size={18} color="#1A73E8" />
                        <Text style={styles.detailsActionText}>Navigate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailsActionButton, styles.detailsActionPrimary]}
                        onPress={() => {
                          setShowDetailsModal(false);
                          setTimeout(() => setShowExtendModal(true), 300);
                        }}
                      >
                        <Icon name="plus-circle" size={18} color="#FFFFFF" />
                        <Text style={[styles.detailsActionText, { color: '#FFFFFF' }]}>Extend Time</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending') && (
                    <>
                      <TouchableOpacity style={styles.detailsActionButton}>
                        <Icon name="edit-2" size={18} color="#1A73E8" />
                        <Text style={styles.detailsActionText}>Modify</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailsActionButton, styles.detailsActionCancel]}
                        onPress={() => {
                          setShowDetailsModal(false);
                          setTimeout(() => setShowCancelModal(true), 300);
                        }}
                      >
                        <Icon name="x-circle" size={18} color="#EF4444" />
                        <Text style={[styles.detailsActionText, { color: '#EF4444' }]}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconContainer}>
              <Icon name="alert-triangle" size={32} color="#EF4444" />
            </View>
            <Text style={styles.confirmTitle}>Cancel Booking?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.confirmCancelText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleCancelBooking}
              >
                <Text style={styles.confirmDeleteText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Extend Booking Modal */}
      <Modal
        visible={showExtendModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExtendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.extendModalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.extendModalTitle}>Extend Parking Time</Text>
            <Text style={styles.extendModalSubtitle}>
              How many additional hours do you need?
            </Text>

            <View style={styles.hourSelector}>
              <TouchableOpacity
                style={styles.hourButton}
                onPress={() => setExtendHours(Math.max(1, extendHours - 1))}
              >
                <Icon name="minus" size={24} color="#1A73E8" />
              </TouchableOpacity>
              <View style={styles.hourDisplay}>
                <Text style={styles.hourValue}>{extendHours}</Text>
                <Text style={styles.hourUnit}>hour{extendHours > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                style={styles.hourButton}
                onPress={() => setExtendHours(Math.min(12, extendHours + 1))}
              >
                <Icon name="plus" size={24} color="#1A73E8" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <View style={styles.extendPriceCard}>
                <View style={styles.extendPriceRow}>
                  <Text style={styles.extendPriceLabel}>Additional Cost</Text>
                  <Text style={styles.extendPriceValue}>
                    ₹{((selectedBooking.price / 3) * extendHours).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.extendActions}>
              <TouchableOpacity
                style={styles.extendCancelButton}
                onPress={() => setShowExtendModal(false)}
              >
                <Text style={styles.extendCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.extendConfirmButton}
                onPress={handleExtendBooking}
              >
                <Text style={styles.extendConfirmText}>Confirm Extension</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.reviewModalTitle}>Rate Your Experience</Text>

            {selectedBooking && (
              <Text style={styles.reviewParkingName}>{selectedBooking.parkingName}</Text>
            )}

            <View style={styles.reviewStarsContainer}>
              {renderStars(reviewRating, true, 36)}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.reviewCancelButton}
                onPress={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewText('');
                }}
              >
                <Text style={styles.reviewCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reviewSubmitButton,
                  reviewRating === 0 && styles.reviewSubmitDisabled
                ]}
                onPress={handleSubmitReview}
                disabled={reviewRating === 0}
              >
                <Text style={styles.reviewSubmitText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Bookings</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="x" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    filterStatus === status && styles.filterOptionActive
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterStatus === status && styles.filterOptionTextActive
                  ]}>
                    {status === 'all' ? 'All' : getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.filterApplyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.filterApplyText}>Apply Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterResetButton}
              onPress={() => {
                setFilterStatus('all');
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.filterResetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: '#EBF5FF',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: '#1A73E8',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#1A73E8',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  parkingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleSection: {
    flex: 1,
    marginLeft: 12,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  bookingId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A73E8',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EBF5FF',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#1A73E8',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#1A73E8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  reviewButton: {
    backgroundColor: '#FEF3C7',
  },
  reviewButtonText: {
    color: '#D97706',
  },
  ratedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Details Modal
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  parkingInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  parkingInfoIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkingInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  parkingInfoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  parkingInfoAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  parkingInfoBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  infoBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoBadgeText: {
    fontSize: 11,
    color: '#1A73E8',
    fontWeight: '500',
  },
  timelineCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1A73E8',
  },
  timelineDotEnd: {
    backgroundColor: '#10B981',
  },
  timelineContent: {
    marginLeft: 12,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 4,
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  paymentTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A73E8',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  ownerPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  detailsActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    gap: 8,
  },
  detailsActionPrimary: {
    backgroundColor: '#1A73E8',
  },
  detailsActionCancel: {
    backgroundColor: '#FEE2E2',
  },
  detailsActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A73E8',
  },

  // Confirm Modal
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Extend Modal
  extendModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  extendModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  extendModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  hourSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  hourButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourDisplay: {
    alignItems: 'center',
  },
  hourValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A73E8',
  },
  hourUnit: {
    fontSize: 14,
    color: '#6B7280',
  },
  extendPriceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  extendPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extendPriceLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  extendPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A73E8',
  },
  extendActions: {
    flexDirection: 'row',
    gap: 12,
  },
  extendCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  extendCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  extendConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
  },
  extendConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Review Modal
  reviewModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  reviewModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  reviewParkingName: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  reviewStarsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A2E',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  reviewCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  reviewSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
  },
  reviewSubmitDisabled: {
    backgroundColor: '#9CA3AF',
  },
  reviewSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Filter Modal
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterOptionActive: {
    backgroundColor: '#1A73E8',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  filterApplyButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  filterApplyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterResetButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterResetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default BookingManagementPage;
