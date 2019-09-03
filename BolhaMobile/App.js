import * as bolha from './Bolha';

import React, { Component } from 'react';
import { 
    Button, Text, View, FlatList, Image, TextInput, Linking, 
    Modal, SectionList, StyleSheet, ActivityIndicator, BackHandler,
    TouchableWithoutFeedback, Keyboard, AppState, Alert, TouchableOpacity,
    Animated } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const Separator = () => <View style={styles.separator} />;

class InputDialog extends Component {
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

class QueryOption extends Component {
  constructor(props) {
    super(props);
  }

  _onTap = () => {
    const query = this.props.query;
    this.props.onTap(query);
  }

  _onDeleteAction = () => {
    const query = this.props.query;
    this.props.onDelete(query);
  }

  _onSwipeLeft = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0.5, 1],
      extrapolate: 'clamp'
    });

    return (
      <View style={styles.queryOptionDeleteSwipe}>
        <TouchableOpacity onPress={this._onDeleteAction}>
          <Animated.Text 
            style={[
              styles.queryOptionDeleteSwipeText,
              { 
                transform: [{ scale }]
              }]
            }>
            Delete
          </Animated.Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    const query = this.props.query;

    return (
      <Swipeable
        renderLeftActions={this._onSwipeLeft}
      >
        <View style={styles.queryOption}>
          <TouchableOpacity onPress={this._onTap}>
            <Text>{query}</Text>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  }
}

class TextList extends Component {
  constructor(props) {
    super(props);

    this._id = 0;
    this.state = {
      entries: [],
      inputDialogVisible: false
    }
  }

  _inputDialogConfirmed = (text) => {
    this.setState({ inputDialogVisible: false });
    this._addItem(text);
  }

  _inputDialogCancelled = () => {
    this.setState({ inputDialogVisible: false });
  }

  _addItem = (text) => {
    if (!text) return false;

    for (let item of this.state.entries) {
      if (item.text === text) 
        return false;
    }

    let new_key = this._id.toString();
    this._id += 1;
    
    let entries = this.state.entries.slice();
    entries.push({ key: new_key, text: text });
    
    this.setState({ entries: entries });

    this.props.itemAdded(text);
    return true;
  }

  _removeItem = (text) => {
    this.setState(state => {
      return { entries: state.entries.filter(entry => entry.text !== text) };
    });
    this.props.itemRemoved(text);
  }

  _renderItem = ({ item }) => {
    return (
      <QueryOption 
        query={item.text}
        onDelete={this._removeItem}
        onTap={this.props.onTap}
      />
    );
  }

  render() {
    return (
      <View>
        <InputDialog 
          visible={this.state.inputDialogVisible}
          onConfirm={this._inputDialogConfirmed}
          onCancel={this._inputDialogCancelled}
        />

        <FlatList
          data={this.state.entries}
          renderItem={this._renderItem}
          ItemSeparatorComponent={Separator}
        />
        
        <Button 
          onPress={() => this.setState({ inputDialogVisible: true })}
          title="Add"
        />
      </View>
    );
  }
}

class ArticleList extends Component {
  constructor(props) {
    super(props);
    
    this._sectionListRef = null;

    this.state = {
      sections: []  // { title: '', data: [articles], isLoading: bool }
    }
  }

  async componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    await this._loadSections();
  }

  async componentWillUnmount() {
    await this._storeSections();
  }

  _handleAppStateChange = async (nextState) => {
    // When minimizing the app, save state.
    if (nextState != "active") {
      await this._storeSections();
    }
  }

  _loadSections = async () => {
    let sections = await AsyncStorage.getItem("@sections");
    console.log("Read sections: ", sections);
    if (sections) {
      sections = JSON.parse(sections);
      this.setState({ sections: sections });
    }
  }

  _storeSections = async () => {
    let sections = JSON.stringify(this.state.sections);
    console.log("Storing sections: ", sections);
    await AsyncStorage.setItem("@sections", sections);
  }

  _jumpToSection = (sectionTitle) => {
    let section_index = this.state.sections.findIndex(el => el.title === sectionTitle);
    this._sectionListRef.scrollToLocation({ sectionIndex: section_index, itemIndex: 0 });
  }

  _jumpToTop = () => {
    if (this.state.sections.length > 0) {
      this._jumpToSection(this.state.sections[0].title);
    }
  }

  _jumpToTopButton = () => {
    return (
      <TouchableOpacity onPress={this._jumpToTop}>
        <Text>
          To top
        </Text>
      </TouchableOpacity>
    );
  }

  _addQuery = async (query) => {
    let new_sections = this.state.sections.slice();

    let idx = new_sections.findIndex((el) => {
      return (el.title === query);
    });

    if (idx === -1) {
      let section = { title: query, data: [], isLoading: false };
      new_sections.push(section);
    }

    this.setState({ sections: new_sections });
  }

  _removeSection = (sectionTitle) => {
    this.setState(state => {
      return { sections: state.sections.filter(section => section.title !== sectionTitle) };
    });
  }

  _fetchArticlesQuery = async (query) => {
    function updateSectionState(state, args) {
      let sections = state.sections.slice();
      // The section exists because it was added in _addQuery.
      let section;
      for (let sect of sections) {
        if (sect.title === query) {
          section = sect;
          break;
        }
      }

      if (args.hasOwnProperty('data')) { 
        section.data = args.data;
      }
      if (args.hasOwnProperty('isLoading')) {
        section.isLoading = args.isLoading;
      }

      return { sections: sections };
    }

    this.setState(state => updateSectionState(state, {isLoading: true}));
    
    let articles = await bolha.get_articles_query(query);

    this.setState(state => updateSectionState(state, {isLoading: false, data: articles}));
  }

  _fetchArticles = async () => {    
    let promises = [];
    for (let section of this.state.sections) {
      promises.push(this._fetchArticlesQuery(section.title));
    }
    await Promise.all(promises);
  }

  _sectionRenderItem = ({ item, index, section }) => {
    return (
    <View>
      <Text style={{color: 'blue'}}
        onPress={() => Linking.openURL(item.link)}>
          {item.title} | {item.price}
      </Text>
      <Text>{item.summary.trim()}</Text>
      <View style={{flexDirection: "row", justifyContent: "center"}}>
        <Image 
          source={{uri: item.image}} 
          style={styles.previewImage}
        />
      </View>
    </View>
    );
  }

  _sectionRenderHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title.toUpperCase()}</Text>
      {section.isLoading && <ActivityIndicator/>}
    </View>
  );

  render() {
    return (
      <View style={{flex: 1}}>
        <TextList 
          itemAdded={this._addQuery}
          itemRemoved={this._removeSection}
          onTap={this._jumpToSection}
        />

        <Button
          onPress={this._fetchArticles}
          title={`Fetch all`}
        />

        <SectionList 
          sections={this.state.sections}
          keyExtractor={(item, index) => item.title + index }
          renderItem={this._sectionRenderItem}
          renderSectionHeader={this._sectionRenderHeader}
          contentContainerStyle={styles.sectionListItem}
          ListFooterComponent={this._jumpToTopButton}
          ref={component => (this._sectionListRef = component)}
          onScrollToIndexFailed={(info) => console.error(info)}
        />
      </View>
    );
  }
}

export default class App extends Component {
  render() {
    return (
      <ArticleList/>
    );
  }
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    backgroundColor: 'rgba(247,247,247,1.0)',
    flex: 1,
    flexDirection: "row", 
    justifyContent: "space-around",
  },

  sectionHeaderText: {
    fontSize: 24, 
    fontWeight: 'bold'
  },

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

  sectionListItem: {
    flexGrow: 1,
    padding: 10  // Margin doesn't work. It cuts off the last item ...
  },
  
  previewImage: {
    flex: 1,
    width: 210,  // Thumbnails are 210x210 px site wide
    height: 210,
    resizeMode: 'contain'
  },

  queryOption: {
    padding: 10,
    backgroundColor: "#fff"  // Weird overlap issue if this isn't set!
  },

  queryOptionDeleteSwipe: {
    justifyContent: "center",
    backgroundColor: "red",
    padding: 10
  },

  queryOptionDeleteSwipeText: {
    color: "white",
    fontWeight: '600',
    padding: 20
  }
});