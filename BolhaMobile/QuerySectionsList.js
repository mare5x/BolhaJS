import React, { Component } from 'react';
import { 
  Text, 
  View, 
  Image, 
  Linking, 
  SectionList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';


export class QuerySectionsList extends Component {
  constructor(props) {
    super(props);

    this._sectionListRef = null;
  }

  _getSectionTitle = (queryInfo) => {
    return queryInfo.query.toUpperCase();
  }

  _jumpToTop = () => {
    if (this.props.queries.length > 0) {
      this._sectionListRef.scrollToLocation({ sectionIndex: 0, itemIndex: 0 });
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

  _sectionRenderHeader = ({ section }) => {
    const queryInfo = section.queryInfo;
    const title = this._getSectionTitle(queryInfo);
    const isLoading = section.isLoading;

    const titleColorStyle = { color: 
      queryInfo.enabled 
        ? (isLoading 
          ? 'blue'
          : 'green')
        : 'grey'
    };

    const isLoadingComp = isLoading ? <ActivityIndicator /> : null;

    return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, titleColorStyle]}>{title}</Text>
      <Text>{queryInfo.build_url()}</Text>
      {isLoadingComp}
    </View>
    );
  }

  render() {
    return (
      <SectionList 
        sections={this.props.queries}
        keyExtractor={(item, index) => item.title + index }
        renderItem={this._sectionRenderItem}
        renderSectionHeader={this._sectionRenderHeader}
        contentContainerStyle={styles.sectionListItem}
        ListFooterComponent={this._jumpToTopButton}
        ref={component => {
          this._sectionListRef = component;
          this.props.setSectionListRef(component)
        }}
        onScrollToIndexFailed={(info) => console.error(info)}
      />
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