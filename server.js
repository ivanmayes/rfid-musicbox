
'use strict'

const express = require('express')
const app     = express()
const msg     = require('gulp-messenger')
const chalk   = require('chalk')
const _       = require('lodash')
const io = require('socket.io');

app.set('port', (process.env.PORT || 3000));

// lets startup this puppy
let server = app.listen(app.get('port'), () => {
  msg.log('\n')
  console.log(chalk.cyan('Server Started ' + new Date()));
  msg.log('\n')
  const serverInfo = chalk.yellow(`http://localhost:${app.get('port')}`);
  msg.success('=', _.pad(`Application Running On: ${serverInfo}`, 80), '=');

  // Configure socket connection
  let socket = require('./lib/io.js')(io, app, server);
})
