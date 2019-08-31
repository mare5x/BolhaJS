import * as bolha from './Bolha';

import React, { Component } from 'react';
import { 
    Button, Text, View, FlatList, Image, TextInput, Linking, 
    Modal, SectionList, StyleSheet, ActivityIndicator } from 'react-native';


class InputDialog extends Component {
  state = {
    text: "",
  }

  _textChanged = (text) => {
    this.setState({ text });
  }

  _confirmButtonPressed = () => {
    this.props.onConfirm(this.state.text);
  }

  render() {
    return (
      <Modal 
        visible={this.props.visible}
        transparent={true}
      >
        <View style={styles.inputDialog}>
          <TextInput 
            autoFocus={true}
            placeholder="Enter text"
            onChangeText={this._textChanged}
          />

          <Button 
            onPress={this._confirmButtonPressed}
            title="Confirm"
          />
        </View>
      </Modal>
    );
  }
}

class TextList extends Component {
  constructor(props) {
    super(props);

    this._id = 0;
  }

  state = {
    entries: [],
    inputDialogVisible: false
  }

  _inputDialogConfirmed = (text) => {
    this.setState({ inputDialogVisible: false });
    this._addItem(text);
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

  _renderItem = ({ item }) => {
    return (
      <View style={{backgroundColor: "red"}}>
        <Text>{item.text}</Text>
      </View>
    );
  }

  render() {
    return (
      <View>
        <InputDialog 
          visible={this.state.inputDialogVisible}
          onConfirm={this._inputDialogConfirmed}
        />

        <FlatList
          data={this.state.entries}
          renderItem={this._renderItem}
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
  state = {
    sections: []  // { title: '', data: [articles], isLoading: bool }
  };

  _addQuery = (query) => {
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
          ListFooterComponent={() => <Text>END</Text>}
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

  inputDialog: {
    padding: 10, 
    margin: 10, 
    backgroundColor: 'skyblue', 
    height: '50%', 
    justifyContent: "center", 
    alignItems: "center"
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
  }
});