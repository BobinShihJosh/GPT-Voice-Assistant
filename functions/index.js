const functions = require("firebase-functions");
const admin = require('firebase-admin');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Storage } = require('@google-cloud/storage');

const fs = require('fs');
const util = require('util');

admin.initializeApp();
const storage = new Storage();

const client = new textToSpeech.TextToSpeechClient();

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: " ",
});

const openai = new OpenAIApi(configuration);


exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

exports.gptRespond = functions.https.onCall(async (data, context) => {
  const { argument, collection, documentId, ava } = data;

  // Perform any processing or manipulation on the argument here
  // const processedArgument = argument.toUpperCase(); // Example: convert argument to uppercase 

  try {
    const docRef = admin.firestore().collection(collection).doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return { success: false, message: 'Document does not exist' };
    }


    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: argument.text }],
    });



    const existingMessages = docSnapshot.data().messsageList || [];


    // text to speech 
    const text = completion.data.choices[0].message.content;
    const outputFile = 'output.mp3'; // Provide the desired output file path

    const request = {
      input: { text: text },
      voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    let url = ''
    try {
      const [response] = await client.synthesizeSpeech(request);

      const audioData = response.audioContent;
      const bucket = storage.bucket('gs://gptbot-f52d4.appspot.com');
      const file = bucket.file('output.mp3');
      const stream = file.createWriteStream();

      // Write the audio data to the file stream
      stream.write(audioData);
      stream.end();
      await file.makePublic();
     
    } catch (error) {
      console.error('Error:', error);
      throw new functions.https.HttpsError('internal', 'An error occurred');
    }

    const newArgument = {
      _id: argument._id + "response",
      text: completion.data.choices[0].message.content,
      createdAt: admin.firestore.Timestamp.now(),
      user: {
        _id: 0,
        avatar: ava
      }
    };
    const updatedMessages = [...existingMessages, newArgument];

    await docRef.set({ messsageList: updatedMessages });
    // await docRef.set({ processedArgument });

    return { success: true, message: 'String processed and written to Firestore successfully' };
  } catch (error) {
    console.error('Error writing to Firestore:', error);
    return { success: false, message: error.message };
  }
});