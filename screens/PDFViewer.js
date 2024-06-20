import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const PDFViewer = () => {
  const [fileUri, setFileUri] = useState('');
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchAndStorePDF = async () => {
        try {
        const pdfUrl = await AsyncStorage.getItem('pdfUrl');
        if (pdfUrl) {
            console.log('Fetched PDF URL:', pdfUrl);
            const response = await fetch(pdfUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = async () => {
            const base64 = arrayBufferToBase64(reader.result);
            // Create a data URI for the PDF content
            const dataUri = `data:application/pdf;base64,${base64}`;
            setFileUri(dataUri); // Set the data URI as the source for the WebView
            setLoading(false);
            };
            reader.readAsArrayBuffer(blob);          
        } else {
            console.log('No URL found in AsyncStorage');
            setLoading(false);
        }
        } catch (error) {
        console.error('Error processing the PDF:', error);
        setLoading(false);
        }
    };

    fetchAndStorePDF();
    }, []);

    function arrayBufferToBase64(buffer) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i += 3) {
        const b1 = bytes[i] & 0xFF;
        const b2 = bytes[i + 1] & 0xFF;
        const b3 = bytes[i + 2] & 0xFF;
        const d1 = b1 >> 2,
            d2 = ((b1 & 3) << 4) | (b2 >> 4),
            d3 = ((b2 & 15) << 2) | (b3 >> 6),
            d4 = b3 & 63;

        if (i + 2 < len) {
        binary += chars[d1] + chars[d2] + chars[d3] + chars[d4];
        } else if (i + 1 < len) {
        binary += chars[d1] + chars[d2] + chars[d3] + '=';
        } else {
        binary += chars[d1] + chars[d2] + '==';
        }
    }

    return binary;
    }
    
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {fileUri ? (
        <WebView source={{ uri: fileUri }} style={{ flex: 1 }} />
      ) : (
        <View style={styles.errorContainer}>
          <Text>No PDF available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PDFViewer;