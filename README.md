# Althea Node Locator

The Node Locator utilizes Google Maps API + Firebase Realtime Database to provide a visual representation of the approximate location of potential nodes in the althea network.

### [Althea Mesh Node-Locator](altheamesh.com)

![Alt Text](http://res.cloudinary.com/dcgnyswpg/image/upload/v1519432417/demo-screenshot_epd4jg.png)

# Getting Started

To begin you will need to install and configure Firebase CLI if you do not already have it. This must be done for code to be deployed to the Firebase Cloud Function server.

To install the Firebase CLI, you first need to [sign up for a Firebase account](https://firebase.google.com/).

Then you need to install [Node.js](http://nodejs.org/) and [npm](https://npmjs.org/). **Note that installing Node.js should install npm as well.**

Once npm is installed, get the Firebase CLI by running the following command:

> npm install -g firebase-tools

This will provide you with the globally accessible firebase command.

In the terminal change the current directory to the functions directory, enter the following command to download all of the necessary packages in the functions directory.

> npm install

## Firebase Setup

Change the back to the top level of the project, in the terminal enter

> firebase setup:web

Firebase will provide an output that must be copied and pasted into the app.js file.

```
firebase.initializeApp({
  "apiKey": "<YOUR API KEY>",
  "databaseURL": "https://<YOUR PROJECT ID>.firebaseio.com",
  "storageBucket": "<YOUR PROJECT ID>.appspot.com",
  "authDomain": "<YOUR PROJECT ID>.firebaseapp.com",
  "messagingSenderId": "<MESSAGING SENDER ID>",
  "projectId": "<YOUR PROJECT ID>"
});
```

In the .firebaserc file replace deafult vaue to your the project ID provided previously.

```
{
  "projects": {
    "default": "<YOUR PROJECT ID>"
  }
}
```

## RECAPTCHA Setup

Next you will need to get an API key from [RECAPTCHA](https://www.google.com/recaptcha/admin#list). Under the 'register a new site' section select reCAPTCHA V2, then proceed to add the appropiate domain(s) that will be required for your web application.

Under 'Keys' copy the 'Site Key' then paste it in the data-sitekey field of index.html.

```
  <div class="g-recaptcha"
  data-sitekey="<YOUR API KEY HERE>">
  </div>
```

Then copy the 'Secret Key' and paste it in the secret field of index.js.

```
var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: "<YOUR API KEY HERE>",
  formatter: null
};
```

## Google Maps Setup

For the [Google Maps](https://developers.google.com/maps/documentation/javascript/get-api-key) API keys, select 'Get A Key', create a new Project, then copy-paste the API key into the following files:

index.html

```
<script src="https://maps.googleapis.com/maps/api/js?key=<YOUR API KEY>"></script>
```

index.js

```
var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: "<YOUR API KEY>",
  formatter: null
};
```

## Firebase Database Setup

Before you are able to read or write to the firebase database you must change the default permissions. In the firebase [console](https://firebase.google.com/) navigate to the real time database section, select 'Get Started'. Under the 'Rules' tab copy and paste the following:

```
{
  "rules": {
    "Country":{
    ".read": false,
    ".write": "auth != null"
    },
    "Markers":{
    ".read": true,
    ".write": "auth != null"
    }
  }
}
```

These rules are set such that only the Markers can be read by the client, and firebase's cloud functions can write to the database (or anyone with sufficent credentials).

## Firebase Cloud Functions Setup

For correct routing of POST requets, the URL in the code below should be changed. This URL will either be the URL of the website that will contain the node-locator (recommended) or the default authorized domain (https://<YOUR PROJECT ID>.firebaseapp.com). If you choose to use your website's URL, go to the firebase console, then under 'Hosting' select 'Connect Domain' and follow the required steps.

index.html

```
<form action="https://<YOUR URL>/submit" method="POST" target="votar">
```

## Deploying to Firebase

Once you have the API Keys and Firebase CLI ready you can deploy the app from the working directory using:

> firebase deploy

When the deployment completes successfully you will copy/ paste the **Hosting URL** into your web browser before interacting with the node-locator client.

* Notes:
  * Ensure you have setup RECAPTCHA such that it will function on the your [websites domain](https://developers.google.com/recaptcha/docs/domain_validation). If you are running this application locally set the domain in RECAPTCHA to 127.0.0.1 and use 127.0.0.1:3000 in the browser

## Site Integration

For this application to be pulled into a site or standalone-app the developer will need the following front-end code:

* index.html
* app.js
* markerclusterer.js
* style.css

# Pixyll

[pixyll.com](http://www.pixyll.com)

![Pixyll screenshot](https://cloud.githubusercontent.com/assets/1424573/3847467/134aa236-1e66-11e4-8421-4e8c122118dc.png)

Pixyll is a simple, beautiful theme for Jekyll that emphasizes content rather than aesthetic fluff. It's mobile _first_, fluidly responsive, and delightfully lightweight.

It's pretty minimal, but leverages large type and drastic contrast to make a statement, on all devices.

This Jekyll theme was crafted with <3 by [John Otander](http://johnotander.com)
([@4lpine](https://twitter.com/4lpine)).

中文版 <https://github.com/ee0703/pixyll-zh-cn>.

## Getting Started

If you're completely new to Jekyll, I recommend checking out the documentation at <http://jekyllrb.com> or there's a tutorial by [Smashing Magazine](http://www.smashingmagazine.com/2014/08/01/build-blog-jekyll-github-pages/).

### Installing Jekyll

If you don't have Jekyll already installed, you will need to go ahead and do that.

```
$ gem install jekyll
```

#### Verify your Jekyll version

It's important to also check your version of Jekyll since this project uses Native Sass which
is [only supported by 2.0+](http://jekyllrb.com/news/2014/05/06/jekyll-turns-2-0-0/).

```
$ jekyll -v
# This should be jekyll 2.0.0 or later
```

### Fork, then clone

Fork the repo, and then clone it so you've got the code locally.

### Modify the `_config.yml`

The `_config.yml` located in the root of the Pixyll directory contains all of the configuration details
for the Jekyll site. The defaults are:

```yml
# Site settings
title: Pixyll
email: your_email@example.com
author: John Otander
description: "A simple, beautiful theme for Jekyll that emphasizes content rather than aesthetic fluff."
baseurl: ""
url: "http://pixyll.com"

# Build settings
markdown: kramdown
permalink: pretty
paginate: 3
```

### Jekyll Serve

Then, start the Jekyll Server. I always like to give the `--watch` option so it updates the generated HTML when I make changes.

```
$ jekyll serve --watch
```

Now you can navigate to `localhost:4000` in your browser to see the site.

### Using Github Pages

You can host your Jekyll site for free with Github Pages. [Click here](https://pages.github.com/) for more information.

#### A configuration tweak if you're using a gh-pages sub-folder

In addition to your github-username.github.io repo that maps to the root url, you can serve up sites by using a gh-pages branch for other repos so they're available at github-username.github.io/repo-name.

This will require you to modify the `_config.yml` like so:

```yml
# Site settings
title: Repo Name
email: your_email@example.com
author: John Otander
description: "Repo description"
baseurl: "/repo-name"
url: "http://github-username.github.io"

# Build settings
markdown: kramdown
permalink: pretty
paginate: 3
```

This will ensure that the the correct relative path is constructed for your assets and posts. Also, in order to run the project locally, you will need to specify the blank string for the baseurl: `$ jekyll serve --baseurl ''`.

##### If you don't want the header to link back to the root url

You will also need to tweak the header include `/{{ site.baseurl }}`:

```html
<header class="site-header px2 px-responsive">
  <div class="mt2 wrap">
    <div class="measure">
      <a href="{{ site.url }}/{{ site.baseurl }}">{{ site.title }}</a>
      <nav class="site-nav right">
        {% include navigation.html %}
      </nav>
    </div>
  </div>
</header>
```

A relevant Jekyll Github Issue: <https://github.com/jekyll/jekyll/issues/332>

### Contact Form

The contact form uses <http://formspree.io>. It will require you to fill the form out and submit it once, before going live, to confirm your email.

More setup instructions and advanced options can be found at [http://formspree.io](http://formspree.io/)

### Disqus

To configure Disqus, set up a [Disqus site](https://disqus.com/admin/create/) with the same name as your site. Then, in `_config.yml`, edit the `disqus_shortname` value to enable Disqus.

### Customizing the CSS

All variables can be found in the `_sass/_variables.scss` file, toggle these as you'd like to change the look and feel of Pixyll.

### Page Animation

If you would like to add a [fade-in-down effect](http://daneden.github.io/animate.css/), you can add `animated: true` to your `_config.yml`.

### Put in a Pixyll Plug

If you want to give credit to the Pixyll theme with a link to <http://pixyll.com> or my personal website <http://johnotander.com> somewhere, that'd be awesome. No worries if you don't.

### Enjoy

I hope you enjoy using Pixyll. If you encounter any issues, please feel free to let me know by creating an [issue](https://github.com/johnotander/pixyll/issues). I'd love to help.

## Upgrading Pixyll

Pixyll is always being improved by its users, so sometimes one may need to upgrade.

#### Ensure there's an upstream remote

If `git remote -v` doesn't have an upstream listed, you can do the following to add it:

```
git remote add upstream https://github.com/johnotander/pixyll.git
```

#### Pull in the latest changes

```
git pull upstream master
```

There may be merge conflicts, so be sure to fix the files that git lists if they occur. That's it!

## Thanks to the following

* [BASSCSS](http://basscss.com)
* [Jekyll](http://jekyllrb.com)
* [Refills](http://refills.bourbon.io/)
* [Solarized](http://ethanschoonover.com/solarized)
* [Animate.css](http://daneden.github.io/animate.css/)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
