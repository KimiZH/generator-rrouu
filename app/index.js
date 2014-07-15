var yeoman = require('yeoman-generator'),
    file = yeoman.file,
    appname = '',
    onepage = false,
    mobile = false,
    bootstrap = false;

function parseAppName() {
    var contents = file.read('./package.json');
    contents = contents.replace(/(\n? *?["']name["'] *?: *?["'])my-app(["'])/ig, '$1' + appname + '$2');
    file.write('./package.json', contents);

    contents = file.read('./bower.json');
    contents = contents.replace(/(\n? *?["']name["'] *?: *?["'])my-app(["'])/ig, '$1' + appname + '$2');
    file.write('./bower.json', contents);

    contents = file.read('./Gruntfile.js');
    contents = contents.replace(/(\n? *?["']app["'] *?: *?["'])my-app(["'])/ig, '$1' + appname + '$2');
    file.write('./Gruntfile.js', contents);

    contents = file.read('./index.html');
    contents = contents.replace(/(\n? *?["']app["'] *?: *?["'])my-app(["'])/ig, '$1' + appname + '$2');
    file.write('./index.html', contents);
}

function parseOnepage() {
    var contents = file.read('./index.html');
    contents = contents.replace(/\r?\n? *?<script type="text\/javascript" src="dist\/0.0.0\/master.js"><\/script> *?/ig, '');
    contents = contents.replace(/\r?\n? *?<script type="text\/javascript" src="getContext::singleCacheSvr\/_imgs\/getContext::app\/js\/getContext::version\/master.js"><\/script> *?/ig, '');
    file.write('./index.html', contents);

    contents = file.read('./Gruntfile.js');
    contents = contents.replace(/(\n? *?)\/\/ *?(arrRun\.push\('onepage'\);)/ig, '$1' + '$2');
    file.write('./Gruntfile.js', contents);
}

function parseMobile() {
    var contents = file.read('./index.html');
    contents = contents.replace(/\r?\n? *?<script type="text\/javascript" src="bower_components\/html5shiv\/src\/html5shiv.js"><\/script> *?/ig, '');
    file.write('./index.html', contents);

    contents = file.read('./Gruntfile.js');
    contents = contents.replace(/\r?\n? *?["']bower_components\/html5shiv\/src\/html5shiv\.js["'],? *?/ig, '');
    file.write('./Gruntfile.js', contents);

    contents = file.read('./src/requirejs/config/main.js');
    contents = contents.replace(/(\n? *?["']jquery["'] *?: *?["']\.\/bower_components\/)jquery\/jquery(["'])/ig, '$1' + 'zepto/zepto' + '$2');
    file.write('./src/requirejs/config/main.js', contents);
}

module.exports = yeoman.generators.Base.extend({
    askFor: function () {
        var done = this.async();

        this.prompt([{
            type: 'input',
            name: 'appname',
            message: 'Input an app name',
            default: this.appname.replace(/ /ig, '-')
        }, {
            type: 'confirm',
            name: 'onepage',
            message: 'Has the project multiple pages ?'
        }, {
            type: 'confirm',
            name: 'mobile',
            message: 'Is it a mobile project ?'
        }, {
            type: 'confirm',
            name: 'bootstrap',
            message: 'Do you want to use BootStrap(v3.11) ?'
        }], function (answers) {
            appname = answers.appname;
            cdn = answers.cdn;
            contextRequire = answers.contextRequire;
            onepage = !answers.onepage;
            mobile = answers.mobile;
            bootstrap = answers.bootstrap;

            done();
        }.bind(this));
    },
    app: function () {
        this.directory('./');
    },
    install: function () {
        var done = this.async();

        this.npmInstall([], {}, function () {
            this.bowerInstall([], {}, function () {
                done();
            });
        }.bind(this));
    },
    end: function () {
        this.log('>>>>>>>> app name >>>>>>>>');
        parseAppName.apply(this);

        if (onepage) {
            this.log('>>>>>>>> onepage >>>>>>>>>');
            parseOnepage.apply(this);
        }

        if (mobile) {
            this.log('>>>>>>>>> mobile >>>>>>>>>');
            parseMobile.apply(this);
        }

        if (bootstrap) {
            this.log('>>>>>>>>> bootstrap >>>>>>>>');
        }

        this.log('>>>>>>>>>>>>>>>>>>>>>>>>>>');

        this.spawnCommand('grunt', ['connect', 'watch']);
    }
});