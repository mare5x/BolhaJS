import * as Bolha from './Bolha';
import { InputDialog } from './InputDialog';

import React, { Component } from 'react';
import { Button, Text, View, FlatList, TouchableOpacity, 
  Animated, StyleSheet, Picker, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import Swipeable from 'react-native-gesture-handler/Swipeable';


const Separator = () => <View style={styles.separator} />;

class RowItem extends Component {
  /* props:
    data
    onTap
    onDelete
  */

  _onTap = () => {
    this.props.onTap(this.props.data);
  }

  _onDeleteAction = () => {
    this.props.onDelete(this.props.data);
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
    return (
      <Swipeable
        renderLeftActions={this._onSwipeLeft}
      >
        <View style={styles.queryOption}>
          <TouchableOpacity onPress={this._onTap}>
            {this.props.children}
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  }
}

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
    const { price_min, price_max, sort, date, pages } = queryInfo;
    const initialPages = (pages < 0) 
      ? this._MAX_PAGES_VALUE : pages;

    this.state = {
      sortOption: sort,
      dateOption: date,
      pagesValue: initialPages,
      priceMin: price_min,
      priceMax: price_max
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
    const pages = (this.state.pagesValue >= this._MAX_PAGES_VALUE)
      ? "ALL" : this.state.pagesValue;
    const priceMin = Math.max(this.state.priceMin, 0).toString();
    const priceMax = (this.state.priceMax >= 0)
      ? this.state.priceMax.toString() : "∞";

    return (
    <RowItem 
      data={queryInfo}
      onTap={this.props.onTap}
      onDelete={this.props.onDelete}
    >
      <Text>Query: <Text style={{fontSize: 18, fontWeight: 'bold'}}>{queryInfo.query}</Text></Text>

      <Text>Sort by: </Text>
      {this._renderSortPicker()}

      <Text>Date posted: </Text>
      {this._renderDatePicker()}

      <Text>Price in €:</Text>
      <View style={styles.priceView}>
        <Text>From </Text>
        <this._PriceInput 
          placeholder={priceMin} 
          onSubmitEditing={this._priceMinInputComplete}
        />

        <Text>to </Text>
        <this._PriceInput 
          placeholder={priceMax}
          onSubmitEditing={this._priceMaxInputComplete}
        />
      </View>

      <Text>Pages: {pages}</Text>
      <this._PageSlider value={this.state.pagesValue}/>

    </RowItem>
    );
  }
}

export class QueryBuilderList extends Component {
  /* props:
    sections : [{queryInfo: QueryInfo ...}]
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
          data={this.props.sections}
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