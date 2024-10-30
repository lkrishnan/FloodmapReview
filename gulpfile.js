var gulp = require( "gulp" ),
	less = require( "gulp-less" ),
    autoprefixer = require( "gulp-autoprefixer" ),
	cssclean = require( "gulp-clean-css" ),
    uglify = require( "gulp-uglify" ),
	concat = require( "gulp-concat" ),
	imagemin = require( "gulp-imagemin" ),
	replace = require( "gulp-replace" ),
	del = require( "del" ),
	web_dir = ".",
	paths = {
		styles: [
			web_dir + "/less/main.less",
		], scripts: [
			web_dir + "/js/standardize_address.js",
			web_dir + "/js/config.js",
			web_dir + "/js/format.js",
			web_dir + "/js/plugins.js",
			web_dir + "/js/map.js",
			web_dir + "/js/main.js"
		], htmls: [
			web_dir + "/index.html"
		]
	};	

//less preprocessing with autoprefixer and minify
gulp.task( "lesstocss", ( ) => {
    return gulp.src( paths.styles )
        .pipe( less( ) )
		.pipe( autoprefixer( "last 2 version", "safari 5", "ie 9", "opera 12.1", "ios 6", "android 4" ) )
        .pipe( cssclean( ) )
        .pipe( gulp.dest( web_dir + "/css" ) );
} );

//push main script to build after minify
gulp.task( "customjstobuild", ( ) => {
    return gulp.src( paths.scripts )
		.pipe( uglify( ) )
		.pipe( concat( "fmr.js" ) )
		.pipe( gulp.dest( "build/js" ) );
} );

//push other js to build
gulp.task( "vendorjstobuild", ( ) => {
	return gulp.src( web_dir + "/js/vendor/*.*" )
		.pipe( gulp.dest( "build/js/vendor/" ) );
} );

//push images to build after processing
gulp.task ( "images", ( ) => {
	return gulp.src( web_dir + "/image/**/*" )
    // Pass in options to the task
    .pipe( imagemin( { optimizationLevel: 3, progressive: true, interlaced: true } ) )
    .pipe( gulp.dest ("build/image" ) );
} );

//push css files to build after processing
gulp.task( "csstobuild", ( ) => {
	return gulp.src( web_dir + "/css/**/*.*" )
		.pipe( gulp.dest( "build/css/" ) );
} );

//push root files to build
gulp.task( "rootfilestobuild", ( ) => {
	return gulp.src( [ web_dir + "/*.*", "!" + web_dir + "/*.html" ] )
        .pipe( gulp.dest( "build/" ) );
} );

//push html files to build after processing
gulp.task( "htmltobuild", ( ) => {
    return gulp.src ( paths.htmls )
        .pipe ( replace ( /<script src="js\/config.js"><\/script><script src="js\/format.js"><\/script><script src="js\/plugins.js"><\/script><script src="js\/standardize_address.js"><\/script><script src="js\/map.js"><\/script><script src="js\/main.js"><\/script>/g, "<script src=\"js/fmr.js?foo=99999\"></script>" ) )
		.pipe ( replace ( /foo=[0-9]*/g, "foo=" + Math.floor ( ( Math.random() * 100000 ) + 1 ) ) )
		.pipe( replace ( /http:\/\/localhost\/mojo/g, "https://gis.mecklenburgcountync.gov/mojo" ) ) 
		.pipe ( gulp.dest ( "build/" ) );
} );

//task to wipe the build directory
gulp.task( "wipebuild", cb => {
	del( [ "build" ], cb );
} );
 
//rerun the task when less files change
gulp.task( "watch", ( ) => { 
	gulp.watch( paths.styles, gulp.series(  "lesstocss" ) ); 
} );

//run in the background during development
gulp.task( "develop", gulp.series( "lesstocss", "watch" ) );

gulp.task( "default", gulp.series( "customjstobuild", "vendorjstobuild", "csstobuild", "images", "rootfilestobuild", "htmltobuild" ) );

//publish website
gulp.task( "publish", function( ){
	return gulp.src( "build/**/*.*" )
	.pipe( gulp.dest ( "//sus-gis-p-app1/c$/inetpub/wwwroot/fmr" ) );
} );