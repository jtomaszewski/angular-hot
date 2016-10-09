;(function(factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node/CommonJS
    module.exports = factory(this);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    var global=this;
    define('angular-hot', function(){ return factory(global);});
  } else {
    // Browser globals
    this.hotAngular = factory(this);
  }
}(function(global) {
  "use strict";

  var angular = global.angular;

  // utils functions/constants copied from angular 1.5,
  // required for further functions
  var CNTRL_REG = /^(\S+)(\s+as\s+([\w$]+))?$/;
  function identifierForController(controller, ident) {
    if (ident && angular.isString(ident)) return ident;
    if (angular.isString(controller)) {
      var match = CNTRL_REG.exec(controller);
      if (match) return match[3];
    }
  }

  function getHotAngularModule(moduleName) {
    var ngModule = angular.module(moduleName);
    ngModule._hotCache = ngModule._hotCache || {};

    // If a directive has been defined already,
    // then just replace it (by a decorator),
    // instead of a defining a new one
    function registerHotDirective(name, factory) {
      var serviceName = name + "Directive";

      if (ngModule._hotCache[serviceName]) {
        ngModule.config(["$provide", function ($provide) {
          $provide.decorator(serviceName, ["$delegate", "$injector", function ($delegate, $injector) {
            var oldDirective = $delegate[0];
            var newDirective;

            if (angular.isArray(factory) || angular.isFunction(factory)) {
              newDirective = $injector.invoke(factory);
            } else {
              newDirective = factory;
            }

            return [angular.extend(oldDirective, newDirective)];
          }]);
        }]);
      } else {
        ngModule._hotCache[serviceName] = true;
        ngModule.directive(name, factory);
      }

      return hotNgModule;
    }

    // Copied from angular 1.5.8 source and slightly modified to work with hotAngular
    function registerComponent(name, options) {
      var controller = options.controller || function () {};

      function factory($injector) {
        function makeInjectable(fn) {
          if (angular.isFunction(fn) || angular.isArray(fn)) {
            return function (tElement, tAttrs) {
              return $injector.invoke(fn, this, { $element: tElement, $attrs: tAttrs });
            };
          } else {
            return fn;
          }
        }

        var template = !options.template && !options.templateUrl ? '' : options.template;
        var ddo = {
          controller: controller,
          controllerAs: identifierForController(options.controller) || options.controllerAs || '$ctrl',
          template: makeInjectable(template),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude,
          scope: {},
          bindToController: options.bindings || {},
          restrict: 'E',
          require: options.require
        };

        // Copy annotations (starting with $) over to the DDO
        angular.forEach(options, function(val, key) {
          if (key.charAt(0) === '$') ddo[key] = val;
        });

        return ddo;
      }

      // Copy any annotation properties (starting with $) over to the factory and controller constructor functions
      // These could be used by libraries such as the new component router
      angular.forEach(options, function(val, key) {
        if (key.charAt(0) === '$') {
          factory[key] = val;
          // Don't try to copy over annotations to named controller
          if (angular.isFunction(controller)) controller[key] = val;
        }
      });

      factory.$inject = ['$injector'];

      registerHotDirective(name, factory);

      return hotNgModule;
    }

    function registerConfigFn(name, configFn) {
      if (configFn) {
        var fnName = name + "ConfigFn";

        if (!ngModule._hotCache[fnName]) {
          ngModule.config(['$injector', function($injector) {
            $injector.invoke(ngModule._hotCache[fnName]);
          }]);
        }

        ngModule._hotCache[fnName] = configFn;
      } else {
        configFn = name;
        // Backward-compatible support for old `angular.config(fn)` way
        if (console && console.debug) {
          console.debug("`hotAngular.module(...).config(fn)`` is deprecated, because the same configFn could be called multiple times in one application runtime. Instead, use: `hotAngular.module(...).config('fnName', fn)` to prevent it.")
        }
        ngModule.config(configFn);
      }

      return hotNgModule;
    }

    function registerRunFn(name, runFn) {
      if (runFn) {
        var fnName = name + "RunFn";

        if (!ngModule._hotCache[fnName]) {
          ngModule.run(['$injector', function($injector) {
            $injector.invoke(ngModule._hotCache[fnName]);
          }]);
        }

        ngModule._hotCache[fnName] = runFn;
      } else {
        runFn = name;
        // Backward-compatible support for old `angular.run(fn)` way
        if (console && console.debug) {
          console.debug("`hotAngular.module(...).run(fn)`` is deprecated, because the same runFn could be called multiple times in one application runtime. Instead, use: `hotAngular.module(...).run('fnName', fn)` to prevent it.")
        }
        ngModule.run(runFn);
      }

      return hotNgModule;
    }

    function notImplemented(fnName) {
      return function() {
        throw new Error("Unfortunately, " + fnName + " function is not implemented yet in hotAngular. Switch to normal angular.module() instead for this function.");
      };
    }

    function decorateNgModuleProviderFunction(providerType) {
      return function registerNgModuleProvider() {
        ngModule[providerType].apply(ngModule, arguments);

        return hotNgModule;
      };
    }

    var hotNgModule = {
      name: ngModule.name,
      requires: ngModule.requires,

      decorator: notImplemented("decorator"),

      config: registerConfigFn,
      run: registerRunFn,

      // If we define two directives with the same name, angular will issue an error
      // (that there are 2 matching directives for the same element).
      // Thus, let's instead register our own register function,
      // that will replace the directive on subsequent calls using a custom decorator fn.
      directive: registerHotDirective,
      component: registerComponent,

      // If we define a provider/value/service (and so on) twice [with the same name],
      // angular will invoke both functions, but will store only the latest value.
      // Thus, let's just leave it as it is.
      provider: decorateNgModuleProviderFunction("provider"),
      constant: decorateNgModuleProviderFunction("constant"),
      value: decorateNgModuleProviderFunction("value"),
      service: decorateNgModuleProviderFunction("service"),
      factory: decorateNgModuleProviderFunction("factory"),
      controller: decorateNgModuleProviderFunction("controller"),
      filter: decorateNgModuleProviderFunction("filter"),
      animation: decorateNgModuleProviderFunction("animation")
    };

    return hotNgModule;
  }

  function hotModuleFn(moduleName, requires, configFn) {
    if (requires) {
      return angular.module(moduleName, requires, configFn);
    } else {
      return getHotAngularModule(moduleName);
    }
  }

  var hotAngular = {
    module: hotModuleFn
  };

  return hotAngular;
}));
