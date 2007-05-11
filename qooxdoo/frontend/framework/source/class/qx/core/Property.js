/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2007 1&1 Internet AG, Germany, http://www.1and1.org

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/* ************************************************************************

************************************************************************ */

/**
 * Internal class for handling of dynamic properties. Should only be used
 * through the methods provided by {@link qx.Class}.
 *
 * For a complete documentation of properties take a
 * look at http://qooxdoo.org/documentation/developer_manual/properties.
 *
 *
 * *Normal properties*
 *
 * The <code>properties</code> key in the class definition map of {@link qx.Class#define}
 * is used to generate the properties.
 *
 * Valid keys of a property definition are:
 *
 * <table>
 *   <tr><th>Name</th><th>Type</th><th>Description</th></tr>
 *   <tr><th>check</th><td>Array, String, Function</td><td>
 *     The check is used to validate the incoming value of a property. The check can be:
 *     <ul>
 *       <li>a custom check function. The function takes the incoming value as a parameter and must
 *           return a boolean value to indicate whether the values is valid.
 *       </li>
 *       <li>inline check code as a string e.g. <code>"value &gt; 0 && value &lt; 100"</code></li>
 *       <li>a class name e.g. <code>qx.ui.form.Button</code></li>
 *       <li>a name of an interface the value must implement, e.g. <code>qx.application.IAplpication</code></li>
 *       <li>an array of all valid values</li>
 *       <li>one of the predefined checks: Boolean, String, Number, Integer, Float, Double,
 *           Object, Array, Map, Class, Mixin, Interface, Theme, Error, RegExp, Function,
 *           Date, Node, Element, Document, Window, Event
 *       </li>
 *     <ul>
 *   </td></tr>
 *   <tr><th>init</th><td>var</td><td>
 *     Sets the default/initial value of the property. If no property value is set or the property
 *     gets reset, the getter will return the <code>init</code> value.
 *   </td></tr>
 *   <tr><th>apply</th><td>String</td><td>
 *     On change of the property value the method of the specified name will be called. The signature of
 *     the method is <code>function(newValue, oldValue)</code>.
 *   </td></tr>
 *   <tr><th>event</th><td>String</td><td>
 *     On change of the property value an event with the given name will be dispached. The event type is
 *     {@link qx.event.type.ChangeEvent}.
 *   </td></tr>
 *   <tr><th>themeable</th><td>Boolean</td><td>
 *     Whether this property can be set using themes.
 *   </td></tr>
 *   <tr><th>inheritable</th><td>Boolean</td><td>
 *     Whether the property value should be inheritable. If the property does not have a user defined or an
 *     init value, the property will try to get the value from the parent of the current object.
 *   </td></tr>
 *   <tr><th>nullable</th><td>Boolean</td><td>
 *     Whether <code>null</code> is an allowed value of the property. This is complemental to the check
 *     defined using the <code>check</code> key.
 *   </td></tr>
 *   <tr><th>refine</th><td>Boolean</td><td>
 *     Whether the property definition is a refinemnet of a property in one of the super classes of the class.
 *     Only the <code>init</code> value can be changed using refine.
 *   </td></tr>
 *   <tr><th>transform</th><td>String</td><td>
 *     On setting of the property value the method of the specified name will
 *     be called. The signature of the method is <code>function(value)</code>.
 *     The parameter <code>value</code> is the value passed to the setter.
 *     The function must return the modified or unmodified value.
 *     Transformation occurs before the check function, so both may be
 *     specified if desired.  Alternatively, the transform function may throw
 *     an error if the value passed to it is invalid.
 *   </td></tr>
 * </table>
 *
 *
 * *Property groups*
 *
 * Property groups are defined in a similar way but support a different set of keys:
 *
 * <table>
 *   <tr><th>Name</th><th>Type</th><th>Description</th></tr>
 *   <tr><th>group</th><td>String[]</td><td>
 *     A list of property names which should be set using the propery group.
 *   </td></tr>
 *   <tr><th>mode</th><td>String</td><td>
 *     If mode is set to <code>"shorthand"</code>, the properties can be set using a CSS like shorthand mode.
 *   </td></tr>
 *   <tr><th>themeable</th><td>Boolean</td><td>
 *     Whether this property can be set using themes.
 *   </td></tr>
 * </table>
 *
 * @internal
 */
qx.Class.define("qx.core.Property",
{
  statics :
  {
    /**
     * Built-in checks
     * The keys could be used in the check of the properties
     *
     * @internal
     */
    __checks :
    {
      "Boolean"   : 'typeof value === "boolean"',
      "String"    : 'typeof value === "string"',
      "NonEmptyString" : 'typeof value === "string" && value.length > 0',

      "Number"    : '!isNaN(value)',
      "Integer"   : '!isNaN(value) && value%1 == 0',
      "Float"     : '!isNaN(value)',
      "Double"    : '!isNaN(value)',

      "Error"     : 'value instanceof Error',
      "RegExp"    : 'value instanceof RegExp',

      "Object"    : 'value !== null && typeof value === "object"',
      "Array"     : 'value instanceof Array',
      "Map"       : 'value !== null && typeof value === "object" && !(value instanceof Array) && !(value instanceof qx.core.Object)',

      "Function"  : 'value instanceof Function',
      "Date"      : 'value instanceof Date',
      "Node"      : 'value != null && value.nodeType !== undefined',
      "Element"   : 'value != null && value.nodeType === 1',
      "Document"  : 'value != null && value.nodeType === 9',
      "Window"    : 'value != null && window.document',
      "Event"     : 'value != null && value.type !== undefined',

      "Class"     : 'value != null && value.$$type === "Class"',
      "Mixin"     : 'value != null && value.$$type === "Mixin"',
      "Interface" : 'value != null && value.$$type === "Interface"',
      "Theme"     : 'value != null && value.$$type === "Theme"',

      "Color"     : 'typeof value === "string" && qx.util.ColorUtil.isValid(value)',
      "Border"    : 'value != null && (qx.manager.object.BorderManager.getInstance().isDynamic(value) || value instanceof qx.renderer.border.Border)',
      "Font"      : 'value != null && (qx.manager.object.FontManager.getInstance().isDynamic(value) || value instanceof qx.renderer.font.Font)'
    },


    /**
     * Contains types from {@link #__checks} list which need to be disposed
     *
     * @internal
     */
    __dispose :
    {
      "Object"    : true,
      "Array"     : true,
      "Map"       : true,
      "Function"  : true,
      "Date"      : true,
      "Node"      : true,
      "Element"   : true,
      "Document"  : true,
      "Window"    : true,
      "Event"     : true,
      "Class"     : true,
      "Mixin"     : true,
      "Interface" : true,
      "Theme"     : true
    },


    /**
     * Inherit value, used to override defaults etc. to force inheritance
     * even if property value is not undefined (through multi-values)
     *
     * @internal
     */
    $$inherit : "inherit",


    /**
     * Undefined value, used to unstyle a property
     *
     * @internal
     */
    $$undefined : "undefined",


    /**
     * Used in build version for storage names
     */
    $$idcounter : 0,


    /**
     * Caching field names for each property created
     *
     * @internal
     */
    $$store :
    {
      user    : {},
      theme   : {},
      inherit : {},
      init    : {},
      useinit : {}
    },


    /**
     * Caching function names for each property created
     *
     * @internal
     */
    $$method :
    {
      get     : {},
      set     : {},
      reset   : {},
      init    : {},
      refresh : {},
      style   : {},
      unstyle : {}
    },


    /**
     * Supported keys for property defintions
     *
     * @internal
     */
    $$allowedKeys :
    {
      name        : "string",   // String
      inheritable : "boolean",  // Boolean
      nullable    : "boolean",  // Boolean
      themeable   : "boolean",  // Boolean
      refine      : "boolean",  // Boolean
      init        : null,       // var
      apply       : "string",   // String
      event       : "string",   // String
      check       : null,       // Array, String, Function
      transform   : "string"    // String
    },

    $$allowedGroupKeys :
    {
      name        : "string",   // String
      group       : "object",   // Array
      mode        : "string",   // String
      themeable   : "boolean"   // Boolean
    },


    /** Contains names of inheritable properties, filled by {@link qx.Class.define} */
    $$inheritable : {},


    /**
     * Refreshes widget whose parent has changed (including the children)
     *
     * @type static
     * @internal
     * @param widget {qx.core.ui.Widget} the widget
     * @return {void}
     */
    refresh : function(widget)
    {
      var parent = widget.getParent();

      if (parent)
      {
        var clazz = widget.constructor;
        var inherit = this.$$store.inherit;
        var refresh = this.$$method.refresh;
        var properties;

        if (qx.core.Variant.isSet("qx.debug", "on"))
        {
          if (qx.core.Setting.get("qx.propertyDebugLevel") > 1) {
            widget.debug("Update widget: " + widget);
          }
        }

        while(clazz)
        {
          properties = clazz.$$properties;

          if (properties)
          {
            for (var name in this.$$inheritable)
            {
              if (properties[name])
              {
                if (qx.core.Variant.isSet("qx.debug", "on"))
                {
                  if (qx.core.Setting.get("qx.propertyDebugLevel") > 2) {
                    widget.debug("Updating property: " + name + " to '" + parent[inherit[name]] + "'");
                  }
                }

                widget[refresh[name]](parent[inherit[name]]);
              }
            }
          }

          clazz = clazz.superclass;
        }
      }
    },


    /**
     * Attach properties to class prototype
     *
     * @type static
     * @internal
     * @param clazz {Class} Class to attach properties to
     * @return {void}
     */
    attach : function(clazz)
    {
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (qx.core.Setting.get("qx.propertyDebugLevel") > 1) {
          console.debug("Generating property wrappers: " + name);
        }
      }

      var properties = clazz.$$properties;

      if (properties)
      {
        for (var name in properties) {
          this.attachMethods(clazz, name, properties[name]);
        }
      }

      clazz.$$propertiesAttached = true;
    },


    /**
     * Attach one property to class
     *
     * @type static
     * @internal
     * @param clazz {Class} Class to attach properties to
     * @param name {String} Name of property
     * @param config {Map} Configuration map of property
     * @return {void}
     */
    attachMethods : function(clazz, name, config)
    {
      var prefix, postfix;

      // Filter old properties and groups
      if (!config._legacy && !config._fast && !config._cached)
      {
        if (name.indexOf("__") == 0)
        {
          prefix = "__";
          postfix = qx.lang.String.toFirstUp(name.substring(2));
        }
        else if (name.indexOf("_") == 0)
        {
          prefix = "_";
          postfix = qx.lang.String.toFirstUp(name.substring(1));
        }
        else
        {
          prefix = "";
          postfix = qx.lang.String.toFirstUp(name);
        }

        // Fill dispose value
        if (config.dispose === undefined && typeof config.check === "string") {
          config.dispose = this.__dispose[config.check] || qx.Class.isDefined(config.check);
        }

        // Attach methods
        config.group ? this.__attachGroupMethods(clazz, config, prefix, postfix) : this.__attachPropertyMethods(clazz, config, prefix, postfix);
      }
    },


    /**
     * Attach group methods
     *
     * @type static
     * @internal
     * @param clazz {Class} Class to attach properties to
     * @param config {Map} Property configuration
     * @return {void}
     */
    __attachGroupMethods : function(clazz, config, prefix, postfix)
    {
      var members = clazz.prototype;
      var name = config.name;
      var themeable = config.themeable === true;

      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (qx.core.Setting.get("qx.propertyDebugLevel") > 1) {
          console.debug("Generating property group: " + name);
        }
      }

      var setter = [];
      var resetter = [];

      if (themeable)
      {
        var styler = [];
        var unstyler = [];
      }

      var argHandler = "var a=arguments[0] instanceof Array?arguments[0]:arguments;";

      setter.push(argHandler);
      resetter.push(argHandler);

      if (themeable)
      {
        styler.push(argHandler);
        unstyler.push(argHandler);
      }

      if (config.mode == "shorthand")
      {
        var shorthand = "a=qx.lang.Array.fromShortHand(qx.lang.Array.fromArguments(a));";
        setter.push(shorthand);

        if (themeable) {
          styler.push(shorthand);
        }
      }

      for (var i=0, a=config.group, l=a.length; i<l; i++)
      {
        if (qx.core.Variant.isSet("qx.debug", "on"))
        {
          if (!this.$$method.set[a[i]]||!this.$$method.reset[a[i]]) {
            throw new Error("Cannot create property group '" + name + "' including non-existing property '" + a[i] + "'!");
          }
        }

        setter.push("this.", this.$$method.set[a[i]], "(a[", i, "]);");
        resetter.push("this.", this.$$method.reset[a[i]], "(a[", i, "]);");

        if (themeable)
        {
          styler.push("this.", this.$$method.style[a[i]], "(a[", i, "]);");
          unstyler.push("this.", this.$$method.unstyle[a[i]], "(a[", i, "]);");
        }
      }

      // Attach setter
      this.$$method.set[name] = prefix + "set" + postfix;
      members[this.$$method.set[name]] = new Function(setter.join(""));

      // Attach resetter
      this.$$method.reset[name] = prefix + "reset" + postfix;
      members[this.$$method.reset[name]] = new Function(resetter.join(""));

      if (themeable)
      {
        // Attach styler
        this.$$method.style[name] = prefix + "style" + postfix;
        members[this.$$method.style[name]] = new Function(styler.join(""));

        // Attach unstyler
        this.$$method.unstyle[name] = prefix + "unstyle" + postfix;
        members[this.$$method.unstyle[name]] = new Function(unstyler.join(""));
      }
    },


    /**
     * Attach property methods
     *
     * @type static
     * @internal
     * @param clazz {Class} Class to attach properties to
     * @param config {Map} Property configuration
     * @return {void}
     */
    __attachPropertyMethods : function(clazz, config, prefix, postfix)
    {
      var members = clazz.prototype;
      var name = config.name;

      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (qx.core.Setting.get("qx.propertyDebugLevel") > 1) {
          console.debug("Generating property wrappers: " + name);
        }
      }

      var method = this.$$method;
      var store = this.$$store;

      store.user[name] = "__user$" + name;
      store.theme[name] = "__theme$" + name;
      store.init[name] = "__init$" + name;
      store.inherit[name] = "__inherit$" + name;
      store.useinit[name] = "__useinit$" + name;

      method.get[name] = prefix + "get" + postfix;
      members[method.get[name]] = function() {
        return qx.core.Property.executeOptimizedGetter(this, clazz, name, "get");
      }

      method.set[name] = prefix + "set" + postfix;
      members[method.set[name]] = function(value) {
        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "set", arguments);
      }

      method.reset[name] = prefix + "reset" + postfix;
      members[method.reset[name]] = function() {
        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "reset");
      }

      method.init[name] = prefix + "init" + postfix;
      members[method.init[name]] = function(value) {
        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "init", arguments);
      }

      if (config.inheritable === true)
      {
        method.refresh[name] = prefix + "refresh" + postfix;
        members[method.refresh[name]] = function(value) {
          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "refresh", arguments);
        }
      }

      if (config.themeable === true)
      {
        method.style[name] = prefix + "style" + postfix;
        members[method.style[name]] = function(value) {
          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "style", arguments);
        }

        method.unstyle[name] = prefix + "unstyle" + postfix;
        members[method.unstyle[name]] = function(value) {
          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "unstyle", arguments);
        }
      }

      if (config.check === "Boolean")
      {
        members[prefix + "toggle" + postfix] = new Function("return this." + method.set[name] + "(!this." + method.get[name] + "())");
        members[prefix + "is" + postfix] = new Function("return this." + method.get[name] + "()");
      }
    },


    sumNumber : 0,
    sumGen : 0,
    sumUnwrap : 0,

    /**
     * Compiles a string builder object to a function, executes the function and
     * returns the return value.
     *
     * @type static
     * @internal
     * @param instance {Object} Instance which have called the original method
     * @param members {Object} Prototype members map where the new function should be stored
     * @param name {String} Name of the property
     * @param variant {String} Function variant e.g. get, set, reset, ...
     * @param code {qx.util.StringBuilder} string builder instance which contains the code
     * @param value {var ? null} Optional value to call function with
     * @return {var} Return value of the generated function
     */
    __unwrapFunctionFromCode : function(instance, members, name, variant, code, args)
    {
      var store = this.$$method[variant][name];

      // Output generate code
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (qx.core.Setting.get("qx.propertyDebugLevel") > 1) {
          console.debug("Code[" + this.$$method[variant][name] + "]: " + code.join(""));
        }

        // Overriding temporary wrapper
        try{
          var s = new Date;
          members[store] = new Function("value", code.join(""));
          // eval("members[store] = function " + instance.classname.replace(/\./g, "_") + "$" + store + "(value) { " + code.join("") + "}");
          this.sumUnwrap += new Date - s;
        } catch(ex) {
          alert("Malformed generated code to unwrap method: " + this.$$method[variant][name] + "\n" + code.join(""));
        }
      }
      else
      {
        var s = new Date;
        members[store] = new Function("value", code.join(""));
        // eval("members[store] = function " + instance.classname.replace(/\./g, "_") + "$" + store + "(value) { " + code.join("") + "}");
        this.sumUnwrap += new Date - s;
      }

      this.sumNumber++;

      // Executing new function
      if (args === undefined) {
        return instance[store]();
      } else if (qx.core.Variant.isSet("qx.debug", "on")) {
        return instance[store].apply(instance, args);
      } else {
        return instance[store](args[0]);
      }
    },


    /**
     * Generates the optimized getter
     * Supported variants: get
     *
     * @type static
     * @internal
     * @param instance {Object} the instance which calls the method
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @return {var} Execute return value of apply generated function, generally the incoming value
     */
    executeOptimizedGetter : function(instance, clazz, name, variant)
    {
      var start = new Date;

      var config = clazz.$$properties[name];
      var members = clazz.prototype;
      var code = [];

      if (config.inheritable)
      {
        code.push('if(this.', this.$$store.inherit[name], '!==undefined)');
        code.push('return this.', this.$$store.inherit[name], ';');
        code.push('else ');
      }

      code.push('if(this.', this.$$store.user[name], '!==undefined)');
      code.push('return this.', this.$$store.user[name], ';');

      if (config.themeable)
      {
        code.push('else if(this.', this.$$store.theme[name], '!==undefined)');
        code.push('return this.', this.$$store.theme[name], ';');
      }

      code.push('else ');

      if (config.init !== undefined) {
        code.push('return this.', this.$$store.init[name], ';');
      } else if (config.inheritable || config.nullable) {
        code.push('return null;');
      } else {
        code.push('throw new Error("Property ', name, ' of an instance of ', clazz.classname, ' is not (yet) ready!");');
      }

      this.sumGen += new Date - start;

      return this.__unwrapFunctionFromCode(instance, members, name, variant, code);
    },


    __errors :
    {
      0 : 'Could not change or apply init value after constructing phase!',
      1 : 'Requires exactly one argument!',
      2 : 'Undefined value is not allowed!',
      3 : 'Does not allow any arguments!',
      4 : 'Null value is not allowed!',
      5 : 'Is invalid!'
    },

    error : function(obj, id, property, variant)
    {
      var classname = obj.constructor.classname;
      var msg = "Error in property " + property + " of class " + classname + " in method " + this.$$method[variant][property] + ": ";
      throw new Error(msg + (this.__errors[id] || "Unknown reason: " + id));
    },


    /**
     * Generates the optimized setter
     * Supported variants: set, reset, init, refresh, style, unstyle
     *
     * @type static
     * @internal
     * @param instance {Object} the instance which calls the method
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param value {var ? null} Optional value to send to newly created method
     * @return {var} Execute return value of apply generated function, generally the incoming value
     */
    executeOptimizedSetter : function(instance, clazz, name, variant, args)
    {
      var start = new Date;

      var config = clazz.$$properties[name];
      var members = clazz.prototype;
      var value = args ? args[0] : undefined;
      var code = [];

      var localInit = variant === "init" && config.init === undefined;
      var incomingValue = variant === "set" || variant === "style" || localInit;
      var resetValue = variant === "reset" || variant === "unstyle";
      var hasCallback = config.apply || config.event || config.inheritable;

      if (variant === "style" || variant === "unstyle") {
        var store = this.$$store.theme[name];
      } else if (variant === "init") {
        var store = this.$$store.init[name];
      } else {
        var store = this.$$store.user[name];
      }





      // [1] INTEGRATE ERROR HELPER METHOD

      code.push('var prop=qx.core.Property;');








      // [2] PRE CONDITIONS

      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (variant === "init") {
          code.push('if(this.$$initialized)prop.error(this,0,"'+name+'","'+variant+'");');
        }

        if (variant === "refresh")
        {
          // do nothing
          // refresh() is internal => no arguments test
          // also note that refresh() supports "undefined" values
        }
        else if (incomingValue)
        {
          // Check argument length
          code.push('if(arguments.length!==1)prop.error(this,1,"'+name+'","'+variant+'");');

          // Undefined check
          code.push('if(value===undefined)prop.error(this,2,"'+name+'","'+variant+'");');
        }
        else
        {
          // Check argument length
          code.push('if(arguments.length!==0)prop.error(this,3,"'+name+'","'+variant+'");');
        }
      }
      else
      {
        // Undefined check
        if (variant === "set") {
          code.push('if(value===undefined)prop.error(this,2,"'+name+'","'+variant+'");');
        }
      }





      // [3] PREPROCESSING INCOMING VALUE

      if (incomingValue)
      {
        // Allow to unstyle themeable properties by explicit "undefined" string value
        // Note: Normalization must occour after the undefined check above.
        if (variant === "style") {
          code.push('if(value===prop.$$undefined)value=undefined;');
        }

        // Call user-provided transform method, if one is provided.  Transform
        // method should either throw an error or return the new value.
        if (config.transform) {
          code.push('value=this.', config.transform, '(value);');
        }
      }






      // [4] COMPARING (LOCAL) NEW AND OLD VALUE

      // Old/new comparision
      if (incomingValue) {
        code.push('if(this.', store, '===value)return value;');
      } else if (resetValue) {
        code.push('if(this.', store, '===undefined)return;');
      }






      // [5] CHECKING VALUE

      // Enable checks in debugging mode or then generating the setter

      if (incomingValue && (qx.core.Variant.isSet("qx.debug", "on") || variant === "set"))
      {
        // Null check
        if (!config.nullable) {
          code.push('if(value===null)prop.error(this,4,"'+name+'","'+variant+'");');
        }

        // Processing check definition
        if (config.check !== undefined)
        {
          if (config.nullable)
          {
            if (variant === "style") {
              code.push('if(value!=null)'); // allow both undefined and null
            } else {
              code.push('if(value!==null)') // allow null
            }
          }
          else if (variant === "style")
          {
            code.push('if(value!==undefined)'); // allow undefined
          }

          // Inheritable properties always accept "inherit" as value
          if (config.inheritable) {
            code.push('if(value!==prop.$$inherit)');
          }

          code.push('if(');

          if (this.__checks[config.check] !== undefined)
          {
            code.push('!(', this.__checks[config.check], ')');
          }
          else if (qx.Class.isDefined(config.check))
          {
            code.push('!(value instanceof ', config.check, ')');
          }
          else if (qx.Interface.isDefined(config.check))
          {
            code.push('!(value && qx.Class.hasInterface(value.constructor, ', config.check, '))');
          }
          else if (typeof config.check === "function")
          {
            code.push('!', clazz.classname, '.$$properties.', name);
            code.push('.check.call(this, value)');
          }
          else if (typeof config.check === "string")
          {
            code.push('!(', config.check, ')');
          }
          else if (config.check instanceof Array)
          {
            // reconfigure for faster access trough map usage
            config.checkMap = qx.lang.Object.fromArray(config.check);

            code.push(clazz.classname, '.$$properties.', name);
            code.push('.checkMap[value]===undefined');
          }
          else
          {
            throw new Error("Could not add check to property " + name + " of class " + clazz.classname);
          }

          code.push(')prop.error(this,5,"'+name+'","'+variant+'");');
        }
      }







      // [6] READING OLD VALUE

      if (hasCallback)
      {
        if (config.inheritable)
        {
          code.push('var old=this.', this.$$store.inherit[name], ';');
        }
        else
        {
          // read user value
          code.push('if(this.', this.$$store.user[name], '!==undefined)var old=this.', this.$$store.user[name], ';else ');

          // read theme value
          if (config.themeable) {
            code.push('if(this.', this.$$store.theme[name], '!==undefined)old=this.', this.$$store.theme[name], ';else ');
          }

          // read init value
          code.push('if(this.', this.$$store.useinit[name], ')old=this.', this.$$store.init[name], ';');
        }
      }








      // [7] STORING INCOMING VALUE

      if (incomingValue)
      {
        // Store value
        code.push('this.', store, '=value;');
      }
      else if (resetValue)
      {
        // Remove key
        code.push('delete this.', store, ';');
      }






      // [8] GENERATING COMPUTED VALUE

      // In variant "set" the value is always the highest priorist value and
      // could not be undefined. This way we are sure we can use this value and don't
      // need a complex logic to find the usable value.

      if (variant === "set")
      {
        if (hasCallback)
        {
          // Create computed value
          // For the first shot identical to user value in set()
          // However it is possible that the computed value gets
          // translated later through inheritance.
          if (config.inheritable) {
            code.push('var computed=value,useinit=false;');
          }

          // We don't need the computed value at all for
          // setters of properties which are not inheritable
          // and do not define a "apply" or "event" key.
          else {
            code.push('var computed=value;');
          }
        }
      }
      else
      {
        code.push('var computed,useinit=false;');

        // Try to use user value when available
        // Hint: Always undefined in reset variant
        if (variant !== "reset")
        {
          code.push('if(this.', this.$$store.user[name], '!==undefined)');
          code.push('computed=this.', this.$$store.user[name], ';else ');
        }

        // Try to use themeable value when available
        if (config.themeable === true && variant !== "unstyle")
        {
          code.push('if(this.', this.$$store.theme[name], '!==undefined)');
          code.push('computed=this.', this.$$store.theme[name], ';else ');
        }

        // Try to use initial value when available
        // Hint: This may also be available even if not defined at declaration time
        // because of the possibility to set the init value of properties
        // without init value at construction time (for complex values like arrays etc.)
        code.push('{computed=this.', this.$$store.init[name], ';useinit=true;}');
      }







      // [9] RESPECTING INHERITANCE

      // The value which comes with refresh() already has the needed computed parent value
      // Note: The computed (inherited) value of the parent could never be "inherit" itself.

      if (config.inheritable)
      {
        code.push('if(computed===undefined||computed===prop.$$inherit)');

        if (variant === "refresh") {
          code.push('computed=value;');
        } else {
          code.push('{var pa=this.getParent();if(pa)computed=pa.', this.$$store.inherit[name], ';}');
        }

        code.push('if(computed===undefined||computed===prop.$$inherit){');
        code.push('computed=this.', this.$$store.init[name], ';');
        code.push('useinit=computed!==prop.$$inherit;');
        code.push('}else{useinit=false;}')
      }









      // [10] SYNCING WITH OBJECT

      // All set methods normally do not allow "undefined" values.
      // But there is one excpetion. Inheritable properties can translate
      // "inherit" to "undefined" as seen above.
      if (variant === "set" && !config.inheritable)
      {
        code.push('delete this.', this.$$store.useinit[name], ';');
      }
      else
      {
        code.push('if(useinit)this.', this.$$store.useinit[name], '=true;');
        code.push('else delete this.', this.$$store.useinit[name], ';');
      }






      // [11] NORMALIZATION AND COMPARISON

      if (hasCallback)
      {
        // Not for inherited properties, because they need be able to differ
        // between null and undefined.
        if (!config.inheritable)
        {
          // Properties which are not inheritable have no possiblity to get
          // undefined at this position. (Hint: set() only allows non undefined values)
          if (variant!=="set") {
            code.push('if(computed===undefined)computed=null;');
          }

          code.push('if(old===undefined)old=null;');
        }

        // Compare old/new computed value
        // We can reduce the overhead here, if the property is not
        // inheritable and has no event or apply method assigned
        code.push('if(old===computed)return value;');

        // Store inherited value of inheritable properties
        if (config.inheritable)
        {
          // Normalize "inherit" to undefined and delete inherited value
          code.push('if(computed===prop.$$inherit){computed=undefined;delete this.', this.$$store.inherit[name], ';}');

          // Only delete inherited value
          code.push('else if(computed===undefined)delete this.', this.$$store.inherit[name], ';');

          // Store inherited value
          code.push('else this.', this.$$store.inherit[name], '=computed;');

          // Protect against normalization
          code.push('var inherited=computed;');

          // After storage finally normalize computed and old value
          code.push('if(computed===undefined)computed=null;');
          code.push('if(old===undefined)old=null;');
        }
      }








      // [12] NOTIFYING DEPENDEND OBJECTS

      if (hasCallback)
      {
        // Execute user configured setter
        if (config.apply) {
          code.push('this.', config.apply, '(computed, old);');
        }

        // Fire event
        if (config.event)
        {
          code.push('if(this.hasEventListeners("', config.event, '"))');
          code.push('this.dispatchEvent(new qx.event.type.ChangeEvent("', config.event, '", computed, old), true);');
        }

        // Refresh children
        // Require the parent/children interface
        if (config.inheritable)
        {
          code.push('var a=this.getChildren();if(a)for(var i=0,l=a.length;i<l;i++){');
          code.push('if(a[i].', this.$$method.refresh[name], ')a[i].', this.$$method.refresh[name], '(inherited);');
          code.push('}');
        }
      }






      // [13] RETURNING WITH ORIGINAL INCOMING VALUE

      // Return value
      if (incomingValue) {
        code.push('return value;');
      }





      this.sumGen += new Date - start;
      return this.__unwrapFunctionFromCode(instance, members, name, variant, code, args);
    }
  },





  /*
  *****************************************************************************
     SETTINGS
  *****************************************************************************
  */

  settings : {
    "qx.propertyDebugLevel" : 0
  }
});
