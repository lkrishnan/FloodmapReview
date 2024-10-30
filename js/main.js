/**
 * main.js
 * This file contains all the map related events and functions
 * Created by Lak Krishnan
 * 9/5/13
 * @license     MIT
 */

/* Variable Declaration */
var map,                        // The map
	mapServices = [ ],
	agsServices = [ ],
	serviceNames = [ ].
	featureServices = [ ],
	identifyServices = [ ],
	parcelGraphic = null,       // Holder for selected parcel
	locationGraphic = null,		// Holder for selected marker
	basemapgallery,
	loop,
	selectedAddress = { },       // Holder for the selected location
	mapTool = null,
	zoomToGraphic = false,
	propPhotoGallery,
	fmr_token = null

// Create map object
require ( [ 
	"esri/map", 
	"esri/geometry/Extent", 
	"esri/dijit/Basemap", 
	"esri/dijit/BasemapGallery",
	"esri/dijit/BasemapLayer", 
	"esri/config",
	"dojo/on",  
	"dojo/domReady!" ], 
	
	function ( Map, Extent, Basemap, BasemapGallery, BasemapLayer, esriConfig, on ) {
	
		/////////////////////////////////////////
		// Initialize the map and its controls //
		/////////////////////////////////////////		
		
		// Initalize map
		map = new Map( "map", { 
				extent : new Extent ( config.initial_extent ),
				minScale: config.min_scale,
				logo : false, 
				zoom: 1 
			} );
					
		// Initalize basemap			
		basemapInit( ); 	
		
		// Add all other map layers	
		map.on( "load", serviceInit ); 
		
		
		// Add maplayer layer list control
		map.on( "layers-add-result", mapCtrlsInit );  
		
		// Disable and enable layer switcher controls based on map extent
		map.on( "extent-change", layerSwitcherZoomCheck ); 
				
		// Take care of map clicks		
		map.on( "click", clickAndSelect ); 
				
		/////////////////////////////////
		// Initialize non map controls //
		/////////////////////////////////
		
		// Initalize tabs
		$( "#riskcont" ).tabs( );
	
		//  Initalize buttons
		$( "#toggle" ).buttonset( );
		$( "#maptoggle" ).button( ).click( function( ){
			$( "#maplayerscont" ).parent( ).addClass( "hidden" );
			$( "#toggle" ).find( "input:radio" ).prop( "checked", false ).end( ).buttonset( "refresh" );
		} );
				
		// Initalize click events
		$( "#toggle input:radio" ).click( function( ){
			showSidebar( $( this ).val( ) + "cont" );
		} );
 	
		// Initalize jQuery UI Autocomplete
		$.widget( "custom.catcomplete", $.ui.autocomplete, {
			_renderMenu: function( ul, items ){
				var that = this,
				currentCategory = "";
				$.each( items, function( index, item ){
					if( item.type != currentCategory ){
						ul.append( "<li class='ui-autocomplete-category'>" + item.type + "</li>" );
						currentCategory = item.type;
					}
					that._renderItemData( ul, item );
				} );
			}
		} );
		
		$( "#searchinput" ).val( "" );
		$( "#searchinput" ).catcomplete( {
			minLength: 4,
			delay: 250,
			autoFocus: false,
			source: function( request, response ){
				$.ajax( {
					url: `${config.gateway}/api/uber/v1`,
					dataType: "json",
					data: {	query: request.term	},
					success: function( data ){
						if( data.length > 0 ){
							response( $.map( data, function( item ){
								return {
									label: item.value,
									gid: item.srch_key,
									type: item.type,
								};
							} ) );
						}
					}
				} );
			},
			select: mainSearch
		} ).keypress( function( event ){
			if( event.keyCode == 13 ){ 
				event.preventDefault( );
				badSearch( );
			}	
		} );
		$( "#searchclear" ).click( function( ){ $ ( "#searchinput" ).val( "" ).focus( ); } );
		$( "#searchbtn" ).click( function( ){ backupSearch( ); } ); 
		
		// Initalize document tooltip
		$( document ).tooltip( );

		// Initalize glossary
		require( [ "dojo/query", "dojo/NodeList-manipulate" ], function( query ){
			var glossaryhtml = "";
		
			for( var idx in tips ){
				glossaryhtml += "<div id='"+idx+"'><h4>" + tips[ idx ].tags[ 0 ] + "</h4>"; 
				
				if( tips[ idx ].tags.length > 1 ){
					var htmlstr = "";
					
					for( var i = 1; i < tips[ idx ].tags.length; i++ ){
						htmlstr += ( htmlstr.length === 0 ? "<p><i><b>Other names used:</b> " + tips[ idx ].tags[ i ] : ", " + tips[ idx ].tags[ i ] );
					}
						
					htmlstr += "</i></p>";	
					glossaryhtml += htmlstr;
				}
				glossaryhtml += tips[ idx ].detailed + "</div>";
			}
			
			query( "#glossarycont" ).innerHTML( glossaryhtml );
		} );
						
		// Inital PubSub Subscriptions
		require( [ "dojo/_base/connect" ], function( connect ){
			connect.subscribe( "/change/selected", chngSelection ); // Selected record change
			connect.subscribe( "/set/propinfo", setPropInfo ); // Selected property information change
			connect.subscribe( "/add/graphics", addGraphics ); // Add graphics
		} );
	}	
);	

function mainSearch( event, ui ){
	if( ui.item.gid ){
		require( [ "dojo/query", "dojo/NodeList-manipulate" ],	function( query ){
			switch ( ui.item.type ) {
				case "ADDRESS":
					finder( { "matid": ui.item.gid } );
					break;
					
				case "PID":
					finder( { "pid": ui.item.value } );	
					break;
					
				case "GISID":
					finder( { "gisid" : ui.item.value } );
					break;

				case "OWNER":
					var comma_split = ui.item.value.split( "," ).map( item => item.trim( ) ),
						owner_obj = { }
					
					owner_obj.lastname = comma_split[ 0 ]

					if( comma_split.length > 1 )
						owner_obj.firstname = comma_split[ 1 ]

					finder( owner_obj );
					break;

				case "ROAD":
					finder( { "stcode": ui.item.gid } );
					break
					
			}
		
			//zoom to graphics added to the map
			zoomToGraphic = true; 
			//hide back to results
			query( "#backtoresults" ).addClass( "hidden" );
		} );	
	}
}

function finderhelper( ){
	require( [ "dojo/dom-attr" ], function( domAttr ){	
		finder( {
			"matid" : domAttr.getNodeProp( "matlist", "value" ), 
			"pid" : selectedAddress.pid, 
			"gisid" : selectedAddress.gisid
		} );		
	} );	
}

function finder( data ){
	require( [ "dojo/request", "dojo/_base/connect", "dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/NodeList-manipulate" ] , function( request, connect, array, lang, query ){
		request.get( config.gateway + "/api/bolt/v1/query", {	
			handleAs: "json",
			headers: { "X-Requested-With": "" },
			query: {limit: 200, ...data}
		} ).then( function( boltdata ){
			if( boltdata.length == 1 ){	//kick it back to Main Search	
				var sel = { pid: boltdata[ 0 ].pid, gisid: boltdata[ 0 ].gisid }
				
				if( boltdata[ 0 ].hasOwnProperty( "mat" ) ){
					var idx = -1

					if( data.hasOwnProperty( "matid" ) )
						idx = boltdata[ 0 ].mat.findIndex( row => row.matid === data.matid )

					sel.matid = boltdata[ 0 ].mat[ ( idx < 0 ? 0 : idx ) ].matid
					sel.address = boltdata[ 0 ].mat[ ( idx < 0 ? 0 : idx ) ].address
					sel.x = boltdata[ 0 ].mat[ ( idx < 0 ? 0 : idx ) ].x
					sel.y = boltdata[ 0 ].mat[ ( idx < 0 ? 0 : idx ) ].y
					sel.lat = boltdata[ 0 ].mat[ ( idx < 0 ? 0 : idx ) ].lat
					sel.lon = boltdata[ 0 ].mat[ ( idx < 0 ? 0 : idx ) ].lng
					
				}else{
					sel.x = boltdata[ 0 ].centroid_x
					sel.y = boltdata[ 0 ].centroid_y
					sel.lat = boltdata[ 0 ].centroid_lat
					sel.lon = boltdata[ 0 ].centroid_lon

				}

				//publish
				connect.publish( "/change/selected", sel );
				connect.publish( "/add/graphics", sel );
				connect.publish( "/set/propinfo", sel );
				connect.publish( "/set/riskinfo", sel );
												
			}else if( boltdata.length > 1 ){ //more taxpids associated with ground pid show results for user to select manually	
				require ( [ "dojo/dom", "mojo/SearchResultBoxLite" ], function( dom, SearchResultBoxLite ){
					var searchResultsContainer = dom.byId( "searchresultscont" );
				
					query( "#searchresultscont" ).innerHTML( "<h5><span class = 'note'>Are you looking for?</span></h5>" );
				
					boltdata.forEach( function ( item, i ){
						var widget = new SearchResultBoxLite( {
							idx: i + 1,
							displaytext : "<div><b>Parcel ID:</b>&nbsp;" + item.pid + "</div>" +
								"<div><b>Address on Property:</b></div>" + 
								( item.situs.length > 0 ? "<div>" + format.arrAslist( item.mat, "address" ) + "</div>" : "" ) +
								"<div><b>Ownership:</b></div>" + 
								"<div>" + format.arrAslist( item.owner, "fullname" ) + "</div>",
							params: { 
								pid: item.pid, 
								gisid: item.gisid, 
								matid: ( item.hasOwnProperty( "mat" ) ? item.mat[ 0 ].matid : null )

							},
							onClick: function ( boxdata ) {
								query ( "#backtoresults" ).removeClass ( "hidden" );
								finder ( boxdata );
							}
						} ).placeAt ( searchResultsContainer );	

					} );
											
					showSidebar( "searchresultscont", "risktoggle" );
					
				} );

			}else{ //no records in cama match search string 
				badSearch( );
				
			}
	
		} )
						
	} );

}

/* Show error message for bad search */
function badSearch( ){
	//get property ownership information
	require( [ "dojo/query", "dojo/NodeList-manipulate" ], function( query ){
		//show no information sign
		query( "#errorcont" ).innerHTML( "<img src='image/sad_face.jpg' /><br/>No information available. Refine your search." );
		
		//hide and show appropriate divs		
		query( "#searchresultscont, #propinfocont" ).addClass( "hidden" );
		query( "#errorcont" ).removeClass( "hidden" ); 	
								
		//show search results div
		showSidebar ( "propcont", "proptoggle" );
	} );
}

function handleHash( ){
	require( [ "dojo/hash", "dojo/io-query", "dojo/_base/connect" ], function( Hash, ioQuery, Connect ){
		var params = ioQuery.queryToObject( Hash( ) ),
			finderparams = { };
				
		if( params.matid ){ 				 
			if( isNumeric( params.matid ) )
				finderparams.matid =  params.matid;
			
		}			
		
		if( params.pid || params.taxpid ){
			var pid = ( params?.pid ? params.pid : params.taxpid )

			if( isTaxPID( pid ) )
				finderparams.pid = pid;
			
		}

		if( params.gisid ){
			if( isGroundPID( params.gisid ) )
				finderparams.gisid = params.gisid;
			
		}
		
		
		if( Object.keys( selectedAddress ).length > 0 ){
			if( selectedAddress?.matid && finderparams?.matid ){
				if( selectedAddress.matid != finderparams.matid ){
					//not duplicate
					finder( finderparams );
					zoomToGraphic = true;	//zoom to graphics added to map	

				}

			}else{
				//most probably not duplicate
				finder( finderparams );
				zoomToGraphic = true;	//zoom to graphics added to map	
			}

		}else{
			//its a new selection
			finder( finderparams );
			zoomToGraphic = true;	//zoom to graphics added to map	
		}
		
	} );

}

/*  Set selected address  */
function chngSelection( data ){
	if( selectedAddress && 
		( selectedAddress.matid != data.matid || 
			selectedAddress.taxpid != data.taxpid || 
			selectedAddress.groundpid != data.groundpid ) ){ 

		require( [ "dojo/hash", "dojo/io-query", "dojo/_base/connect" ], function( Hash, ioQuery, connect ){
			//store selected address
			selectedAddress = {
				"matid": data.matid,
				"address": data.address,
				"groundpid": data.groundpid,
				"taxpid": data.taxpid,
				"y": data.y,
				"x": data.x,
				"lat": data.lat,
				"lon": data.lon
			};
								
			//set hash
			Hash( ioQuery.objectToQuery( { 
				matid: data.matid, 
				pid: data.pid, 
				gisid: data.gisid 
			} ) );
		} );
	}
}

/*  Set property information  */
function setPropInfo( data ){
	//get property ownership information
	require ( [ "mojo/PhotoGallery", "esri/tasks/query", "esri/tasks/QueryTask", 
		"dojo/promise/all","dojo/Deferred", "dojo/request",
		"dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/NodeList-manipulate" ] , function( PhotoGallery, esriquery, QueryTask, all, Deferred, request, array, lang, query ){
		//reset
		query ( "#propkey" ).innerHTML ( "");

		request.get( config.gateway + "/api/bolt/v1/query", {
			handleAs: "json",
			headers: { "X-Requested-With": "" },
			query: {
				pid: data.pid
			}
		} ).then( function( boltdata ){
			var addrhtml = "NA",
				p3g_url = `https://polaris3g.mecklenburgcountync.gov/pid/${boltdata[ 0 ].pid}/`,
				fz_url = `http://gis.mecklenburgcountync.gov/3dfz/#taxpid=${data.pid}&groundpid=${data.gisid}`

			if( boltdata[ 0 ].hasOwnProperty( "mat" ) ){
				var idx = 0

				if( boltdata[ 0 ].mat.length > 1 ){
					boltdata[ 0 ].mat.forEach( function( item, i ){
						if( item.matpid == data.pid ){
							idx = i
							addrhtml += "<option value='" + item.matid + "' " + 
								( ( item.matid == data.matid ) ? "selected='selected'" : "" ) + ">" + 
								( ( lang.trim ( item.address ).length > 0 ) ? item.address : "Unavailable" ) + "</option>";
						}
					} );
					addrhtml = "<select id='matlist' style='width:100%;' onchange='finderhelper();'>" + addrhtml + "</select>";
				}else
					addrhtml = boltdata[ 0 ].mat[ 0 ].address

				p3g_url = `https://polaris3g.mecklenburgcountync.gov/address/${boltdata[ 0 ].mat[ idx ].matid}/`
				fz_url = `${fz_url}&matid=${boltdata[ 0 ].mat[ idx ].matid}`

				request.get( `${config.gateway}/api/photo?lat=${boltdata[ 0 ].mat[ idx ].photo_lat}&lng=${boltdata[ 0 ].mat[ idx ].photo_lng}&view=${boltdata[ 0 ].mat[ idx ].photo_view}`, {
					handleAs: "json",
					headers: { "X-Requested-With": "" },
				} ).then( function( photodata ){
					if( propPhotoGallery ){			
						propPhotoGallery.reset( );
					}else{
						propPhotoGallery = new PhotoGallery( ).placeAt( document.getElementById( "photo" ) );
						propPhotoGallery.startup( );
					}

					if( photodata.length > 0 ){
						//if the property photo exisits at the location add it
						var imgdate = photodata[ 0 ].photo_date;
						
						propPhotoGallery.addPhoto( { 
							url: photodata[ 0 ].photo_url, 
							photo_date: imgdate,
							title: "Photo Date: " + format.theDate(imgdate)
						} );	
						

					}
					
				} )

			}

			query( "#propkey" ).append(
				"<table class='proptbl'>" +
					"<tr>" + 
						"<th class='top'>Parcel ID</th><td>" + boltdata[ 0 ].pid+"</td>" + 
					"</tr>"+
					"<tr>" + 
						"<th>Address</th><td>" + addrhtml + "</td>" + 
					"</tr>" + 
					"<tr>" + 
						"<th class='top'>Ownership</th><td>" + format.arrAslist( boltdata[ 0 ].owner, "fullname" ) + "</td>" + 
					"</tr>"+
					"<tr>" + 
						"<td colspan='2' class='center'>" + 
							"<a href='" + p3g_url + "' target='_blank'>Polaris 3G</a>" +
							"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + 
							"<a href='https://property.spatialest.com/nc/mecklenburg/#/property/" + boltdata[ 0 ].assessproid + "' target='_blank'>Spatialest</a>" +
							"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
							"<a href='" + fz_url + "' target='_blank'>3D Floodzone</a>" +											
						"</td>" + 
					"</tr>" +
				"</table>" )

			//set google streetview link
			if( data.address ){
				query( "#streetviewlink" ).innerHTML( "<span>Use <a href='https://www.google.com/maps/place/" + data.address + "' target='_blank'>Google Street View</a> for more recent property photo.</span>" );
			}	
			
			//set birdseye view link
			query( "#birdseyelink" ).innerHTML( "<span>Jump to <a href='http://maps.co.mecklenburg.nc.us/meckscope/?lat=" + data.lat + "&lon=" + data.lon + "' target='_blank'>45&deg; view</a> (<span class='note'>Pictometry Oblique Imagery</span>).</span>" );
			
		} )							

		//hide and show appropriate divs		
		query( "#errorcont, #searchresultscont" ).addClass( "hidden" );
		query( "#propinfocont" ).removeClass( "hidden" ); 			
				
		//show property container
		showSidebar ( "propcont", "proptoggle" );  
	} );	
}

function showLoginForm( ){
	if( window.localStorage ){
		if( !fmr_token && localStorage.getItem( "fmr_token" ) ){
			var temp_fmr_token = JSON.parse( localStorage.getItem( "fmr_token" ) ),
				now = new Date( )

			// compare the expiry time of the item with the current time
			if( now.getTime( ) > temp_fmr_token.expiry ){
				// If the item is expired, delete the item from storage
				// and return null
				localStorage.removeItem( "fmr_token" )
				fmr_token = null
	
			}else{
				fmr_token = temp_fmr_token
				loginhtml = "<tr><td colspan='2'><a href='javascript:void(0);' onclick='forgetlogin();'>Forget me</a></td></tr>";
				
			}

		}

	}

	if( fmr_token ){
		signedin = true;

		$ ( "#managelogin" ).html ( "<table><tr><td class='right'><a href='javascript:void(0);' onclick='signOut();'>Signout</a></td></tr></table>" );
				
		//add comment records
		showCommentRows( );
		
	}else{
		$( "#managelogin" ).html( 
			"<table>" + 
				"<tr><td>Login</td><td><input name='myusername' type='text' id='myusername' value='' style='width:100px;'></td></tr>" +
				"<tr><td>Password</td><td><input name='mypassword' type='password' id='mypassword' value='' style='width:100px;'></td></tr>" +
				"<tr><td colspan='2'><input type='button' id='signinbtn' value='Sign In' onclick='signIn();'/></td></tr>" + 
			"</table>"

		);

	}
		
}

function signIn( ){
	require ( [ "dojo/request/xhr" ] , function ( xhr ) {
		xhr ( config.gateway +  "/api/fm/v1/login", {
			data: 	JSON.stringify( { "login": $( "#myusername" ).val( ), "pwd": $( "#mypassword" ).val( ), } ),
			handleAs: "json",
			method: "POST"
		} ).then ( function( data ){
			if( data.result === "success" ){
				var now = new Date( )

				fmr_token = {
					token: data.token,
					expiry: now.getTime( ) + ( 43200000 ) //expires in 12 hours
				}
			
				localStorage.setItem( "fmr_token", JSON.stringify( fmr_token ) )

				signedin = true;

				$( "#managelogin" ).html( "<table><tr><td class='right'><a href='javascript:void(0);' onclick='signOut();'>Signout</a></td></tr></table>" );
				
				//add comment records
				showCommentRows( );
				
			}

		} );

	} );

}

function signOut( ){
	if( window.localStorage ){
		if( localStorage.getItem( "fmr_token" ) ){
			localStorage.removeItem( "fmr_token" )

		}

	}

	fmr_token = null
	signedin = false;
	$( "#managerows" ).html( "" );
	showLoginForm( );
	//hide comment features
	$( "#0" ).prop( "checked", false ).trigger( "change" ); 

}

function showCommentRows( ){
	$.ajax ( {
		url: `${config.gateway}/api/fm/v1/query/floodmap_review_pt`,
		type : "GET",
		dataType : "json",
		data: {
			columns: "objectid, name, email, dateenter, status, comment, response",
			filter: "dateenter>'08/31/2016'"
		},
		success: function ( data ) {
			if( data.length > 0 ){
				var htmlstr = "";
				//list results

				$.each ( data, function ( i, item ) {
					htmlstr += "<div class='scont' " + ( item.status == "open" ? " style='background: #F5DDA6'" : "" ) + "><table>" +
						"<tr><th width='50px'>Added: </th><td>" + format.readableDate ( new Date(item.dateenter) ) + "</td><td class='right'><a href='javascript:void(0);' onclick='zoomToComment(" + item.objectid + ");'>Zoom To</a></td></tr>" +
						"<tr><th width='50px' class='top'>Comment: </th><td colspan='2'>" + item.comment + "</td></tr>" +
						"<tr><th width='50px' class='top'>Name: </th><td colspan='2'>" + item.name + "</td></tr>";
					if( item.status == "open" ){			
						htmlstr +=  
						"<tr>" + 
							"<th width='50px' class='top'>Response:</th>" + 
							"<td colspan='2'><textarea id='response" + item.objectid + "' rows='6' cols='30' minlength='10' maxlength='8000000'>" + ( item.response ? item.response : "" ) + "</textarea></td>" +
						"</tr>" +
						"<tr><th width='50px' class='top'></th><td><input type='button' value='Update' onclick='modifyComments("+item.objectid+",\"update\");'/>&nbsp;&nbsp;<input type='button' value='Delete' onclick='modifyComments("+item.objectid+",\"delete\");'/></td></tr>";
					}else{
						htmlstr +=  
						"<tr><th width='50px' class='top'>Response: </th><td colspan='2'>" + ( item.response ? item.response : "" ) + "</td></tr>" +
						"<tr><th width='50px' class='top'></th><td><input type='button' value='Open Issue' onclick='modifyComments("+item.objectid+",\"open\");'/>";
					}	
					
					htmlstr +=  "</table></div>"; 
															
				} );
				
				$ ( "#managerows" ).html ( htmlstr ); 

				//show comment features
				console.log( $( "#0" ) )
				$( "#0" ).prop( "checked", true ).trigger( "change" ); 
			
			}
			
		}	
	});

}

function modifyComments( objectid, task ){
	var graphic = getGraphics( objectid ),
		featureService = agsServices[ serviceNames.indexOf ( "fmr_comments" ) ];
	
	if( graphic ){
		switch( task ){
			case "open":
				graphic.attributes.status = "open";
				//update feature in feature layer
				featureService.applyEdits( null, [ graphic ], null, function( result ){
					showCommentRows( );
				} );
				break;
		
			case "update":
				/*require ( [ "dojo/request/xhr" ] , function ( xhr ) {	
					graphic.attributes.response = fixSpecialChars( $( "#response" + objectid ).val( ) );
					graphic.attributes.objectid = objectid;

					xhr ( "https://meckags.mecklenburgcountync.gov/server/rest/services/StormWater/FMR/FeatureServer/0/applyEdits", {
						adds: null,
						updates: [ graphic ],
						deletes: null,
						async: true,
						handleAs: "json",
						method: "POST"
					} ).then ( function( data ){
						
						console.log( data )
			
					} );
		
				} );*/

				graphic.attributes.response = fixSpecialChars( $( "#response" + objectid ).val( ) );
				graphic.attributes.objectid = objectid;

				featureService.applyEdits( null, [ graphic ], null )

				

				break;
			case "delete":
				//delete feature in feature layer
				featureService.applyEdits( 
					null, 
					null, 
					[ graphic ], 
					function( result ){
						showCommentRows( );
					}		
				);
				break;	
		}		
	}
}

function zoomToComment( objectid ){
	require( [ "esri/layers/FeatureLayer", "esri/tasks/query" ], function( FeatureLayer, Query ) {
		// create a query to fetch object IDs for all records
		var query = new Query( );
		query.objectIds = [ objectid ];
  		agsServices[ serviceNames.indexOf ( "fmr_comments" ) ].queryFeatures( query, function( featureSet ) {
			//do something with the objectIds here
			map.setLevel( 7 );
			map.centerAt( featureSet.features[0].geometry );

		} );

	} );

}

function getGraphics( objectid ){
	var featureService = agsServices[ serviceNames.indexOf ( "fmr_comments" ) ];

	for ( var i = 0; i < featureService.graphics.length; i++ ) {
	
		if ( featureService.graphics[ i ].attributes.OBJECTID == objectid )
			return featureService.graphics[i];
	}
	
	return null;
}