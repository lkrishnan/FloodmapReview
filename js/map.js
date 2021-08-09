function basemapInit( ){
	require( [ "esri/dijit/Basemap", "esri/dijit/BasemapGallery", "esri/dijit/BasemapLayer", "esri/tasks/GeometryService" ], function( Basemap, BasemapGallery, BasemapLayer ){
		var cachelayers = [ ];

		//add basemaps and gallery control
		for( var basemap in config.tiled_services ){
			cachelayers.push( new BasemapLayer( { url: config.tiled_services [ basemap ].url } ) );
		}		
		
		//add basemap gallery
		basemapgallery = new BasemapGallery( { 
			showArcGISBasemaps : false, 
			basemaps : [
				new Basemap( {	"id": "streets", layers: [ cachelayers[ 0 ] ] } ), 
				new Basemap( { "id": "aerial", layers: [ cachelayers[ 1 ], cachelayers[ 2 ] ] } ),
				new Basemap ( { "id": "topo", layers: [ cachelayers[ 3 ], cachelayers[ 2 ] ] } )  
			], 
			map : map 
		} );
		
		//add basemap toggle and toggle event
		$( "#basemaptoggle" ).append ( 
			"<input type = 'radio' id = 'streetstoggle' name = 'basemaptoggle-button' value = 'streets' checked />" +
			"<label for = 'streetstoggle'>Streets</label>" +
			"<input type = 'radio' id = 'aerialstoggle' name = 'basemaptoggle-button' value = 'aerial' />" +
			"<label for='aerialstoggle'>Aerials</label>" +
			"<input type = 'radio' id = 'topotoggle' name = 'basemaptoggle-button' value = 'topo' />" +
			"<label for='topotoggle'>Topo</label>"
		);	
		$( "#basemaptoggle" ).buttonset( );	
		$( "#basemaptoggle input:radio" ).click( function( ){
			var floodzoneService = agsServices[ serviceNames.indexOf ( "floodzones" ) ],
				overlayService = agsServices[ serviceNames.indexOf ( "overlays" ) ];
		
			basemapgallery.select( $(this).val( ) );
			
			switch( basemapgallery.getSelected( ).id ){
				case "streets":
					//remove yellow building outlines
					alterVisibleLayersInService( overlayService, [ 11 ], "remove" );
					//add black parcel and building outlines
					alterVisibleLayersInService( overlayService, [ 10, 12 ], "add" );
					//add black depth grid outlines
					if( $( "#3d_floodzone" ).prop( "checked" ) ){
						alterVisibleLayersInService( floodzoneService, [ $ ( "#3dctrl" ).slider ( "option", "value" ) - 16, $ ( "#3dctrl" ).slider ( "option", "value" ) ], "replace" );
					} 
					//adjust floodmaps dynamic map service's opacity				
					floodzoneService.setOpacity( 1.0 );
					break;
					
				case "aerial": case "topo":
					//remove black parcel and building outlines
					alterVisibleLayersInService( overlayService, [ 10, 12 ], "remove" ); 
					//add yellow building outlines
					alterVisibleLayersInService( overlayService, [ 11 ], "add" ); 
					//add yellow depth grid outlines
					if( $ ( "#3d_floodzone" ).prop( "checked" ) ){
						alterVisibleLayersInService ( floodzoneService, [ $ ( "#3dctrl" ).slider ( "option", "value" ) - 8, $ ( "#3dctrl" ).slider ( "option", "value" ) ], "replace" );
					}
					
					//adjust floodmaps dynamic map service's opacity
					floodzoneService.setOpacity( 0.5 ); 				
					break;
			}
		} );
	} );		
}

function serviceInit( ){
	require ( [ "esri/layers/ArcGISDynamicMapServiceLayer", "esri/InfoTemplate", "esri/layers/FeatureLayer", "esri/layers/GraphicsLayer", 
		"esri/renderers/SimpleRenderer", "esri/symbols/PictureMarkerSymbol", "esri/symbols/SimpleLineSymbol","esri/tasks/IdentifyTask", "dojo/_base/Color" ], function( ArcGISDynamicMapServiceLayer, InfoTemplate, 
			FeatureLayer, GraphicsLayer, SimpleRenderer, PictureMarkerSymbol, SimpleLineSymbol, IdentifyTask, Color ){
			var srvc,	
				symbols = {
					"fmr_comments": new PictureMarkerSymbol ( "image/comments.png", 32, 32 ),
					"loma_points": new PictureMarkerSymbol ( "image/loma.png", 32, 32 ), 
					"firm_ref_points": new PictureMarkerSymbol ( "image/circle_cross.png", 40, 40 ),  
					"xsections_preliminary" : new SimpleLineSymbol ( SimpleLineSymbol.STYLE_SOLID, new Color ( [ 248, 236, 0 ] ), 4 ),
					"xsections": new SimpleLineSymbol ( SimpleLineSymbol.STYLE_SOLID, new Color ( [ 255,0,0 ] ), 4 )
				};
									
			//add dynamic map services
			for( var dynamic_service in config.dynamic_services ){
				srvc = new ArcGISDynamicMapServiceLayer ( config.dynamic_services [ dynamic_service ].url, 
					{ "id" : dynamic_service, "opacity" : config.dynamic_services [ dynamic_service ].opacity } );
				srvc.setVisibleLayers ( config.dynamic_services [ dynamic_service ].visiblelyrs );
				agsServices.push ( srvc );
				serviceNames.push ( dynamic_service ); //store dynamic service name for future usage
				
			}
						
			//add feature map services
			for( var feature_service in config.feature_services ){
				srvc = new FeatureLayer( config.feature_services [ feature_service ].url , {
						mode: FeatureLayer.MODE_ONDEMAND,
						outFields: config.feature_services [ feature_service ].fields,
						infoTemplate: new InfoTemplate ( config.feature_services [ feature_service ].popupTitle, 
							config.feature_services [ feature_service ].popupTemplate )
					}
				);
				srvc.setRenderer ( new SimpleRenderer ( symbols [ feature_service ] ) );
				srvc.setVisibility ( config.feature_services [ feature_service ].visible );
				agsServices.push ( srvc );
				serviceNames.push ( feature_service ); //store dynamic service name for future usage
				
			}
		
			//add graphic layer
			agsServices.push( new GraphicsLayer( ) );
			serviceNames.push( "selection" ); //store dynamic service name for future usage
		
			//add spatial services to the map
			map.addLayers( agsServices );
					
			//initialize identification services
			for( var identify_service in config.identify_services ){
				agsServices.push( new IdentifyTask ( config.identify_services [ identify_service ].url ) );
				serviceNames.push( identify_service );
			}
		} 
	);
}

function mapCtrlsInit( ){
	require ( [ 
		"dojo/_base/array", 
		"dojo/query", 
		"dojo/NodeList-manipulate" ] , 
		function ( array, query ) {
		
			//create the overlay switcher
			var htmlstr = "";
			array.forEach ( config.overlay_controls, function ( item, i ) {
			
				htmlstr +=
					"<li><input type = 'checkbox' id = '" + i + "' class = 'layer'" + ( item.visible ? " checked" : "" ) + " />" + 				
						"<label for='" + i + "'>" + 
							"<img src = 'image/overlay" + i + ".png' class = 'legend'/>" +
							item.name + 
						"</label>" + 
					"</li>";
			
			} );
			
			query ( "#overlays" ).append ( "<ul>" + htmlstr + "</ul>" );
			layerSwitcherZoomCheck();
						
			//create the 3d flood map switcher
			query ( "#3dfldmaps" ).append (
							
				"<ul>" +
					"<li>" + 
						"<input type = 'checkbox' id = '3d_floodzone' class = 'fmap'/>" + 
						"<label for = '3d_floodzone'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips[ "3dfloodzone" ].brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"3dfloodzone\");'>3D Floodzones</a>" + 
						"</label>" + 
					"</li>" +
				"</ul>" + 
				"<div style = 'margin:10px 0 5px 30px;'>" + 
					"<img src = 'image/3dfloodzones_ramp.png' />" +
				"</div>" +
				"<div id = '3dctrl' style = 'height:200px; margin:50px 0 20px 100px;'></div>" +
				"<div id = '3dloop' style='margin-left: 50px;'>" +
					"<input type = 'radio' id = 'play' name = '3dloop-button' value = 'play' /><label for = 'play'>Play</label>" +
					"<input type = 'radio' id = 'stop' name = '3dloop-button' value = 'stop' checked = 'checked'/><label for = 'stop'>Stop</label>" +
				"</div>" +
				"<div class='note'><br/>Enhanced datasets are non-regulatory and derived from latest available flood models, which may not be reflected on FIRM Current.</div>"
								
			);
			
			//create the 3d floodmap slider control
			$ ( "#3dctrl" ).slider ( 
				{
					orientation : "vertical",
					range : "min",
					min : 34,
					max : 41,
					step : 1,
					value : 39,
					stop : function(event, ui) 
					{ 
							
						alterVisibleLayersInService ( 0, [ ui.value - ( basemapgallery.getSelected().id == "streets" ? 16 : 8 ), ui.value ], "replace" );
						
					}
				}
			);
			
			$ ( "#3dctrl" ).sliderLabels ( 
				[
					{ 
						left : "<a class='tip' href = 'javascript:void(0);' title='" + tips.annualchance.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"annualchance\");'>Annual&nbsp;Chance</a>", 
						right: "<a class='tip' href = 'javascript:void(0);' title='" + tips.fldz.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"fldz\");'>Floodzone</a>" 
					}, 
					{ 
						left : "<a class='tip' href = 'javascript:void(0);' title='" + tips.commufldp.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"commufldp\");'>Future</a>&nbsp;-", 
						right: "-&nbsp;<a class='tip' href = 'javascript:void(0);' title='" + tips.commufldp.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"commufldp\");'>Future</a>" 
					}, 
					{ 
						left : "0.2%&nbsp;-", 
						right:"-&nbsp;500yr" 
					}, 
					{ 
						left : "<a class='tip' href = 'javascript:void(0);' title='" + tips.femafloodplain.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"femafloodplain\");'>1%</a>&nbsp;-", 
						right: "-&nbsp;<a class='tip' href = 'javascript:void(0);' title='" + tips.femafloodplain.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"femafloodplain\");'>100yr</a>" 
					},
					{ 
						left : "2%&nbsp;-", 
						right: "-&nbsp;50yr" 
					}, 
					{ 
						left : "4%&nbsp;-", 
						right: "-&nbsp;25yr" 
					}, 
					{ 
						left : "10%&nbsp;-", 
						right: "-&nbsp;10yr" 
					},
					{ 
						left : "20%&nbsp;-", 
						right: "-&nbsp;5yr" 
					}, 
					{ 
						left : "50%&nbsp;-", 
						right: "-&nbsp;2yr" 
					}
				]
			);
			
			//intialize play and stop button for looping
			$ ( "#3dloop" ).buttonset ();
			$ ( "#3dloop input:radio[value=stop]" ).prop ( "checked", true).button ( "refresh" );
			$ ( "#play, #stop" ).button ();
			
			//play or stop click event
			$ ( "#3dloop input:radio" ).click ( function() {
				$ (this).attr( "id" ) == "play" ? playloop( ) : stoploop( );
			} );	

			//create flood risk switcher
			query ( "#floodriskmaps" ).append (
			
				"<ul><li>" + 
					"<input type = 'checkbox' id = 'flood_risk' class = 'fmap' />" +
					"<label for = 'flood_risk'>" + 
						"<a class='tip' href = 'javascript:void(0);' title='" + tips.annualchance.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"annualchance\");'>Annual Chance of Flooding</a>" +
					"</label>" +
				"</li></ul>" +	
				"<div style = 'margin:10px 0 5px 30px;'>" + 
					"<img src = 'image/flood_risk1.png' />&nbsp;&nbsp;0.2%&nbsp;-&nbsp;1%" +
					"&nbsp;&nbsp;&nbsp;&nbsp;<img src='image/flood_risk2.png' />&nbsp;&nbsp;1%&nbsp;-&nbsp;2%&nbsp;&nbsp;&nbsp;&nbsp;" + 
					"&nbsp;&nbsp;&nbsp;&nbsp;<img src='image/flood_risk3.png' />&nbsp;&nbsp;2%&nbsp;-&nbsp;4%" + 
				"</div>" +
				"<div style = 'margin:5px 0 5px 30px;'>" + 	
					"<img src = 'image/flood_risk4.png' />&nbsp;&nbsp;4%&nbsp;-&nbsp;10%&nbsp;" + 
					"&nbsp;&nbsp;&nbsp;&nbsp;<img src='image/flood_risk5.png' />&nbsp;&nbsp;10%&nbsp;-&nbsp;20%" + 
					"&nbsp;&nbsp;&nbsp;&nbsp;<img src='image/flood_risk6.png' />&nbsp;&nbsp;20%&nbsp;-&nbsp;50%" + 
				"</div>" +							
				"<div style = 'margin:5px 0 10px 30px;'>" + 	
					"<img src = 'image/flood_risk7.png' />&nbsp;&nbsp;Above&nbsp;50%" + 
				"</div>" +
				"<div class='note'>Enhanced datasets are non-regulatory and derived from latest available flood models, which may not be reflected on FIRM Current.</div>"
				
			);		

			//create the proposed flood maps switcher
			query ( "#proposedfldmaps" ).append (
				
				"<ul>" +
					"<li>" + 
						"<input type = 'checkbox' id = 'proposed_firm' class = 'fmap'/>" + 
						"<label for = 'proposed_firm'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.firmproposed.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"firmproposed\");'>FIRM Proposed</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'proposed_fema_fldp' class = 'fmap />" + 
						"<label for = 'proposed_fema_fldp'>" + 
							"<img src = 'image/fema_fldp.png' class = 'legend'/>" +
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.femafloodplain.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"femafloodplain\");'>FEMA Floodplain</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'proposed_comm_fldp' class = 'fmap' />" + 
						"<label for = 'proposed_comm_fldp'>" +
							"<img src = 'image/com_fldp.png' class = 'legend'/>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.commufldp.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"commufldp\");'>Community Floodplain</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'proposed_fema_fldway' class = 'fmap' />" + 
						"<label for = 'proposed_fema_fldway'>" +
							"<img src = 'image/fema_encro.png' class = 'legend'/>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.femafloodway.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"femafloodway\");'>FEMA Floodways</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'proposed_comm_fldway' class = 'fmap' />" + 
						"<label for = 'proposed_comm_fldway'>" +
							"<img src = 'image/com_encro.png' class='legend'/>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.commuencroach.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"commuencroach\");'>Community Floodways</a>" + 
						"</label>" + 
					"</li>" +
				"</ul>" +
				"<div class='note'>Use FIRM Current for flood insurance and local regulatory purposes.</div>"
				
			);
			
			//create the current flood maps switcher
			query ( "#currentfldmaps" ).append (
				
				"<ul>" +
					"<li>" + 
						"<input type = 'checkbox' id = 'current_firm' class = 'fmap' />" + 
						"<label for = 'current_firm'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.firmcurrent.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"firmcurrent\");'>FIRM Current</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'current_fema_fldp' class = 'fmap' />" + 
						"<label for = 'current_fema_fldp'>" + 
							"<img src = 'image/fema_fldp.png' class = 'legend'/>" +
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.femafloodplain.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"femafloodplain\");'>FEMA Floodplain</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'current_comm_fldp' class = 'fmap' />" + 
						"<label for = 'current_comm_fldp'>" +
							"<img src = 'image/com_fldp.png' class = 'legend'/>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.commufldp.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"commufldp\");'>Community Floodplain</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'current_fema_fldway' class = 'fmap' />" + 
						"<label for = 'current_fema_fldway'>" +
							"<img src = 'image/fema_encro.png' class = 'legend'/>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.femafloodway.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"femafloodway\");'>FEMA Floodways</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'current_comm_fldway' class = 'fmap' />" + 
						"<label for = 'current_comm_fldway'>" +
							"<img src = 'image/com_encro.png' class='legend'/>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.commuencroach.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"commuencroach\");'>Community Floodways</a>" + 
						"</label>" + 
					"</li>" +
				"</ul>" +
				"<div class='note'>Use FIRM Current for flood insurance and local regulatory purposes.</div>"
				
			);
			
			//create the in-out flood maps switcher
			query ( "#inoutfldmaps" ).append (
				
				"<ul>" +
					"<li>" + 
						"<input type = 'checkbox' id = 'inout_firm' class = 'fmap' checked/>" + 
						"<label for = 'inout_firm'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.firmchngcomp.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"firmchngcomp\");'><b>FIRM Change Comparison</b></a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'inout_fema_fldp' class = 'fmap' checked/>" + 
						"<label for = 'inout_fema_fldp'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.inoutfemafloodplain.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"inoutfemafloodplain\");'>FEMA Floodplain</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'inout_comm_fldp' class = 'fmap'/>" + 
						"<label for = 'inout_comm_fldp'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.inoutcommufldp.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"inoutcommufldp\");'>Community Floodplain</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'inout_fema_fldways' class = 'fmap'/>" + 
						"<label for = 'inout_fema_fldways'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.inoutfemafldwys.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"inoutfemafldwys\");'>FEMA Floodways</a>" + 
						"</label>" + 
					"</li>" +
					"<li>" + 
						"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type = 'checkbox' id = 'inout_comm_fldways' class = 'fmap'/>" + 
						"<label for = 'inout_comm_fldways'>" + 
							"<a class='tip' href = 'javascript:void(0);' title='" + tips.inoutcommufldwys.brief + " Click link for more detail.' onclick='event.preventDefault();showTipDetail(\"inoutcommufldwys\");'>Community Floodways</a>" + 
						"</label>" + 
					"</li>" +
				"</ul>" +
				"<div><img src = 'image/in.png' class = 'legend'/>&nbsp;&nbsp;Area to be added</div>" + 
				"<div><img src = 'image/out.png' class='legend'/>&nbsp;&nbsp;Area to be removed</div>" +
				"<div class='note'><br/>Draft/Preliminary</div>"
				
			);
			 	
			//maptools
			require ( [ 
				"esri/graphic", 
				"esri/symbols/SimpleMarkerSymbol",
				"esri/symbols/SimpleLineSymbol", 
				"esri/symbols/SimpleFillSymbol",
				"esri/symbols/PictureMarkerSymbol",
				"esri/symbols/TextSymbol",
				"esri/SpatialReference", 
				"esri/geometry/Point",
				"esri/symbols/Font",			
				"esri/tasks/IdentifyParameters",							
				"esri/toolbars/draw", 
				"esri/tasks/LengthsParameters", 
				"esri/tasks/AreasAndLengthsParameters",
				"esri/tasks/GeometryService",
				"dojo/_base/array",
				"dojo/_base/Color",
				"dojo/dom",
				"dojo/request/script",
				"dojo/on",
				"dojo/query", 
				"dojo/NodeList-manipulate",
				"dojo/NodeList-dom", 
				"dojo/NodeList-traverse" ], 
				
				function ( Graphic, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, PictureMarkerSymbol, TextSymbol, 
					SpatialReference, Point, Font, IdentifyParameters, Draw, LengthsParameters, AreasAndLengthsParameters, 
					GeometryService, array, Color, dom, script, on, query ) {
				
					var geometryService = new GeometryService ( config.geometry_service ),
						lengthParams = new LengthsParameters(),
						areaParams = new AreasAndLengthsParameters(),
						drawToolbar = new Draw ( map ),
						selectParcelLayer = agsServices[ serviceNames.indexOf ( "selection" ) ];
						
					query ( "#cmntsoff" ).on ( "click", function() {
													
						mapTool = "addcomment";
						map.graphics.clear();
						selectParcelLayer.disableMouseEvents(); //disable click event of the selected feature
						drawToolbar.activate ( esri.toolbars.Draw.POINT );	
						$ ( "#0" ).prop ( "checked", true ).trigger( "change" ); 
							
						query ( "#cmntsoff" ).addClass ( "hidden "); 
						query ( "#cmntson" ).removeClass ( "hidden "); 
												
					} );
					
					query ( "#cmntsclose" ).on ( "click", function() {
					
						//clean house
						mapTool = null;
						map.graphics.clear();
						selectParcelLayer.enableMouseEvents(); //enable click event of the selected feature
						if ( drawToolbar ) //deactivate draw toolbar
							drawToolbar.deactivate();
							
						query ( "#cmntsmsg" ).innerHTML ( "Click on map to add comment" );
						query ( "#cmntson" ).addClass ( "hidden "); 
						query ( "#cmntsoff" ).removeClass ( "hidden "); 	
											
					} );	
					
					query ( ".tb" ).innerHTML (
						"<div id='distMeasure' class='tool icon-ruler'></div>" +
						"<div id='areaMeasure' class='tool notfirst icon-setsquare'></div>" +
						"<div id='elevMeasure' class='tool notfirst icon-mountain'></div>"
						//"<div id='firmID' class='tool notfirst icon-identify'></div>"
					);
					
					query ( ".tbContent" ).innerHTML (
						"<div class='tbTitle'></div>" +
						"<div class='tbClose'><img src='image/close-icon.png'/></div>" +
						"<div class='tbMain'></div>"
					);

					//on toolbox tool close
					query ( ".tbClose" ).on ( "click", function() {
					
						query ( ".tool" ).removeClass ( "on" );
						query ( ".tb" ).addClass ( "shadow" );
						query ( ".tbContent" ).addClass ( "hidden" ); //hide toolbox content
						
						//clean house
						mapTool = null;
						map.graphics.clear();
						selectParcelLayer.enableMouseEvents(); //enable click event of the selected feature
						if ( drawToolbar ) //deactivate draw toolbar
							drawToolbar.deactivate();
						
					} );	
					
					query (	".tb" ).on ( ".tool:click", function ( event ) {
										
						//initate chosen tool
						mapTool = event.target.id;
						map.graphics.clear();
						selectParcelLayer.disableMouseEvents(); //disable click event of the selected feature
						
						switch ( mapTool ) {
							
							case "distMeasure": 
								
								drawToolbar.activate ( esri.toolbars.Draw.POLYLINE );
														
								query ( ".tbTitle" ).innerHTML ( "Distance Measure" );
								query ( ".tbMain" ).empty();
								
								break;
								
							case "areaMeasure":
							
								query ( ".tbTitle" ).innerHTML ( "Area Measure" );
								query ( ".tbMain" ).empty();
								
								drawToolbar.activate ( esri.toolbars.Draw.POLYGON );
								
								break;
								
							case "elevMeasure":
								query ( ".tbTitle" ).innerHTML ( "Ground Elevation and Base Flood Elevation (BFE)" );
								query ( ".tbMain" ).innerHTML(
									"<table class='pup'>" +
										"<thead>" + 
											"<tr>" +
												"<th rowspan='2'>No</th><th rowspan='2'>Ground Elevation</th><th colspan='8'>Annual Chance of Flooding - BFE (ft NAVD)</th>" +
											"</tr>" +
											"<tr>" +
												"<th>50%</th>" +
												"<th>20%</th>" +
												"<th>10%</th>" +
												"<th>4%</th>" +
												"<th>2%</th>" +
												"<th>1%</th>" +
												"<th>0.2%</th>" +
												"<th>1% Fut</th>" +
											"</tr>" +
										"</thead>" +
										"<tbody>" +
										"</tbody>" +		 	
									"</table>"
								);
							
								drawToolbar.activate ( esri.toolbars.Draw.POINT );
								
								break;
							
							case "firmID":
							
								if ( drawToolbar ) //deactivate draw toolbar
									drawToolbar.deactivate();
							
								query ( ".tbTitle" ).innerHTML ( "FIRM panel identify" );
								query ( ".tbMain" ).innerHTML ( "Click on a panel to access corresponding<br/>Flood Insurance Rate Map." );
																
								break;	
					
						}
						
						//switch on tool and show toolbox content
						
						query ( "#" + mapTool ).addClass ( "on" ).siblings( ".tool" ).removeClass ( "on" );
						query ( ".tb" ).removeClass ( "shadow" );
						query ( ".tbContent" ).removeClass ( "hidden" ); //show the toolbox content
						
					} );
						
					drawToolbar.on ( "draw-end", function ( event ) {
					
						switch ( mapTool ) {
								
							case "distMeasure":
							
								lengthParams.polylines = [ event.geometry ];
								lengthParams.lengthUnit = esri.tasks.GeometryService.FEET;
								geometryService.lengths ( lengthParams );
								map.graphics.add ( 
									new Graphic ( 
										event.geometry, 
										new SimpleLineSymbol ( 
											SimpleLineSymbol.STYLE_SOLID, 
											new Color( [ 191, 54, 38 ] ), 3 
										) 
									)
								);
								
								break;
								
							case "areaMeasure":
								
								areaParams.polygons = [ event.geometry ];
								areaParams.areaUnit = GeometryService.UNIT_ACRES;
								areaParams.lengthUnit = GeometryService.FEET;
								geometryService.areasAndLengths ( areaParams );							
								map.graphics.add ( 
									new Graphic ( 
										event.geometry, 
										new SimpleFillSymbol ( 
											SimpleFillSymbol.STYLE_SOLID, 
											new SimpleLineSymbol ( SimpleLineSymbol.STYLE_SOLID, new Color( [ 191, 54, 38 ] ), 3 ), 
											new Color ( [ 191, 54, 38, 0.5 ] ) 
										) 
									) 
								);
								
								break;

							case "elevMeasure":
								var idx = query( ".tbMain table tbody tr" ).length + 1;
								
								//add marker on click position
								var markerSymbol = new SimpleMarkerSymbol(
									SimpleMarkerSymbol.STYLE_SQUARE, 
									14,
									new SimpleLineSymbol( SimpleLineSymbol.STYLE_SOLID, new Color( [ 191, 54, 38 ] ), 2 ),
									new Color( [ 191, 54, 38, 1 ] ) );
								map.graphics.add( new Graphic( event.geometry, markerSymbol ) );	
								
								var textSymbol =  new TextSymbol( idx )
									.setColor( new Color( [ 255, 255, 255 ] ) )
									.setFont( new Font( "8pt" ).setWeight( Font.WEIGHT_BOLD ) )
									.setOffset( 0, -4 );
			
								map.graphics.add( new Graphic( event.geometry, textSymbol ) );
								
								//add the ground elevation and fllod depth value to the table
								var identifyService = agsServices[ serviceNames.indexOf( "idfloodzones" ) ],
									idParams = new IdentifyParameters( );
									idParams.tolerance = 0;
									idParams.returnGeometry = false;
									//idParams.layerIds = [ 43, 44, 45, 46, 47, 48, 49, 50, 51 ];
									idParams.layerIds = [ 43, 44, 45, 52, 53, 54, 55, 56, 51 ];
									idParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;	
									idParams.geometry = event.geometry;
									idParams.mapExtent = map.extent;
									
								identifyService.execute( idParams, function( results ){
									query( ".tbMain table tbody" ).append( "<tr><td>" + idx + "</td><td>NA</td><td>NA</td><td>NA</td><td>NA</td><td>NA</td><td>NA</td><td>NA</td><td>NA</td><td>NA</td></tr>" );
								
									if( results.length > 0 ){
										array.forEach( results, function( item, i ){
											if( item.feature.attributes[ "Pixel Value" ] != "NoData" && [ 0, 3, 4, 5, 6, 7 ].includes( i, 0 ) ){
												query( ".tbMain table tbody tr:last-child td:nth-child(" + ( i + 2 ) + ")" ).innerHTML( format.number( item.feature.attributes[ "Pixel Value" ], 1 ) );
											}															
										} );
									}
								} );
								break;
									
							case "addcomment":	
								var featureService = agsServices[ serviceNames.indexOf( "fmr_comments" ) ],
									identifyService1 = agsServices[ serviceNames.indexOf( "idoverlaystrans" ) ],
									idParams1 = new IdentifyParameters( );
									idParams1.tolerance = 0;
									idParams1.returnGeometry = false;
									idParams1.layerIds = [ 0 ];
									idParams1.layerOption = IdentifyParameters.LAYER_OPTION_ALL;	
									idParams1.geometry = event.geometry;
									idParams1.mapExtent = map.extent;
								
								identifyService1.execute( idParams1, function( results ){
									if( results.length > 0 ){
										switch( results[ 0 ].value ){
											case "PHASE 4":
												query( "#cmntsmsg" ).innerHTML(
													"<table class='pup'>" +
														"<tbody>" +
															"<tr>" +
																"<th>" +
																	"<label for='cmntsName'>Name (required)</label>" +
																"</th>" +
																"<td>" +
																	"<input type='text' name='name' id='cmntsName'/>" +
																"</td>" +
															"</tr>" +
															"<tr>" +
																"<th>" +
																	"<label for='cmntsEmail'>E-Mail (required)</label>" +
																"</th>" +
																"<td>" +
																	"<input type='text' name='email' id='cmntsEmail' />" +
																"</td>" +
															"</tr>" +
															"<tr>" +
																"<th>" +
																	"<label for='cmntsComments'>Problem Description<br/>(required)</label>" +
																"</th>" +
																"<td>" +
																	"<textarea id='cmntsComments' name='comment' rows='6' cols='16' minlength='10' maxlength='800'></textarea>" +
																"</td>" +
															"</tr>" +
															"<tr>" +
																"<td colspan='2'>" +
																	"<input id='addCommentBtn' type='button' value='Add' />" +
																"</td>" +
															"</tr>" +
														"</tbody>" +
													"</table>" +
													"<div id='cmntserrors' class='cont note'></div>" +
													"<div class='cont'>Once your comments are reviewed, a representative from Charlotte-Mecklenburg Storm Water Services will contact you as soon as possible.</div>"
												);
												
												query( "#addCommentBtn" ).on( "click", function( ){
													//validate form entries
													var validName = false,
														validEmail = false,
														validComments = false,
														errorMsg = "";
																								
													if( query ( "#cmntsName" ).val( ).length > 0 ){
														validName = true;
													}else{
														errorMsg += "<div>Name required</div>";
													}
															
													if( query ( "#cmntsEmail" ).val( ).length > 0 && isEmail( query ( "#cmntsEmail" ).val( ) ) ){
														validEmail = true;
													}else{
														errorMsg += "<div>Valid email required</div>";	
													}

													if( query( "#cmntsComments" ).val().length > 0 ){
														validComments = true;
													}else{
														errorMsg += "<div>Comment required</div>";	
													}
																
													if( validName && validEmail &&	validComments ){
														//save comment point to feature layer																	
														featureService.applyEdits( 
															[
																new Graphic( 
																	event.geometry, 
																	new PictureMarkerSymbol( "image/comments.png", 32, 32 ), 
																	{ 
																		"name" : $ ( "#cmntsName" ).val( ),
																		"email" : $ ( "#cmntsEmail" ).val( ),
																		"dateenter" : format.readableDate( new Date( ) ),
																		"status" : "open",
																		"comment" : fixSpecialChars( $( "#cmntsComments" ).val( ) )
																	} 
																)
															], 
															null, 
															null, 
															function( result ){
																if( result[ 0 ].success ){
																	
																	//send out email notification
																	sendemail( 
																		"Salih.Iddrisu@MecklenburgCountync.gov", 
																		"New comment added to Flood Map Review by " + $( "#cmntsName" ).val( ), 
																		"A new comment was submitted through the Flood Map Review website by " +
																			$( "#cmntsName" ).val( ) + " ( " + $( "#cmntsEmail" ).val( ) + " ) :\n\n" +
																			$( "#cmntsComments" ).val( )
																	);
																	
																	//send out email notification to user
																	sendemail( 
																		$( "#cmntsEmail" ).val( ), 
																		"Comment submission acknowledgment", 
																		"A representative from Charlotte-Mecklenburg Storm Water Services will contact you soon regarding the comment you submitted:\n\n" +
																			$( "#cmntsComments" ).val( ) 
																	);
																	
																	on.emit( dom.byId( "cmntsclose" ), "click", {
																		bubbles: true,
																		cancelable: true
																	} );
																}else{
																	query( "#cmntsmsg" ).innerHTML( "<div class='cont note'>An error occured! Please try again!</div><div class='cont'>If problem persists contact<br/><a href='mailto://Salih.Iddrisu@MecklenburgCountyNC.gov' target='_self'>Salih.Iddrisu@MecklenburgCountyNC.gov</a></div>" );
																}	
															},
															function( ){
																query( "#cmntsmsg" ).innerHTML( "<div class='cont note'>An error occured! Please try again!</div><div class='cont'>If problem persists contact<br/><a href='mailto://Salih.Iddrisu@MecklenburgCountyNC.gov' target='_self'>Salih.Iddrisu@MecklenburgCountyNC.gov</a></div>" );
															}		
														);
													}	
												} );
												break;
												
											default:
												query( "#cmntsmsg" ).innerHTML( "<div class='cont note'>Comments can not be submitted in this region at this time.</div><div class='cont'>Questions should be emailed to<br/><a href='mailto://Salih.Iddrisu@MecklenburgCountyNC.gov' target='_self'>Salih.Iddrisu@MecklenburgCountyNC.gov</a></div>" );
												break;
										}
									}
									//value: 
								} );
								break;
						}	
					} );
										
					geometryService.on( "lengths-complete", function( event ){
						var distance;
						
						if( event.result.lengths[ 0 ] > 5280 ){ //if distance more than 5280 feet output in miles
							distance = ( event.result.lengths[ 0 ] / 5280 ).toFixed ( 2 ) + ' miles';
						}else{
							distance = Math.ceil ( event.result.lengths[ 0 ] ).toFixed ( 2 ) + ' ft';
						}
						
						query( ".tbMain" ).innerHTML( distance );
					} );
					
					geometryService.on( "areas-and-lengths-complete", function( event ){
						var area = event.result.areas[ 0 ].toFixed( 2 ) + " acres";
						
						query ( ".tbMain" ).innerHTML( area );
							
						// simplify polygon so it can be used in the get label points request
						geometryService.simplify( [ map.graphics.graphics[ map.graphics.graphics.length-1 ].geometry ], function( geometries ){
							if( geometries[ 0 ].rings.length > 0 ){ //get label points
								geometryService.labelPoints( geometries, function( labelPoints ){
									array.forEach (labelPoints, function ( labelPoint ) {
										var textSymbol =  new TextSymbol ( area )
											.setColor ( new Color ( [ 255, 255, 255 ] ) )
											.setFont ( new Font ( "12pt" ).setWeight ( Font.WEIGHT_BOLD ) );
							
										map.graphics.add ( new Graphic ( labelPoint, textSymbol ) );	
									} );
								} );
							}
						} );
								
					} );
				}
			);	
			
			//handle hash
			handleHash( );
		}
	);	
}

function clickAndSelect ( event ) {
	
	require ( [ "dojo/query", "dojo/NodeList-manipulate" ], function ( query ) {	

		if ( !mapTool ) {
				
			//do search based on lat lon
			finder( { "y" : event.mapPoint.y, "x" : event.mapPoint.x } );

			//do not zoom to graphics added to map	
			zoomToGraphic = false;	
			//hide back to results
			query ( "#backtoresults" ).addClass ( "hidden" );			

		} else if ( mapTool == "firmID" ) {
						
			require ( [ "esri/tasks/IdentifyParameters" ], function ( IdentifyParameters ) { 
			
				var identifyService = agsServices[ serviceNames.indexOf ( "idoverlays" ) ],
					idParams = new IdentifyParameters();
					idParams.tolerance = 3;
					idParams.returnGeometry = false;
					idParams.layerIds = [ 4 ];
					idParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;	
					idParams.geometry = event.mapPoint;
					idParams.mapExtent = map.extent;
				
				identifyService.execute ( idParams, function ( results ) {
							
					if ( results.length > 0 ) {
						
						var pdfurl = ( results[ 0 ].feature.attributes.URL == "Null" ? "" : results[ 0 ].feature.attributes.URL );
						
						if ( pdfurl.trim().length > 0 ) {
							
							window.open ( pdfurl ); 
							query ( ".tbMain" ).innerHTML ( "Click on a panel to access corresponding<br/>Flood Insurance Rate Map." );	
						
						} else {
							
							query ( ".tbMain" ).innerHTML ( "Click on a panel to access corresponding<br/>Flood Insurance Rate Map.<div class='note'>FIRM Map Panel is not available in this area.</div>" );	
						
						}
						
					} else 	{
					
						query ( ".tbMain" ).innerHTML ( "Click on a panel to access corresponding<br/>Flood Insurance Rate Map.<div class='note'>FIRM Map Panel is not available in this area.</div>" );	
					
					}
					
				} );	
				
			});
							
		}	
		
	} );	

}

/*  Add vector graphics to the map.  */
function addGraphics ( data ) {

	var selectionLayer = agsServices[ serviceNames.indexOf ( "selection" ) ];
	
	if ( locationGraphic ) //remove location graphic
		selectionLayer.remove ( locationGraphic );
		
	if ( data.hasOwnProperty ( "groundpid" ) ) { //get ground parcel geometry and add it to map
	
		if ( parcelGraphic ) //remove parcel graphic
			selectionLayer.remove ( parcelGraphic );
				
		require ( [
			"dojo/request", 
			"esri/graphic", 
			"esri/symbols/SimpleFillSymbol", 
			"esri/symbols/SimpleLineSymbol", 
			"esri/SpatialReference", 
			"esri/geometry/Point", 
			"dojo/_base/Color" ], function ( request, Graphic, SimpleFillSymbol, SimpleLineSymbol, SpatialReference, Point, Color ) {
				request.get( config.web_service_local + "v1/ws_attributequery.php", {
					handleAs: "json",
					headers: { "X-Requested-With": "" },
					query: 
					{
						table: "parcels_py", 
						fields: "ST_AsText ( shape ) as parcelgeom", 
						parameters: "pid='" + data.groundpid + "'",
						source: "gis"					
					}
				} ).then( function( parceldata ){
				
					if ( parceldata.length > 0 ) {
				
						//add parcel feature to map
						parcelGraphic = new Graphic ( 
							parseGeomTxt ( parceldata[ 0 ].parcelgeom ), 
							new SimpleFillSymbol ( 
								SimpleFillSymbol.STYLE_SOLID, 
								new SimpleLineSymbol ( SimpleLineSymbol.STYLE_SOLID, new Color ( [ 0, 255, 102 ] ), 3 ), 
								new Color ( [ 0, 255, 102, 0 ] ) ), 
								{ "title" : "<h5>Selected Property</h5>", "content": "Parcel ID: " + data.taxpid + "<br/>" + data.address }, 
									new esri.InfoTemplate ( "${title}", "${content}" ) ) ;
						selectionLayer.add ( parcelGraphic );	
																							
						//zoom to add feature
						if ( zoomToGraphic )
							zoom.toCenter ( new Point ( data.x, data.y, 
								new SpatialReference ( config.initial_extent.spatialReference ) ), 7 );	
							
					}		
				
				} );
			

		} );	

	} else { //add a location to the map
	
		require ( [ 
			"esri/graphic", 
			"esri/geometry/Point", 
			"esri/symbols/PictureMarkerSymbol", 
			"esri/SpatialReference" ], function ( Graphic, Point, PictureMarkerSymbol, SpatialReference ) {
			
				locationGraphic = new Graphic ( 
						new Point ( data.x, data.y, new SpatialReference ( config.initial_extent.spatialReference ) ), 
						new PictureMarkerSymbol("image/loc.png", 25,41), { "title" : "<h5>Location</h5>", "content": data.label }, 
						new esri.InfoTemplate ( "${title}", "${content}" ) ) ;
				selectionLayer.add ( locationGraphic );	
				
				//zoom to add feature
				if ( zoomToGraphic )
					zoom.toCenter ( new Point ( data.x, data.y, new SpatialReference ( config.initial_extent.spatialReference ) ), 7 );	
			
		} );	
			
	} 	

}

/* Layer Switcher */

function layerSwitcherZoomCheck(){ //enable/disable layer list checkboxes based on map zoom level

	$.each ( config.overlay_controls, function ( index ) {
	
		var zoom = map.getZoom();
		
		if ( zoom > this.maxZoom || zoom < this.minZoom ) { 
			
			$ ( "#" + index ).prop ( "disabled", true ).next().css ( "color", "#D1D0CC" );
		
		} else { 
			
			$ ( "#" + index ).prop ( "disabled", false ).next().css ( "color", "inherit" );
		}	
	
	} );
	
}

$ ( ".switcher" ).on ( "change", ".layer", function() {

	//set variables
	var overlay_control = config.overlay_controls [ $ ( this ).prop ( "id" ) ],
		service =  agsServices[ serviceNames.indexOf ( overlay_control.service ) ];
		
	if ( overlay_control.featurelyr ) { //feature layer
	
		service.setVisibility ( $ ( this ).prop( "checked" ) );
	
	} else { //static map layer
	
		alterVisibleLayersInService ( service, overlay_control.lyrs, ( $ ( this ).prop( "checked" ) ? "add": "remove" ) );
	
	}
		
} );

$ ( ".switcher" ).on ( "change", ".fmap", function() {

	var floodmap_control = config.floodmap_controls [ $ ( this ).prop ( "id" ) ],
		floodzoneService =  agsServices[ serviceNames.indexOf ( "floodzones" ) ];
	
	if ( $ ( this ).prop( "checked" ) ) {
	
		alterVisibleLayersInService ( floodzoneService, floodmap_control.lyrs, ( floodmap_control.parent ? "replace" : "add" ) );
		
		if ( floodmap_control.parent ) 
			$ ( ".fmap:not(#" + $ ( this ).prop ( "id" ) + ")" ).prop ( "checked", false );
			
		if ( floodmap_control.hasOwnProperty("dependencies") )
			$ ( floodmap_control.dependencies ).prop ( "checked", true ); 
		
		
	
	} else {
	
		alterVisibleLayersInService ( floodzoneService, floodmap_control.lyrs, "remove" );
		
		if ( floodmap_control.hasOwnProperty("dependencies") ) 
			$ ( floodmap_control.dependencies ).prop ( "checked", false ); 
		
	}
	
	//disable the 3dfloodzone slider
	$ ( "#3dctrl" ).slider ( "option", "disabled", 
		( ( $ ( this ).prop ( "id" ) == "3d_floodzone" && $ ( this ).prop ( "checked" ) ) ? false : true ) );
	$ ( "#play, #stop" ).button ( 
		{ disabled: ( ( $ ( this ).prop ( "id" ) == "3d_floodzone" && $ ( this ).prop ( "checked" ) ) ? false : true ) } );
			
} );

function playloop() {

	var floodzoneService = agsServices[ serviceNames.indexOf ( "floodzones" ) ],
		idx = 34;
	
	//set radar slider to start from 50% annual chance
	$ ( "#3dctrl" ).slider ( "option", "value", idx ); 
	
	//set the 50% anuual chance depth grid layer visible
	alterVisibleLayersInService ( floodzoneService, 
		[ idx - ( basemapgallery.getSelected().id == "streets" ? 16 : 8 ), idx ], 
		"replace" );
		
	//start the loop to control opacity which inturn creates a looping illusion. 
	//3 second timeout gives enough time for the layers to be setup properly
	loop = self.setInterval ( function() {
	
		//compute new index
		idx = ( idx == 41 ? 34 : idx + 1 );
		
		//set radar slider
		$ ( "#3dctrl" ).slider ( "option", "value", idx );
		
		//set the corresponsing depth grid layer visible
		alterVisibleLayersInService ( floodzoneService, 
			[ idx - ( basemapgallery.getSelected().id == "streets" ? 16 : 8 ), idx ], 
			"replace" );
	
	}, 3000 );
	
}

function stoploop() {
	
	var floodzoneService = agsServices[ serviceNames.indexOf ( "floodzones" ) ];
	
	//stop the loop and set back the current radar layer
	window.clearInterval ( loop ); 
	
	//set radar slider to 1% annual chance
	$ ( "#3dctrl" ).slider ( "option", "value", 39 ); 
	
	//set the 1% anuual chance depth grid layer visible
	alterVisibleLayersInService ( floodzoneService, [ 39 - ( basemapgallery.getSelected().id == "streets" ? 16 : 8 ), 39 ], "replace" );
	
}

function alterVisibleLayersInService( service, lyrs, task ){
	var dynlyrs = service.visibleLayers;
	
	switch( task ){
		case "add":
			if( dynlyrs.indexOf( -1 ) > -1 ){
				dynlyrs.splice( dynlyrs.indexOf( -1 ), 1 );
			}
				
			for( var i = 0; i < lyrs.length; i++ ){
				dynlyrs.push( lyrs[ i ] );	
			}
				
			break;
	
		case "remove":
			for( var j = lyrs.length - 1; j > -1 ; j-- ){
				if( dynlyrs.indexOf( lyrs[ j ] ) > -1 ){
					dynlyrs.splice( dynlyrs.indexOf( lyrs[ j ] ), 1 );
				}
			}
					
			break;
			
		case "replace":
			dynlyrs.length = 0;
			for ( var k = 0; k < lyrs.length ; k++ ){
				dynlyrs.push ( lyrs[ k ] );
			} 
			break;	
	}
	
	if( dynlyrs.length === 0 ){
		dynlyrs.push( -1 );
	}
	
	service.setVisibleLayers( dynlyrs );
	
}	