var yeoman = require('yeoman-generator'),
    mobile = false,
    bootstrap = false,
    onepage = false;

module.exports = yeoman.generators.Base.extend({
    prompting: function () {
        var generator = this,
            done = this.async();

        generator.prompt({
            type: 'confirm',
            name: 'mobile',
            message: 'Is it a mobile project ?'
        }, function (answers) {
            mobile = answers.mobile;

            generator.prompt({
                type: 'confirm',
                name: 'bootstrap',
                message: 'Do you want to use BootStrap(v3.11) ?'
            }, function (answers) {
                bootstrap = answers.bootstrap;

                generator.prompt({
                    type: 'confirm',
                    name: 'onepage',
                    message: 'Has the project multiple pages ?'
                }, function (answers) {
                    onepage = !answers.onepage;

                    done();
                });
            });
        });
    },
    install: function () {
        var generator = this;

        generator.directory('./', './');

        generator.npmInstall([], {}, function () {
            generator.bowerInstall([], {}, function () {
                generator.spawnCommand('grunt', ['livereload']);
            });
        });
    }
});