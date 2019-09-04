import { InputDialog } from './InputDialog';

import React, { Component } from 'react';
import { Button, Text, View, FlatList, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const Separator = () => <View style={styles.separator} />;

class RowItem extends Component {
  /* props:
    title
    onTap
    onDelete
    onAdd 
  */

  _onTap = () => {
    this.props.onTap(this.props.title);
  }

  _onDeleteAction = () => {
    this.props.onDelete(this.props.title);
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
            <Text>{this.props.title}</Text>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  }
}

export class QueryInfo {
  constructor(query = '') {
    this.query = query;
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
    this.setState({ inputDialogVisible: false });
    let query = new QueryInfo(queryText);
    this.props.queryAdded(query);
  }

  _inputDialogCancelled = () => {
    this.setState({ inputDialogVisible: false });
  }

  _renderQueryInfo = ({ item }) => {
    let queryInfo = item.queryInfo;
    return (
      <RowItem 
        title={queryInfo.query}
        onDelete={this.props.queryRemoved}
        onTap={this.props.queryTapped}
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