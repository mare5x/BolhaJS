import React, { Component } from 'react';
import { 
  Image, 
  StyleSheet, 
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';


export const JumpButton = (onPress) => {
  return (
    <RectButton 
      onPress={onPress}
      style={styles.jumpButton}
    >
      <Image source={require('../img/up.png')} style={{width: floatButtonRadius, height: floatButtonRadius}} />
    </RectButton>
  );
}

export const AddButton = (onPress) => {
  return (
    <RectButton 
      onPress={onPress}
      style={styles.floatButton}
    >
      <Image source={require('../img/add.png')} style={{width: floatButtonRadius, height: floatButtonRadius}} />
    </RectButton>
  );
}

export const FetchButton = (onPress) => {
  return (
    <RectButton 
      onPress={onPress}
      style={styles.floatButton}
    >
      <Image source={require('../img/fetch.png')} style={{width: floatButtonRadius, height: floatButtonRadius}} />
    </RectButton>
  );
}


const floatButtonRadius = 28;

const styles = StyleSheet.create({
  jumpButton: {
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

  floatButton: {
    borderRadius: floatButtonRadius, 
    width: 2 * floatButtonRadius, 
    height: 2 * floatButtonRadius, 
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#177cff',
    elevation: 8,

    position: 'absolute', 
    bottom: 15, 
    right: 15
  }
});

