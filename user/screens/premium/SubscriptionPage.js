import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

// Sample subscription plans data
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Essential parking features',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { name: 'Standard Booking', included: true, icon: 'calendar' },
      { name: 'Basic Search', included: true, icon: 'search' },
      { name: 'Payment History', included: true, icon: 'file-text' },
      { name: 'Priority Booking', included: false, icon: 'zap' },
      { name: 'Reserved Slots', included: false, icon: 'bookmark' },
      { name: 'EV Charging', included: false, icon: 'battery-charging' },
      { name: 'Premium Support', included: false, icon: 'headphones' },
      { name: 'No Ads', included: false, icon: 'eye-off' },
    ],
    color: '#10B981',
    gradient: ['#34D399', '#10B981'],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Most popular choice',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      { name: 'Standard Booking', included: true, icon: 'calendar' },
      { name: 'Advanced Search', included: true, icon: 'search' },
      { name: 'Payment History', included: true, icon: 'file-text' },
      { name: 'Priority Booking', included: true, icon: 'zap' },
      { name: 'Reserved Slots', included: true, icon: 'bookmark' },
      { name: 'EV Charging', included: false, icon: 'battery-charging' },
      { name: 'Premium Support', included: true, icon: 'headphones' },
      { name: 'No Ads', included: true, icon: 'eye-off' },
    ],
    color: '#1A73E8',
    gradient: ['#4285F4', '#1A73E8'],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Ultimate parking experience',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    features: [
      { name: 'Standard Booking', included: true, icon: 'calendar' },
      { name: 'Advanced Search', included: true, icon: 'search' },
      { name: 'Payment History', included: true, icon: 'file-text' },
      { name: 'Priority Booking', included: true, icon: 'zap' },
      { name: 'Reserved Slots', included: true, icon: 'bookmark' },
      { name: 'EV Charging', included: true, icon: 'battery-charging' },
      { name: 'Premium Support', included: true, icon: 'headphones' },
      { name: 'No Ads', included: true, icon: 'eye-off' },
    ],
    color: '#7C3AED',
    gradient: ['#A78BFA', '#7C3AED'],
    popular: false,
  },
];

// Sample FAQ data
const faqData = [
  {
    id: '1',
    question: 'How do I upgrade my subscription?',
    answer: 'You can upgrade your subscription at any time by selecting a higher-tier plan from this page. Your new benefits will be available immediately, and you\'ll be charged the prorated difference.',
  },
  {
    id: '2',
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period.',
  },
  {
    id: '3',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay.',
  },
  {
    id: '4',
    question: 'Is there a free trial available?',
    answer: 'Yes! New users can try our Premium plan free for 7 days. No credit card required to start your trial.',
  },
  {
    id: '5',
    question: 'What happens when my subscription expires?',
    answer: 'When your subscription expires, you\'ll automatically be downgraded to the Basic plan. Your booking history and account data will be preserved.',
  },
  {
    id: '6',
    question: 'Can I get a refund?',
    answer: 'We offer a 30-day money-back guarantee for annual subscriptions. Monthly subscriptions are non-refundable but can be cancelled anytime.',
  },
];

// Payment methods data
const paymentMethods = [
  { id: '1', type: 'visa', last4: '4242', expiry: '12/25', isDefault: true },
  { id: '2', type: 'mastercard', last4: '8888', expiry: '06/26', isDefault: false },
];

const SubscriptionPage = ({ navigation }) => {
  // State management
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [currentPlan, setCurrentPlan] = useState('basic'); // User's current active plan
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate cards when billing cycle changes
  useEffect(() => {
    // Reset animation values
    fadeAnim.setValue(0.7);
    slideAnim.setValue(10);

    // Animate back
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [billingCycle]);

  // Calculate savings for yearly billing
  const calculateSavings = (plan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const yearlyCost = plan.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  // Get current plan details
  const currentPlanDetails = useMemo(() => {
    return subscriptionPlans.find(p => p.id === currentPlan);
  }, [currentPlan]);

  // Apply promo code
  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'PARK10') {
      setPromoApplied(true);
      setPromoDiscount(10);
    } else if (promoCode.toUpperCase() === 'FIRST50') {
      setPromoApplied(true);
      setPromoDiscount(50);
    } else {
      setPromoApplied(false);
      setPromoDiscount(0);
    }
  };

  // Handle subscription action
  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  // Confirm subscription
  const confirmSubscription = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentPlan(selectedPlan.id);
      setShowPaymentModal(false);
      setSelectedPlan(null);
    }, 2000);
  };

  // Handle plan management actions
  const handleManageAction = (action) => {
    setConfirmAction(action);
    setShowManageModal(false);
    setShowConfirmModal(true);
  };

  // Confirm management action
  const confirmManageAction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (confirmAction === 'cancel') {
        setCurrentPlan('basic');
      }
      setShowConfirmModal(false);
      setConfirmAction(null);
    }, 1500);
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
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Premium Features</Text>
        <Text style={styles.headerSubtitle}>Unlock exclusive parking benefits</Text>
      </View>
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => {}}
      >
        <Icon name="help-circle" size={24} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  // Render billing toggle
  const renderBillingToggle = () => (
    <View style={styles.billingToggleContainer}>
      <TouchableOpacity
        style={[
          styles.billingOption,
          billingCycle === 'monthly' && styles.billingOptionActive,
        ]}
        onPress={() => setBillingCycle('monthly')}
      >
        <Text style={[
          styles.billingOptionText,
          billingCycle === 'monthly' && styles.billingOptionTextActive,
        ]}>Monthly</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.billingOption,
          billingCycle === 'yearly' && styles.billingOptionActive,
        ]}
        onPress={() => setBillingCycle('yearly')}
      >
        <Text style={[
          styles.billingOptionText,
          billingCycle === 'yearly' && styles.billingOptionTextActive,
        ]}>Yearly</Text>
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>Save 17%</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render trial banner
  const renderTrialBanner = () => {
    if (currentPlan !== 'basic') return null;

    return (
      <View style={styles.trialBanner}>
        <View style={styles.trialIconContainer}>
          <Icon name="gift" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.trialTextContainer}>
          <Text style={styles.trialTitle}>Try Premium Free for 7 Days</Text>
          <Text style={styles.trialSubtitle}>No credit card required</Text>
        </View>
        <TouchableOpacity style={styles.trialButton}>
          <Text style={styles.trialButtonText}>Start Trial</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render subscription card
  const renderPlanCard = (plan) => {
    const isCurrentPlan = currentPlan === plan.id;
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const savings = calculateSavings(plan);

    const getBorderColor = () => {
      if (plan.id === 'basic') return '#10B981';
      if (plan.id === 'premium') return '#1A73E8';
      if (plan.id === 'pro') return '#7C3AED';
      return '#E5E7EB';
    };

    return (
      <Animated.View
        key={plan.id}
        style={[
          styles.planCard,
          plan.popular && styles.popularPlanCard,
          isCurrentPlan && styles.currentPlanCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            borderColor: getBorderColor(),
          },
        ]}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Icon name="star" size={12} color="#FFFFFF" />
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
        )}

        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Icon name="check-circle" size={12} color="#1A73E8" />
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
        )}

        <View style={[styles.planIconContainer, { backgroundColor: plan.color }]}>
          <Icon
            name={plan.id === 'basic' ? 'box' : plan.id === 'premium' ? 'award' : 'crown'}
            size={24}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>

        <View style={styles.priceContainer}>
          {price === 0 ? (
            <Text style={styles.freePrice}>Free</Text>
          ) : (
            <>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceAmount}>{price.toFixed(2)}</Text>
              <Text style={styles.pricePeriod}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</Text>
            </>
          )}
        </View>

        {billingCycle === 'yearly' && savings > 0 && (
          <Text style={styles.savingsText}>Save ₹{savings.toFixed(2)}/year</Text>
        )}

        <View style={styles.featuresPreview}>
          {plan.features.slice(0, 4).map((feature, index) => (
            <View key={index} style={styles.featurePreviewItem}>
              <Icon
                name={feature.included ? 'check' : 'x'}
                size={14}
                color={feature.included ? '#10B981' : '#D1D5DB'}
              />
              <Text style={[
                styles.featurePreviewText,
                !feature.included && styles.featureDisabled,
              ]}>{feature.name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.viewAllFeaturesButton}
          onPress={() => setShowCompareModal(true)}
        >
          <Text style={styles.viewAllFeaturesText}>View all features</Text>
          <Icon name="chevron-right" size={14} color="#1A73E8" />
        </TouchableOpacity>

        {isCurrentPlan ? (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => setShowManageModal(true)}
          >
            <Icon name="settings" size={18} color="#10B981" />
            <Text style={styles.manageButtonText}>Manage Plan</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: plan.color }]}
            onPress={() => handleSubscribe(plan)}
          >
            <Text style={styles.subscribeButtonText}>
              {plan.monthlyPrice === 0 ? 'Current Plan' :
               currentPlan === 'basic' ? 'Subscribe Now' :
               subscriptionPlans.findIndex(p => p.id === plan.id) > subscriptionPlans.findIndex(p => p.id === currentPlan)
                 ? 'Upgrade Now' : 'Downgrade'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  // Render current subscription status
  const renderCurrentStatus = () => {
    if (currentPlan === 'basic') return null;

    return (
      <View style={styles.currentStatusContainer}>
        <View style={styles.currentStatusHeader}>
          <Text style={styles.currentStatusTitle}>Your Subscription</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statusBadgeText, { color: '#059669' }]}>Active</Text>
          </View>
        </View>

        <View style={styles.currentStatusDetails}>
          <View style={styles.statusDetailRow}>
            <Text style={styles.statusDetailLabel}>Plan</Text>
            <Text style={styles.statusDetailValue}>{currentPlanDetails?.name}</Text>
          </View>
          <View style={styles.statusDetailRow}>
            <Text style={styles.statusDetailLabel}>Billing Cycle</Text>
            <Text style={styles.statusDetailValue}>
              {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
            </Text>
          </View>
          <View style={styles.statusDetailRow}>
            <Text style={styles.statusDetailLabel}>Next Billing</Text>
            <Text style={styles.statusDetailValue}>Jan 15, 2026</Text>
          </View>
          <View style={styles.statusDetailRow}>
            <Text style={styles.statusDetailLabel}>Amount</Text>
            <Text style={styles.statusDetailValue}>
              ₹{billingCycle === 'monthly'
                ? currentPlanDetails?.monthlyPrice.toFixed(2)
                : currentPlanDetails?.yearlyPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.currentStatusActions}>
          <TouchableOpacity
            style={styles.statusActionButton}
            onPress={() => setShowManageModal(true)}
          >
            <Icon name="edit-2" size={16} color="#1A73E8" />
            <Text style={styles.statusActionText}>Change Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusActionButton, styles.statusActionButtonOutline]}
            onPress={() => handleManageAction('cancel')}
          >
            <Icon name="x-circle" size={16} color="#EF4444" />
            <Text style={[styles.statusActionText, { color: '#EF4444' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render promo section
  const renderPromoSection = () => (
    <View style={styles.promoSection}>
      <View style={styles.promoHeader}>
        <Icon name="tag" size={20} color="#1A73E8" />
        <Text style={styles.promoTitle}>Have a promo code?</Text>
      </View>
      <View style={styles.promoInputContainer}>
        <TextInput
          style={styles.promoInput}
          placeholder="Enter promo code"
          placeholderTextColor="#9CA3AF"
          value={promoCode}
          onChangeText={setPromoCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[
            styles.promoApplyButton,
            !promoCode && styles.promoApplyButtonDisabled,
          ]}
          onPress={handleApplyPromo}
          disabled={!promoCode}
        >
          <Text style={styles.promoApplyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
      {promoApplied && (
        <View style={styles.promoSuccessContainer}>
          <Icon name="check-circle" size={16} color="#10B981" />
          <Text style={styles.promoSuccessText}>
            {promoDiscount}% discount applied!
          </Text>
        </View>
      )}
      <Text style={styles.promoHint}>Try: PARK10 or FIRST50</Text>
    </View>
  );

  // Render payment methods section
  const renderPaymentMethods = () => (
    <View style={styles.paymentMethodsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.addPaymentButton}>
          <Icon name="plus" size={16} color="#1A73E8" />
          <Text style={styles.addPaymentText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {paymentMethods.map((method) => (
        <View key={method.id} style={styles.paymentMethodCard}>
          <View style={styles.paymentMethodIcon}>
            <Icon
              name="credit-card"
              size={20}
              color={method.type === 'visa' ? '#1A1F71' : '#EB001B'}
            />
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodType}>
              {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ****{method.last4}
            </Text>
            <Text style={styles.paymentMethodExpiry}>Expires {method.expiry}</Text>
          </View>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
          <TouchableOpacity style={styles.paymentMethodMenu}>
            <Icon name="more-vertical" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  // Render FAQ section
  const renderFaqSection = () => (
    <View style={styles.faqSection}>
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

      {faqData.map((faq) => (
        <TouchableOpacity
          key={faq.id}
          style={styles.faqItem}
          onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
          activeOpacity={0.7}
        >
          <View style={styles.faqHeader}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Icon
              name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
          {expandedFaq === faq.id && (
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
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
        <View style={styles.paymentModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Subscription</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedPlan && (
            <>
              <View style={styles.selectedPlanSummary}>
                <View style={[styles.summaryPlanIcon, { backgroundColor: selectedPlan.color }]}>
                  <Icon name="award" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.summaryPlanInfo}>
                  <Text style={styles.summaryPlanName}>{selectedPlan.name} Plan</Text>
                  <Text style={styles.summaryPlanCycle}>
                    {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
                  </Text>
                </View>
              </View>

              <View style={styles.pricingSummary}>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Subtotal</Text>
                  <Text style={styles.pricingValue}>
                    ₹{(billingCycle === 'monthly'
                      ? selectedPlan.monthlyPrice
                      : selectedPlan.yearlyPrice).toFixed(2)}
                  </Text>
                </View>
                {promoApplied && (
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Promo Discount ({promoDiscount}%)</Text>
                    <Text style={[styles.pricingValue, { color: '#10B981' }]}>
                      -₹{((billingCycle === 'monthly'
                        ? selectedPlan.monthlyPrice
                        : selectedPlan.yearlyPrice) * promoDiscount / 100).toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={styles.pricingDivider} />
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingTotalLabel}>Total</Text>
                  <Text style={styles.pricingTotalValue}>
                    ₹{((billingCycle === 'monthly'
                      ? selectedPlan.monthlyPrice
                      : selectedPlan.yearlyPrice) * (1 - promoDiscount / 100)).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentMethodSelect}>
                <Text style={styles.paymentMethodSelectLabel}>Payment Method</Text>
                {paymentMethods.filter(m => m.isDefault).map((method) => (
                  <View key={method.id} style={styles.selectedPaymentMethod}>
                    <Icon name="credit-card" size={20} color="#1F2937" />
                    <Text style={styles.selectedPaymentText}>
                      {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ****{method.last4}
                    </Text>
                    <TouchableOpacity>
                      <Text style={styles.changePaymentText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmSubscribeButton,
                  isProcessing && styles.buttonProcessing,
                ]}
                onPress={confirmSubscription}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Text style={styles.confirmSubscribeText}>Processing...</Text>
                ) : (
                  <Text style={styles.confirmSubscribeText}>
                    Subscribe for ₹{((billingCycle === 'monthly'
                      ? selectedPlan.monthlyPrice
                      : selectedPlan.yearlyPrice) * (1 - promoDiscount / 100)).toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.subscribeDisclaimer}>
                By subscribing, you agree to our Terms of Service and Privacy Policy.
                You can cancel anytime from your account settings.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render manage subscription modal
  const renderManageModal = () => (
    <Modal
      visible={showManageModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowManageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.manageModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Subscription</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowManageModal(false)}
            >
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.manageOptions}>
            <TouchableOpacity
              style={styles.manageOptionItem}
              onPress={() => {
                setShowManageModal(false);
                setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly');
              }}
            >
              <View style={styles.manageOptionIcon}>
                <Icon name="refresh-cw" size={20} color="#1A73E8" />
              </View>
              <View style={styles.manageOptionInfo}>
                <Text style={styles.manageOptionTitle}>Change Billing Cycle</Text>
                <Text style={styles.manageOptionSubtitle}>
                  Switch to {billingCycle === 'monthly' ? 'yearly' : 'monthly'} billing
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manageOptionItem}
              onPress={() => {
                setShowManageModal(false);
                // Navigate to payment methods
              }}
            >
              <View style={styles.manageOptionIcon}>
                <Icon name="credit-card" size={20} color="#1A73E8" />
              </View>
              <View style={styles.manageOptionInfo}>
                <Text style={styles.manageOptionTitle}>Update Payment Method</Text>
                <Text style={styles.manageOptionSubtitle}>Change your default card</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manageOptionItem}
              onPress={() => handleManageAction('renew')}
            >
              <View style={styles.manageOptionIcon}>
                <Icon name="rotate-cw" size={20} color="#1A73E8" />
              </View>
              <View style={styles.manageOptionInfo}>
                <Text style={styles.manageOptionTitle}>Renew Now</Text>
                <Text style={styles.manageOptionSubtitle}>Extend your subscription early</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.manageOptionItem, styles.manageOptionDanger]}
              onPress={() => handleManageAction('cancel')}
            >
              <View style={[styles.manageOptionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="x-circle" size={20} color="#EF4444" />
              </View>
              <View style={styles.manageOptionInfo}>
                <Text style={[styles.manageOptionTitle, { color: '#EF4444' }]}>
                  Cancel Subscription
                </Text>
                <Text style={styles.manageOptionSubtitle}>
                  Access continues until billing period ends
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render confirm action modal
  const renderConfirmModal = () => (
    <Modal
      visible={showConfirmModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <View style={[
            styles.confirmIconContainer,
            confirmAction === 'cancel' && { backgroundColor: '#FEE2E2' },
          ]}>
            <Icon
              name={confirmAction === 'cancel' ? 'alert-triangle' : 'check-circle'}
              size={32}
              color={confirmAction === 'cancel' ? '#EF4444' : '#10B981'}
            />
          </View>

          <Text style={styles.confirmTitle}>
            {confirmAction === 'cancel'
              ? 'Cancel Subscription?'
              : 'Renew Subscription?'}
          </Text>
          <Text style={styles.confirmMessage}>
            {confirmAction === 'cancel'
              ? 'Your premium features will remain active until the end of your current billing period. You can resubscribe anytime.'
              : 'Your subscription will be renewed immediately and you\'ll be charged for the next billing period.'}
          </Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmCancelButton}
              onPress={() => setShowConfirmModal(false)}
            >
              <Text style={styles.confirmCancelText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmActionButton,
                confirmAction === 'cancel' && { backgroundColor: '#EF4444' },
                isProcessing && styles.buttonProcessing,
              ]}
              onPress={confirmManageAction}
              disabled={isProcessing}
            >
              <Text style={styles.confirmActionText}>
                {isProcessing ? 'Processing...' : confirmAction === 'cancel' ? 'Yes, Cancel' : 'Renew Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render feature comparison modal
  const renderCompareModal = () => (
    <Modal
      visible={showCompareModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCompareModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.compareModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Compare Plans</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCompareModal(false)}
            >
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.compareContent}>
            {/* Header Row */}
            <View style={styles.compareHeaderRow}>
              <View style={styles.compareFeatureCell}>
                <Text style={styles.compareFeatureHeader}>Features</Text>
              </View>
              {subscriptionPlans.map((plan) => (
                <View key={plan.id} style={styles.comparePlanCell}>
                  <Text style={[styles.comparePlanHeader, { color: plan.color }]}>
                    {plan.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Feature Rows */}
            {subscriptionPlans[0].features.map((feature, index) => (
              <View key={index} style={styles.compareRow}>
                <View style={styles.compareFeatureCell}>
                  <Icon name={feature.icon} size={16} color="#6B7280" />
                  <Text style={styles.compareFeatureName}>{feature.name}</Text>
                </View>
                {subscriptionPlans.map((plan) => (
                  <View key={plan.id} style={styles.comparePlanCell}>
                    <Icon
                      name={plan.features[index].included ? 'check' : 'x'}
                      size={18}
                      color={plan.features[index].included ? '#10B981' : '#D1D5DB'}
                    />
                  </View>
                ))}
              </View>
            ))}

            {/* Price Row */}
            <View style={[styles.compareRow, styles.comparePriceRow]}>
              <View style={styles.compareFeatureCell}>
                <Text style={styles.comparePriceLabel}>
                  {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Price
                </Text>
              </View>
              {subscriptionPlans.map((plan) => (
                <View key={plan.id} style={styles.comparePlanCell}>
                  <Text style={[styles.comparePriceValue, { color: plan.color }]}>
                    {plan.monthlyPrice === 0
                      ? 'Free'
                      : `₹${(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice).toFixed(2)}`}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {renderHeader()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderTrialBanner()}
        {renderCurrentStatus()}
        {renderBillingToggle()}

        <View style={styles.plansContainer}>
          {subscriptionPlans.map((plan) => renderPlanCard(plan))}
        </View>

        {renderPromoSection()}
        {renderPaymentMethods()}
        {renderFaqSection()}
      </ScrollView>

      {renderPaymentModal()}
      {renderManageModal()}
      {renderConfirmModal()}
      {renderCompareModal()}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },

  // Trial Banner
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1A73E8',
  },
  trialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trialSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  trialButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },

  // Billing Toggle
  billingToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  billingOptionActive: {
    backgroundColor: '#1A73E8',
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  billingOptionTextActive: {
    color: '#FFFFFF',
  },
  saveBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },

  // Plans Container
  plansContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },

  // Plan Card
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  popularPlanCard: {
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  currentPlanCard: {
    // Border color applied dynamically
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 4,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1F2937',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  freePrice: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1F2937',
  },
  savingsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  featuresPreview: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  featurePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featurePreviewText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
  },
  featureDisabled: {
    color: '#D1D5DB',
  },
  viewAllFeaturesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  viewAllFeaturesText: {
    fontSize: 14,
    color: '#1A73E8',
    fontWeight: '600',
  },
  subscribeButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },

  // Current Status
  currentStatusContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  currentStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentStatusDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statusDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  currentStatusActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statusActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EBF5FF',
  },
  statusActionButtonOutline: {
    backgroundColor: '#FEE2E2',
  },
  statusActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 6,
  },

  // Promo Section
  promoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  promoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promoApplyButton: {
    marginLeft: 12,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  promoApplyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  promoApplyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  promoSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  promoSuccessText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
  },
  promoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Payment Methods Section
  paymentMethodsSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 4,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodIcon: {
    width: 48,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentMethodExpiry: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A73E8',
  },
  paymentMethodMenu: {
    padding: 4,
  },

  // FAQ Section
  faqSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
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

  // Payment Modal
  paymentModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  selectedPlanSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  summaryPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPlanInfo: {
    marginLeft: 12,
  },
  summaryPlanName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryPlanCycle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pricingSummary: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  pricingTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  pricingTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A73E8',
  },
  paymentMethodSelect: {
    marginTop: 20,
  },
  paymentMethodSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedPaymentText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  changePaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
  confirmSubscribeButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmSubscribeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscribeDisclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  buttonProcessing: {
    opacity: 0.7,
  },

  // Manage Modal
  manageModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  manageOptions: {
    marginTop: 8,
  },
  manageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  manageOptionDanger: {
    borderBottomWidth: 0,
  },
  manageOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  manageOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  manageOptionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Confirm Modal
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  confirmActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
  },
  confirmActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Compare Modal
  compareModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  compareContent: {
    marginTop: 8,
  },
  compareHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  compareRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  comparePriceRow: {
    backgroundColor: '#F9FAFB',
    marginTop: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  compareFeatureCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparePlanCell: {
    flex: 1,
    alignItems: 'center',
  },
  compareFeatureHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  comparePlanHeader: {
    fontSize: 14,
    fontWeight: '700',
  },
  compareFeatureName: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
  },
  comparePriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  comparePriceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SubscriptionPage;
