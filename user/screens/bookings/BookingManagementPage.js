import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAlert } from '../../components/AppAlert';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import * as bookingService from '../../services/bookingService';
import { palette, fontStacks } from '../../theme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const getSpaceName = (booking) => {
  const s = booking.spaceId;
  if (s && typeof s === 'object') {
    // Populated: spaceId.propertyId.propertyName (nested populate)
    const prop = s.propertyId;
    if (prop && typeof prop === 'object') return prop.propertyName || prop.name || 'Parking Space';
    return s.title || s.name || 'Parking Space';
  }
  return 'Parking Space';
};

const getSpaceAddress = (booking) => {
  const s = booking.spaceId;
  if (s && typeof s === 'object') {
    const prop = s.propertyId;
    if (prop && typeof prop === 'object') {
      const parts = [prop.address, prop.city, prop.state].filter(Boolean);
      return parts.join(', ') || '—';
    }
    return s.address || '—';
  }
  return '—';
};

// ─── Component ───────────────────────────────────────────────────────────────

const BookingManagementPage = ({ navigation }) => {
  const auth = useAuth();
  const user = auth.user;

  // Data
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Cancel
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Extend
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [isExtending, setIsExtending] = useState(false);

  // Review (local only — no review API in current scope)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  // local review ratings stored per booking id
  const [localRatings, setLocalRatings] = useState({});

  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: 'clock' },
    { id: 'active', label: 'Active', icon: 'play-circle' },
    { id: 'past', label: 'Past', icon: 'check-circle' },
  ];

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchBookings = useCallback(async (refreshing = false) => {
    if (!user?.id) return;
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await bookingService.getUserBookings(user.id, { limit: 100 });
      // Controller returns the array directly as data (not { bookings: [] })
      setBookings(Array.isArray(res) ? res : (res.bookings || []));
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  // ─── Derived data ──────────────────────────────────────────────────────────

  const activeBookings = useMemo(
    () => bookings.filter(b => b.status === 'active'),
    [bookings]
  );
  const upcomingBookings = useMemo(
    () => bookings.filter(b => ['pending', 'confirmed'].includes(b.status)),
    [bookings]
  );
  const pastBookings = useMemo(
    () => bookings.filter(b => ['completed', 'cancelled', 'rejected', 'no_show'].includes(b.status)),
    [bookings]
  );

  const currentTabBookings = useMemo(() => {
    switch (selectedTab) {
      case 'active': return activeBookings;
      case 'upcoming': return upcomingBookings;
      case 'past': return pastBookings;
      default: return [];
    }
  }, [selectedTab, activeBookings, upcomingBookings, pastBookings]);

  const filteredBookings = useMemo(() => {
    let data = currentTabBookings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(b =>
        getSpaceName(b).toLowerCase().includes(q) ||
        getSpaceAddress(b).toLowerCase().includes(q) ||
        (b.bookingNumber || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      data = data.filter(b => b.status === filterStatus);
    }
    return data;
  }, [currentTabBookings, searchQuery, filterStatus]);

  const tabCount = (tabId) => {
    if (tabId === 'active') return activeBookings.length;
    if (tabId === 'upcoming') return upcomingBookings.length;
    return pastBookings.length;
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleTabChange = (tabId) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    Animated.spring(tabIndicatorAnim, { toValue: tabIndex, useNativeDriver: true }).start();
    setSelectedTab(tabId);
    setFilterStatus('all');
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(selectedBooking.id, cancelReason.trim() || undefined);
      setBookings(prev =>
        prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b)
      );
      setShowCancelModal(false);
      setShowDetailsModal(false);
      setSelectedBooking(null);
      setCancelReason('');
    } catch (err) {
      AppAlert.alert('Error', err?.message || 'Could not cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExtendBooking = async () => {
    if (!selectedBooking) return;
    setIsExtending(true);
    try {
      const res = await bookingService.extendBooking(selectedBooking.id, extendHours);
      // Update the booking in local state with new end time / total
      const updated = res.booking || res;
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...updated } : b));
      setShowExtendModal(false);
      setExtendHours(1);
    } catch (err) {
      AppAlert.alert('Error', err?.message || 'Could not extend booking. Please try again.');
    } finally {
      setIsExtending(false);
    }
  };

  const handleSubmitReview = () => {
    if (!selectedBooking || reviewRating === 0) return;
    setLocalRatings(prev => ({ ...prev, [selectedBooking.id]: reviewRating }));
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewText('');
  };

  const handleBookAgain = (booking) => {
    navigation.navigate('Home');
  };

  // ─── Status helpers ────────────────────────────────────────────────────────

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':    return '#10B981';
      case 'confirmed': return '#3B82F6';
      case 'pending':   return '#F59E0B';
      case 'completed': return '#A1A1AA';
      case 'cancelled': return '#EF4444';
      case 'rejected':  return '#DC2626';
      case 'no_show':   return '#6B7280';
      default:          return '#A1A1AA';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':    return 'In Progress';
      case 'confirmed': return 'Confirmed';
      case 'pending':   return 'Pending Approval';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'rejected':  return 'Rejected';
      case 'no_show':   return 'No Show';
      default:          return status;
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderStars = (rating, interactive = false, size = 20) => (
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
            color={star <= rating ? '#F59E0B' : 'rgba(255,255,255,0.08)'}
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookingCard = ({ item }) => {
    const parkingName = getSpaceName(item);
    const address = getSpaceAddress(item);
    const dateLabel = formatDate(item.startTime);
    const startLabel = formatTime(item.startTime);
    const endLabel = formatTime(item.endTime);
    const price = item.totalAmount ?? 0;
    const rating = localRatings[item.id];

    return (
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
            <Text style={styles.parkingName} numberOfLines={1}>{parkingName}</Text>
            <Text style={styles.bookingId}>Booking #{item.bookingNumber || item.id?.slice(-6)}</Text>
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
              <Icon name="map-pin" size={14} color="#A1A1AA" />
              <Text style={styles.detailText} numberOfLines={1}>{address}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="calendar" size={14} color="#A1A1AA" />
              <Text style={styles.detailText}>{dateLabel}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="clock" size={14} color="#A1A1AA" />
              <Text style={styles.detailText}>{startLabel} – {endLabel}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            {item.bookingMode === 'request' && item.status === 'pending' ? (
              <View style={styles.detailItem}>
                <Icon name="info" size={14} color="#F59E0B" />
                <Text style={[styles.detailText, { color: '#F59E0B' }]}>Awaiting owner approval</Text>
              </View>
            ) : (
              <View style={styles.detailItem} />
            )}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total:</Text>
              <Text style={styles.priceValue}>₹{price.toFixed(2)}</Text>
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
                onPress={() => { setSelectedBooking(item); setShowExtendModal(true); }}
              >
                <Icon name="plus-circle" size={16} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Extend</Text>
              </TouchableOpacity>
            </>
          )}
          {(item.status === 'confirmed' || item.status === 'pending') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => { setSelectedBooking(item); setShowCancelModal(true); }}
            >
              <Icon name="x" size={16} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
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
              {!rating ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.reviewButton]}
                  onPress={() => { setSelectedBooking(item); setShowReviewModal(true); }}
                >
                  <Icon name="star" size={16} color="#F59E0B" />
                  <Text style={[styles.actionButtonText, styles.reviewButtonText]}>Review</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.ratedContainer}>
                  {renderStars(rating, false, 14)}
                </View>
              )}
            </>
          )}
          {(item.status === 'cancelled' || item.status === 'no_show') && (
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
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon
          name={selectedTab === 'active' ? 'play-circle' : selectedTab === 'upcoming' ? 'clock' : 'check-circle'}
          size={48}
          color="#6B7280"
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
        onPress={() => navigation.navigate('Home')}
      >
        <Icon name="search" size={18} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Find Parking</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Icon name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Icon name="sliders" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bookings..."
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
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const count = tabCount(tab.id);
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.tabActive]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={selectedTab === tab.id ? '#FF2E40' : '#6B7280'}
              />
              <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, selectedTab === tab.id && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, selectedTab === tab.id && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
              {selectedTab === tab.id && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchBookings(true)}
              tintColor="#1A73E8"
            />
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Booking Details Modal ── */}
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
                <Icon name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: getStatusColor(selectedBooking.status) + '15' }]}>
                  <Icon
                    name={selectedBooking.status === 'active' ? 'play-circle' : 'check-circle'}
                    size={20}
                    color={getStatusColor(selectedBooking.status)}
                  />
                  <Text style={[styles.statusBannerText, { color: getStatusColor(selectedBooking.status) }]}>
                    {getStatusLabel(selectedBooking.status)}
                  </Text>
                  {selectedBooking.bookingMode === 'request' && selectedBooking.status === 'pending' && (
                    <Text style={[styles.statusBannerText, { color: '#F59E0B', fontSize: 12 }]}>
                      {' '}· Requires owner approval
                    </Text>
                  )}
                </View>

                {/* Parking Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Parking Space</Text>
                  <View style={styles.parkingInfoCard}>
                    <View style={styles.parkingInfoIcon}>
                      <MaterialIcon name="parking" size={28} color="#1A73E8" />
                    </View>
                    <View style={styles.parkingInfoContent}>
                      <Text style={styles.parkingInfoName}>{getSpaceName(selectedBooking)}</Text>
                      <Text style={styles.parkingInfoAddress}>{getSpaceAddress(selectedBooking)}</Text>
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
                        <Text style={styles.timelineValue}>
                          {formatDate(selectedBooking.startTime)}, {formatTime(selectedBooking.startTime)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timelineLine} />
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, styles.timelineDotEnd]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>End</Text>
                        <Text style={styles.timelineValue}>
                          {formatDate(selectedBooking.endTime)}, {formatTime(selectedBooking.endTime)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Payment Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Payment</Text>
                  <View style={styles.paymentCard}>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Booking Number</Text>
                      <Text style={styles.paymentValue}>#{selectedBooking.bookingNumber || '—'}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Duration</Text>
                      <Text style={styles.paymentValue}>
                        {selectedBooking.durationHours
                          ? `${selectedBooking.durationHours.toFixed(1)} hrs`
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Payment Status</Text>
                      <Text style={[styles.paymentValue, {
                        color: selectedBooking.paymentStatus === 'paid' ? '#10B981' :
                               selectedBooking.paymentStatus === 'refunded' ? '#3B82F6' : '#F59E0B'
                      }]}>
                        {selectedBooking.paymentStatus
                          ? selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1).replace('_', ' ')
                          : '—'}
                      </Text>
                    </View>
                    {selectedBooking.discountAmount > 0 && (
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Discount</Text>
                        <Text style={[styles.paymentValue, { color: '#10B981' }]}>
                          -₹{selectedBooking.discountAmount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.paymentDivider} />
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentTotalLabel}>Total</Text>
                      <Text style={styles.paymentTotalValue}>
                        ₹{(selectedBooking.totalAmount ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Cancellation Reason */}
                {selectedBooking.cancellationReason ? (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Cancellation Reason</Text>
                    <View style={styles.cancellationCard}>
                      <Icon name="info" size={16} color="#EF4444" />
                      <Text style={styles.cancellationText}>{selectedBooking.cancellationReason}</Text>
                    </View>
                  </View>
                ) : null}

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
                    <TouchableOpacity
                      style={[styles.detailsActionButton, styles.detailsActionCancel, { flex: 1 }]}
                      onPress={() => {
                        setShowDetailsModal(false);
                        setTimeout(() => setShowCancelModal(true), 300);
                      }}
                    >
                      <Icon name="x-circle" size={18} color="#EF4444" />
                      <Text style={[styles.detailsActionText, { color: '#EF4444' }]}>Cancel Booking</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Cancel Confirmation Modal ── */}
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
              {selectedBooking?.bookingMode === 'request'
                ? 'Cancelling a pending request will notify the owner.'
                : 'Are you sure? This action cannot be undone.'}
            </Text>
            <TextInput
              style={styles.cancelReasonInput}
              placeholder="Reason (optional)"
              placeholderTextColor="#6B7280"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => { setShowCancelModal(false); setCancelReason(''); }}
                disabled={isCancelling}
              >
                <Text style={styles.confirmCancelText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteButton, isCancelling && { opacity: 0.7 }]}
                onPress={handleCancelBooking}
                disabled={isCancelling}
              >
                {isCancelling
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.confirmDeleteText}>Yes, Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Extend Booking Modal ── */}
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
                  <Text style={styles.extendPriceLabel}>Additional Cost (estimate)</Text>
                  <Text style={styles.extendPriceValue}>
                    ₹{((selectedBooking.totalAmount / Math.max(selectedBooking.durationHours, 1)) * extendHours).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.extendActions}>
              <TouchableOpacity
                style={styles.extendCancelButton}
                onPress={() => setShowExtendModal(false)}
                disabled={isExtending}
              >
                <Text style={styles.extendCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.extendConfirmButton, isExtending && { opacity: 0.7 }]}
                onPress={handleExtendBooking}
                disabled={isExtending}
              >
                {isExtending
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.extendConfirmText}>Confirm Extension</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Review Modal ── */}
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
              <Text style={styles.reviewParkingName}>{getSpaceName(selectedBooking)}</Text>
            )}
            <View style={styles.reviewStarsContainer}>
              {renderStars(reviewRating, true, 36)}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.reviewCancelButton}
                onPress={() => { setShowReviewModal(false); setReviewRating(0); setReviewText(''); }}
              >
                <Text style={styles.reviewCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewSubmitButton, reviewRating === 0 && styles.reviewSubmitDisabled]}
                onPress={handleSubmitReview}
                disabled={reviewRating === 0}
              >
                <Text style={styles.reviewSubmitText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Filter Modal ── */}
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
                <Icon name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'active', 'confirmed', 'pending', 'completed', 'cancelled', 'rejected', 'no_show'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterOption, filterStatus === status && styles.filterOptionActive]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[styles.filterOptionText, filterStatus === status && styles.filterOptionTextActive]}>
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
              onPress={() => { setFilterStatus('all'); setShowFilterModal(false); }}
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
    backgroundColor: palette.bg,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: fontStacks.regular,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: palette.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FF2E40',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,46,64,0.12)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabBadgeTextActive: {
    color: '#FF2E40',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#FF2E40',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  // Flat content block on the mint page bg. The card-inside-card feel
  // (white box behind every booking) is gone — booking groups are
  // separated by spacing only.
  bookingCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginBottom: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  parkingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 115, 119, 0.10)',
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
    color: '#FFFFFF',
  },
  bookingId: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: 'transparent',
    paddingVertical: 4,
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
    color: '#A1A1AA',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF2E40',
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
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(13, 115, 119, 0.10)',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#FF2E40',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FF2E40',
  },
  primaryButtonText: {
    color: '#0B0F0C',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,107,107,0.12)',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  reviewButton: {
    backgroundColor: 'rgba(242,181,60,0.12)',
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
    backgroundColor: 'transparent',
    borderRadius: 999,
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
    backgroundColor: 'rgba(13, 115, 119, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2E40',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#0B0F0C',
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
    backgroundColor: '#FF2E40',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2E40',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Details Modal
  detailsModalContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
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
    color: '#A1A1AA',
    marginBottom: 10,
  },
  parkingInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
  },
  parkingInfoIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,46,64,0.12)',
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
    color: '#FFFFFF',
  },
  parkingInfoAddress: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 2,
  },
  parkingInfoBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  infoBadge: {
    backgroundColor: 'rgba(255,46,64,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoBadgeText: {
    fontSize: 11,
    color: '#FF2E40',
    fontWeight: '500',
  },
  timelineCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    backgroundColor: '#FF2E40',
  },
  timelineDotEnd: {
    backgroundColor: '#10B981',
  },
  timelineContent: {
    marginLeft: 12,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 5,
    marginVertical: 4,
  },
  paymentCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    color: '#A1A1AA',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10,
  },
  paymentTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B0F0C',
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF2E40',
  },
  cancellationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cancellationText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 18,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,46,64,0.12)',
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
    color: '#FFFFFF',
  },
  ownerPhone: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,46,64,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF2E40',
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
    backgroundColor: 'rgba(255,46,64,0.12)',
    gap: 8,
  },
  detailsActionPrimary: {
    backgroundColor: '#FF2E40',
  },
  detailsActionCancel: {
    backgroundColor: 'rgba(255,107,107,0.12)',
  },
  detailsActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF2E40',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,107,107,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  cancelReasonInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 20,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Extend Modal
  extendModalContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  extendModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  extendModalSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
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
    backgroundColor: 'rgba(255,46,64,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourDisplay: {
    alignItems: 'center',
  },
  hourValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF2E40',
  },
  hourUnit: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  extendPriceCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    color: '#A1A1AA',
  },
  extendPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF2E40',
  },
  extendActions: {
    flexDirection: 'row',
    gap: 12,
  },
  extendCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  extendCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  extendConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF2E40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Review Modal
  reviewModalContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  reviewModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  reviewParkingName: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  reviewStarsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  reviewCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  reviewSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF2E40',
    alignItems: 'center',
  },
  reviewSubmitDisabled: {
    backgroundColor: '#6B7280',
  },
  reviewSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Filter Modal
  filterModalContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterOptionActive: {
    backgroundColor: '#FF2E40',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  filterApplyButton: {
    backgroundColor: '#FF2E40',
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
    color: '#A1A1AA',
  },
});

export default BookingManagementPage;
