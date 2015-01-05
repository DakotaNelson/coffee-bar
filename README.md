coffee-bar
==========

Simple Node.js app to assist with running a coffee bar.

#### Local use:

Install:
```
npm install
```

Run:
```
mongod --dbpath=./mongo     (or whatever your path is)
foreman start
```

#### Todo:
 * Tests!
 * ~~Show last ten transactions.~~
 * Turn customers into a class/object to make the code cleaner.
 * Show past five rejected Venmo transactions (i.e. where a matching Venmo username couldn't be found)
