# angular-hot

Hot reload your angular services/directives/factories/etc without unnecessary pain.

# Usage

1) Add the `angular-hot.js` file into your grunt/gulp/brunch vendors files list, or require it with require.js, webpack or whatever thing you're using (it should support all of them: CommonJS, AMD, Browser globals).

2) Replace all your `angular.module(...)` with `hotAngular.module(...)` .

3) If you have any `.run(fn)` or `.config(fn)` callback, replace them to `.run(fnStringKey, fn)` and `.config(fnStringKey, fn)`. It can be any string key, just remember to keep them unique (1 unique key for each unique function).

4) Done. Check out [HotApp.js](https://github.com/jtomaszewski/hot-app), to see how to make it work with webpack hot reload!

# Proof of Concept

```js
// 1) Let's define some simple angular1 app
var app = hotAngular.module('app');

app.service('CurrentDateService', function() {
  var currentDate = new Date();

  return {
    currentDate: currentDate
  };
});

app.directive('currentDateAlert', function(CurrentDateService) {
  return {
    template: '<h1>{{currentDate}}</h1>',
    scope: true,
    link: function (scope) {
      scope.currentDate = CurrentDateService.currentDate;
    }
  };
});

// NOTE: Notice the different syntax here a bit (it's only for .config and .run functions)
app.run('currentDateConsoleLog', function(CurrentDateService) {
  console.log('Current date is now equal to: ', CurrentDateService.currentDate);
});

// 2) Run the app
document.body.innerHTML = '<current-date-alert></current-date-alert>';
angular.bootstrap(document.body, ['app']);
// >> Console: Current date is now equal to: Sun Oct 09 2016 16:48:46 GMT+0200 (CEST)
// >> Also, document's body shows the current-date-alert element with date in h1 tag.

// 3) Now, let's redefine some stuff in our app
var app = hotAngular.module('app');

app.service('CurrentDateService', function() {
  var currentDate = new Date();
  currentDate.setYear(1920);

  return {
    currentDate: currentDate
  };
});

app.directive('currentDateAlert', function(CurrentDateService) {
  return {
    template: '<marquee>{{currentDate}}</marquee>',
    scope: true,
    link: function (scope) {
      scope.currentDate = CurrentDateService.currentDate;
    }
  };
});

app.run('currentDateConsoleLog', function(CurrentDateService) {
  console.log('Welcome back in 1920. Current date is now equal to: ', CurrentDateService.currentDate);
});

// Destroy the previous app, to avoid memory leaks
angular.element(document.body).injector().get('$rootScope').$destroy();

// Launch the app again
document.body.innerHTML = '<current-date-alert></current-date-alert>';
angular.bootstrap(document.body, ['app']);
// >> Console: Welcome back in 1920. Current date is now equal to: Sun Oct 09 1920 16:48:46 GMT+0200 (CEST)
// >> Also, document's body shows the current-date-alert element with date in marquee tag.
//
// Vuala! It works. The directive, service and .run callback function have been successfully replaced.
```

# License

MIT

# Contribution, Bug reports, Questions

Just use github issues or pull requests! ;)
