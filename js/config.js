var config = {
	"initial_extent": {
		"xmin": 1384251.24585599,
		"ymin": 460978.995855999,
		"xmax": 1537013.50075424,
		"ymax": 660946.333333335,
		"spatialReference": { "wkid":2264 }
	}, 
	"min_scale": 425000, 
	"max_scale": 600,
	"basemap_services": {
		basemap: "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/basemap/MapServer",
		basemap_aerial: "http://polaris3g.mecklenburgcountync.gov/polarisv/rest/services/basemap_aerial/MapServer",
		topo: "http://polaris3g.mecklenburgcountync.gov/polarisv/rest/services/topohillshade/MapServer"
	}, 
	"tiled_services": {
		"street_tiles": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/basemap/MapServer"
		}, "aerial_tiles": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/aerial2022/MapServer"
		}, "aerialtop_tiles": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/basemap_aerial/MapServer"
		}, "topohillshade_tiles": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/topohillshade/MapServer"
		}
	}, 
	"dynamic_services": {
		"transparent_overlays": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaystransparentfgdb/MapServer", 
			"opacity": "0.5", 
			"visiblelyrs": [ -1 ]
		}, "floodzones": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodmapsfgdb/MapServer", 
			"opacity": "1.0", 
			"visiblelyrs": [ 2, 6 ] 
		}, "overlays": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaysfgdb/MapServer", 
			"opacity": "1.0", 
			"visiblelyrs": [ 2, 5, 9, 10, 12, 13 ]
		} 
	}, 
	"feature_services": {
		"fmr_comments": {
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/fmr/FeatureServer/0",
			"fields": [ "name", "email", "dateenter", "status", "comment", "response" ],
			"popupTitle": "<h5>User Comment</h5>",
			"popupTemplate": "${comment}",
			"visible": false,
			"mode": "snapshot"	
		}, "loma_points" : {
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaysfgdb/MapServer/0",
			"fields": [ "case_numbe" ],
			"popupTitle": "<h5>Structure not in<br/>Floodplain by FEMA Letter</h5>",
			"popupTemplate" :
				"<a href='https://mecklenburgcounty.exavault.com/p/stormwater/Adobe%20LOMR/${case_numbe}.pdf' target='_blank'>Download FEMA Letter</a>",
			"visible": true,
			"mode": "ondemand"					
		}, "firm_ref_points": {
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaysfgdb/MapServer/1",
			"fields": [ "ID", "Point_Desi", "Elevation_", "northing_1", "easting__m", "latitude", "longitude", "monument_d", "drive__to_", "comments" ],
			"popupTitle": "<h5>FIRM Reference Point</h5>",
			"popupTemplate":
				"<div class='textright'><a href = 'http://meckmap.mecklenburgcountync.gov/3dfz/services/firmreport.php?id=${ID}' target='_blank'>Download Report</a></div>" +
				"<table class = 'pup'>" +
					"<tr>" + 
						"<th>ID</th><td>${ID}</td>" +
					"</tr>" +
					"<tr>" + 
						"<th>Point Desig</th><td>${Point_Desi}</td>" +
					"</tr>" +
					"<tr>" + 
						"<th>Elevation</th><td>${Elevation_}</td>" +
					"</tr>" +
					"<tr>" + 
						"<th>XY</th><td>${northing_1}, ${easting__m}</td>" +
					"</tr>" +
					"<tr>" + 
						"<th>Lat Lon</th><td>${latitude}, ${longitude}</td>" +
					"</tr>" +
					"<tr>" + 
						"<th>Monument Description</th><td>${monument_d}</td>" +
					"</tr>" +
					"<tr>" + 
						"<th>Drive to Description</th><td>${drive__to_}</td>" +
					"</tr>" +
					"</tr>" +
					"<tr>" + 
						"<th>Comments</th><td>${comments}</td>" +
					"</tr>" +
				"</table>",
			"visible": false,
			"mode": "ondemand"						
		}, "xsections_preliminary":	{
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaysfgdb/MapServer/6", 
			"fields": [ "cross_sect", "stream_stn", "profiles", "existing_d", "future_dis", "x00_year_e", "x00_year_f", "left_fldw", "right_fldw", "left_com", "right_com" ],
			"popupTitle": "<h5>Cross Section ${cross_sect} <br/> Flood Hazard Data </h5>",
			"popupTemplate" :
				"<table class = 'pup'>" +
					"<tr><th>Cross Section</th><th>Stream Station</th></tr>" + 
					"<tr><td>${cross_sect}</td><td>${stream_stn}</td></tr>" + 
				"</table>" +
				"<table class = 'pup'>" +
					"<tr><th colspan = '2'>Flood Discharge (cfs)</th></tr>" + 
					"<tr><td>Existing (FEMA) Land Use Conditions</th><td>${existing_d}</td></tr>" +
					"<tr><td>Future (Community) Land Use Conditions</th><td>${future_dis}</td></tr>" +
				"</table>" +
				"<table class = 'pup'>" +
					"<tr><th colspan = '2'>1% Annual Chance (100-year) Water-Surface Elevation (feet NAVD88)</th></tr>" + 
					"<tr><td>Existing (FEMA) Land Use Conditions</th><td>${x00_year_e}</td></tr>" +
					"<tr><td>Future (Community) Land Use Conditions</th><td>${x00_year_f}</td></tr>" +
				"</table>" +
				"<table class = 'pup'>" +
					"<tr><th colspan = '3'>Distance in Feet From Center of Stream to Encroachment Boundary (Looking Downstream)</th></tr>" + 
					"<tr><td rowspan = '2'>Floodway</td><th>Left</th><th>Right</th></tr>" +
					"<tr><td>${left_fldw}</td><td>${right_fldw}</td></tr>" +
					"<tr><td rowspan = '2'>Community Encroachment Line</td><th>Left</th><th>Right</th></tr>" +
					"<tr><td>${left_com}</td><td>${right_com}</td></tr>" +
				"</table>",
			"label": "labelfield", 	
			"visible": false,
			"mode": "ondemand"						
		}, "xsections": {
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaysfgdb/MapServer/7", 
			"fields": [ "cross_sect", "stream_stn", "profiles", "existing_d", "future_dis", "x00_year_e", "x00_year_f", "left_fldw", "right_fldw", "left_com", "right_com" ],
			"popupTitle": "<h5>Cross Section ${cross_sect} <br/> Flood Hazard Data </h5>",
			"popupTemplate":
				"<div class='textright'><a href='https://mecklenburgcounty.exavault.com/p/stormwater/Floodplain%20Mapping/Effective%20Data/FIS/Profiles/${profiles}.pdf' target='_blank'>Download Profile</a></div>" +
				"<table class = 'pup'>" +
					"<tr><th>Cross Section</th><th>Stream Station</th></tr>" + 
					"<tr><td>${cross_sect}</td><td>${stream_stn}</td></tr>" + 
				"</table>" +
				"<table class = 'pup'>" +
					"<tr><th colspan = '2'>Flood Discharge (cfs)</th></tr>" + 
					"<tr><td>Existing (FEMA) Land Use Conditions</th><td>${existing_d}</td></tr>" +
					"<tr><td>Future (Community) Land Use Conditions</th><td>${future_dis}</td></tr>" +
				"</table>" +
				"<table class = 'pup'>" +
					"<tr><th colspan = '2'>1% Annual Chance (100-year) Water-Surface Elevation (feet NAVD88)</th></tr>" + 
					"<tr><td>Existing (FEMA) Land Use Conditions</th><td>${x00_year_e}</td></tr>" +
					"<tr><td>Future (Community) Land Use Conditions</th><td>${x00_year_f}</td></tr>" +
				"</table>" +
				"<table class = 'pup'>" +
					"<tr><th colspan = '3'>Distance in Feet From Center of Stream to Encroachment Boundary (Looking Downstream)</th></tr>" + 
					"<tr><td rowspan = '2'>Floodway</td><th>Left</th><th>Right</th></tr>" +
					"<tr><td>${left_fldw}</td><td>${right_fldw}</td></tr>" +
					"<tr><td rowspan = '2'>Community Encroachment Line</td><th>Left</th><th>Right</th></tr>" +
					"<tr><td>${left_com}</td><td>${right_com}</td></tr>" +
				"</table>",
			"label": "labelfield",	
			"visible": false,
			"mode": "ondemand"						
		}
	}, 
	"identify_services": {
		"idfloodzones": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodmapsfgdb/MapServer"
		}, "idoverlays": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaysfgdb/MapServer"
		}, "idoverlaystrans": { 
			"url": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/stormwater/floodoverlaystransparentfgdb/MapServer"
		} 
	}, 
	"geometry_service": "https://maps.mecklenburgcountync.gov/agsadaptor/rest/services/Utilities/Geometry/GeometryServer",
	"web_service_local": "../ws/php/",
	"overlay_controls" : [
		{
			name: "User Comments",
			minZoom: 1,
			maxZoom: 10,
			featurelyr: true,
			visible: false,
			service: "fmr_comments"
		}, {
			name: "Structure not in Floodplain by FEMA Letter",
			minZoom: 6,
			maxZoom: 10,
			featurelyr: true,
			visible: false,
			service: "loma_points"
		}, {
			name: "FIRM Reference Points",
			minZoom: 6,
			maxZoom: 10,
			featurelyr: true,
			visible: false,
			service: "firm_ref_points"
		}, {
			name: "Draft FIRM Panels",
			lyrs: [ 4 ],
			minZoom: 1,
			maxZoom: 10,
			featurelyr: false,
			visible: false,
			service: "overlays"
		}, {
			name: "Draft Cross Sections",
			minZoom: 5,
			maxZoom: 10,
			featurelyr: true,
			visible: false,
			service: "xsections_preliminary"
		}, {
			name: "Cross Section Data",
			minZoom: 5,
			maxZoom: 10,
			featurelyr: true,
			visible: false,
			service: "xsections"
		}, 
		/*{
			name: "Topographic",
			lyrs: [ 8 ],
			minZoom: 5,
			maxZoom: 10,
			featurelyr: false,
			visible: false,
			service: "overlays"
		},*/
		{
			name: "Map Change Area",
			lyrs: [ 13 ],
			minZoom: 5,
			maxZoom: 10,
			featurelyr: false,
			visible: false,
			service: "overlays"
		}, {
			name: "Physical Map Revision",
			lyrs: [ 0 ],
			minZoom: 1,
			maxZoom: 10,
			featurelyr: false,
			visible: false,
			service: "transparent_overlays"
		}/*, {
			name: "Future Land Use",
			lyrs: [ 1 ],
			minZoom: 4,
			maxZoom: 10,
			featurelyr: false,
			visible: false,
			service: "transparent_overlays"
		}, {
			name: "Exisiting Land Use",
			lyrs: [ 2 ],
			minZoom: 4,
			maxZoom: 10,
			featurelyr: false,
			visible : false,
			service: "transparent_overlays"
		}*/
	], 
	"floodmap_controls": {
		"3d_floodzone":	{
			parent: true,
			lyrs : [ 23, 39 ]
		}, "flood_risk": {
			parent: true,
			lyrs : [ 42 ]
		}, "proposed_firm": {
			parent: true,
			dependencies: "#proposed_fema_fldp,#proposed_comm_fldp,#proposed_fema_fldway,#proposed_comm_fldway", 
			lyrs : [ 8, 9, 10, 11 ]
		}, "proposed_fema_fldp": {
			parent: false,
			lyrs : [ 10 ]
		}, "proposed_comm_fldp": {
			parent: false,
			lyrs : [ 11 ]
		}, "proposed_fema_fldway": {
			parent: false,
			lyrs : [ 8 ]
		}, "proposed_comm_fldway": {
			parent: false,
			lyrs : [ 9 ]
		}, "current_firm": {
			parent: true,
			dependencies: "#current_fema_fldp,#current_comm_fldp,#current_fema_fldway,#current_comm_fldway",
			lyrs : [ 4, 5, 6, 7 ]
		}, "current_fema_fldp": {
			parent: false,
			lyrs : [ 6 ]
		}, "current_comm_fldp": {	
			parent: false,
			lyrs : [ 7 ]
		}, "current_fema_fldway": {
			parent: false,
			lyrs : [ 4 ]
		}, "current_comm_fldway": {
			parent: false,
			lyrs : [ 5 ]
		}, "inout_firm": {
			parent: true,
			dependencies: "#inout_fema_fldp",
			lyrs :  [ 2, 6 ]
		}, "inout_fema_fldp": {
			parent: true,
			dependencies: "#inout_firm",
			lyrs : [ 2, 6 ]
		}, "inout_comm_fldp": {
			parent: true,
			dependencies: "#inout_firm",
			lyrs : [ 3, 7 ]
		}, "inout_fema_fldways": {
			parent: true,
			dependencies: "#inout_firm",
			lyrs : [ 0, 4 ]
		}, "inout_comm_fldways": {
			parent: true,
			dependencies: "#inout_firm",
			lyrs : [ 1, 5 ]
		} 
	}
};		