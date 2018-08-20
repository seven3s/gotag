#!/usr/bin/env node
/**
 * @file:      命令行将dist压缩目录通过打tag的方式上线😂
 * @author:    花夏(liubiao@itoxs.com)
 * @version:   V0.0.1
 * @date:      2018-08-13 16:30:23
 */

'use strict';
const path = require('path');
const fs = require('fs');
var gotag = require('./lib/gotag.js');
var packageJson = path.join(process.cwd(), 'package.json');
var config = JSON.parse(fs.readFileSync(packageJson).toString());
var distTag = config.disTag || {};
gotag(distTag);
