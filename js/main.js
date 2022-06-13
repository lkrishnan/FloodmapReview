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
	zoomToGraphic = false;

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
				//maxScale: config.max_scale,				
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
					url: config.web_service_local + "v1/ws_sw_ubersearch.php",
					dataType: "jsonp",
					data: {	query: request.term	},
					success: function( data ){
						if( data.length > 0 ){
							response( $.map( data, function( item ){
								return {
									label: item.displaytext,
									gid: item.getid,
									type: item.responsetype,
									table: item.responsetable
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
				backupSearch( );
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
		
		// Initalize manage content form
		showLoginForm( );
				
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
				case "Address":
					finder( { "matid": ui.item.gid } );
					break;
					
				case "PID":
					finder( { "taxpid": ui.item.value, "groundpid": ui.item.gid } );	
					break;
					
				case "GISID": case "Owner":
					if( isGroundPID( ui.item.value ) ){
						finder( { "groundpid" : ui.item.value } );
					}else{
						finder( { "owner" : ui.item.value } );
					}	
					break;
					
				case "Road":
					require( [ "dojo/request", "dojo/dom", "dojo/_base/array", "mojo/SearchResultBoxLite" ], function( request, dom, array, SearchResultBoxLite ){
						request.get( config.web_service_local + "v1/ws_cama_stname_choices.php", {
							handleAs: "json",
							headers: { "X-Requested-With": "" },
							query: { "stname": ui.item.value }
						} ).then( function( camadata ){
							if( camadata.length > 1 ){ //multiple roads with same road name
								var searchResultsContainer = dom.byId( "searchresultscont" );
						
								//list results
								query( "#searchresultscont" ).innerHTML( "<h5><span class = 'note'>Did you mean?</span></h5>" );
								
								camadata.forEach( function( item, i ){
									var widget = new SearchResultBoxLite( {
										idx: i + 1,
										displaytext: format.address ( "", item.prefix, item.street_name, item.road_type, 
											item.suffix, "", format.jurisdisplay(item.municipality), "", "" ), 
										params: {
											stprefix: ( ( item.prefix ) ?  item.prefix : null ),
											stname: ( ( item.street_name ) ?  item.street_name : null ),
											sttype: ( ( item.road_type ) ?  item.road_type : null ),
											stsuffix: ( ( item.suffix ) ?  item.suffix : null ), 
											stmuni: ( ( item.municipality ) ?  format.jurisdisplay ( item.municipality ) : null ) 
										}, 
										address: item.address,
										onClick: finder
									} ).placeAt( searchResultsContainer );
								} );
											
								//hide and show appropriate divs		
								query( "#riskcont, #propinfocont, #errorcont" ).addClass( "hidden" );
								query( "#searchresultscont" ).removeClass( "hidden" ); 	
								
								//show search results div
								showSidebar( "propcont", "proptoggle" );
							}else if( camadata.length > 0 ){ //proceed with search
								finder( { 
									"stprefix": null, 
									"stname": ui.item.value, 
									"sttype": "", 
									"stsuffix": "", 
									"stmuni": ""
								} );
							}
						} );
					} );
					break;
					
				case "Intersection":
					require( [ "dojo/request", "dojo/_base/lang" ] , function( request, lang ){
						request.get( config.web_service_local + "v1/ws_geo_roadintersection.php", {
							handleAs: "json",
							headers: { "X-Requested-With": "" },
							query: {
								"street1": lang.trim ( ui.item.value.substring ( 0, ui.item.value.indexOf ( "&" ) ) ),
								"street2": lang.trim ( ui.item.value.substring ( ui.item.value.indexOf ( "&" ) + 1, ui.item.value.length ) ),
								"srid" : "2264"
							}
						} ).then( function( roaddata ){
							if( roaddata.length > 0 ){ //publish location
								require( [ "dojo/_base/connect" ], function( connect ){
									connect.publish( "/add/graphics", { 
										"y" : roaddata[ 0 ].y, 
										"x" : roaddata[ 0 ].x, 
										"label" : ui.item.gid 
									} );
								} );
							}
						} );
					} );
					break;
				
				case "Library": case "Park": case "School": case "CATS": case "Business":	
					// Set list of fields to retrieve from POI Layers
					var poiFields = {
						"libraries" : "ST_X(the_geom) as x, ST_Y(the_geom) as y, name || '<br />' || address AS label",
						"schools_2013" : "ST_X(geom) as x, ST_Y(geom) as y, coalesce(school_name,'') || '<br/>Type: ' || coalesce(type,'') || ' School<br />' || coalesce(address,'') AS label",
						"parks" : "ST_X(the_geom) as x, ST_Y(the_geom) as y, prkname || '<br />Type: ' || prktype || '<br />' || prkaddr AS label",
						"cats_light_rail_stations" : "ST_X(the_geom) as x, ST_Y(the_geom) as y, name as label",
						"cats_park_and_ride" : "ST_X(the_geom) as x, ST_Y(the_geom) as y, NAME || '<br />Routes ' || routes || '<br />' || address AS label",
						"businesswise_businesses": "ST_X(the_geom) as x, ST_Y(the_geom) as y, company || '<br />' || address || '<br />' || city || ' ' || state || ' ' || zip as label"
					};
					
					require( [ "dojo/request" ], function( request ){
						requets.get( config.web_service_local + "v1/ws_attributequery.php", {
							handleAs: "json",
							headers: { "X-Requested-With": "" },
							query: {
								"table" : ui.item.table,
								"source": "opensource",
								"fields" : poiFields[ ui.item.table ],
								"parameters" : "gid = " + ui.item.gid
							}
						} ).then( function( gisdata ){
							if( gisdata.length > 0 ){ //publish location
								require( [ "dojo/_base/connect" ], function( connect ){
									connect.publish( "/add/graphics", {
										"y" : gisdata[ 0 ].y, 
										"x" : gisdata[ 0 ].x, 
										"label" : gisdata[ 0 ].label
									} );
								} );
							}
						} );
					} );
					break;
					
			}
		
			//zoom to graphics added to the map
			zoomToGraphic = true; 
			//hide back to results
			query( "#backtoresults" ).addClass( "hidden" );
		} );	
	}
}

function backupSearch( ){
	var searchStr = $( "#searchinput" ).val( ); //get search string from the search box
			
	$( "#searchinput" ).catcomplete( "close" );
	
	require( [ "dojo/query", "dojo/NodeList-manipulate" ], function( query ){
		if( isTaxPID( searchStr ) ){
			finder( {"taxpid": searchStr } );	
		}else if( isCNumber ( searchStr ) ){
			finder( { "groundpid": searchStr } );	
		}else{
			var standardizedAddr = getStandardizedAddress( searchStr ).split( "|" );
		
			if( standardizedAddr[ 2 ].length > 0 ){ //atleast a street name is needed
				require( [ "dojo/request", "dojo/dom", "dojo/_base/array", "mojo/SearchResultBoxLite" ] , 
					function( request, dom, array, SearchResultBoxLite ){
						request.get( config.web_service_local + "v1/ws_attributequery.php", {
							handleAs: "json",
							headers: { "X-Requested-With": "" },
							query: {
								table: "masteraddress_pt",
								fields: "num_addr as matid, full_address as address",
								parameters: ( standardizedAddr[ 2 ].length > 0 ? ( standardizedAddr[ 0 ].length > 0 ?  "dmetaphone(nme_street) like dmetaphone('" + standardizedAddr[ 2 ] + "')" : "nme_street like '" + standardizedAddr[ 2 ] + "%'" ) : "" ) +
									( standardizedAddr[ 0 ].length > 0 ? " and txt_street_number = '" + standardizedAddr[ 0 ] + "'" : "" ) +
									( standardizedAddr[ 1 ].length > 0 ? " and cde_street_dir_prfx = '" + standardizedAddr[ 1 ] + "'" : "" ) +
									( standardizedAddr[ 3 ].length > 0 ? " and cde_roadway_type = '" + standardizedAddr[ 3 ] + "'" : "" ) +
									( standardizedAddr[ 4 ].length > 0 ? " and cde_street_dir_suff = '" + standardizedAddr[ 4 ] + "'" : "" ) +
									( standardizedAddr[ 5 ].length > 0 ? " and txt_addr_unit = '" + standardizedAddr[ 5 ] + "'" : "" ) +
									( standardizedAddr[ 6 ].length > 0 ? " and nme_po_city = '" + standardizedAddr[ 6 ] + "'" : "" ) +
									( standardizedAddr[ 8 ].length > 0 ? " and cde_zip1 = '" + standardizedAddr[ 8 ] + "'" : "" ),
								source: "gis"				
							}
						} ).then( function( matdata ){
							if( matdata.length > 1 ){ //publish search results
								var searchResultsContainer = dom.byId( "searchresultscont" );
					
								//list results
								query( "#searchresultscont" ).innerHTML( "<h5><span class = 'note'>Did you mean?</span></h5>" );
								
								matdata.forEach( function( item, i ){
									var widget = new SearchResultBoxLite( {
										idx: i + 1,
										displaytext: item.address,
										params: { matid: item.matid }, 
										onClick: function( boxdata ){
											query( "#backtoresults" ).removeClass( "hidden" );
											finder( boxdata );
										}
									} ).placeAt( searchResultsContainer );
								} );
																
								//show search results div
								showSidebar( "searchresultscont", "proptoggle" );
							}else if( matdata.length > 0 ){
								finder( {"matid": matdata[0].matid } );
							} else {
								badSearch( );
							}
				   		} );
					} 
				);
			}else{ //search string needs to be validated by uber search
				badSearch( );
			}
		}
		
		//zoom to graphics added to map
		zoomToGraphic = true;		
		//hide back to results
		query( "#backtoresults" ).addClass( "hidden" );
	} );
}

function finderhelper( ){
	require( [ "dojo/dom-attr" ], function( domAttr ){	
		finder( {
			"matid" : domAttr.getNodeProp( "matlist", "value" ), 
			"address" : selectedAddress.address, 
			"groundpid" : selectedAddress.groundpid, 
			"taxpid" : selectedAddress.taxpid, 
			"y" : selectedAddress.y, 
			"x" : selectedAddress.x
		} );		
	} );	
}

function finder( data ){
	require( [ "dojo/request", "dojo/_base/connect", "dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/NodeList-manipulate" ] , function( request, connect, array, lang, query ){
		//1. Best case almost ready for publication 
		if( data.matid && data.taxpid && data.groundpid ){
			if( data.matid == -1 ){ //use parcel centroids instead of master address point 
				request.get( config.web_service_local + "v1/ws_attributequery.php", {
					handleAs: "json",
					headers: { "X-Requested-With": "" },
					query: {
						table: "parcels_py",
						fields: "ST_Y( ST_PointOnSurface( shape ) ) as centroidy, ST_X( ST_PointOnSurface( shape ) ) as centroidx, " +
								  "ST_Y( ST_PointOnSurface( ST_Transform( shape, 4326 ) ) ) as centroidlat, " + 
								  "ST_X( ST_PointOnSurface( ST_Transform( shape, 4326 ) ) ) as centroidlon",
						parameters: "pid='" + data.groundpid + "'",
						source: "gis"
					}
				} ).then( function( parceldata ){
					data.matid = null;
					data.address = null;				
					data.y =  parceldata[ 0 ].centroidy; 
					data.x = parceldata[ 0 ].centroidx;
					data.lat = parceldata[ 0 ].centroidlat; 
					data.lon = parceldata[ 0 ].centroidlon;
										
					//publish 
					connect.publish( "/change/selected", data );
					connect.publish( "/add/graphics", data );
					connect.publish( "/set/propinfo", data );
					connect.publish( "/set/riskinfo", data );
				} );
												
			}else if( !( data.x && data.y ) ){ //came from query string find xy and full address of the master address point
				request.get( config.web_service_local + "v1/ws_attributequery.php", {
					handleAs: "json",
					headers: { "X-Requested-With": "" },
					query: {
						table: "masteraddress_pt",
						fields: "full_address as address, ST_Y( shape ) as y, ST_X( shape ) as x, " + 
								  "ST_Y( ST_Transform( shape, 4326 ) ) as lat, ST_X( ST_Transform( shape, 4326 ) ) as lon",
						parameters: "num_addr='" + data.matid + "'",
						source: "gis"
					}
				} ).then( function( matdata ){
					if( matdata.length > 0 ){
						data.address = matdata[ 0 ].address;				
						data.y =  matdata[ 0 ].y; 
						data.x = matdata[ 0 ].x;
						data.lat = matdata[ 0 ].lat; 
						data.lon = matdata[ 0 ].lon;
					
						//publish
						connect.publish( "/change/selected", data );
						connect.publish( "/add/graphics", data );
						connect.publish( "/set/propinfo", data );
						connect.publish( "/set/riskinfo", data );
					}	
				} );
			}else{ 
				//publish
				connect.publish( "/change/selected", data );
				connect.publish( "/add/graphics", data );
				connect.publish( "/set/propinfo", data );
				connect.publish( "/set/riskinfo", data );
			}
		}
			
		// 2. Get ground pid from cama	
		else if( data.matid && data.taxpid ){
			request.get( config.web_service_local + "v1/ws_cama_pidswitcher.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: {
					pid: data.taxpid,
					pidtype: "tax"
				}
			} ).then( function( camadata ){
				if( camadata.length > 0 ){ //kick it back to finder function
					data.groundpid = camadata[ 0 ].common_parcel_id;
					data.taxpid = camadata[ 0 ].parcel_id;					
					finder( data );
				}		
				//else is not handled because its impossible to have no ground pid for a corresponding tax pid
			} );
		}
			
		// 3. Get tax pid from cama
		else if( data.matid && data.groundpid ){
			request.get( config.web_service_local + "v1/ws_cama_situsaddress.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: { pid: data.groundpid }
			} ).then( function( camadata ){
				if( camadata.length > 0 ){ //the passed groundpid exists in cama
					var idx = 0;
					
					if( camadata.length > 1 ){ //some tax pids have alphabets appended after 3 digit numerals
						var sideaddrs = [ ];
						
						camadata.forEach( function( item, i ){
							sideaddrs.push( item.house_number + "|" + item.street_name );
						} );
						
						//find the best matching tax pid by comparing the master address and situs address
						idx = getBestMatchingAddr( data.address, sideaddrs );			
					}
					data.taxpid = camadata[ idx ].parcel_id;
					finder( data );
				}else{ //ground pid doesn't exist in cama
					badSearch( );
				}	
			} );
		}
			
		//4. Get matid by intersecting parcel layer with master address table 
		else if( data.groundpid && data.taxpid ){
			request.get ( config.web_service_local + "v1/ws_geo_featureoverlay.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: 
				{
					"from_table" : "parcels_py",
					"to_table" : "masteraddress_pt",
					"fields" : "f.pid as groundpid, t.num_addr as matid, t.full_address as address, t.num_parent_parcel as parcel_id, " +
								"ST_Y( t.shape ) as y, ST_X( t.shape ) as x, " + 
								"ST_Y( ST_Transform ( t.shape, 4326 ) ) as lat, ST_X( ST_Transform( t.shape, 4326 ) ) as lon",
					"parameters" : "f.pid='" + data.groundpid + "'",
					source: "gis"		
				}
			} ).then( function( gisdata ){
				data.matid = -1;
				data.address = null; 
				data.y = null; 
				data.x = null;
				data.lat = null;
				data.lon = null;
				
				if( gisdata.length > 0 ){
					var idx = 0;
				
					if( data.groundpid != data.taxpid ){ //its a condo
									
						gisdata.forEach( function( item, i ){
							if( item.parcel_id == guessPIDinMAT( data.taxpid, data.groundpid ) ){
								idx = i;
								return false;
							}	
						} );
					}
					
					data.matid = gisdata[ idx ].matid;
					data.address = gisdata[ idx ].address;
					data.y = gisdata[ idx ].y; 
					data.x = gisdata[ idx ].x;
					data.lat = gisdata[ idx ].lat; 
					data.lon = gisdata[ idx ].lon;
				} 
				
				finder( data );
			} );
		}
			
		//5. Probably control came form a map identify, find the groundpid based on latlon 
		else if( data.y && data.x ){
			request.get ( config.web_service_local + "v1/ws_geo_pointoverlay.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: {
					x: data.x,
					y: data.y,
					geometryfield: "shape",
					srid: "2264",
					table: "parcels_py",
					fields: "pid as groundpid",
					source: "gis"
				}
			} ).then( function( parceldata ){
				if( parceldata.length == 1 ){ //kick it back to finder function
					finder( { "groundpid": parceldata[ 0 ].groundpid } );
				}else{ //no parcel intersects identify point
					badSearch( );	
				}
			} );
		}
		
		//6. Probably control came from a master address search, find groundpid by intersecting with parcel layer
		else if( data.matid ){ 
			request.get( config.web_service_local + "v1/ws_geo_featureoverlay.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: {
					from_table: "masteraddress_pt",
					to_table: "parcels_py",
					from_geometryfield: "shape",
					to_geometryfield: "shape",
					fields: "f.full_address as address, f.num_parent_parcel as pid_mat, t.pid as groundpid, " +
								"ST_Y( f.shape ) as y, ST_X( f.shape ) as x," + 
								"ST_Y( ST_Transform( f.shape, 4326 ) ) as lat, ST_X( ST_Transform( f.shape, 4326 ) ) as lon",
					parameters: "f.num_addr='" + data.matid + "'",
					source: "gis"		
				}
			} ).then( function( gisdata ){
				if( gisdata.length > 0 ){
					if( isCNumber( gisdata[ 0 ].groundpid ) ){ //if ground pid has C the pid attached to the MAT point is King
						if( isCNumber( gisdata[ 0 ].pid_mat ) ){ //the pid attached to MAT has a C so matid is useless, kick it back to finder function
							finder( { "groundpid": gisdata[ 0 ].groundpid } );
						}else{ //kick it back to finder function
							/*data.address = gisdata[ 0 ].address; 
							data.taxpid = gisdata[ 0 ].pid_mat; 
							data.y = gisdata[ 0 ].y; 
							data.x = gisdata[ 0 ].x;
							data.lat = gisdata[ 0 ].lat; 
							data.lon = gisdata[ 0 ].lon;*/ 	
							finder( { groundpid: gisdata[ 0 ].groundpid } );
						}		
					}else{ //kick it back to finder function 
						data.address = gisdata[ 0 ].address; 
						data.groundpid = gisdata[ 0 ].groundpid; 
						data.y = gisdata[ 0 ].y; 
						data.x = gisdata[ 0 ].x;
						data.lat = gisdata[ 0 ].lat; 
						data.lon = gisdata[ 0 ].lon; 	
							
						finder( data );
					}
				}else{ //no parcel intersects mat point
					badSearch( );
				}
			} );
		}
			
		//7. Go to cama and get ground pid
		else if( data.taxpid ){
			request.get( config.web_service_local + "v1/ws_cama_pidswitcher.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: {
					"pid" : data.taxpid,
					"pidtype" : "tax"		
				}
			} ).then( function( camadata ){
				if( camadata.length > 0 ){
					data.groundpid = camadata[ 0 ].common_parcel_id; 
					finder( data );
				}else{ //tax pid is not found in cama. can happen if a bad pid comes from the master address table
					badSearch( );
				}	
			} );
		}
			
		//8. Query cama based on passed parameter(s) 
		else if( data.groundpid || data.owner || data.stname ){
			request.get( config.web_service_local + "v1/ws_owner_compid.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: 
				{
					compid: ( data.groundpid ? data.groundpid : ""),
					lastname: ( data.owner ? $.trim( data.owner.substring( 0, data.owner.indexOf( "," ) ) )  : "" ),
					firstname: ( data.owner ? $.trim( data.owner.substring( data.owner.indexOf( "," ) + 1, data.owner.length ) )  : "" ),
					stprefix: ( data.stprefix ? data.stprefix : "" ),
					stname: ( data.stname ? data.stname : "" ),
					sttype: ( data.sttype ? data.sttype : "" ),
					stsuffix: ( data.stsuffix ? data.stsuffix : "" ),
					stmuni: ( data.stmuni ? data.stmuni : "" )					
				}
			} ).then( function( camadata ){
				if( camadata.length == 1 ){	//kick it back to finder function	
					finder( {
						"taxpid": camadata[ 0 ].pid.trim( ), 
						"groundpid": camadata[ 0 ].common_pid.trim( )
					} );	
				}else if( camadata.length > 1 ){ //more taxpids associated with ground pid show results for user to select manually	
					require( [ "dojo/dom", "mojo/SearchResultBoxLite" ], function( dom, SearchResultBoxLite ){
						var searchResultsContainer = dom.byId( "searchresultscont" );
					
						query( "#searchresultscont" ).innerHTML( "<h5><span class = 'note'>Are you looking for?</span></h5>" );
					
						camadata.forEach( function ( item, i ){
							var widget = new SearchResultBoxLite( {
								idx: i + 1,
								displaytext : "<div><b>Parcel ID:</b>&nbsp;" + item.pid + "</div>" + 
									"<div>" + 
										format.address ( item.house_number, item.prefix, item.street_name, item.road_type, 
											item.suffix, item.unit, format.jurisdisplay ( item.municipality ), "", "" ) + 
									"</div>" +
									"<div><b>Ownership:</b></div>" + 
									"<div>" + format.ownerlist ( item.owner_names ) + "</div>",
								params: { taxpid: lang.trim ( item.pid ), groundpid: lang.trim ( item.common_pid ) },
								onClick: function ( boxdata ) {
									query ( "#backtoresults" ).removeClass ( "hidden" );
									finder ( boxdata );
								}
							} ).placeAt ( searchResultsContainer );	
						} );
						
						//hide and show appropriate divs		
						query( "#errorcont, #propinfocont" ).addClass( "hidden" );
						query( "#searchresultscont" ).removeClass( "hidden" ); 	
						
						//show search results div
						showSidebar ( "propcont", "proptoggle" );
					} );
				}else{ //no records in cama match search string
					if( data.stname ){ //zoom to the centroid of the road
						request.get( config.web_service_local + "v1/ws_geo_getcentroid.php", {
							handleAs: "json",
							headers: { "X-Requested-With": "" },
							query: {
								table: "roads",
								srid: "2264",
								parameters: "streetname='" + data.stname + "' order by ll_add limit 1"	
							}
						} ).then( function( roaddata ){
							if( roaddata.length > 0 ){ //publish location
								connect.publish( "/add/graphics", {
									"y": roaddata[ 0 ].y, 
									"x": roaddata[ 0 ].x, 
									"label": data.stname
								} );
							}else{ //tax pid is not found in cama. can happen if a bad pid comes from the master address table
								badSearch( );
							}	
						} );
					}else{ //invalid groundpid or owner name
						badSearch( );
					}
				}
			} );
		}
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
		var params = ioQuery.queryToObject( Hash() ),
		finderparams = { };
				
		if( params.matid ){ 				 
			if( isNumeric( params.matid ) ){ 
				finderparams.matid =  params.matid;
			}
		}			
	
		if( params.taxpid ){
			if( isTaxPID( params.taxpid ) ){
				finderparams.taxpid =  params.taxpid;
			}
		}

		if( params.groundpid ){
			if( isGroundPID( params.groundpid ) ){
				finderparams.groundpid =  params.groundpid;
			}
		}	
										
		if( finderparams.matid || finderparams.taxpid || finderparams.groundpid ){
			if( selectedAddress && !( selectedAddress.matid == finderparams.matid && selectedAddress.taxpid == finderparams.taxpid && selectedAddress.groundpid == finderparams.groundpid ) ){
				finder ( finderparams );
				zoomToGraphic = true;	//zoom to graphics added to map	
			}	
		}
				
		Connect.subscribe( "/dojo/hashchange", function( newHash ){
			var params = ioQuery.queryToObject( newHash );
			
			if( !( selectedAddress.matid == params.matid && 
				selectedAddress.taxpid == params.taxpid && selectedAddress.groundpid == params.groundpid ) ){
				finder( params );
				zoomToGraphic = true;	//zoom to graphics added to map	
				
			}	
									
		} );
														
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
				taxpid: data.taxpid, 
				groundpid: data.groundpid 
			} ) );
		} );
	}
}

/*  Set property information  */
function setPropInfo( data ){
	//get property ownership information
	require ( [ "esri/tasks/query", "esri/tasks/QueryTask", 
		"dojo/promise/all","dojo/Deferred", "dojo/request",
		"dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/NodeList-manipulate" ] , function( esriquery, QueryTask, all, Deferred, request, array, lang, query ){
		//set variable
		var ffe = "NA", lag = "NA";
		var qry = new esriquery( ),
			riskQueryTask = new QueryTask( config.identify_services.idoverlays.url + "/16" );
				
		qry.where = "pid = '" + data.groundpid + "'";
		qry.returnGeometry = false;
		qry.outFields = [ "riskchange", "floodsource", "eff_flood_zone", "pmr4_flood_zone", "mapchange", "wsel_eff", "wsel_pmr4", "wsel_change" ];
		
		
		//reset
		query ( "#propkey" ).innerHTML ( "");
		$ ( '.cycle-slideshow' ).html( '' ).cycle ( 'reinit' );
	
		all( [
			request.get( config.web_service_local + "v1/ws_cama_ownership.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: { "pid": data.taxpid, "pidtype": "tax" }
			} ),
			request.get( config.web_service_local + "v1/ws_cama_legal.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: { pid: data.taxpid }
			} ),
			request.get( config.web_service_local + "v1/ws_misc_house_photos.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: { pid : data.taxpid, photo_source: "ilookabout" }
			} ),
			request.get( config.web_service_local + "v1/ws_elev_data.php", {
				handleAs: "json",
				headers: { "X-Requested-With": "" },
				query: {
					"source": "ec_v2",
					"tax_pid" : guessPIDinMAT( data.taxpid, data.groundpid )
				}
			} ),
			riskQueryTask.execute( qry )	
		] ).then( function( results ){
			var camadata = results[ 0 ],
				legaldata = results[ 1 ],
				photos = results[ 2 ],
				elevdata = results[ 3 ],
				riskdata = results[ 4 ];
						
			if( camadata.length > 0 ){ //publish location
				//format the owner name
				var owners = [ ], 
					ownerhtml = "";
				
				camadata.forEach( function( item, i ){
					owners.splice( parseInt( item.owner_number, 10 ) - 1, 0, 
						format.ownership( [ item.last_name, item.first_name ] ) );
				} );
				
				for( var i = 0; i < owners.length; i++ ){
					ownerhtml += ( ( i > 0) ? "</br>" : "" ) + ( i + 1 ) + ". " + owners[ i ];
				}
					
				if( data.groundpid == data.taxpid ){ //get other address points associated with ground parcel
					request.get( config.web_service_local + "v1/ws_geo_featureoverlay.php", {
						handleAs: "json",
						headers: { "X-Requested-With": "" },
						query: { 
							from_table: "tax_parcels",
							to_table: "master_address_table",
							from_geometryfield: "the_geom",
							to_geometryfield: "the_geom",
							fields: "t.objectid as matid,t.num_parent_parcel as parcel_id,t.full_address as address", 
							parameters: "f.pid='" + data.groundpid + "'",
							source: "opensource" 
						}
					} ).then( function( matdata ){
						var addrhtml = "";
						
						if( matdata.length > 1 ){
							matdata.forEach( function( item, i ){
								if( item.parcel_id == data.taxpid ){
									addrhtml += "<option value='" + item.matid + "' " + 
										( ( item.matid == data.matid ) ? "selected='selected'" : "" ) + ">" + 
										( ( lang.trim ( item.address ).length > 0 ) ? item.address : "Unavailable" ) + "</option>";
								}
							} );
							
							if( lang.trim ( addrhtml ).length > 0 ){
								addrhtml = "<select id='matlist' style='width:100%;' onchange='finderhelper();'>" +
								addrhtml + "</select>";
							}else{
								addrhtml = ( data.address ? data.address : "NA" );
							}
						}else{ 
							addrhtml = ( data.address ? data.address : "NA" );
						}

						query( "#propkey" ).append(
							"<table class='proptbl'>" +
								"<tr>" + 
									"<th>Parcel ID</th><td>" + data.taxpid + "</td>" + 
								"</tr>"+
								"<tr>" + 
									"<th>Address</th><td>" + addrhtml + "</td>" + 
								"</tr>" + 
								"<tr>" + 
									"<th class='top'>Ownership</th><td>"+ownerhtml+"</td>" + 
								"</tr>"+
								"<tr>" + 
									"<td colspan='2' class='center'>" + 
										"<a href='http://polaris3g.mecklenburgcountync.gov/#/" + data.taxpid + "' target='_blank'>Polaris 3G</a>" +
										"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + 
										"<a href='https://property.spatialest.com/nc/mecklenburg/#/property/" + ( legaldata.length > 0 ? legaldata[ 0 ].account_no : "" ) + "' target='_blank'>Tax Value & Bldg Info</a>" + 
										"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + 
										"<a href='http://meckmap.mecklenburgcountync.gov/3dfz/#" + 
											"matid=" + ( data.matid ? data.matid : "" ) + 
											"&taxpid=" + ( data.taxpid ? data.taxpid : "" ) + 
											"&groundpid=" + ( data.groundpid ? data.groundpid : "" ) +
											"' target='_blank'>3D Floodzone</a>" +
									"</td>" + 
								"</tr>" +								
							"</table>" );							
					} );
				}else{
					query( "#propkey" ).append(
						"<table class='proptbl'>" +
							"<tr>" + 
								"<th class='top'>Parcel ID</th><td>" + data.taxpid+"</td>" + 
							"</tr>"+
							"<tr>" + 
								"<th class='top'>Address</th><td>" + ( data.address ? data.address : "NA" ) + "</td>" + 
							"</tr>" + 
							"<tr>" + 
								"<th class='top'>Ownership</th><td>" + ownerhtml + "</td>" + 
							"</tr>" +
							"<tr>" + 
								"<td colspan='2' class='center'>" + 
									"<a href='http://polaris3g.mecklenburgcountync.gov/#/" + data.taxpid + "' target='_blank'>Polaris 3G</a>" +
									"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + 
									"<a href='https://property.spatialest.com/nc/mecklenburg/#/property/" + ( legaldata.length > 0 ? legaldata[ 0 ].account_no : "" ) + "' target='_blank'>Tax Value & Bldg Info</a>" + 
									"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + 
										"<a href='http://meckmap.mecklenburgcountync.gov/3dfz/#" + 
											"matid=" + ( data.matid ? data.matid : "" ) + 
											"&taxpid=" + ( data.taxpid ? data.taxpid : "" ) + 
											"&groundpid=" + ( data.groundpid ? data.groundpid : "" ) +
											"' target='_blank'>3D Floodzone</a>" +
								"</td>" + 
							"</tr>" +
						"</table>" );	
				}
			}

			//set property photo
			if( photos.length > 1 ){
				$ ( ".cycle-slideshow" ).append ( "<div class='cycle-prev'></div><div class='cycle-next'></div>" );
			}
					
			if( photos.length > 0 ){
				photos.forEach( function( item, i ){
					if( item.photo_url.trim( ).length > 0 ){
						//if the property photo exisits at the location add it
						imageExists( item.photo_url, function( exists ){
							if( exists ){
								if( item.attribution === "Historic"){
							
									var imgdate = item.photo_date;

									$( ".cycle-slideshow" ).cycle( "add", "<img src='" + item.photo_url + "' " +
										"alt='<i>Photo Date: " + imgdate.substring( 4, 6 ) + "/" + imgdate.substring( 6, 8 ) + "/" + imgdate.substring( 0, 4 ) + " Source: " + item.attribution + "</i>" +
										( photos.length > 1 ? "</br>Hover over left / right of photo to goto prev / next." : "" ) + "'/>" );
								}else{ 
									var imgdate = item.photo_date;

									$( ".cycle-slideshow" ).cycle( "add", "<img src='" + switchQueryParams( item.photo_url, { w: 600, h: 450 } ) + "' " +
										"alt='<i>Photo Date: " + imgdate.substring( 4, 6 ) + "/" + imgdate.substring( 6, 8 ) + "/" + imgdate.substring( 0, 4 ) + " Source: " + item.attribution + "</i>" +
										( photos.length > 1 ? "</br>Hover over left / right of photo to goto prev / next." : "" ) + "'/>" );
								}
								
							}
							
						} );
							
					}
				} );	
			}		
			
			//set google streetview link
			if( data.address ){
				query( "#streetviewlink" ).innerHTML( "<span>Use <a href='https://www.google.com/maps/place/" + data.address + "' target='_blank'>Google Street View</a> for more recent property photo.</span>" );
			}	
				
			//set birdseye view link
			query( "#birdseyelink" ).innerHTML( "<span>Jump to <a href='http://maps.co.mecklenburg.nc.us/meckscope/?lat=" + data.lat + "&lon=" + data.lon + "' target='_blank'>45&deg; view</a> (<span class='note'>Pictometry Oblique Imagery</span>).</span>" );

			//set risk content
			if( elevdata.length > 0 ){
				ffe = parseFloat( elevdata[ 0 ].ffe ); 
				lag = parseFloat( elevdata[ 0 ].lag );
			}
			console.log( riskdata )
			if( riskdata.features.length > 0 ){
				console.log( "here" )
				field_values = riskdata.features[ 0 ].attributes;
				query( "#riskcont" ).innerHTML( "<h5>Flood Risk Information</h5>" );
				query( "#riskcont" ).append( boxit( riskfacts.updatedfloodrisk.fact, riskfacts.updatedfloodrisk.icon, "icont", [ field_values.RiskChange ] ) );
				
				query( "#riskcont" ).append( "<h5>Flood Zone</h5>" );
				query( "#riskcont" ).append( 
					"<div class='icont'>" + 
						"<table id='firmtable' class='proptbl'>" + 
							"<tr><th>Current</th><td>" + field_values.EFF_FLOOD_ZONE + "</td></tr>" +
							"<tr><th>Proposed</th><td>" + field_values.PMR4_FLOOD_ZONE + "</td></tr>" +
							"<tr><td colspan='2'>" + field_values.MapChange + "</td></tr>" +
						"</table>" + 
					"</div>" );

				query( "#riskcont" ).append( "<h5>Building Flood Elevation Information (ft)*</h5>" );
				query( "#riskcont" ).append( 
					"<div class='icont'>" + 
						"<table id='firmtable' class='proptbl'>" + 
							"<tr><th>Current FEMA Flood Elevation</th><td>" + ( field_values.WSEL_EFF ? format.number( field_values.WSEL_EFF, 1 ) : "N/A" ) + "</td></tr>" +
							"<tr><th>Proposed FEMA Flood Elevation</th><td>" + ( field_values.WSEL_PMR4 ? format.number( field_values.WSEL_PMR4, 1 ) : "N/A" ) + "</td></tr>" +
							"<tr><th>Flood Elevation Change</th><td>" + ( field_values.WSEL_CHANGE ? format.number( field_values.WSEL_CHANGE, 1 ) : "N/A" ) + "</td></tr>" +
							"<tr><th>Lowest Finished Floor Elevation</th><td>" + ( ffe ? format.number( ffe, 1 ) : "N/A" ) + "</td></tr>" +
							"<tr><th>Lowest Ground Elevation at Building</th><td>" + ( lag ? format.number( lag, 1 ) : "N/A" ) + "</td></tr>" +
							"<tr><td colspan='2'><span class='note'>*Based upon best available information</span></td></tr>" +
						"</table>" + 
					"</div>" );
				query( "#riskcont" ).append( "<h5>About Flood Risk Info</h5>" );	
				query( "#riskcont" ).append( boxit( riskfacts.zero.fact, riskfacts.zero.icon, "icont" ) );
				query( "#riskcont" ).append( boxit( riskfacts.one.fact, riskfacts.one.icon, "icont" ) );
				query( "#riskcont" ).append( boxit( riskfacts.two.fact, riskfacts.two.icon, "icont" ) );
				query( "#riskcont" ).append( boxit( riskfacts.three.fact, riskfacts.three.icon, "icont" ) );

				query( "#riskcont" ).removeClass( "hidden" );
			}else{
				query( "#riskcont" ).addClass( "hidden" ); 			
			}	
		} );
									
		//hide and show appropriate divs		
		query( "#errorcont, #searchresultscont" ).addClass( "hidden" );
		query( "#propinfocont" ).removeClass( "hidden" ); 			
				
		//show property container
		showSidebar ( "propcont", "proptoggle" );  
	} );	
}

function showLoginForm( ){
	var fmrlogin = "",
		fmrpwd = "",
		loginhtml = "";
	
	if( window.localStorage ){
		if( localStorage.getItem( "fmrlogin" ) ){
			fmrlogin = localStorage.getItem( "fmrlogin" );
			fmrpwd = localStorage.getItem( "fmrpwd" );
			loginhtml = "<tr><td colspan='2'><a href='javascript:void(0);' onclick='forgetlogin();'>Forget me</a></td></tr>";
		}else{
			loginhtml = "<tr><td colspan='2'><input type='checkbox' id='signincbx' class='cbx' checked/>&nbsp;Remember me on this computer</td></tr>";
		}	
	}
	
	$( "#managelogin" ).html( 
		"<table>" + 
			"<tr><td>Login</td><td><input name='myusername' type='text' id='myusername' value='" + fmrlogin + "' style='width:100px;'></td></tr>" +
			"<tr><td>Password</td><td><input name='mypassword' type='password' id='mypassword' value='" + fmrpwd + "' style='width:100px;'></td></tr>" +
			loginhtml + 
			"<tr><td colspan='2'><input type='button' id='signinbtn' value='Sign In' onclick='signIn();'/></td></tr>" + 
		"</table>"
	);
}

function signIn( ){
	$.ajax( {
		url: config.web_service_local + "v1/fmrlogin.php",
		type: "POST",
		dataType: "jsonp",
		data: {
			"login" : $ ( "#myusername" ).val(),
			"pwd": $ ( "#mypassword" ).val()
		},
		success: function( data ){
			if( data.success ){
				
				signedin = true;
				
				if ( window.localStorage ) {
					
					if ( $ ( "#signincbx" ).is ( ":checked" ) ) {
						
						localStorage.setItem ( "fmrlogin", $ ( "#myusername" ).val() );
						localStorage.setItem ( "fmrpwd", $ ( "#mypassword" ).val() );
					}
					
				}	
				
				$ ( "#managelogin" ).html ( "<table><tr><td class='right'><a href='javascript:void(0);' onclick='signOut();'>Signout</a></td></tr></table>" );
				
				//add comment records
				showCommentRows();
				
				//show comment features
				$ ( "#0" ).prop ( "checked", true ).trigger( "change" ); 
			
			} else {
			
				$ ( "#managelogin" ).append ( "<div class='cont note'>The login or password is incorrect. Please try again.</div>" );
				$ ( "#myusername" ).val( "" );
				$ ( "#mypassword" ).val ( "" );
			
			}
			
		}
		
	} );
		
}

function signOut( ){
	signedin = false;
	$( "#managerows" ).html( "" );
	showLoginForm( );
	//hide comment features
	$( "#0" ).prop( "checked", false ).trigger( "change" ); 
}

function forgetlogin( ){
	$( "#myusername" ).val( "" );
	$( "#mypassword" ).val( "" );
	
	localStorage.removeItem( "fmrlogin" );
	localStorage.removeItem( "fmrpwd" );
	
	showLoginForm( );

}

function showCommentRows( ){
	$.ajax ( {
		url : config.web_service_local + "v1/ws_attributequery.php",
		type : "GET",
		dataType : "jsonp",
		data: {
			table: "sde.floodmap_review_pt",
			fields: "objectid, name, email, dateenter, status, comment, response",
			parameters: "dateenter>'08/31/2016'",
			source: "floodmitigation"
		},
		success: function ( data ) {
			if ( data.length > 0 ) {
			
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
			
			}		
			
		}	
	});

}

function modifyComments( objectid, task ){
	var graphic = getGraphics ( objectid ),
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
				graphic.attributes.response = fixSpecialChars( $( "#response" + objectid ).val( ) );
				graphic.attributes.status = "close";
		
				//update feature in feature layer
				featureService.applyEdits( 
					null, 
					[ graphic ], 
					null, 
					function( result ){
						//send out email notification
						sendemail( 
							graphic.attributes.email, 
							"The comment you submitted has been reviewed", 
							"The comment you submitted:\n\n" +
								graphic.attributes.comment + "\n\n" +
								"Charlotte-Mecklenburg Storm Water Service response:\n\n" +
								graphic.attributes.response + "\n\n" +
								"For further clarifications contact Salih.Iddrisu@MecklenburgCountyNC.gov" 
						);
						
						showCommentRows( );
					}		
				);
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