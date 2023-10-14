import React, { useState, useEffect } from 'react';
import { Avatar, Bubble, GiftedChat, InputToolbar, Message, Send } from 'react-native-gifted-chat';
import { View, Platform, KeyboardAvoidingView, Text } from 'react-native';
import { auth, db, storage } from '../firebase';
import { ref, getDownloadURL } from "firebase/storage";
import { Audio } from 'expo-av';

import { doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { functions } from '../firebase';
import { getFunctions, httpsCallable } from "firebase/functions";

import Loading from '../components/loading.js';
const dPic = 'https://firebasestorage.googleapis.com/v0/b/gptbot-f52d4.appspot.com/o/depro.png?alt=media&token=31617fd3-70c6-498a-b2c6-356d0e35f68d&_gl=1*xhnui0*_ga*MTE5MzM2NjY1My4xNjc1NDY1NDcz*_ga_CW55HF8NVT*MTY4NTU5OTczNC45MS4xLjE2ODU1OTk5NTUuMC4wLjA.'

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [messagePaginator, setMessagePaginator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userID, setUserID] = useState();
  const [init, setInit] = useState(true);
  const [sound, setSound] = useState();
  const [audioURL, setAudioURL] = useState("");

  useEffect(() => {
    // Get current user ID
    const auth = getAuth();
    const user = auth.currentUser;
    setUserID(user.uid);
      
    // Fetch previous messages if any
    getDocumentData('messages', user.uid)


    setLoading(false);
  }, []);

  async function playAudio() {
    console.log("playing sounds")
    try {

      const sound = new Audio.Sound()

      await sound.loadAsync({
        uri: audioURL
      })

      // await sound.loadAsync(require('../assets/output.mp3'))

      await sound.playAsync()

      // const { sound } = await Audio.Sound.createAsync( require('../assets/output.mp3'));
      // setSound(sound);
      setAudioURL("");
      // await sound.playAsync();
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    // Get current user ID
    console.log("audio URL updated")
    if (audioURL !== "") {
      playAudio();
    }
  }, [audioURL]);

  const getDocumentData = async (collectionName, documentId) => {

    try {
      const documentRef = doc(db, collectionName, documentId);
      const documentSnapshot = await getDoc(documentRef);
      if (documentSnapshot.exists()) {
        const unsub = onSnapshot(documentRef, (doc) => {
          const documentData = doc.data();
          const elements = documentData.messsageList || [];
          let latestElements = [];
          if (elements.length > 25) {
            latestElements = elements.slice(-25);
          } else {
            latestElements = elements;
          }

          const newMessages = latestElements.map((element) => {
            return {
              _id: element._id,
              text: element.text,
              createdAt: element.createdAt.toDate(),
              audioURL: element.audioURL || '',
              user: {
                _id: element.user._id,
                avatar: element.user.avatar
              }
            };
          }).reverse();

          const messageTexts = latestElements.map((element) => element.text).reverse();
          // console.log("fetched messages", messageTexts)
          if (init) {
            setMessages(newMessages)
            setInit(false);
          }
        });
      } else {
        console.log('Document does not exist!');
      }
    } catch (e) {
      console.error("error reading document on snapshot", e)
    }


  };

  const writeToDocument = async (collectionName, documentId, message) => {
    const documentRef = doc(db, collectionName, documentId)
    const documentSnapshot = await getDoc(documentRef); 

    if (documentSnapshot.exists()) {
      try {
        await updateDoc(documentRef, {
          messsageList: arrayUnion(message)
        });
        console.log('Message added to document!');
      } catch (error) {
        console.error('Error writing to document:', error);
      }
    } else {
      try {

        await setDoc(documentRef, {
          messsageList: [message]
        }, { merge: true });
        console.log('Message added to document!');
      } catch (error) {
        console.error('Error writing to document:', error);
      }
    }
    getResponse(message);
  };

  function mapMessage(message) {
    return {
      _id: message.id,
      text: message.body,
      createdAt: new Date(message.createdTime),
      user: mapUser(dPic)
    };
  }

  function mapUser() {
    return {
      _id: 1,
      name: "chad",
      avatar: dPic
      // avatar: user.displayPictureUrl
    };
  }

  const playSounds = async (msg) => {
    getDownloadURL(ref(storage, 'output.mp3'))
      .then((url) => {
        // `url` is the download URL for 'images/stars.jpg'

        // This can be downloaded directly:
        console.log("url", url)
        setAudioURL(url);


      })
      .catch((error) => {
        // Handle any errors
        console.log("error", error);
      });
  }

  useEffect(() => {
    return sound
      ? () => {
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const getResponse = async (msg) => {
    try {
      const gptResponse = httpsCallable(functions, 'gptRespond');
       
      
      const response = await gptResponse({ argument: msg, collection: 'messages', documentId: userID, ava: dPic });
      // Handle the response
      if (response.data.success) {
        console.log('Success', response.data.message);
      } else {
        console.log('Error', response.data.message);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error calling Cloud Function:', error);
      console.log('Error', 'Failed to call Cloud Function');
    }

  }

  const onSend = (newMessages = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));

    writeToDocument('messages', userID, newMessages[0])


    // Append new messages to firebase storage 
  };

  const renderFooter = () => (
    <View style={{ paddingBottom: 15 }} />
  );

  function renderInputToolbar(props) {
    // Here you will return your custom InputToolbar.js file you copied before and include with your stylings, edits.
    return <InputToolbar {...props} containerStyle={{
      // borderTopWidth: 0.5, 
      borderTopColor: '#333',
      height: 'auto',
      borderWidth: 1,
      borderTopWidth: 1,
      margin: 10,
      marginBottom: 40,
      borderRadius: 30,
      paddingTop: 0,
      paddingBottom: 0,
      // marginTop:40
      // borderBottomEndRadius: 10,
      // marginBottom:5
    }} textInputStyle={{
      fontSize: 17,
      paddingTop: 9,
      marginTop: 5,
    }} />
  }
  function renderAvatar(props) {
    return (
      <Avatar
        {...props}
        onPressAvatar={(avatarUser) => {
          playSounds("test msg");
        }}
      />
    );
  }
  function renderSend(props) {
    return (
      <Send {...props} containerStyle={{
        padding: 10,

      }}>
        <Text style={{
          color: `#ff6347`,
          fontWeight: '600',
          fontSize: 19,
          margin: 0,
          paddingBottom: 7,
          paddingRight: 9
        }}>Send</Text>
      </Send>
    );
  }

  async function handleLoadEarlier() {
    // if (!messagePaginator.hasNextPage) {
    //   setLoadEarlier(false);

    //   return;
    // }

    // setIsLoadingEarlier(true);

    // const nextPaginator = await messagePaginator.nextPage();

    // setMessagePaginator(nextPaginator);

    // setMessages((currentMessages) =>
    //   GiftedChat.prepend(currentMessages, nextPaginator.items.map(mapMessage))
    // );

    setIsLoadingEarlier(false);
  }

  function renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          // left: {
          //     backgroundColor: '#d3d3d3'
          // }
          left: {
            backgroundColor: `#f77777`
          },
          right: {
            backgroundColor: `#3b3b3b`
          }
        }}
      />
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={{ flex: 1 }}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={mapUser(dPic)}
        renderFooter={renderFooter}
        // renderChatFooter={renderFooter}
        loadEarlier={loadEarlier}
        isLoadingEarlier={isLoadingEarlier}
        onLoadEarlier={handleLoadEarlier}
        renderBubble={renderBubble}
        showUserAvatar={false}
        renderAvatar={renderAvatar}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderAvatarOnTop={true}
        showAvatarForEveryMessage={true}
        minInputToolbarHeight={70}
        bottomOffset={3}
      />
      {Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />}
    </View>
  );
}
