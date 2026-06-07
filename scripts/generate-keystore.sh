#!/bin/bash
# Generate debug keystore for Android builds
KEYSTORE_PATH="mobile/android/app/debug.keystore"

if [ ! -f "$KEYSTORE_PATH" ]; then
  keytool -genkey -v -keystore "$KEYSTORE_PATH" -storepass android \
    -alias androiddebugkey -keypass android -keyalg RSA \
    -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"
  echo "Debug keystore created at $KEYSTORE_PATH"
else
  echo "Debug keystore already exists at $KEYSTORE_PATH"
fi
