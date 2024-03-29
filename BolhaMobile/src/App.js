import * as Bolha from './Bolha';
import { QuerySectionsList } from './QuerySectionsList';
import { QueryBuilderList } from './QueryBuilderList';
import { InputDialog } from './InputDialog';
import { AddButton, FetchButton, JumpButton } from './Buttons';

import React, { Component } from 'react';
import { 
  View, 
  AppState,
  Animated
} from 'react-native';
import { TabView } from 'react-native-tab-view';
import AsyncStorage from '@react-native-community/async-storage';


class BaseScreen extends Component {
  constructor(props) {
    super(props);

    this._animatedJumpY = new Animated.Value(-56);
    this.state = {
      jumpVisible: false,
    };
  }

  _showJumpButton = () => {
    if (this.state.jumpVisible) return;

    // this._animatedJumpY.setValue(-56);
    Animated.timing(
      this._animatedJumpY, 
      {
        toValue: 15,
        duration: 250
      }
    ).start();
    this.setState({ jumpVisible: true });
  }

  _hideJumpButton = () => {
    if (!this.state.jumpVisible) return;

    // this._animatedJumpY.setValue(15);
    Animated.timing(
      this._animatedJumpY,
      {
        toValue: -56,
        duration: 250
      }
    ).start((info) => {
      if (info.finished) {
        this.setState({jumpVisible: false});  // Callback.
      }
    });
  }

  _onScroll = (dy) => {
    if (dy < -20) {
      this._showJumpButton();
    } else if (dy > 20) {
      this._hideJumpButton();
    }
  }

  render() {
    // Without the flex: 1, the list is cut off!
    return (
      <View style={{flex: 1}}>
        {this.props.children}

        <JumpButton 
          onPress={this.props.onJump}
          style={{bottom: this._animatedJumpY}}
        />
      </View>
    );
  }
}


class SettingsScreen extends Component {  
  /* props:
    queries : [{queryInfo: QueryInfo ...}]
    queryAdded
    queryChanged
    queryRemoved
    queryTapped
  */

  constructor(props) {
    super(props);

    this._baseScreenRef = {};
    this._listRef = {};

    this.state = {
      inputDialogVisible: false
    };
  }

  _onQueryAdded = (queryText) => {
    let query = new Bolha.QueryInfo({ query: queryText });
    this.props.queryAdded(query);
    this.setState({ inputDialogVisible: false });
  }

  _inputDialogCancelled = () => {
    this.setState({ inputDialogVisible: false });
  }

  render() {
    return (
      <BaseScreen
        onJump={this._listRef._jumpToTop}
        ref={component => this._baseScreenRef = component}
      >
        <InputDialog 
          visible={this.state.inputDialogVisible}
          onConfirm={this._onQueryAdded}
          onCancel={this._inputDialogCancelled}
        />

        <QueryBuilderList 
          queries={this.props.queries}
          queryRemoved={this.props.queryRemoved}
          queryChanged={this.props.queryChanged}
          queryTapped={this.props.queryTapped}
          onScroll={this._baseScreenRef._onScroll}
          ref={component => this._listRef = component}
        />

        <AddButton
          onPress={() => this.setState({ inputDialogVisible: true })}
        />
      </BaseScreen>
    );
  }
}


class HomeScreen extends Component {
  /* props:
    queries
    setSectionListRef
    onFetchAll
  */

  constructor(props) {
    super(props);

    this._baseScreenRef = {};
    this._queryListRef = {};
  }

  render() {
    return (
      <BaseScreen
        onJump={this._queryListRef._jumpToTop}
        ref={component => this._baseScreenRef = component}
      >
        <QuerySectionsList 
          queries={this.props.queries}
          setSectionListRef={this.props.setSectionListRef}
          onScroll={this._baseScreenRef._onScroll}
          ref={component => this._queryListRef = component}
        />

        <FetchButton
          onPress={this.props.onFetchAll}
        />
      </BaseScreen>
    );
  }
}


export default class App extends Component {
  constructor(props) {
    super(props);

    this._uid = 0;
    this._sectionListRef = null;

    this.state = {
      // { id: string, queryInfo: QueryInfo, isLoading: bool,
      //   data: [BolhaArticle] }
      // 'id' is also injected into queryInfo, to tie them together.
      // 'id' and 'data' are needed for the SectionList.
      queries: [],
      
      // TabView required state.
      index: 0,
      routes: [
        { key: 'home', title: 'Home' },
        { key: 'settings', title: 'Settings' }
      ]
    }
  }

  _getUid = () => {
    const n = this.state.queries.length;
    let old = (n > 0)
        ? (parseInt(this.state.queries[n - 1].id) + 1)
        : (-1);
    this._uid = Math.max(this._uid + 1, old);
    return this._uid.toString();
  }

  _fetchArticlesQuery = async (queryInfo) => {
    if (!queryInfo.enabled) {
      return null;
    }
    
    function updateQueriesState(state, args) {
      let queries = state.queries.slice();
      let query = queries.find(el => el.id === queryInfo.id);

      if (args.hasOwnProperty('data')) { 
        query.data = args.data;
      }
      if (args.hasOwnProperty('isLoading')) {
        query.isLoading = args.isLoading;
      }

      return { queries: queries };
    }

    this.setState(state => updateQueriesState(state, {isLoading: true}));
    
    let articles = await Bolha.get_articles_query(queryInfo);

    this.setState(state => updateQueriesState(state, {isLoading: false, data: articles}));
  }

  _fetchAllArticles = async () => {    
    let promises = [];
    for (let query of this.state.queries) {
      promises.push(this._fetchArticlesQuery(query.queryInfo));
    }
    await Promise.all(promises);
  }

  async componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    await this._loadQueries();
  }

  async componentWillUnmount() {
    await this._storeQueries();
  }

  _handleAppStateChange = async (nextState) => {
    // When minimizing the app, save state.
    if (nextState != "active") {
      await this._storeQueries();
    }
  }

  _loadQueries = async () => {
    let raw_queries = await AsyncStorage.getItem("@queries");
    console.log("Read queries: ", raw_queries);
    if (raw_queries) {
      raw_queries = JSON.parse(raw_queries);
      let queries = [];
      for (let raw_query of raw_queries) {
        let query = {};
        query.id = raw_query.id;
        query.isLoading = false;
        query.queryInfo = new Bolha.QueryInfo(raw_query.queryInfo);
        query.data = raw_query.data;
        queries.push(query);
      }
      this.setState({ queries: queries });
    }
  }

  _storeQueries = async () => {
    let queries = JSON.stringify(this.state.queries);
    console.log("Storing queries: ", queries);
    await AsyncStorage.setItem("@queries", queries);
  }

  _addQuery = (queryInfo) => {
    this.setState(state => {
      let queries = state.queries.slice();
      queryInfo.id = this._getUid();  // Tie the query with the section.
      queries.push({ 
        id: queryInfo.id,
        isLoading: false,
        queryInfo: queryInfo,
        data: []
      });
      return { queries };
    });
  }

  _removeQuery = (queryInfo) => {
    this.setState(state => {
      return { queries: state.queries.filter(q => q.id !== queryInfo.id) };
    });
  }

  _updateQuery = (queryInfo) => {
    this.setState(state => {
      let queries = state.queries.slice();
      let section = this.state.queries.find(q => q.id === queryInfo.id);
      section.queryInfo = queryInfo;
      section.isLoading = false;
      return { queries: queries };
    })
  }

  _jumpToQuery = (queryInfo, sectionList, jumpTo) => {
    jumpTo('home');
    let section_index = this.state.queries.findIndex(q => q.id === queryInfo.id);
    sectionList.scrollToLocation({ sectionIndex: section_index, itemIndex: 0 });    
  }

  _renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
      case 'home': 
        return <HomeScreen 
          queries={this.state.queries}
          onFetchAll={this._fetchAllArticles}
          setSectionListRef={ref => this._sectionListRef = ref}
        />;
      case 'settings':
        return <SettingsScreen 
          queries={this.state.queries}
          queryAdded={this._addQuery}
          queryChanged={this._updateQuery}
          queryRemoved={this._removeQuery}
          queryTapped={queryInfo => this._jumpToQuery(queryInfo, this._sectionListRef, jumpTo)}
        />;
    }
  }

  render() {
    return (
      <TabView 
        navigationState={this.state}
        onIndexChange={index => this.setState({ index })}
        renderScene={this._renderScene}
      />
    );
  }
}