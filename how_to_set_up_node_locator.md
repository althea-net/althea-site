# Althea Node Locator

v0.2 The Node Locator utilizes Google Maps API + Firebase Realtime Database to provide a visual representation of the approximate location of potential nodes in the althea network.

# Getting Started

To begin you will need to install and configure Firebase CLI if you do not already have it. This must be done for code to be deployed to the Firebase Cloud Function server.

To install the Firebase CLI, you first need to [sign up for a Firebase account](https://firebase.google.com/).

Then you need to install [Node.js](http://nodejs.org/) and [npm](https://npmjs.org/). **Note that installing Node.js should install npm as well.**

Once npm is installed, get the Firebase CLI by running the following command:

> npm install -g firebase-tools

This will provide you with the globally accessible firebase command.

From the working directory's terminal, enter the following command to download all of the necessary packages.

> npm install

Next you will need to get [RECAPTCHA](https://codelabs.developers.google.com/codelabs/reCAPTCHA/index.html#0) and [Google Maps](https://developers.google.com/maps/documentation/javascript/get-api-key) API keys. Keys required for Firebase should be available after logging into [Firebase's website](https://firebase.google.com/). Enter the API keys and other data where necessary in the index.html, index.js, and app.js files.

Once you have Firebase CLI ready you can deploy the app from the working directory using:

> firebase deploy

When the deployment completes successfully you will copy/ paste the **Hosting URL** into your web browser.

* Notes:
  * Ensure you have setup RECAPTCHA such that it will function on the your [websites domain](https://developers.google.com/recaptcha/docs/domain_validation). If you are running this application locally set the domain in RECAPTCHA to 127.0.0.1 and use 127.0.0.1:3000 in the browser```
