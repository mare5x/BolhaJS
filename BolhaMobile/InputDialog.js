import React, { Component } from 'react';
import { 
  Button, View, TextInput, Modal, StyleSheet,
  TouchableWithoutFeedback, Keyboard } from 'react-native';


export class InputDialog extends Component {
  /* props:
    visible
    onConfirm
    onCancel
  */

  state = {
    text: "",
  }

  _handleBackPress = () => {
    this._cancelButtonPressed();
  }

  _textChanged = (text) => {
    this.setState({ text });
  }

  _confirmButtonPressed = () => {
    this.props.onConfirm(this.state.text);
  }

  _cancelButtonPressed = () => {
    this.props.onCancel();
  }

  render() {
    return (
      <Modal 
        visible={this.props.visible}
        transparent={true}
        onRequestClose={this._handleBackPress}
      >
        {/* This closes the keyboard when pressing something else ... */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {/* The outer view centers the inner view ... */}
          <View style={styles.inputDialogOuter}>
            <View style={styles.inputDialogInner}>
              <TextInput 
                style={styles.textInput}
                autoFocus={true}
                placeholder="Enter text"
                onChangeText={this._textChanged}
              />

              <View style={{flexDirection: "row", justifyContent: "space-around", alignSelf: "stretch"}}>
                <Button 
                  onPress={this._cancelButtonPressed}
                  title="Cancel"
                />

                <Button 
                  onPress={this._confirmButtonPressed}
                  title="Confirm"
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }
}
  
const styles = StyleSheet.create({
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: "black",
    marginLeft: 10
  },

  inputDialogOuter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000080"
  },

  inputDialogInner: {
    backgroundColor: 'skyblue', 
    height: '40%', 
    width: '90%',
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 10
  },

  textInput: {
    padding: 10,
    backgroundColor: "rgba(247,247,247,1.0)",
    borderRadius: 4
  },
});