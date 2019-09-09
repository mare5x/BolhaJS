import * as Bolha from './Bolha';
import { InputDialog } from './InputDialog';

import React, { Component } from 'react';
import { Button, Text, View, FlatList, TouchableOpacity, 
  Animated, StyleSheet, Picker, TextInput, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import Swipeable from 'react-native-gesture-handler/Swipeable';


const Separator = () => <View style={styles.separator} />;


class QueryInfoItem extends Component {
  /* props:
    queryInfo
    onTap
    onDelete
    onChange
  */

  constructor(props) {
    super(props);

    this._MAX_PAGES_VALUE = 10;

    const queryInfo = props.queryInfo;
    const { price_min, price_max, sort, date, pages, enabled } = queryInfo;
    const initialPages = (pages < 0) 
      ? this._MAX_PAGES_VALUE : pages;

    this.state = {
      sortOption: sort,
      dateOption: date,
      pagesValue: initialPages,
      priceMin: price_min,
      priceMax: price_max,
      enabled: enabled
    };
  }

  _queryChanged = (params) => {
    let queryInfo = this.props.queryInfo;
    for (let opt in params) {
      queryInfo[opt] = params[opt];
    }
    this.props.onChange(queryInfo);
  }

  _sortPickerValueChanged = (itemValue, itemIndex) => {
    this._queryChanged({ sort: itemValue });
    this.setState({ sortOption: itemValue });
  }

  _datePickerValueChanged = (itemValue, itemIndex) => {
    this._queryChanged({ date: itemValue });
    this.setState({ dateOption: itemValue });
  }

  _pageValueChanged = (value) => {
    this.setState({ pagesValue: value });
  }

  _pageValueComplete = (value) => {
    // -1 for all pages
    value = (value >= this._MAX_PAGES_VALUE) ? -1 : value;
    this._queryChanged({ pages: value });
  }

  _priceMinInputComplete = (event) => {
    let text = event.nativeEvent.text;
    let price = text ? Math.max(0, parseInt(text)) : 0;
    this._queryChanged({ price_min: price });
    this.setState({ priceMin: price });
  }

  _priceMaxInputComplete = (event) => {
    let text = event.nativeEvent.text;
    let price = text ? Math.max(this.state.priceMin, parseInt(text)) : -1;
    this._queryChanged({ price_max: price });
    this.setState({ priceMax: price });
  }

  _enabledChanged = (value) => {
    this._queryChanged({ enabled: value });
    this.setState({ enabled: value });
  }

  _onDeleteAction = () => {
    this.props.onDelete(this.props.queryInfo);
  }

  _renderSortPicker = () => {
    let sortItems = [];
    for (let option in Bolha.SORT_OPTIONS) {
      let val = Bolha.SORT_OPTIONS[option];
      sortItems.push(
        <Picker.Item 
          label={Bolha.sort_option_to_string(val)} 
          value={val}
          key={option}
        />
      );
    }

    return (
      <Picker
        selectedValue={this.state.sortOption}
        onValueChange={this._sortPickerValueChanged}
        prompt="Hello"  // Doesn't show?!?
      >
        {sortItems}
      </Picker>
    );
  }

  _renderDatePicker = () => {
    let dateItems = [];
    for (let option in Bolha.DATE_OPTIONS) {
      let val = Bolha.DATE_OPTIONS[option];
      dateItems.push(
        <Picker.Item 
          label={Bolha.date_option_to_string(val)}
          value={val}
          key={option}
        />
      )
    }

    return (
      <Picker
        selectedValue={this.state.dateOption}
        onValueChange={this._datePickerValueChanged}
        prompt="Hello"
      >
        {dateItems}
      </Picker>
    );
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

  _onSwipeRight = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp'
    });

    return (
      <View style={styles.queryOptionToggleSwipe}>
        <Animated.Text 
          style={[
            styles.queryOptionToggleSwipeText,
            { 
              transform: [{ scale }]
            }]
          }>
          Enabled: 
        </Animated.Text>
        <Switch 
        onValueChange={this._enabledChanged}
        value={this.state.enabled}
        />
      </View>
    );
  }

  _PageSlider = (props) => {
    return (
      <Slider 
        {...props}
        step={1}
        minimumValue={1}
        maximumValue={this._MAX_PAGES_VALUE}
        onValueChange={this._pageValueChanged}
        onSlidingComplete={this._pageValueComplete}
      />
    );
  }

  _PriceInput = (props) => {
    return (
      <TextInput 
        {...props}
        style={styles.priceInput}
        keyboardType="numeric"
      />
    );
  }

  render() {
    const queryInfo = this.props.queryInfo;
    const queryColorStyle = { color: this.state.enabled ? 'green' : 'red' };
    const pages = (this.state.pagesValue >= this._MAX_PAGES_VALUE)
      ? "ALL" : this.state.pagesValue;
    const priceMin = Math.max(this.state.priceMin, 0).toString();
    const priceMax = (this.state.priceMax >= 0)
      ? this.state.priceMax.toString() : "∞";

    return (
    <Swipeable
      renderLeftActions={this._onSwipeLeft}
      renderRightActions={this._onSwipeRight}
    >
      <View style={styles.queryOption}>
        <TouchableOpacity onPress={() => this.props.onTap(queryInfo)}>
          <Text>Query: 
            <Text style={[styles.queryText, queryColorStyle]}>  {queryInfo.query}</Text>
          </Text>
        </TouchableOpacity>

        <Text>Sort by: </Text>
        {this._renderSortPicker()}

        <Text>Date posted: </Text>
        {this._renderDatePicker()}

        <Text>Price in €:</Text>
        <View style={styles.priceView}>
          <Text>From </Text>
          <this._PriceInput 
            placeholder={priceMin} 
            onEndEditing={this._priceMinInputComplete}
          />

          <Text>to </Text>
          <this._PriceInput 
            placeholder={priceMax}
            onEndEditing={this._priceMaxInputComplete}
          />
        </View>

        <Text>Pages: {pages}</Text>
        <this._PageSlider value={this.state.pagesValue}/>
      </View>
    </Swipeable>
    );
  }
}


export class QueryBuilderList extends Component {
  /* props:
    queries : [{queryInfo: QueryInfo ...}]
    queryAdded
    queryChanged
    queryRemoved
    queryTapped
  */

  constructor(props) {
    super(props);

    this.state = {
      inputDialogVisible: false
    }
  }

  _onQueryAdded = (queryText) => {
    let query = new Bolha.QueryInfo({ query: queryText });
    this.props.queryAdded(query);
    this.setState({ inputDialogVisible: false });
  }

  _inputDialogCancelled = () => {
    this.setState({ inputDialogVisible: false });
  }

  _renderQueryInfo = ({ item }) => {
    let queryInfo = item.queryInfo;  // section.[...]
    return (
      <QueryInfoItem 
        queryInfo={queryInfo}
        onDelete={this.props.queryRemoved}
        onTap={this.props.queryTapped}
        onChange={this.props.queryChanged}
      />
    );
  }

  render() {
    return (
      <View style={this.props.style}>
        <InputDialog 
          visible={this.state.inputDialogVisible}
          onConfirm={this._onQueryAdded}
          onCancel={this._inputDialogCancelled}
        />

        <FlatList
          data={this.props.queries}
          renderItem={this._renderQueryInfo}
          ItemSeparatorComponent={Separator}
        />
        
        <Button 
          onPress={() => this.setState({ inputDialogVisible: true })}
          title="Add query"
        />
      </View>
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

  queryOption: {
    padding: 10,
    backgroundColor: "#fff"  // Weird overlap issue if this isn't set!
  },

  queryText: {
    fontSize: 18, 
    fontWeight: 'bold'
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
  },

  queryOptionToggleSwipe: {
    justifyContent: "center",
    alignItems: "flex-end",
    backgroundColor: "rgba(240, 240, 240, 0.5)",
    padding: 10
  },

  queryOptionToggleSwipeText: {
    color: "black",
    fontWeight: '600',
    padding: 20
  },

  priceView: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: 'rgba(22, 22, 220, 0.5)',
    borderRadius: 10,
    alignItems: 'center'
  },

  priceInput: {
    borderRadius: 5,
    backgroundColor: "rgba(200, 200, 200, 0.5)",
    // marginLeft: 20,
    margin: 5,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 2,
    paddingBottom: 2,
    maxWidth: '33%'
  }
});