import * as Bolha from './Bolha';
import { QueryBuilderList } from './QueryBuilderList';

import React, { Component } from 'react';
import { Button, Text, View, Image, Linking, 
    SectionList, StyleSheet, ActivityIndicator, 
    AppState, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';


export class QuerySectionsList extends Component {
  constructor(props) {
    super(props);
    
    this._sectionListRef = null;
    this._uid = 0;

    this.state = {
      sections: []  // { title: '', id: string, queryInfo: QueryInfo, isLoading: bool,
                    //   data: [BolhaArticle] }
    }
  }

  _getUid = () => {
    let old = (this.state.sections.length > 0)
        ? (parseInt(this.state.sections[this.state.sections.length - 1].id) + 1)
        : (-1);
    this._uid = Math.max(this._uid + 1, old);
    return this._uid.toString();
  }

  _getSectionTitle = (queryInfo) => {
    return queryInfo.query.toUpperCase();
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
    let raw_sections = await AsyncStorage.getItem("@sections");
    console.log("Read sections: ", raw_sections);
    if (raw_sections) {
      raw_sections = JSON.parse(raw_sections);
      let sections = [];
      for (let raw_section of raw_sections) {
        let section = {};
        section.title = raw_section.title;
        section.id = raw_section.id;
        section.isLoading = false;
        section.queryInfo = new Bolha.QueryInfo(raw_section.queryInfo);
        section.data = raw_section.data;
        sections.push(section);
      }
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

  _addQuerySection = (queryInfo) => {
    let title = this._getSectionTitle(queryInfo);
    let new_sections = this.state.sections.slice();
    let idx = new_sections.findIndex(el => el.title === title);
    if (idx === -1) {
      new_sections.push({ 
        title: title, 
        id: this._getUid(),
        isLoading: false,
        queryInfo: queryInfo,
        data: []
      });
    }
    this.setState({ sections: new_sections });
  }

  _removeQuerySection = (queryInfo) => {
    let sectionTitle = this._getSectionTitle(queryInfo);
    this.setState(state => {
      return { sections: state.sections.filter(section => section.title !== sectionTitle) };
    });
  }

  _updateQuerySection = (queryInfo) => {
    let sectionTitle = this._getSectionTitle(queryInfo);
    this.setState(state => {
      let sections = state.sections.slice();
      let section = this.state.sections.find(el => el.title === sectionTitle);
      section.queryInfo = queryInfo;
      section.isLoading = false;
      return { sections: sections };
    })
  }

  _fetchArticlesQuery = async (queryInfo) => {
    let sectionTitle = this._getSectionTitle(queryInfo);

    function updateSectionState(state, args) {
      let sections = state.sections.slice();
      let section = sections.find(el => el.title === sectionTitle);

      if (args.hasOwnProperty('data')) { 
        section.data = args.data;
      }
      if (args.hasOwnProperty('isLoading')) {
        section.isLoading = args.isLoading;
      }

      return { sections: sections };
    }

    this.setState(state => updateSectionState(state, {isLoading: true}));
    
    let articles = await Bolha.get_articles_query(queryInfo);

    this.setState(state => updateSectionState(state, {isLoading: false, data: articles}));
  }

  _fetchAllArticles = async () => {    
    let promises = [];
    for (let section of this.state.sections) {
      promises.push(this._fetchArticlesQuery(section.queryInfo));
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
      <Text>{section.queryInfo.build_url()}</Text>
      {section.isLoading && <ActivityIndicator/>}
    </View>
  );

  render() {
    // WIthout the flex: 1, the list is cut off!
    return (
      <View style={{flex: 1}}>  
        <QueryBuilderList 
          style={{maxHeight: '50%'}}
          sections={this.state.sections}
          queryAdded={this._addQuerySection}
          queryRemoved={this._removeQuerySection}
          queryChanged={this._updateQuerySection}
          queryTapped={(queryInfo) => this._jumpToSection(queryInfo.query)}
        />

        <Button
          onPress={this._fetchAllArticles}
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