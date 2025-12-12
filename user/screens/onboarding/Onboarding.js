import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Seamless Control,\nAnywhere, Anytime.',
    buttonText: 'Move Forward',
    illustration: 'house',
  },
  {
    id: '2',
    title: 'Connect, Control, Thrive:\nYour Smart Home Journey\nBegins.',
    buttonText: 'Get Start',
    illustration: 'person',
  },
];

const Onboarding = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate('SignIn');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const HouseIllustration = () => (
    <View style={styles.illustrationContainer}>
      <View style={styles.houseFrame}>
        {/* Roof */}
        <View style={styles.roof}>
          <View style={styles.roofTriangle} />
          <View style={styles.chimney} />
        </View>
        {/* House Body */}
        <View style={styles.houseBody}>
          <View style={styles.window} />
          <View style={styles.door}>
            <View style={styles.doorKnob} />
          </View>
        </View>
        {/* Temperature Badge */}
        <View style={styles.tempBadge}>
          <Text style={styles.tempText}>32° C</Text>
        </View>
      </View>
    </View>
  );

  const PersonIllustration = () => (
    <View style={styles.illustrationContainer}>
      <View style={styles.couchScene}>
        {/* Person on couch */}
        <View style={styles.couch}>
          <View style={styles.couchBack} />
          <View style={styles.couchSeat} />
        </View>
        <View style={styles.person}>
          <View style={styles.personHead} />
          <View style={styles.personBody} />
          <View style={styles.laptop} />
        </View>
        {/* Plant */}
        <View style={styles.plant}>
          <View style={styles.plantPot} />
          <View style={styles.plantLeaf1} />
          <View style={styles.plantLeaf2} />
        </View>
      </View>
    </View>
  );

  const renderSlide = ({ item, index }) => (
    <View style={styles.slide}>
      {/* Decorative Elements */}
      <View style={styles.decorativeTopRight}>
        <View style={styles.blobLarge} />
        <View style={styles.blobSmall} />
      </View>

      {/* Illustration */}
      {item.illustration === 'house' ? <HouseIllustration /> : <PersonIllustration />}

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{item.buttonText}</Text>
      </TouchableOpacity>

      {/* Bottom Decorative */}
      <View style={styles.decorativeBottomLeft}>
        <View style={styles.blobBottom} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width: width,
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
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
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
    height: 200,
    justifyContent: 'center',
  },
  // House Illustration Styles
  houseFrame: {
    alignItems: 'center',
  },
  roof: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  roofTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 50,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0D7377',
  },
  chimney: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 20,
    height: 35,
    backgroundColor: '#0D7377',
  },
  houseBody: {
    width: 120,
    height: 80,
    backgroundColor: '#E8F5F4',
    marginTop: -2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
  },
  window: {
    width: 30,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0D7377',
  },
  door: {
    width: 28,
    height: 45,
    backgroundColor: '#0D7377',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 5,
  },
  doorKnob: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  tempBadge: {
    position: 'absolute',
    top: -10,
    right: -40,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tempText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D7377',
  },
  // Person Illustration Styles
  couchScene: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  couch: {
    marginRight: -30,
  },
  couchBack: {
    width: 100,
    height: 50,
    backgroundColor: '#0D7377',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  couchSeat: {
    width: 120,
    height: 25,
    backgroundColor: '#0D7377',
    borderRadius: 8,
    marginLeft: -10,
  },
  person: {
    alignItems: 'center',
    marginBottom: 25,
    marginLeft: -60,
  },
  personHead: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#F5DEB3',
  },
  personBody: {
    width: 35,
    height: 40,
    backgroundColor: '#E8F5F4',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginTop: -3,
  },
  laptop: {
    width: 30,
    height: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 3,
    position: 'absolute',
    bottom: 10,
  },
  plant: {
    marginLeft: 20,
    alignItems: 'center',
  },
  plantPot: {
    width: 30,
    height: 25,
    backgroundColor: '#D4A574',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  plantLeaf1: {
    position: 'absolute',
    top: -20,
    left: 5,
    width: 15,
    height: 25,
    backgroundColor: '#0D7377',
    borderRadius: 10,
    transform: [{ rotate: '-20deg' }],
  },
  plantLeaf2: {
    position: 'absolute',
    top: -25,
    right: 5,
    width: 15,
    height: 30,
    backgroundColor: '#0D7377',
    borderRadius: 10,
    transform: [{ rotate: '15deg' }],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#0D7377',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#E8F5F4',
  },
  button: {
    backgroundColor: '#0D7377',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: -30,
  },
  blobBottom: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5F4',
  },
});

export default Onboarding;
