There are currently **5** different types of arguments

## Abstract Argument
--------------------
All Argument types have following methods:

### **#name(name, display?)**
this will set the name of the argument, the name defines how the parameter gets set onto the argument object in the exec handler


### **#optional(fallback?, displayDefault?)**
defines an argument as optional if a parameter gets not parsed successfully then it will try to parse the next argument if available or omit it\
the first optional parameter `fallback` sets a default value if no value has been found
the second optional parameter `displayDefault` defines if the default value should get displayed when using the getManual method

### **#hasDefault()**
returns true when a default value for an optional argument has been provided (see Argument#optional())

### **getDefault()**
returns the default value if one has been set (see Argument#optional())

### **isOptional()**
returns true when this argument is optional (see Argument#optional())

### **getName()**
retrieves the name which has been set for this Argument (see Argument#name())



## StringArgument
-----------------

**StringArgument** only expects a simple string without a space

Methods: https://multivit4min.github.io/teamspeak-commander/classes/stringargument.html


## RestArgument
---------------

**RestArgument** can only be the last argument of a command the only difference to the String Argument is that it can have spaces in it

Methods: https://multivit4min.github.io/teamspeak-commander/classes/restargument.html


## NumberArgumnet
-----------------

**NumberArgument** expects the input to be a number and parses it as one

Methods: https://multivit4min.github.io/teamspeak-commander/classes/numberargument.html


## ClientArgument
----------------

**ClientArgument** tries to parse a TeamSpeak UID or a TeamSpeak Client URL
Valid inputs look like following:
- `NF61yPIiDvYuOJ/Bbeod84bw6dE=`
- `[URL=client://1/NF61yPIiDvYuOJ/Bbeod84bw6dE=~Multivitamin]Multivitamin[/URL]`

Methods: https://multivit4min.github.io/teamspeak-commander/classes/clientargument.html


## GroupArgument
----------------

**GroupArgument** can create an **or** / **and** 

Methods: https://multivit4min.github.io/teamspeak-commander/classes/groupargument.html