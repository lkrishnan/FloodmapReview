if ( !Array.prototype.indexOf ) {
    
	Array.prototype.indexOf = function ( searchElement, fromIndex ) {
     
		if ( this === undefined || this === null ) {
        
			throw new TypeError( '"this" is null or not defined' );
		}

		var length = this.length >>> 0; // Hack to convert object.length to a UInt32

		fromIndex = +fromIndex || 0;

		if ( Math.abs ( fromIndex ) === Infinity ) {
        
			fromIndex = 0;
      
		}

		if ( fromIndex < 0 ) {
        
			fromIndex += length;
			if ( fromIndex < 0 ) {
			
				fromIndex = 0;
			
			}
			
		}

		for ( ;fromIndex < length; fromIndex++ ) {
		
			if ( this[ fromIndex ] === searchElement ) {
				
				return fromIndex;
				
			}
			
		}

		return -1;
		
    };
	
}
 
if ( !String.prototype.trim ) {

	String.prototype.trim = function () {
	
		return this.replace ( /^\s+|\s+$/g, '' );
	
	};
	
} 

function getStandardizedAddress(address) {	
	
	var inputAddress = address.replace ( /[^a-zA-Z0-9]/g, " " ).trim().toUpperCase().split ( " " ),
		stdAddress = [ "", "", "", "","", "", "", "", "" ],
		prefixes = [ "NORTH", "N", "EAST", "E", "WEST", "W", "SOUTH", "S" ],
		sttypes = [ "ALLEY", "ALY", "AL", "AVENUE", "AVE", "AV", "BOULEVARD", "BLVD", "BV", "CIRCLE", "CIR", "CR", "CRESCENT", "CRES", 
					"CS", "COURT", "CT", "CT", "COVE", "CV", "CV", "DRIVE", "DR", "DR", "FREEWAY", "FWY", "FR", "HIGHWAY", "HWY", "HY",
					"LANE", "LN", "LN", "LOOP", "LOOP", "LP", "PLACE", "PL", "PL", "PARKWAY", "PKY", "PY", "ROAD", "RD", "RD", 
					"RUN", "RUN", "RN", "ROW", "ROW", "RW", "STREET", "ST", "ST", "TRACE", "TRCE", "TC", "TRAIL", "TRL", "TL", "TERRACE", "TER", "TR", "WAY", "WAY", "WY" ],
		suffixes = [ "N", "NORTH", "E", "EAST", "W", "WEST", "S", "SOUTH", "EX", "EXT" ]; 			
		units = [ "APT", "SUITE" ],
		states = [ "ALABAMA", "AL", "ALABAMA", "ALASKA", "AK", "ALASKA", "ARIZONA", "AZ", "ARIZONA", "ARKANSAS", "AR", "ARKANSAS", 
					"CALIFORNIA", "CA", "CALIFORNIA", "COLORADO", "CO", "COLORADO", "CONNECTICUT", "CT", "CONNECTICUT", 
					"DELAWARE", "DE", "DELAWARE", "DISTRICTOFCOLUMBIA", "DC", "DISTRICT OF COLUMBIA", "FLORIDA", "FL", "FLORIDA", 
					"GEORGIA", "GA", "GEORGIA", "HAWAII", "HI", "HAWAII", "IDAHO", "ID", "IDAHO", "ILLINOIS", "IL", "ILLINOIS", "INDIANA", "IN", "INDIANA", "IOWA", "IA", "IOWA", 
					"KANSAS", "KS", "KANSAS", "KENTUCKY", "KY", "KENTUCKY", "LOUISIANA", "LA", "LOUISIANA", 
					"MAINE", "ME", "MAINE", "MARYLAND", "MD", "MARYLAND", "MASSACHUSETTS", "MA", "MASSACHUSETTS", "MICHIGAN", "MI", "MICHIGAN", 
					"MINNESOTA", "MN", "MINNESOTA", "MISSISSIPPI", "MS", "MISSISSIPPI", "MISSOURI", "MO", "MISSOURI", "MONTANA", "MT", "MONTANA", 
					"NEBRASKA", "NE", "NEBRASKA", "NEVADA", "NV", "NEVADA", "NEWHAMPSHIRE", "NH", "NEW HAMPSHIRE", "NEWJERSEY", "NJ", "NEW JERSEY", 
					"NEWMEXICO", "NM", "NEW MEXICO", "NEWYORK", "NY", "NEW YORK", "NORTHCAROLINA", "NC", "NORTH CAROLINA", "NORTHDAKOTA", "ND", "NORTH DAKOTA", 
					"OHIO", "OH", "OHIO", "OKLAHOMA", "OK", "OKLAHOMA", "OREGON", "OR", "OREGON", "PENNSYLVANIA", "PA", "PENNSYLVANIA", "RHODEISLAND", "RI", "RHODE ISLAND",
					"SOUTHCAROLINA", "SC", "SOUTH CAROLINA", "SOUTHDAKOTA", "SD", "SOUTH DAKOTA", "TENNESSEE", "TN", "TENNESSEE", "TEXAS", "TX", "TEXAS", 
					"UTAH", "UT", "UTAH", "VERMONT", "VT", "VERMONT", "VIRGINIA", "VA", "VIRGINIA", "WASHINGTON", "WA", "WESTVIRGINIA", "WV", "WISCONSIN", "WI", "WYOMING", "WY" ],
		notoriousList = {
				"N": [ 
						"NORTH", "NORTH COMMUNITY HOUSE", "NORTH POINT", "NORTH COURSE", "NORTH BEATTIES FORD", "NORTH WIND", "NORTH HILLS", "NORTH HARBOR",
						"NORTH LIBRARY", "NORTH VALLEY", "NORTH FALLS", "NORTH CASTLE", "NORTH KIMBERLY", "NORTH COVE",	"NORTH LYNBROOK", 
						"NORTH CANYON", "NORTH RIDGE", "NORTH PINE HILL", "NORTH SHORE", "NORTH FAULKNER", "NORTH HAMPTON", "NORTH DOWNING" 
					 ],
				"E": [ 
						"EAST", "EAST BATTERY", "EAST END", "EAST ORCHARD", "EAST TODD", "EAST ROCK", "EAST FORD", "EAST ARBORS", "EAST DOUGLAS PARK",
						"EAST LAKE", "EAST BARDEN", "EAST LANE", "EAST PROVIDENCE" 
					 ],
				"W": [ 
						"WEST", "WEST KENTON", "WEST TODD", "WEST DOUGLAS PARK", "WEST BANK", "WEST SLOPE", "WEST CATAWBA", "WEST ARBORS",
						"WEST HOLLY VISTA", "WEST POINTE", "N C 73", "S MAIN", "S J LAWRENCE", "W S LEE", "W T HARRIS" 
					 ],
				"S": [ 
						"SOUTH", "SOUTH BIRKDALE COMMONS", "SOUTH RIDGE", "SOUTH HAMPTON", "SOUTH BANK", "SOUTH LAKES", "SOUTH VILLAGE",	"SOUTH BRENT",
						"SOUTH RENSSELAER", "SOUTH REGAL", "SOUTH HILL", "SOUTH BEND", "SOUTH STREAM", "SOUTH DEVON", "SOUTH LIBRARY",
						"SOUTH POINT", "SOUTH CREEK", "SOUTH DOWNS", "SOUTH WAY", "SOUTH HALL", "SOUTH FAULKNER", "SOUTH HILL VIEW",
						"SOUTH BRIDGE",	"SOUTH FORD", "SOUTH COMMERCE" 
					 ]		
			},
		prefixToname = { "E": "EAST", "W": "WEST", "S": "SOUTH", "N": "NORTH" },			
		j = 0;

	for ( var i = 0; i < inputAddress.length; i++ ) {
	
		switch ( j ) {
			
			case 0: //house no
				
				if ( onlyNumbers( inputAddress[ i ] ) ) {
				
					stdAddress[ j ] = inputAddress[ i ];
								
				} else {
				
					i--; 
				
				}
				 
				j++
							
				break;
				
			case 1: //prefix
			
				if ( prefixes.indexOf( inputAddress[ i ] ) > -1 ) {
				
					stdAddress[ j ] = prefixes[ prefixes.indexOf ( inputAddress[ i ] ) + ( 1 - ( prefixes.indexOf ( inputAddress[ i ] ) % 2) ) ]; //standardize prefix
				
				} else { 
				
					i--; 
				
				} 
				
				j++;
							
				break;
				
			case 2: //street name
			
				if ( sttypes.indexOf ( inputAddress[ i ] ) == -1 ) {
								
					if ( inputAddress[i].length > 0 )			
						stdAddress[ j ] += ( stdAddress[ j ].length > 0 ? " " : "" ) + inputAddress[ i ];
					
				} else { 
					
					i--; 
					j++; 
				
				}
												
				break;
				
			case 3: //street type
							
				stdAddress[ j ] = sttypes[ sttypes.indexOf ( inputAddress[ i ] ) + ( 2 - ( sttypes.indexOf ( inputAddress[ i ] ) % 3 ) ) ]; //standardize street type
				j++;
						
				break;

			case 4: //suffix
			
				if ( suffixes.indexOf ( inputAddress[ i ] ) > -1 ) {
				
					stdAddress[ j ] = suffixes[ suffixes.indexOf ( inputAddress[ i ] ) + ( 1 - ( suffixes.indexOf ( inputAddress[ i ] ) % 2 ) ) ]; //standardize suffix
				
				} else { 
				
					i--; 
				
				}	
				
				j++;
				
				break;
				
			case 5: //unit
			
				if ( units.indexOf ( inputAddress [ i ] ) == -1 ) {
				
					if( soundex ( inputAddress [ i ] ).substring ( 1 ) == "000" ) { //this takes cares of spaces also
										
						stdAddress[ j ] +=  ( stdAddress[ j ].length > 0 ? " " : "" ) + inputAddress[ i ];  		
					
					} else { 
					
						i--; 
						j++; 
						
					}
				
				} 
							
				break;
								
			case 6: //city and state
			
				if ( !inputAddress[ i ].match( /^\d{5}$/ ) ) {
				
					if ( inputAddress[i].length > 0 )
						stdAddress[ j ] += ( stdAddress[ j ].length > 0 ? " " : "" ) + inputAddress[i];  		
				
				} else { 
					
					i--; 
					j += 2; 
					
				}
							
				break;	
				
			case 8: //zip
			
				stdAddress[ j ] = inputAddress[ i ];

				break;
											
		}
														
	}
	
	//fix notorious street names	
	if ( stdAddress[ 1 ].length > 0 ) {
					
		if ( notoriousList[ stdAddress[ 1 ] ].indexOf ( ( stdAddress[ 1 ] + " " + stdAddress[ 2 ] ).trim() ) > -1 ) {
		
			stdAddress[ 2 ] =	notoriousList[ stdAddress[ 1 ] ][notoriousList[ stdAddress[ 1 ] ].indexOf ( ( stdAddress[ 1 ] + " " + stdAddress[ 2 ] ).trim() ) ];
			stdAddress[ 1 ] = "";	
		
		} else if ( notoriousList[ stdAddress[ 1 ] ].indexOf ( ( prefixToname[ stdAddress[ 1 ] ] + " " + stdAddress[ 2 ] ).trim() ) > -1 ) {
		
			stdAddress[ 2 ] =	notoriousList[ stdAddress[ 1 ] ][notoriousList[ stdAddress[ 1 ] ].indexOf ( ( prefixToname[ stdAddress[ 1 ] ] + " " + stdAddress[ 2 ] ).trim() ) ];
			stdAddress[ 1 ] = "";	
		
		}
	
	}
		
	//split city and state
				
	if ( stdAddress[ 6 ].length > 0 ) {
				
		var city = stdAddress[ 6 ].split( " " ), temp = [];
												
		for ( var k = city.length-1; k > -1; k-- ) {		
					
			temp.splice( 0, 0, city[ k ] );

			//look for state names in the city state cell
			if ( states.indexOf ( temp.join( "" ) ) > -1 ) {
			
				stdAddress[ 7 ] = states [ states.indexOf( temp.join( "" ) ) + ( 1 - ( states.indexOf ( temp.join( "" ) ) % 3 ) ) ];
				city.splice ( k, temp.length );
				stdAddress[ 6 ] = city.join( " " ); 
				break;
				
			} 
			
		}
		
	}
	
	return stdAddress.join( "|" );
	
}

function onlyNumbers( sText ) {

	var ValidChars = "0123456789.";
	var isNumber = true;
	var Char;

	for ( i = 0; i < sText.length && isNumber == true; i++ ) { 
		
		Char = sText.charAt ( i ); 
		if ( ValidChars.indexOf ( Char ) == -1 ) 
			isNumber = false;
    
	}
	
    return isNumber;

}

function soundex ( str ) {
 
	//  discuss at: http://phpjs.org/functions/soundex/
	// original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
	// original by: Arnout Kazemier (http://www.3rd-Eden.com)
	// improved by: Jack
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// bugfixed by: Onno Marsman
	// bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	//    input by: Brett Zamir (http://brett-zamir.me)
	//  revised by: Rafal Kukawski (http://blog.kukawski.pl)
	//   example 1: soundex('Kevin');
	//   returns 1: 'K150'
	//   example 2: soundex('Ellery');
	//   returns 2: 'E460'
	//   example 3: soundex('Euler');
	//   returns 3: 'E460'
  
	str = ( str + '' ).toUpperCase();
	if ( !str ) {
	
		return '';
  
	}
	var sdx = [ 0, 0, 0, 0 ],
		m = {
			B : 1,
			F : 1,
			P : 1,
			V : 1,
			C : 2,
			G : 2,
			J : 2,
			K : 2,
			Q : 2,
			S : 2,
			X : 2,
			Z : 2,
			D : 3,
			T : 3,
			L : 4,
			M : 5,
			N : 5,
			R : 6
		},
		i = 0,
		j, s = 0,
		c, p;

	while ( ( c = str.charAt ( i++ ) ) && s < 4 ) {
	
		if ( j = m[ c ] ) {
			
			if ( j !== p ) {
				
				sdx[ s++ ] = p = j;
		
			}
    
		} else {
			s += i === 1;
			p = 0;
		}
	}

	sdx[ 0 ] = str.charAt ( 0 );
	return sdx.join( '' );
}