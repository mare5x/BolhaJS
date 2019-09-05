import * as Bolha from './Bolha';
import { InputDialog } from './InputDialog';

import React, { Component } from 'react';
import { Button, Text, View, FlatList, TouchableOpacity, 
  Animated, StyleSheet, Picker } from 'react-native';
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

    this.state = {
      sortOption: "RECENT_FIRST",
      dateOption: "ALL",
      pagesValue: 1
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
    this._queryChanged({ sort: Bolha.SORT_OPTIONS[itemValue] });
    this.setState({ sortOption: itemValue });
  }

  _datePickerValueChanged = (itemValue, itemIndex) => {
    this._queryChanged({ date: Bolha.DATE_OPTIONS[itemValue] });
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

  _renderSortPicker = () => {
    let sortItems = [];
    for (let option in Bolha.SORT_OPTIONS) {
      sortItems.push(
        <Picker.Item 
          label={Bolha.sort_option_to_string(option)} 
          value={option}
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
      dateItems.push(
        <Picker.Item 
          label={Bolha.date_option_to_string(option)}
          value={option}
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

  _renderPageSlider = () => {
    return (
      <Slider 
        step={1}
        minimumValue={1}
        maximumValue={this._MAX_PAGES_VALUE}
        onValueChange={this._pageValueChanged}
        onSlidingComplete={this._pageValueComplete}
      />
    );
  }

  render() {
    let queryInfo = this.props.queryInfo;
    let pages = (this.state.pagesValue >= this._MAX_PAGES_VALUE)
      ? "ALL" : this.state.pagesValue;

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

      <Text>Pages: {pages}</Text>
      {this._renderPageSlider()}

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
      <View>
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
  }
});