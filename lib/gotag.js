#!/usr/bin/env node
'use strict';
const fs = require('hexo-fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const spawn = require('hexo-util/lib/spawn');
const util = require('./util.js');
module.exports = function(args) {
    if (!args.type || !args.dir) {
        let help = '';
        help += 'You have to configure the deployment settings in package.json first!\n\n';
        help += '{\n';
        help += '  "disTag": {\n';
        help += '    "type": "git",\n';
        help += '    "repo": <repository url>\n';
        help += '    "dir": [directory]\n';
        help += '  }\n';
        help += '}';
        console.log(chalk.yellow(help));
        return;
    }
    let baseDir = path.join(process.cwd(), '');
    // 需要打tag的文件夹名称
    let dirName = args.dir;
    if (!dirName) {
        dirName = '/**/*';
    }
    let deployDir = '.deploy_git';
    deployDir = path.join(baseDir, deployDir);
    let publicDir = path.join(baseDir, dirName);
    util.init(deployDir);
    // 判断打包目录是否存在
    if (dirName !== '/**/*' && !fs.existsSync(publicDir)) {
        console.log('🔴 ' + chalk.red(publicDir + ' Non-existent, Please check it!!!\n'));
        console.log('😭 ' + chalk.white(' Bye Bye!!!'));
        // 退出程序
        process.exit(1);
    }
    let tag = util.getProgram('tag');
    let message = util.getProgram('message');
    let spinner = ora().start('🚥 Action...');
    let startTime = new Date().getTime();
    // 先删除避免引起不必要错误
    util.deleteFolder(deployDir);
    // 如果远程分支存在则不允许创建该tag
    spawn('git', ['ls-remote', '--tags'], {
        cwd: baseDir
    }).then(result => {
        if (result.split('\n').map((item, index) => {
            return item.split('/').reverse()[0];
        }).indexOf(tag) !== -1) {
            spinner.fail(chalk.black.bgRed(' Fail ' )
                    + ' Tag: '
                    + chalk.black.bgRed(tag)
                    + chalk.red(' already exists in the remote repository'));
            util.deleteFolder(deployDir);
            // 退出程序
            process.exit(1);
        }
        return;
    }).then(() => {
        return fs.exists(deployDir).then(function(exist) {
            spinner.text = '🚀 ' + chalk.black.bgCyan(' Start! ') + chalk.cyan(' Git dist Tag deployment...');
            if (exist) return;
            return util.setup(args);
        }).then(function() {
            // 删除临时目录
            spinner.text = '🈹 ' + chalk.black.bgCyan(' Clearing! ') + chalk.yellow(' ' + deployDir) + ' folder...';
            return fs.emptyDir(deployDir);
        })
        .then(function() {
            spinner.text = '🔃 ' + chalk.black.bgCyan(' Copying! ') + chalk.cyan(' files from public folder...');
            return fs.copyDir(publicDir, deployDir);
        }).then(function() {
            return util.git('add', '-A').then(() => {
                return util.git('commit', '-m', message || 'git push dist tag: ' + tag);
            }).then(() => {
                return util.git('tag', '-a', tag, '-m', message);
            }).then(() => {
                return util.git('remote', 'add', 'origin', args.repo);
            }).then(() => {
                spinner.text = '🚚 ' + chalk.black.bgCyan(' Start! ') + chalk.cyan(' push tag...');
                return util.git('push', '-u', 'origin', tag);
            }).then(() => {
                util.consoleAllFile();
                let endTime = new Date().getTime();
                spinner.succeed('🎉 ' + chalk.black.bgCyan(' Done! ' ) + chalk.green(' tag is succeed...   ') + (endTime - startTime + 'ms'));
                return;
            }).then(() => {
                util.deleteFolder(deployDir);
                return console.log(chalk.green('✔'), chalk.cyan('😁 😁 😁  Bye Bye...'));
            });
        });
    });
};
