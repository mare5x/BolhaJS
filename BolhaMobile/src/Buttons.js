import React from 'react';
import { 
  Image, 
  StyleSheet, 
  Animated,
  TouchableOpacity
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';


export const JumpButton = (props) => {
  return (
    <Animated.View 
      style={[styles.circleButton, styles.floatBottomLeft, props.style]}
    >
      <TouchableOpacity
        onPress={props.onPress}
      >
        <Image source={require('../img/up.png')} style={{width: floatButtonRadius, height: floatButtonRadius}} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export const AddButton = (props) => {
  return (
    <RectButton 
      onPress={props.onPress}
      style={[styles.circleButton, styles.floatBottomRight]}
    >
      <Image source={require('../img/add.png')} style={{width: floatButtonRadius, height: floatButtonRadius}} />
    </RectButton>
  );
}

export const FetchButton = (props) => {
  return (
    <RectButton 
      onPress={props.onPress}
      style={[styles.circleButton, styles.floatBottomRight]}
    >
      <Image source={require('../img/fetch.png')} style={{width: floatButtonRadius, height: floatButtonRadius}} />
    </RectButton>
  );
}


const floatButtonRadius = 28;

const styles = StyleSheet.create({
  circleButton: {
    borderRadius: floatButtonRadius, 
    width: 2 * floatButtonRadius, 
    height: 2 * floatButtonRadius, 
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#177cff',
    elevation: 8
    // Shadow props are IOS only.
    // shadowOffset: { width: 4, height: 8 },
    // shadowColor: '#000',
    // shadowRadius: 16,
    // shadowOpacity: 0.8,
    // Elevation is Android only.
  },

  floatBottomRight: {
    position: 'absolute', 
    bottom: 15, 
    right: 15
  },

  floatBottomLeft: {
    position: 'absolute',
    bottom: 15,
    left: 15
  }
});

