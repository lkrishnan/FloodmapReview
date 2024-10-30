//format functions
var format = {
	number: function( num, places ){
		num = $.trim( String( num ) );
		
		if( num.length > 0 ){
			num = parseFloat( num ).toFixed( places );
		}
						
		return num;	
		
	}, 
	
	ownership: function( oname_arr ){
		var oname = "";
		
		oname_arr[ 1 ] = ( oname_arr[ 1 ] ? oname_arr[ 1 ] : "" ).trim( ); //first name
		oname_arr[ 0 ] = ( oname_arr[ 0 ] ? oname_arr[ 0 ] : "" ).trim( ); //last name
		
		if( oname_arr[ 1 ].length > 0 || oname_arr[ 0 ].length > 0 ){
			if( oname_arr[ 1 ].length > 0 ){
				oname += oname_arr[ 1 ];
			} 
							
			if( oname_arr[ 0 ].length > 0 ){
				oname += " " + oname_arr[ 0 ] ;
			} 
		}  
		return oname;
		
	}, 

	arrAslist: function( arr, prop ){
		var html = "1. " + arr[ 0 ][ prop ];
		
		for( l = 1;l < ( arr.length > 3 ? 3 : arr.length ); l++ ){
			html += "<br/>" + parseInt ( l + 1, 10 ) + ". " + arr[ l ][ prop ];
		
		}
		
		return html;	
		
	},
	
	latlon: function( val ){
		var temp = val.split ( "-" );
		
		return temp[ 0 ] + "\u00B0" + temp[ 1 ] + "\'" + temp[ 2 ] + "\'\'";
		
	}, 
	
	leftPad: function( number, targetLength ){
		var output = number + '';
		
		while( output.length < targetLength ){
			output = '0' + output;
		}
		
		return output;
		
	}, 
	
	jurisdisplay: function( muni ){
		switch( muni.toUpperCase( ) ){
			case "CHAR":
				return "CHARLOTTE"; 
				break;
				
			case "CORN":
				return "CORNELIUS"; 
				break;
				
			case "DAVI":
				return "DAVIDSON"; 
				break;
				
			case "HUNT":
				return "HUNTERSVILLE"; 
				break;
				
			case "MATT":
				return "MATTHEWS"; 
				break;
				
			case "MINT":
				return "MINT HILL"; 
				break;
				
			case "PINE":
				return "PINEVILLE"; 
				break;
			
			case "STAL":
				return "STALLINGS"; 
				break;
			
			case "MECK": case "UNINC":	
				return "MECKLENBURG"; 
				break;	
			
			default:
				return muni; 
				break;
		}
		
	}, 
	
	address: function( hnum, prefix, sname, roadtype, suffix, unit, city, state, zip ){
		var addr = "";
		
		if( $.trim ( hnum ).length > 0 ) 
			addr += $.trim ( hnum );
			
		if( $.trim ( prefix ).length > 0 ) 
			addr += " " + $.trim ( prefix );
			
		if( $.trim ( sname ).length > 0 ) 
			addr += " " + $.trim ( sname );
			
		if( $.trim ( roadtype ).length >0 ) 
			addr += " " + $.trim ( roadtype );
			
		if( $.trim ( suffix ).length > 0 ) 
			addr += " " + $.trim ( suffix );
			
		if( $.trim ( unit ).length > 0 ) 
			addr += " " + $.trim ( unit );
			
		if( $.trim ( city ).length > 0 ) 
			addr += ", " + $.trim ( city );
			
		if( $.trim ( state ).length > 0 ) 
			addr += " " + $.trim ( state );
			
		if( $.trim ( zip ).length > 0 ) 
			addr += " " + $.trim ( zip );
		
		return addr;		
	
	}, 
	
	readableDate: function( inputDate, dateFormat ){
		var readableDate = "",
			dateFormat = ( dateFormat ? dateFormat.toUpperCase( ) : "MM/DD/YYYY" ),
			m = "" + ( inputDate.getMonth( ) + 1 ),
			mm = ( m.length < 2 ? "0" + m : m ),
			d = "" + inputDate.getDate( ),
			dd = ( d.length < 2 ? "0" + d : d ),
			yyyy = "" + inputDate.getFullYear( ),
			months = { 
				1: { "short": "Jan", "long": "January" },
				2: { "short": "Feb", "long": "February" },
				3: { "short": "Mar", "long": "March" },
				4: { "short": "Apr", "long": "April" },
				5: { "short": "May", "long": "May" },
				6: { "short": "Jun", "long": "June" },
				7: { "short": "Jul", "long": "July" },
				8: { "short": "Aug", "long": "August" },
				9: { "short": "Sep", "long": "September" },
				10: { "short": "Oct", "long": "October" },
				11: { "short": "Nov", "long": "November" },
				12: { "short": "Dec", "long": "December" }
			};	
				
		switch( dateFormat ){
			case "MM/DD/YYYY": case "MM/DD/YY": case "M/D/YYYY": case "M/D/YY":
			case "MM-DD-YYYY": case "MM-DD-YY": case "M-D-YYYY": case "M-D-YY":
			
				var splitter = "/";
				
				if ( dateFormat.indexOf ( "-" ) > -1 )
					splitter = "-";
									
				var dateFormatArr = dateFormat.split ( splitter );
							
				readableDate = [ 
						( dateFormatArr[ 0 ] == "MM" ? mm : m ) , 
						( dateFormatArr[ 1 ] == "DD" ? dd : d ) , 
						( dateFormatArr[ 2 ] == "YYYY" ? yyyy : yyyy.substring(2, 4) ) 
					].join ( splitter );
								
				break;
				
			case "YYYY-MM-DD":
				
				readableDate = [ yyyy, mm, dd ].join ( "-" );
												
				break;
							
			case "MONTH DD, YYYY": case "MON DD, YYYY":
			
				var month = months[ m ].short;
			
				if ( dateFormat.indexOf ( "MONTH" ) > -1 )
					month = months[ m ].long;
			
				readableDate = month + " " + dd + ", " + yyyy;
				
				break;
								
		}

		return readableDate; 
		
	},
	
	theDate: dateString => new Date( dateString ).toLocaleDateString( "en-US", { month: "2-digit", day: "2-digit", year: "numeric" } )

}