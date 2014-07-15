var extend = require('extend');
module.exports = function(grunt) {
    var config = {
            'app': 'my-app'
        },
        jsHints = getJSHints(),
        LESSs = getLESSs(),
        pages = getPages('src/page'),
        defaultGruntInitConfigRequireJS = {
            'onBuildRead': onBuildRead,
            'onBuildWrite': onBuildWrite,

            'uglify': {
                'ascii_only': true
            },
            // 'optimize': 'none',

            // 'optimize': 'uglify2',
            // 'generateSourceMaps': true,
            // 'preserveLicenseComments': false,

            'skipModuleInsertion': true
        },
        mainGruntInitConfigRequireJS = getMainGruntInitConfigRequireJS('./src/requirejs/config/main.js'),
        version = grunt.file.readJSON('package.json').version,
        configConnect = {
            options: {
                singleCacheSvr: 'http://localhost:9000',
                hostname: 'localhost',
                port: 9000,
                livereload: 35729
            }
        },
        requirejsExcludeShallow = {
            'master': []
        },
        filepathTmp = './dist/tmp.js';

    function getJSHints() {
        var watch = {},
            jshint = {};
        grunt.file.recurse('./src', function (abspath, rootdir, subdir, filename) {
            var ma = filename.match(/(^.*)\.js$/i);
            if (ma) {
                var name = (subdir + '/' + ma[1] + '-js').replace(/\//ig, '-'),
                    file = rootdir + '/' + subdir + '/' + ma[1];
                watch[name] = {
                    files: [file + '.js'],
                    tasks: ['jshint:' + name]
                };
                jshint[name] = {
                    options: {},
                    src: [file + '.js']
                };
            }
        });
        return {
            'watch': watch,
            'jshint': jshint
        };
    }

    function getLESSs() {
        var watch = {},
            less = {};
        grunt.file.recurse('./src', function (abspath, rootdir, subdir, filename) {
            var ma = filename.match(/(^.*)\.less$/i);
            if (ma) {
                var name = (subdir + '/' + ma[1] + '-less').replace(/\//ig, '-'),
                    file = rootdir + '/' + subdir + '/' + ma[1];
                watch[name] = {
                    files: [file + '.less'],
                    tasks: ['less:' + name]
                };
                less[name] = {
                    options: {},
                    files: {}
                };
                less[name].files[file + '.css'] = file + '.less';
            }
        });

        return {
            'watch': watch,
            'less': less
        };
    }

    function getPages(path) {
        var tmpFolderName,
            tmpPageFolderName,
            rePages = {};

        grunt.file.recurse(path, function (abspath, rootdir, subdir, filename) {
            var pos = subdir.indexOf('/'),
                pageName = pos > -1 ? subdir.substr(0, pos) : subdir;
            if (pageName != tmpPageFolderName) {
                rePages[pageName] = []
                tmpPageFolderName = pageName;
            }
            tmpFolderName = subdir;
        });

        return rePages;
    }

    function getMainGruntInitConfigRequireJS(filePath) {
        var configRe = {},
            strMainGruntInitConfigRequireJS = grunt.file.read(filePath)
                .replace(
                    /^\s*?var *?require *?= *?/ig,
                    'var mainGruntInitConfigRequireJS = '
                )
                .replace(/\s*?\(\s*?config\s*?\)\s*?;?\s*?$/ig, '(' + JSON.stringify(config) + ')');
        eval(strMainGruntInitConfigRequireJS);
        configRe = extend(true, {}, defaultGruntInitConfigRequireJS, mainGruntInitConfigRequireJS);
        delete configRe.context;
        return configRe;
    }

    function onBuildRead(moduleName, path, contents) {
        if (
            /^bower_components\/jquery[-\.]/.test(moduleName)
            || /^shared\/jquery\//.test(moduleName)
        ) {
            if (!(/^define\s*?\(/.test(contents))) {
                contents = 'define("' + moduleName + '", ["jquery"], function ($) { var jQuery = $; ' + contents + '});';
            }
        }
        return contents;
    }

    function onBuildWrite(moduleName, path, contents) {
        //
        return contents;
    }

    function getGruntInitConfigRequireJS(pages) {
        var configRe = {};
        for (var i in pages) {
            var pageName = i.toString(),
                page = pages[i];
            configRe[pageName] = {
                options: extend(true, {}, mainGruntInitConfigRequireJS, {
                    include: config.app + '/page/' + pageName + '/main',
                    excludeShallow: [],
                    out: './dist/' + version + '/' + pageName + '.js'
                })
            };
            if (pageName == 'master') {
                configRe[pageName].options.onBuildWrite = function (moduleName, path, contents) {
                    requirejsExcludeShallow.master.push(moduleName);
                    return contents;
                };
            }
        }
        return configRe;
    };

    grunt.initConfig({
        jshint: extend(true, {}, jsHints.jshint),
        less: extend(true, {}, LESSs.less),
        requirejs: getGruntInitConfigRequireJS(pages),
        watch: (function () {
            var watchJSHint = extend(true, {}, jsHints.watch),
                watchLESS = extend(true, {}, LESSs.watch)
                watch = extend(true, {}, watchJSHint, watchLESS);
            watch.livereload = {
                options: {
                    livereload: configConnect.options.livereload
                },
                files: [
                    '**/*.html',
                    '**/*.css'
                ]
            };
            return watch;
        })(),
        connect: {
            options: {
                hostname: configConnect.options.hostname,
                livereload: {
                    options: {
                        middleware: function (connect, options, middlewares) {
                            middlewares.splice(0, 0, function (req, res, next) {
                                if (/\.css$/ig.test(req.url)) {
                                    var singleCacheSvr = configConnect.options.singleCacheSvr,
                                        randomCacheSvr = singleCacheSvr,
                                        contents = grunt.file.read('./' + req.url);
                                    contents = contents.replace(/(url\s*?\(\s*?[\'\"]?\s*?)(?:#cacheSvr\d?#)?(\/_imgs\/)/ig, '$1' + randomCacheSvr + '$2');
                                    contents = contents.replace(/(url\s*?\(\s*?[\'\"]?\s*?)(?:#singleCacheSvr#)?(\/_imgs\/)/ig, '$1' + singleCacheSvr + '$2');
                                    res.end(contents);
                                }
                                else {
                                    return next();
                                }
                            });
                            return middlewares;
                        }
                    }
                }
            },
            page: {
                options: {
                    port: configConnect.options.port,
                    livereload: configConnect.options.livereload,
                    open: {
                        target: 'http://' + configConnect.options.hostname + ':' + configConnect.options.port,
                        callback: function () {}
                    }
                }
            }
        },
        uglify: {
            master: {
                files: {
                    './dist/tmp.js': [
                        'bower_components/html5shiv/src/html5shiv.js',
                        'src/requirejs/config/main.js',
                        'bower_components/requirejs/require.js'
                    ]
                }
            }
        },
        concat: {
            master: {
                src: [
                    filepathTmp,
                    './dist/' + version + '/master.js'
                ],
                dest: './dist/' + version + '/master.js',
            },
            onepage: {
                src: [
                    './dist/' + version + '/master.js',
                    './dist/' + version + '/index.js'
                ],
                dest: './dist/' + version + '/index.js'
            }
        },
        clean: {
            tmp: {
                src: [
                    filepathTmp
                ]
            },
            onepage: {
                src: [
                    './dist/' + version + '/master.js'
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');

    function parseExcludeShallow() {
        grunt.registerTask('getExcludeShallow', '', function () {
            var excludePageName = this.args[0];
            if (!excludePageName) {
                return;
            }
            requirejsExcludeShallow[excludePageName] = [];
            grunt.task.run(['createExcludeShallow:' + excludePageName, 'cleanExcludeShallow:' + excludePageName]);
        });
        grunt.registerTask('createExcludeShallow', '', function () {
            var excludePageName = this.args[0];
            grunt.config.set('requirejs.' + excludePageName + '.options.out', filepathTmp);
            grunt.config.set('requirejs.' + excludePageName + '.options.optimize', 'none');
            grunt.task.run(['requirejs:' + excludePageName]);
        });
        grunt.registerTask('cleanExcludeShallow', '', function () {
            var excludePageName = this.args[0];
            grunt.config.set('requirejs.' + excludePageName + '.options.out', 'dist/' + version + '/' + excludePageName + '.js');
            if (!mainGruntInitConfigRequireJS.optimize) {
                grunt.config.escape('requirejs.' + excludePageName + '.options.optimize');
            }
            grunt.task.run(['clean:tmp']);
        });
    }

    grunt.registerTask('fillExcludeShallow', '', function () {
        var excludePageName = this.args[0],
            fillExcludePageName = this.args[1];
        if (!excludePageName || !fillExcludePageName) {
            return
        }
        if (fillExcludePageName == 'all') {
            for (var i in pages) {
                var pageName = i.toString();
                if (pageName != excludePageName) {
                    grunt.config.set(
                        'requirejs.' + pageName + '.options.excludeShallow',
                        requirejsExcludeShallow[excludePageName]
                    );
                }
            }
        }
        else {
            grunt.config.set(
                'requirejs.' + fillExcludePageName + '.options.excludeShallow',
                requirejsExcludeShallow[excludePageName]
            );
        }
    });

    grunt.registerTask('onepage', '', function () {
        grunt.task.run(['concat:onepage', 'clean:onepage']);
    });

    grunt.registerTask('umbraco', '', function () {
        var contents = grunt.file.read('index.html');

        function testWhile(pattBegin, pattEnd) {
            return pattBegin.test(contents) && pattEnd.test(contents);
        }
        function available(pattBegin, pattEnd) {
            while(testWhile(pattBegin, pattEnd)) {
                var begin = contents.match(pattBegin)
                    end = contents.match(pattEnd);
                if (begin && end) {
                    contents = contents.substring(0, begin.index)
                        + contents.substring(begin.index + begin[0].length, end.index)
                        + contents.substring(end.index + end[0].length + 1);
                }
            }
        }
        function unavailable(pattBegin, pattEnd) {
            while(testWhile(pattBegin, pattEnd)) {
                var begin = contents.match(pattBegin)
                    end = contents.match(pattEnd);
                if (begin && end) {
                    contents = contents.substring(0, begin.index)
                        + contents.substring(end.index + end[0].length + 1);
                }
            }
        }

        unavailable(/\n *<!-- debug: -->/i, /<!-- enddebug -->/i);
        available(/\n *<!-- release:/i, /\n\s*endrelease -->/i);
        contents = contents
            .replace(/getContext::app/ig, config.app)
            .replace(/getContext::version/ig, version);

        grunt.file.write('./dist/' + version + '/index.html', contents);
    });

    for (var i in pages) {
        var pageName = i.toString();
        if (pageName == 'master') {
            grunt.registerTask(pageName, [
                'requirejs:master',
                'uglify:master',
                'concat:master',
                'clean:tmp'
            ]);
        } else {
            grunt.registerTask(pageName, '', function () {
                var pageName = this.name;
                parseExcludeShallow();
                grunt.task.run([
                    'getExcludeShallow:master',
                    'fillExcludeShallow:master:' + pageName,
                    'requirejs:' + pageName
                ]);
            });
        }
    }

    grunt.registerTask('default', '', function () {
        var arrRun = [
                'master',
                'fillExcludeShallow:master:all'
            ];

        for (var i in pages) {
            var pageName = i.toString();
            if (pageName != 'master') {
                arrRun.push('requirejs:' + pageName);
            }
        }

        // arrRun.push('onepage');

        arrRun.push('umbraco');

        grunt.task.run(arrRun);
    });

    grunt.registerTask('livereload', '', function () {
        var pathPage = this.args[0] || '';
        grunt.config.set(
            'connect.page.options.open.target',
            'http://' + configConnect.options.hostname + ':' + configConnect.options.port + '/' + pathPage
        );
        grunt.task.run([
            'connect',
            'watch'
        ]);
    });

    grunt.registerTask('test', []);
};