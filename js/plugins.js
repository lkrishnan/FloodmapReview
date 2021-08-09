/**
 * plugins.js
 * This file contains plugins
 * Created by Lak Krishnan
 * 9/25/13
 * @license     MIT
 */

/*
    Add left and right labels to a jQuery UI Slider
*/
$.fn.extend( {
    sliderLabels : function ( labels ) {
        var $this = $ ( this );
        var $sliderdiv = $this;
        $sliderdiv.css( { "font-weight" : "normal" } );
		for ( var i = 0; i < labels.length; i++ ) {
		
			$sliderdiv.prepend ( "<span class = 'ui-slider-inner-label' style = 'width:90px; text-align: right; position: absolute; right:15px; top:" + ( ( -36 ) + ( i * 28 ) ) + "px;'>" + labels[i].left + "</span>" );
			$sliderdiv.append ( "<span class = 'ui-slider-inner-label' style = 'width:90px; position: absolute; left:15px; top:" + ( ( -36 ) + ( i * 28 ) ) + "px;'>" + labels[i].right + "</span>" );	
		
		}
	}
});

/***********/
/* Workers */
/***********/

//function that opens the glossary to show tip detail
function showTipDetail( tipid ){
	showSidebar ( "glossarycont", "glossarytoggle" );
	$ ( "#glossarycont" ).parent ().scrollTop ( $ ( "#" + tipid ).position().top );
	
}

//show sidebar i.e the info window
function showSidebar ( cont, btn ) {

	//show the corresponding div
	$ ( "#" + cont ).removeClass ( "hidden" ).siblings( ".cont" ).addClass ( "hidden" ).parent ().removeClass ( "hidden" );
		
	//switch on the corresponsing toggle
	if ( btn )
		$ ( "#" + btn ).prop ( "checked", true ); $ ( "#toggle" ).buttonset ( "refresh" );
	
}

function backToResults() {

	require ( [ "dojo/query", "dojo/NodeList-manipulate" ],	function ( query ) {
		
		query ( "#backtoresults, #errorcont, #propinfocont" ).addClass ( "hidden" );
		query ( "#searchresultscont" ).removeClass ( "hidden" );
		
	} );
	
}

//get url parameter
function getURLParameter( name ){
    return decodeURIComponent ( ( new RegExp ('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec ( location.search ) || [, ""] )[ 1 ].replace( /\+/g, '%20' ) ) || null;
}

function fixSpecialChars( str ){ 
	str = str.replace( /’/g, "'" );
	str = str.replace( /‘/g, "'" );
	str = str.replace( /“/g, '"' );
	str = str.replace( /”/g, '"' );
	return str;
}

//function that makes the fact box
function boxit( txt, icon, cssclass, params ){
	var htmlstr = "<div class = '" + cssclass + "'><table><tr>";
	
	//add descriptive icon
	htmlstr += "<td class = 'top'><img src = 'image/" + icon + ".png'/></td>";
	
	//add descriptive txt
	if( txt.indexOf ( "param" ) == -1 ){
		htmlstr += "<td width = '100%'>" + txt + "</td>";
	}else{
		htmlstr += "<td width = '100%'>" + replaceparams ( txt, params ) + "</td>";
	}
		
	//close
	htmlstr += "</tr></table></div>";
	
	return htmlstr;
}

//used by boxit
function replaceparams ( txt, params ) {

	for ( var i = 0; i < params.length; i++ )
		txt = txt.replace ( "param" + ( i + 1 ), params[ i ] );
		
	return txt;
	
}

function parseGeomTxt( geomtxt ){
	var poly, 
		points,
		rings = geomtxt.replace( /(\d+)(\s+)(\d+)/g, "$1&$3" )
						.replace( / +?/g, "" )
						.replace( "MULTIPOLYGON(((", "" )
						.replace( ")))", "" )
						.replace( /\)\),\(\(/g, "!" )
						.replace( "MULTIPOLYGON(((", "" )
						.replace( ")))", "" )
						.replace( "POLYGON((", "" )
						.replace( "))", "" )
						.replace( /\),\(/g, "!" )
						.split( "!" ),
		ring = [ ];
		
	require( [ "esri/geometry/Polygon", "esri/SpatialReference" ], function( Polygon, SpatialReference ){
		poly = new esri.geometry.Polygon( new SpatialReference( config.initial_extent.spatialReference ) );
	} );	
				
	poly.rings = rings.map( function( ring ){
		return ring.split( "," ).map( function( point ){
			var coords = point.split( "&" );
			
			return [ parseFloat( coords[ 0 ].trim( ) ), parseFloat( coords[ 1 ].trim( ) ) ];
		} );
	} );
	return poly;
}

function sendemail ( to, subject, message ) {
	require ( [ "dojo/request/xhr" ] , function ( xhr ) {
		xhr ( config.web_service_local + "v1/send_email.php", {
			query: 	{ 
				"to" : to, 
				"subject": subject, 
				"message" : message 
			},
			method: "POST"
		} ).then ( function ( data ) {
							
		} );
	} );
}

/**************/
/* Validaters */
/**************/
function isNumeric ( sText ) {

	var ValidChars = "0123456789.";
	var isNumber=true;
	var Char;

	for ( i = 0; i < sText.length && isNumber === true; i++ ) { 
	
		Char = sText.charAt ( i ); 
		if ( ValidChars.indexOf ( Char ) == -1 ) 
			isNumber = false;
			
    }
    return isNumber;

}

function isGroundPID ( str ) {
	
	var retval = false;
	if ( str.match ( /^[0-2]\d{4}(C|c|[0-9])\d{2}$/ ) )
		retval = true;
	return retval;	
		
}

function isTaxPID ( str ) {
	
	var retval = false;
	if ( str.match ( /^\d{8}([A-Z]|[a-z])?$/ ) )
		retval = true;
	return retval;	
		
}

function isCNumber ( str ) {

	var retval = false;
	if ( str.match ( /^[0-2]\d{4}(C|c)\d{2}$/ ) )
		retval = true;
	return retval;	

}

function is8Number ( str ) {

	var retval = false;
	if ( str.match ( /^\d{8}$/ ) )
		retval = true;
	return retval;	

}

function isEmail( str ) {

	var retval = false;
	if ( str.match ( /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ ) )
		retval = true;
	return retval;

}

//function to check if an image actually exists at a location. used to check if property photo is at the specified location
function imageExists ( url, callback ) {
	var img = new Image( );
	 
  	img.onload = function( ){ callback ( true ); };
  	img.onerror = function(){ callback ( false ); };
  	img.src = url;
}

/**************/
/* Finders */
/**************/
//check if a particular element is in an array. mainly used for quick tips
function inArray( arr, val ){
	var retval = false;

	for( var i = 0; i < arr.length; i++ ){
		if( arr[ i ].toLowerCase( ) == String ( val ).toLowerCase( ) ){
			retval = true;
        	break;
    	}    	 
	}

	return retval;
}

//guess the best possible pid that would be used in the master address table
function guessPIDinMAT( taxpid, groundpid ){
	var pid;
	
	if( is8Number( taxpid ) ){
		pid = taxpid;
	}else if( is8Number( groundpid ) ){	
		pid = groundpid;
	}else{
		pid = taxpid.substr( 0 , 8 );
	}	
			
	return pid;
}

function getBestMatchingAddr( address, checkArr ){
	var match_arr = [ ];
	
	for( var i=0; i < checkArr.length; i++ ){
		var match = 0;
		var temp = checkArr[ i ].split( "|" );
		for( var j = 0; j < temp.length; j++ ){
			match += address.indexOf ( temp[ j ] ) + 1;
		} 
		match_arr.push ( match );
	}
	
	return match_arr.indexOf( Math.max.apply( window, match_arr ) );
}

function switchQueryParams( url, switchParams ){
	var queryParameters = { },
		urlArray = url.split ( "?" ),
		re = /([^&=]+)=([^&]*)/g, m;
 
	// Creates a map with the query string parameters
	while( m = re.exec ( urlArray[ 1 ] ) ){
		queryParameters [ decodeURIComponent ( m [ 1 ] ) ] = decodeURIComponent ( m [ 2 ] );
	}
	
 
	// Add new parameters or update existing ones
	for( var key in  switchParams ){
		queryParameters[ key ] = switchParams[ key ];
	}		
		
	return urlArray[ 0 ] + "?" + $.param( queryParameters ); // Causes page to reload
}

var riskfacts = {
	"zero": {
		"fact": "The proposed floodplain information was approved and provided by the North Carolina Floodplain Mapping program.", 
		"icon": "info"
	},"one": {
		"fact": "This information is considered <b>DRAFT</b> and could be subject to change.", 
		"icon": "info"
	}, "two": {
		"fact": "These draft Base Flood Elevations will not be used for determining premiums for flood insurance policies underwritten by the National Flood Insurance Program.", 
		"icon": "info"
	}, "three": {
		"fact": "These draft Base Flood Elevations can be consulated by local officials for decisions relevant to flood risk.", 
		"icon": "info"
	}, "updatedfloodrisk" : {
		"fact": "param1", 
		"icon": "caution"
	}, "floodsource" : {
		"fact": "Flood Source for this property is param1", 
		"icon": "info"
	}
}, tips = {
	"onepercentchance": {
		"tags": ["1% chance flood"],
		"brief": "Statistically, the area has a one-percent chance of flooding in any given year. Also called a &quot;100-year&quot; flood or called &quot;base flood&quot;. The one-percent chance flood is the standard for flood insurance requirements and floodplain development restrictions.",
		"detailed": "<p>Statistically, the area has a one-percent chance of flooding in any given year. Also called a &quot;100-year&quot; flood or called &quot;base flood&quot;. The one-percent chance flood is the standard for flood insurance requirements and floodplain development restrictions.</p>"
	}, "3dfloodzone": {
		"tags": ["3-D Flood Zone Mapping"],
		"brief": "Typical floodzone maps depict the floodplain areas in only two dimensions: length and width, showing how far floodwater will spread across the ground. Our new floodplain maps add information on the flood height and show how deep and even how fast the floodwater will get. Adding the third dimension (height) is why the new maps are referred to as &quot;3-D&quot;.",
		"detailed": "<p>Typical floodzone maps depict the floodplain areas in only two dimensions: length and width, showing how far floodwater will spread across the ground. Our new floodplain maps add information on the flood height and show how deep and even how fast the floodwater will get. Adding the third dimension (height) is why the new maps are referred to as &quot;3-D&quot;.</p>"
	}, "annualchance": {
		"tags": ["Annual Chance of Flooding", "AnnualChance"],
		"brief": "A measure of the likelihood that flood waters will rise and cover the land to a certain level in any year expressed in percent.",
		"detailed": "<p>Annual chance is a measure of the likelihood that flood waters will rise and cover the land to a certain level in any year. Statistics are used to determine the percent chance of flood waters reaching a certain level for several flooding events shown on the slider bar. These flood events are also referred to by certain &quot;year&quot; flood, " + 
					"also known as the &quot;Recurrence Interval&quot;. Engineering models utilize past records of rainfall amounts and flood levels to predict the height and extent of flooding for several flood events.</p>" + 
					"<p>It is a common misconception that a &quot;100-year&quot; flood is the largest flood to occur once in a 100 year period of time. In reality a &quot;100-year&quot; flood is a flood that has a 1 in 100, or a 1% chance of occurring in any year. In fact, it is possible to have two &quot;100-year&quot; floods in the same year.</p>" +
					"<p>The list below shows the annual chance in percentage, recurrence Interval in years and the probability of various flood events.</p>" +
					"<p class = 'textcenter'><img src = 'image/future_tip1.png' class = 'responsive-image' /></p><p class = 'textcenter'><img src = 'image/future_tip2.png' class = 'responsive-image' /></p>"
	}, "baseflood": {
		"tags": ["Base Flood"],
		"brief": "An one-percent chance flood, also called a 100-year flood. Base flood is the standard for floodplain management, regulations, and determining the need for flood insurance.",
		"detailed": "<p>An one-percent chance flood, also called a 100-year flood. Base flood is the standard for floodplain management, regulations, and determining the need for flood insurance.</p>"
	}, "basefloodelev": {
		"tags": ["Base Flood Elevation", "FEMA Base Flood Elevation"],
		"brief": "The expected depth of floodwater in a one-percent chance flood, also called a 100-year flood. This is determined by existing land use conditions. Primarily, used for flood insurance rating.",
		"detailed": "<p>The expected depth of floodwater in a one-percent chance flood, also called a 100-year flood. This is determined by existing land use conditions. Primarily, used for flood insurance rating.</p>"
	}, "buyout": {
		"tags": ["Buyout"],
		"brief": "Government buying and removing flood-prone houses to eliminate potential flood damages.",
		"detailed": "<p>Government buying and removing flood-prone houses to eliminate potential flood damages.</p>"
	},
	"commubasefloodelev": {
		"tags": ["Community Base Flood Elevation"],
		"brief": "The elevation of the flood water having a one percent chance of being equaled or exceeded in any given year, determined using future land use conditions.",
		"detailed": "<p>The elevation of the flood water having a one percent chance of being equaled or exceeded in any given year, determined using future land use conditions.</p>"
	}, "commuencroach": {
		"tags": ["Community Encroachment Area"],
		"brief": "An area of the floodplain that must be kept clear of any obstruction (fill dirt, buildings, etc) as to not impede the flow of water. Development in this area is very restrictive, and usually requires a detailed engineering analysis (and local approval) prior to beginning development.",
		"detailed": "<p>An area of the floodplain that must be kept clear of any obstruction (fill dirt, buildings, etc) as to not impede the flow of water. Development in this area is very restrictive, and usually requires a detailed engineering analysis (and local approval) prior to beginning development.</p>" +
					"<p class = 'textcenter'><img src = 'image/community1.png' class = 'responsive-image' /></p><p class = 'textcenter'><img src = 'image/community2.png' class = 'responsive-image' /></p>"
	}, "commufldp": {
		"tags": ["Community Floodplain", "Community Special Flood Hazard Area", "Future", "Community FP", "1% Fut"],
		"brief": "The land area that would be covered by water during a 1% annual chance flood determined using future land use conditions. It includes the FEMA Floodway, Community Encroachment Area, FEMA Flood Fringe Area, and the Community Flood Fringe Area. Used locally to regulate new development. This is also called as the Community Special Flood Hazard Area.",
		"detailed": "<p>As urban areas continue to grow land that was once covered with more natural land cover such as forests, fields, and lawns is replaced by manmade land covers such as roads, parking lots and rooftops. Rainfall that used to soak into the ground is now gathered into storm drains, pipes and ditches and directed into streams and creeks. This results in greater amounts of water draining into the streams usually causing higher flood levels. These &quot;future&quot; floodplain areas are shown on the Flood Insurance Rate Maps (FIRM) for Mecklenburg County. They are indicated on the maps as &quot;Zone X Shaded&quot;. In Mecklenburg County, all new construction and substantial improvements to existing buildings must be built so that the lowest floor is one or two feet above the 1% annual chance flood level based on future land use conditions.</p>"+
				"<p>Future land use is determined by reviewing maps and other data developed by planning departments and other agencies. The future land use layer developed by the Charlotte-Mecklenburg Planning Department was used as the &quot;basis&quot; for the future land use for floodplain mapping. This layer is regularly maintained from zoning cases and district/area plans within the extra territorial jurisdiction (ETJ) of Charlotte. Future land use for areas outside of the Charlotte ETJ were compiled from a variety of sources including zoning, the 2015 land use plan and land use plans from the six towns. The final future land use conditions used to develop the future floodplain areas was determined after extensive review of the data by watershed task forces. These task forces were comprised of residents and professionals living or working in the studied watersheds.</p>"+
				"<p>The future land use conditions are divided into several categories based on the percent of the land that will not allow water to soak into the ground. These categories of future land use are input (along with many other variables) into detailed hydrologic models that determine the amount of water flowing in the stream when the future land use conditions are met.</p>" +
				"<p class = 'textcenter'><img src = 'image/future_tip1.png' class = 'responsive-image' /></p><p class = 'textcenter'><img src = 'image/future_tip2.png' class = 'responsive-image' /></p><p class = 'textcenter'><img src = 'image/community1.png' class = 'responsive-image'/></p><p class = 'textcenter'><img src = 'image/community2.png' class = 'responsive-image'/></p>"
	}, "compbscore": {
		"tags": ["Electrical and/or mechanical equipment"],
		"brief": "",
		"detailed": "<p>As urban areas continue to grow land that was once covered with more natural land cover such as forests, fields, and lawns is replaced by manmade land covers such as roads, parking lots and rooftops. Rainfall that used to soak into the ground is now gathered into storm drains, pipes and ditches and directed into streams and creeks. This results in greater amounts of water draining into the streams usually causing higher flood levels. These &quot;future&quot; floodplain areas are shown on the Flood Insurance Rate Maps (FIRM) for Mecklenburg County. They are indicated on the maps as &quot;Zone X Shaded&quot;. In Mecklenburg County, all new construction and substantial improvements to existing buildings must be built so that the lowest floor is one or two feet above the 1% annual chance flood level based on future land use conditions.</p>"+
				"<p>Future land use is determined by reviewing maps and other data developed by planning departments and other agencies. The future land use layer developed by the Charlotte-Mecklenburg Planning Department was used as the &quot;basis&quot; for the future land use for floodplain mapping. This layer is regularly maintained from zoning cases and district/area plans within the extra territorial jurisdiction (ETJ) of Charlotte. Future land use for areas outside of the Charlotte ETJ were compiled from a variety of sources including zoning, the 2015 land use plan and land use plans from the six towns. The final future land use conditions used to develop the future floodplain areas was determined after extensive review of the data by watershed task forces. These task forces were comprised of residents and professionals living or working in the studied watersheds.</p>"+
				"<p>The future land use conditions are divided into several categories based on the percent of the land that will not allow water to soak into the ground. These categories of future land use are input (along with many other variables) into detailed hydrologic models that determine the amount of water flowing in the stream when the future land use conditions are met.</p>" +
				"<p class = 'textcenter'><img src = 'image/future_tip1.png' class = 'responsive-image' /></p><p class = 'textcenter'><img src = 'image/future_tip2.png' class = 'responsive-image' /></p><p class = 'textcenter'><img src = 'image/community1.png' class = 'responsive-image' /></p><p class = 'textcenter'><img src = 'image/community2.png' class = 'responsive-image' /></p>"
	}, "xsec": {
		"tags": ["Cross section"],
		"brief": "A line on a floodplain map indicating that a flood elevation has been calculated for that section of the stream and floodplain.",
		"detailed": "<p>A line on a floodplain map indicating that a flood elevation has been calculated for that section of the stream and floodplain.</p>"
	}, "depth": {
		"tags": ["Depth"],
		"brief": "Depth of water in the flooded area.",
		"detailed": "<p>Depth of water in the flooded area.</p>"
	}, "elev": {
		"tags": ["Elevation"],
		"brief": "Height above sea level expressed in feet.",
		"detailed": "<p>Height above sea level expressed in feet.</p>"
	}, "fema": {
		"tags": ["FEMA"],
		"brief": "Federal Emergency Management Agency. Nationwide agency responsible for reducing loss of life and property from natural and man-made hazards.",
		"detailed": "<p>Federal Emergency Management Agency. Nationwide agency responsible for reducing loss of life and property from natural and man-made hazards.</p>"
	}, "firmcurrent": {
		"tags": ["FIRM Current"],
		"brief": "These are the current/effective Flood Insurance Rate Maps.  Maps in western and northeastern Mecklenburg have a FEMA effective date of March 9, 2009.  Maps in central and southeastern Mecklenburg have a FEMA effective date of February 19, 2014.",
		"detailed": "<p>These are the current/effective Flood Insurance Rate Maps.  Maps in western and northeastern Mecklenburg have a FEMA effective date of March 9, 2009.  Maps in central and southeastern Mecklenburg have a FEMA effective date of February 19, 2014.</p><p>These are the maps that are in use now to rate flood insurance. A Flood Insurance Rate Map (FIRM) is the official map of a community on which FEMA has delineated both the special hazard areas and the risk premium zones applicable to the community.</p>"
	}, "femafloodplain": {
		"tags": ["FEMA Floodplain", "FEMA Special Flood Hazard Area", "Special Flood Hazard Area", "100yr", "1%", "100yr/1%", "FEMA FP"],
		"brief": "The land area that would be covered by water during a 1% annual chance flood determined using existing land use conditions. Flood insurance is required for buildings with mortgages located in this area.",
		"detailed": "<p>The 100-year flood is more accurately referred to as the 1% annual exceedance probability flood, since it is a flood that has a 1% chance of being equaled or exceeded in any single year.</p>"
	}, "femafloodway": {
		"tags": ["FEMA Floodway"],
		"brief": "The area closest to the stream centerline that must be kept clear of any obstruction (fill dirt, buildings, etc) as to not impede the flow of water. Development in this area is very restrictive, and usually requires a detailed engineering analysis (and possibly FEMA approval) prior to working in this area.",
		"detailed": "<p>The area closest to the stream centerline that must be kept clear of any obstruction (fill dirt, buildings, etc) as to not impede the flow of water. Development in this area is very restrictive, and usually requires a detailed engineering analysis (and possibly FEMA approval) prior to working in this area.</p>"
	}, "fins": {
		"tags": ["FINS - Flood Information & Notification System"],
		"brief": "Network of rain and stream gauges in Charlotte-Mecklenburg that automatically alerts emergency responders of heavy rain or rising streams.",
		"detailed": "<p>Network of rain and stream gauges in Charlotte-Mecklenburg that automatically alerts emergency responders of heavy rain or rising streams.</p>"
	}, "fldinsurance": {
		"tags": ["Flood Insurance"],
		"brief": "A type of insurance policy that specifically covers damage caused by flooding. Flood insurance is required in most cases where the property is in an area with at least a one-percent chance of flooding in any given year and if that home or business has a mortgage that is financed by a federally-insured lender. Flood insurance can be purchased for any property, regardless of the level of risk.",
		"detailed": "<p>A type of insurance policy that specifically covers damage caused by flooding. Flood insurance is required in most cases where the property is in an area with at least a one-percent chance of flooding in any given year and if that home or business has a mortgage that is financed by a federally-insured lender. Flood insurance can be purchased for any property, regardless of the level of risk.</p>"
	}, "firm": {
		"tags": ["Flood Insurance Rate Map"],
		"brief": "The official map of a community, on which the Federal Emergency Management Agency (FEMA) has delineated the Special Flood Hazard Areas and the flood insurance zones. The main use of the FIRM is to correctly rate flood insurance policies but it also provides valuable information concerning the flood risk of property.",
		"detailed": "<p>The official map of a community, on which the Federal Emergency Management Agency (FEMA) has delineated the Special Flood Hazard Areas and the flood insurance zones. The main use of the FIRM is to correctly rate flood insurance policies but it also provides valuable information concerning the flood risk of property.</p>"
	}, "firmproposed": {
		"tags": ["FIRM Proposed"],
		"brief": "The proposed floodplain information was approved and provided by the North Carolina Floodplain Mapping program as part of a flood study of the Catawaba River. This information is currently DRAFT. Affected property owners will be notified of changes to the status of this flood study.",
		"detailed": "<p>These are the proposed Flood Insurance Rate Maps that will become effective in late 2015 for streams in western Mecklenburg (Phase 2) and in 2017 for streams in northeastern Mecklenburg (Phase 3).  Click link for more information. A Flood Insurance Rate Map (FIRM) is the official map of a community on which FEMA has delineated both the special hazard areas and the risk premium zones applicable to the community.</p>"
	}, "firmchngcomp": {
		"tags": ["FIRM Chnage Comparison"],
		"brief": "This set of layers represent the changes in the proposed lines for 100yr Floodzone, 100yr Future Floodzone and Floodways from the existing ones. Green region is the area to be removed and Red region is the area to be added.",
		"detailed": "<p>The Green regions portray the portions in the FEMA Floodplain, Community Floodplain and Floodways that have been removed from the Existing lines in the Proposed lines. The Red regions portray the portions that have been added.</p>"
	}, "fistudy": {
		"tags": ["Flood Insurance Study"],
		"brief": "A document that includes a variety data related to the Flood Insurance Rate Maps. Data includes; stream profiles, floodway widths, base flood elevations, stream flows etc.",
		"detailed": "<p>A document that includes a variety data related to the Flood Insurance Rate Maps. Data includes; stream profiles, floodway widths, base flood elevations, stream flows etc.</p>"
	}, "fldp": {
		"tags": ["Floodplain"],
		"brief": "The land area covered by water from a flood having a specific likelihood of occurring in any year, commonly referred to as a certain &quot;year&quot; flood event.",
		"detailed": "<p>Statistics are used to determine the percent chance of flood waters reaching a certain level for specific flood events as shown on the slider bar. The &quot;year&quot; term is an attempt to assign a time period to indicate the statistical probability of a certain magnitude flood occurring. These flood events are also referred to by certain &quot;% Annual Chance&quot;. Engineering models utilize past records of rainfall amounts and flood levels to predict the height and extent of flooding for several flood events.</p>"+
				"<p>It is a common misconception that a &quot;100-year&quot; flood is the largest flood to occur once in a 100 year period of time. In reality a &quot;100-year&quot; flood is a flood that has a 1 in 100, or a 1% chance of occurring in any year. In fact, it is possible to have two &quot;100-year&quot; floods in the same year.</p>"+
				"<p>The list below shows the annual chance in percentage, recurrence Interval in years and the probability of various flood events. </p>"+
				"<p class = 'textcenter'><img src = 'image/floodplain.png' class = 'responsive-image'/></p>"
	}, "fldpdevpermit": {
		"tags": ["Floodplain Development Permit"],
		"brief": "A permit, issued by Mecklenburg County Flood Mitigation, that must be obtained prior to any development occurring in the floodplain.",
		"detailed": "<p>The official map of a community, on which the Federal Emergency Management Agency (FEMA) has delineated the Special Flood Hazard Areas and the flood insurance zones. The main use of the FIRM is to correctly rate flood insurance policies but it also provides valuable information concerning the flood risk of property.</p>"
	}, "fldpmgmt": {
		"tags": ["Floodplain Management"],
		"brief": "Use of land development regulations, property buyouts and floodplain mapping to reduce flood hazards, avoid increasing flood levels, inform the public of their property’s flood risks and restore the beneficial functions of the natural floodplain.",
		"detailed": "<p>Use of land development regulations, property buyouts and floodplain mapping to reduce flood hazards, avoid increasing flood levels, inform the public of their property’s flood risks and restore the beneficial functions of the natural floodplain.</p>"
	}, "fpe": {
		"tags": ["Flood Protection Elevation"],
		"brief": "The height to which the lowest floor of new or substantially improved buildings and other building features must be constructed. It is typically one foot above the Community Base Flood Elevation (two feet above in Cornelius). Along the Catawba River it is two feet above the FEMA Base Flood Elevation.",
		"detailed": "<p>The height to which the lowest floor of new or substantially improved buildings and other building features must be constructed. It is typically one foot above the Community Base Flood Elevation (two feet above in Cornelius). Along the Catawba River it is two feet above the FEMA Base Flood Elevation.</p>"
	}, "floodways": {
		"tags": ["Floodways"],
		"brief": "Areas of the floodplain, closer to the stream centerline, that are must be kept free of development or other obstructions in order to convey the free flow of water. This term includes the FEMA Floodway and the Community Encroachment Area.",
		"detailed": "<p>The term floodways refers to both the <b>FEMA Floodway</b> and the <b>Community Encroachment Area</b> and are described in more detail below.</p>"+
					"<p><b>Community Encroachment Area</b> - An area of the floodplain that must be kept clear of any obstruction (fill dirt, buildings, etc) as to not impede the flow of water. Development in this area is very restrictive, and usually requires a detailed engineering analysis (and local approval) prior to beginning development. The location and width of the Community Encroachment Area is established by engineering models that determine the area needed to convey the FEMA Base Flood Discharge without increasing the water surface elevation more than 0.1 foot. The Community Encroachment Area is wider the FEMA Floodway.</p>"+
					"<p><b>FEMA Floodway</b> - An area of the floodplain that must be kept clear of any obstruction (fill dirt, buildings, etc) as to not impede the flow of water. Development in this area is very restrictive, and usually requires a detailed engineering analysis (and FEMA approval) prior to beginning development. The location and width of the FEMA Floodway Area is established by engineering models that determine the area needed to convey the FEMA Base Flood Discharge without increasing the water surface elevation more than 0.5 foot.</p>"+
					"<p class = 'textcenter'><img src = 'image/floodways_tip.png' class = 'responsive-image'/></p>"					
	}, "fldz": {
		"tags": ["Floodzone"],
		"brief": "A geographical area shown on a Flood Insurance Rate Map that indicates the severity or type of flooding in the area. Also used to determine flood insurance rates. &quot;Recurrence Interval&quot;.",
		"detailed": "<p>The land area covered by water from a flood having a specific likelihood of occurring in any year, commonly referred to as a certain &quot;year&quot; flood event.</p>"+
					"<p>Statistics are used to determine the percent chance of flood waters reaching a certain level for specific flood events as shown on the slider bar. The &quot;year&quot; term is an attempt to assign a time period to indicate the statistical probability of a certain magnitude flood occurring. These flood events are also referred to by certain &quot;% Annual Chance&quot;. Engineering models utilize past records of rainfall amounts and flood levels to predict the height and extent of flooding for several flood events.</p>"+
					"<p>It is a common misconception that a &quot;100-year flood&quot; is the largest flood to occur once in a 100 year period of time. In reality a &quot;100-year&quot; flood is a flood that has a 1 in 100, or a 1% chance of occurring in any year. In fact, it is possible to have two &quot;100-year&quot; floods in the same year.</p>"+	
					"<p>The list below shows the annual chance in percentage, recurrence Interval in years and the probability of various flood events.</p>"+ 
					"<p class = 'textcenter'><img src = 'image/floodplain.png' class = 'responsive-image'/></p>"
	}, "groundelev": {
		"tags": ["Ground Elevation"],
		"brief": "The vertical distance from mean sea level to a point on the earth's surface.",
		"detailed": "<p>The vertical distance from mean sea level to a point on the earth's surface.</p>"
	}, "inoutfemafloodplain": {
		"tags": [ "In Out FEMA Floodplain", "FEMA Floodplain Change Comparison" ],
		"brief": "This layer represents the changes in the proposed FEMA Floodplain from that of the existing one.",
		"detailed": "<p>The Green regions portray the portions in the FEMA Floodplain that have been removed from the Existing lines in the Proposed lines. The Red regions portray the portions that have been added.</p>"
	}, "inoutcommufldp": {
		"tags": [ "In Out Community Floodplain", "Community Floodplain Change Comparison" ],
		"brief": "This layer represents the changes in the proposed Community Floodplain from that of the existing one.",
		"detailed": "<p>The Green regions portray the portions in the Community Floodplain that have been removed from the Existing lines in the Proposed lines. The Red regions portray the portions that have been added.</p>"
	}, "inoutfemafldwys": {
		"tags": [ "In Out FEMA Enchroachment", "In Out FEMA Floodways", "FEMA Enchroachment Change Comparison" ],
		"brief": "This layer represents the changes in the proposed FEMA Floodway from that of the existing one.",
		"detailed": "<p>The Green regions portray the portions in the FEMA Floodway that have been removed from the Existing lines in the Proposed lines. The Red regions portray the portions that have been added.</p>"
	}, "inoutcommufldwys": {
		"tags": [ "In Out Community Enchroachment", "In Out Community Floodways", "Community Enchroachment Change Comparison" ],
		"brief": "This layer represents the changes in the proposed Community Floodway from that of the existing one.",
		"detailed": "<p>The Green regions portray the portions in the Community Encroachment Area Floodway that have been removed from the Existing lines in the Proposed lines. The Red regions portray the portions that have been added.</p>"
	}, "lomr": {
		"tags": ["Letter of Map Revision (LOMR)"],
		"brief": "An official amendment to the currently effective FEMA FIRM based on as-built conditions. It is issued by FEMA and may change FEMA Base Flood Elevations, the location of the FEMA Floodway Lines and/or the location of the FEMA Flood Fringe line.",
		"detailed": "<p>An official amendment to the currently effective FEMA FIRM based on as-built conditions. It is issued by FEMA and may change FEMA Base Flood Elevations, the location of the FEMA Floodway Lines and/or the location of the FEMA Flood Fringe line.</p>"
	}, "loma": {
		"tags": ["Letter of Map Amendment (LOMA)"],
		"brief": "A letter from FEMA that officially removes a building from the Special Flood Hazard Area (SFHA), (Flood Zone AE) on the Flood Insurance Rate Map and no fill has been added to elevate the building. A LOMA is issued when a surveyed elevation indicates the lowest adjacent grade of the building is equal to or higher than the FEMA Base Flood Elevation. The LOMA states that the building is actually located outside of the SFHA and is now correctly located in flood zone X (area outside of the SFHA). A LOMA is used when there has been no fill material added to the property in order to raise the building or land in question. A LOMA can also be issued for a parcel or other land area.",
		"detailed": "<p>Flood insurance is required for buildings with mortgages that are shown in the FEMA Special Flood Hazard Area (SFHA) on the current Flood Insurance Rate Map (FIRM).  Sometimes buildings are incorrectly shown as being located in the SFHA when in fact, based on survey data, they are actually above the FEMA Base Flood Elevations.  This may occur when the maps are drawn incorrectly or when the ground has been elevated by fill material prior to the building being constructed.</p>" +	
					"<p>It is possible in these cases to obtain a letter from FEMA that provides the correct information and officially removes the building or property from the SFHA, which in turn removes the mandatory flood insurance purchase requirement.   The two types of FEMA letters are described below.</p>" +	
					"<p>A Letter of Map Revision based on Fill (LOMR-F) a letter from FEMA that officially removes a building from the Special Flood Hazard Area (SFHA), (Flood Zone AE) on the Flood Insurance Rate Map because fill has been added to elevate the building.  A LOMR-F is issued when surveyed elevations indicate the lowest adjacent grade, and lowest floor of the building are equal to or higher than the FEMA Base Flood Elevation.  The LOMR-F states that the building is actually located outside of the SFHA and is now correctly located in Zone X (flood insurance not required).  A LOMR-F can also be issued for a parcel or other land area.</p>" +	
					"<p>The surveyed elevations must be provided by a professional land surveyor and they usually complete the appropriate forms and forward them to FEMA for review.  For more information about LOMAs and LOMR-Fs go to www.fema.gov and search for LOMA or LOMR-F.  The forms, instructions and other information about LOMAs and LOMR-Fs can be found on this site.</p>"	
	}, "lomrf": {
		"tags": ["Letter of Map Revision based on Fill (LOMR-F)"],
		"brief": "A letter from FEMA that officially removes a building from the Special Flood Hazard Area (SFHA), (Flood Zone AE) on the Flood Insurance Rate Map because fill has been added to elevate the building. A LOMR-F is issued when surveyed elevations indicate the lowest adjacent grade, and lowest floor of the building is equal to or higher than the FEMA Base Flood Elevation. The LOMR-F states that the building is actually located outside of the SFHA and is now correctly located in flood zone X (area outside of the SFHA). A LOMR-F can also be issued for a parcel or other land area.",
		"detailed": "<p>A letter from FEMA that officially removes a building from the Special Flood Hazard Area (SFHA), (Flood Zone AE) on the Flood Insurance Rate Map because fill has been added to elevate the building. A LOMR-F is issued when surveyed elevations indicate the lowest adjacent grade, and lowest floor of the building is equal to or higher than the FEMA Base Flood Elevation. The LOMR-F states that the building is actually located outside of the SFHA and is now correctly located in flood zone X (area outside of the SFHA). A LOMR-F can also be issued for a parcel or other land area.</p>"
	}, "lowstfloor": {
		"tags": ["Lowest Floor"],
		"brief": "The lowest floor of the lowest enclosed area (including the basement). An unfinished or flood-resistant enclosure, usable solely for parking of vehicles, building access or storage in an area other than a basement area, is not considered a building's Lowest Floor provided that such enclosure is not built so as to render the structure in violation of the applicable non-elevation design requirements of this ordinance.",
		"detailed": "<p>The lowest floor of the lowest enclosed area (including the basement). An unfinished or flood-resistant enclosure, usable solely for parking of vehicles, building access or storage in an area other than a basement area, is not considered a building's Lowest Floor provided that such enclosure is not built so as to render the structure in violation of the applicable non-elevation design requirements of this ordinance.</p>"
	}, "mitigate": {
		"tags": ["Mitigate"],
		"brief": "Reduce the potential for damage; make less severe.",
		"detailed": "<p>Reduce the potential for damage; make less severe.</p>"
	}, "oneprcntchance": {
		"tags": ["One-percent chance flood"],
		"brief": "Statistically, the area has a one-percent chance of flooding in any given year. Also called a &quot;100-year&quot; flood or called &quot;base flood&quot;. The one-percent chance flood is the standard for flood insurance requirements and floodplain development restrictions.",
		"detailed": "<p>Statistically, the area has a one-percent chance of flooding in any given year. Also called a &quot;100-year&quot; flood or called &quot;base flood&quot;. The one-percent chance flood is the standard for flood insurance requirements and floodplain development restrictions.</p>"
	}, "prcntchance": {
		"tags": ["Percent Chance Flood"],
		"brief": "Statistical likelihood of a flood. For example, a one-percent chance flood has a one percent chance of occurring in any given year.",
		"detailed": "<p>Statistical likelihood of a flood. For example, a one-percent chance flood has a one percent chance of occurring in any given year.</p>"
	}, "postfirm": {
		"tags": ["Post-FIRM"],
		"brief": "Construction or other development for which the &quot;start of construction&quot; occurred on or after the effective date of the initial Flood Insurance Rate Map. In Charlotte, that date is August 1978. Most post-FIRM buildings pay actuarial flood insurance rates.",
		"detailed": "<p>Construction or other development for which the &quot;start of construction&quot; occurred on or after the effective date of the initial Flood Insurance Rate Map. In Charlotte, that date is August 1978. Most post-FIRM buildings pay actuarial flood insurance rates.</p>"
	}, "prefirm": {
		"tags": ["Pre-FIRM"],
		"brief": "Construction or other development for which the &quot;start of construction&quot; occurred before the effective date of the initial Flood Insurance Rate Map. In Charlotte, that date is August 1978. Restrictions on improvements or repairs to pre-FIRM buildings may be different from what is allowed for post-FIRM buildings. Pre-FIRM buildings usually qualify for less expensive, flood insurance rates.",
		"detailed": "<p>Construction or other development for which the &quot;start of construction&quot; occurred before the effective date of the initial Flood Insurance Rate Map. In Charlotte, that date is August 1978. Restrictions on improvements or repairs to pre-FIRM buildings may be different from what is allowed for post-FIRM buildings. Pre-FIRM buildings usually qualify for less expensive, flood insurance rates.</p>"
	}, "substdamage": {
		"tags": ["Substantial Damage"],
		"brief": "Damage to a building totaling either 50% of the building's market value in one event or 25% of the building's market value on each of two events within a ten year period. See definition of &quot;Substantial Improvement&quot;. If the structure's lowest floor is below the current base flood elevation, the &quot;substantial improvement rule&quot; applies. The building often must be elevated (raised) above projected flood levels before it is renovated or repaired.",
		"detailed": "<p>Damage to a building totaling either 50% of the building's market value in one event or 25% of the building's market value on each of two events within a ten year period. See definition of &quot;Substantial Improvement&quot;. If the structure's lowest floor is below the current base flood elevation, the &quot;substantial improvement rule&quot; applies. The building often must be elevated (raised) above projected flood levels before it is renovated or repaired.</p>"
	}, "substantialimprovement": {
		"tags": ["Substantial Improvement", "50% rule"],
		"brief": "There are limits on how much one can spend to renovate or repair a home or business in the regulated floodplain. The limits apply to one-time expenses as well as to multiple projects over a ten year period. If the cost of reconstruction, repairs or an addition equals or goes above 50 percent of the building's market value, then the building must meet the same floodplain construction requirements as a new building. If the structure's lowest floor is below the current base flood elevation, the &quot;substantial improvement rule&quot; applies. The building often must be elevated (raised) above projected flood levels before it is renovated or repaired.",
		"detailed": "<p>There are limits on how much one can spend to renovate or repair a home or business in the regulated floodplain. The limits apply to one-time expenses as well as to multiple projects over a ten year period. If the cost of reconstruction, repairs or an addition equals or goes above 50 percent of the building's market value, then the building must meet the same floodplain construction requirements as a new building. If the structure's lowest floor is below the current base flood elevation, the &quot;substantial improvement rule&quot; applies. The building often must be elevated (raised) above projected flood levels before it is renovated or repaired.</p>"
	}
}, zoom = {
	toCenter: function(mapCenter, zoomlevel){
		map.setLevel( zoomlevel );
		map.centerAt( mapCenter );
	}
};