#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const fs = require('hexo-fs');
const path = require('path');
const spawn = require('hexo-util/lib/spawn');
const Table = require('cli-table');
module.exports = {
    init(deployDir) {
        this.deployDir = deployDir;
        this.initProgram();
    },
    initProgram() {
        program.version('V1.0.0')
            .option('-t, --tag <string>', 'Please enter the tag name!!!')
            .option('-m, --message [string]', 'Please enter the comment information!!!')
            .parse(process.argv);
    },
    getProgram(opt) {
        if (program[opt] === undefined) {
            console.log(chalk.red('Error parameter!!!') + chalk.green(' please run "gotag -h"'));
            // 退出程序
            process.exit(1);
        }
        return program[opt];
    },
    deleteFolder(path) {
       var files = [];
       if(fs.existsSync(path)) {
           files = fs.readdirSync(path);
           files.forEach((file, index) => {
               var curPath = path + '/' + file;
               if(fs.statSync(curPath).isDirectory()) {
                   // recurse
                   this.deleteFolder(curPath);
               } else {
                   // delete file
                   fs.unlinkSync(curPath);
               }
           });
           fs.rmdirSync(path);
       }
   },
   setup(args) {
       let self = this;
       let deployDir = this.deployDir;
       var userName = args.name || args.user || args.userName || '';
       var userEmail = args.email || args.userEmail || '';
       // Create a placeholder for the first commit
       return fs.writeFile(path.join(deployDir, 'placeholder'), new Date()).then(function() {
           return self.git('init');
       }).then(function() {
           return userName && self.git('config', 'user.name', userName);
       }).then(function() {
           return userEmail && self.git('config', 'user.email', userEmail);
       });
   },
   git() {
       var len = arguments.length;
       var args = new Array(len);

       for (var i = 0; i < len; i++) {
           args[i] = arguments[i];
       }
       let deployDir = this.deployDir;
       return spawn('git', args, {
           cwd: deployDir
       });
   },
   getFiles(files) {
       let filesName = [];
       const fileTemp = fs.readdirSync(files);
       fileTemp.forEach((item, index) => {
           let stat = fs.lstatSync(files + '/' + item);
           filesName.push(item);
       });
       return filesName;
   },
   consoleAllFile() {
       let deployDir = this.deployDir;
       const files = this.getFiles(deployDir);
       let header = [chalk.white('Number'), chalk.white('Asset'), chalk.white('State')];
       let body = files.map((item, index) => {
           if (item !== '.git') {
               return [`#${index}`, chalk.yellow(item), chalk.green('✔')];
           } else {
               return [];
           }
       }).filter((item) => {
           return item.length > 0;
       });
       const table = new Table({
           head: header
       });
       table.push(...body);
       console.log(chalk.black.bgWhite('\n\n All Files Bale to tag: '));
       console.log(table.toString());
   }
}
