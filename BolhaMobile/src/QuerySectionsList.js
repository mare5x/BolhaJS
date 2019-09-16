import { JumpButton } from './Buttons';

import React, { Component } from 'react';
import { 
  Text, 
  View, 
  Image, 
  Linking, 
  SectionList, 
  StyleSheet, 
  ActivityIndicator
} from 'react-native';
import { RectButton, BaseButton } from 'react-native-gesture-handler';


class ArticleItem extends React.PureComponent {
  static Header(props) {
    const { title, price } = props;
    return (
      <RectButton 
        onPress={props.onTap}
        style={styles.articleHeader}
      >
        <Text style={styles.articleHeaderTitle}>
          {title}
        </Text>
        <Text style={styles.articleHeaderPrice}>
          {price}
        </Text>
      </RectButton>
    );
  }

  static Summary(props) {
    const { summary, image, link } = props;
    return (
      <View>
        <Text>{summary.trim()}</Text>
        <BaseButton 
          style={{flexDirection: "row", justifyContent: "center"}}
          onPress={() => Linking.openURL(link)}
        >
          <Image 
            source={{uri: image}} 
            style={styles.previewImage}
          />
        </BaseButton>
      </View>
    );
  }

  render() {
    const { title, link, price, summary, image } = this.props.article;
    const showDetails = this.props.showDetails;
    
    const summaryItem = showDetails 
      ? <ArticleItem.Summary 
          summary={summary} 
          image={image} 
          link={link}/>
      : null;

    return (
      <View>
        <ArticleItem.Header 
          title={title} 
          price={price} 
          onTap={this.props.onTap} 
        />
        {summaryItem}
      </View>
    );
  }
}


export class QuerySectionsList extends Component {
  /* props:

  */

  constructor(props) {
    super(props);

    this._sectionListRef = null;
    this._prevScroll = 0;
    this._scrollDelta = 0;
    this.state = {
      refresh: false   // Update the list by toggling this variable.
    };
  }

  _onScroll = ({ nativeEvent }) => {
    const scrollY = nativeEvent.contentOffset.y;
    // down > 0, up < 0
    const dy = scrollY - this._prevScroll;
    // If direction changed.
    if (Math.sign(dy) !== Math.sign(this._scrollDelta)) {
      this._scrollDelta = 0;
    }
    this._scrollDelta += dy;
    this._prevScroll = scrollY;
    if (this._scrollDelta !== 0) {
      this.props.onScroll(this._scrollDelta);
    }
  }

  _getSectionTitle = (queryInfo) => {
    return queryInfo.query.toUpperCase();
  }

  _jumpToTop = () => {
    if (this.props.queries.length > 0) {
      this._sectionListRef.scrollToLocation({ sectionIndex: 0, itemIndex: 0 });
    }
  }

  _sectionRenderItem = ({ item, index, section }) => {
    return (
      <ArticleItem 
        article={item} 
        showDetails={item.showDetails}
        onTap={() => {
          item.showDetails = item.showDetails ? false : true;
          this.setState(state => ({ refresh: !state.refresh }));
        }}
      />
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
      <View style={{
         flexDirection: "row", 
         justifyContent: "space-around" 
      }}>
        <Text style={[styles.sectionHeaderText, titleColorStyle]}>{title}</Text>
        {isLoadingComp}
      </View>
      <Text>{queryInfo.build_url()}</Text>
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
        ListFooterComponent={<View/>}
        ListFooterComponentStyle={styles.footerStyle}
        ref={component => {
          this._sectionListRef = component;
          this.props.setSectionListRef(component)
        }}
        onScrollToIndexFailed={(info) => console.error(info)}
        extraData={this.state.refresh}
        onScroll={this._onScroll}
        scrollEventThrottle={15}
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
      // flexDirection: "row", 
      // justifyContent: "space-around",
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
    },

    footerStyle: {
      // Create empty space at the end of the list,
      // so that the list can be scrolled more and
      // the floating button won't cover anything.
      minHeight: 80,
      minWidth: 80,
      padding: 5,
      flexDirection: 'column-reverse'
    },

    articleHeader: {
      backgroundColor: 'rgb(200,200,247)',
      padding: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      borderRadius: 10
    },

    articleHeaderTitle: {
      color: 'blue', 
      fontWeight: 'bold', 
      fontSize: 14, 
      maxWidth: '66%'
    },

    articleHeaderPrice: {
      color: 'green', 
      fontWeight: 'bold', 
      fontSize: 18
    }
  });