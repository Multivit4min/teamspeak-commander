There are currently **5** different types of arguments


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