//Calculate NDVI and LST for 1985 and 2010 at both sites
//Pull imagery from the same month (as close together as possible)

var phxGeo = ee.FeatureCollection("users/mfstuhlmacher/UrbanAgPHX/CAPBoundary"),
    cs = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/EE6AStudyArea"),
    rs = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/StudyArea"),
    l5 = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR");

//Select suitable images from 1985
var dates1985 = ee.DateRange('1985-05-31','1985-09-30');
var filter1985 = l5.filterDate(dates1985).filterBounds(rs).filterMetadata('CLOUD_COVER','less_than',5);
//print(filter1985);
//Output:
//LANDSAT/LT05/C01/T1_SR/LT05_037037_19850723
//LANDSAT/LT05/C01/T1_SR/LT05_037037_19850808*

//Select suitable images from 2010
var dates2010 = ee.DateRange('2010-05-31','2010-09-30');
var filter2010_cs = l5.filterDate(dates2010).filterBounds(cs).filterMetadata('CLOUD_COVER','equals',0);
//print(filter2010_cs);
//Output:
//LANDSAT/LT05/C01/T1_SR/LT05_037037_20100626
//LANDSAT/LT05/C01/T1_SR/LT05_037037_20100813*
//LANDSAT/LT05/C01/T1_SR/LT05_037037_20100914

// //----Setting up visualization----// //
// background white layer
var background = ee.Image(1).clip(phxGeo);
Map.addLayer(background,{palette:'white'},'background');

// visualization
var ndvi_palette = {min:-0.1, max:1, palette: ['FFFFFF','CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901', '66A000','529400',
                                              '3E8601', '207401', '056201', '004C00', '023B01', '012E01', '011D01', '011301']};
var lst_palette = {min: 25, max: 86, palette:['00007F','0000FF','0074FF','0DFFEA','8CFF41','FFDD00','FF3700','C30000','790000']};


//Image dates
// //----1985----// //
//New date to match months: 1985-08-08
var day1985 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_19850808').clip(phxGeo);
Map.addLayer(day1985,{},'day1985',false);


//Scale bands (doing it for 3 and 4) before using them in NDVI calculation
//Scaling factor provided by table in GEE SR metadata, 0.0001 for bands 1 - 5 and 0.01 for band 6. 
var sr1985Scaled = day1985.multiply(0.0001);
Map.addLayer(sr1985Scaled,{},'sr1985Scaled',false);

//NDVI for study area
var ndvi1985 = sr1985Scaled.normalizedDifference(['B4', 'B3']).rename('NDVI_1985');

//Emissivity Calculation
var emissivity_1985 = ndvi1985.addBands(ndvi1985.select('NDVI_1985').where(ndvi1985.select('NDVI_1985').lt(0), 0.9925)
                    .where(ndvi1985.select('NDVI_1985').gte(0) && ndvi1985.select('NDVI_1985').lt(0.15), 0.923)
                    .where(ndvi1985.select('NDVI_1985').gt(0.727), 0.986)
                    .where(ndvi1985.select('NDVI_1985').gte(0.15) && ndvi1985.select('NDVI_1985').lt(0.727), 
                          ndvi1985.expression(
                              '1.0094 + 0.047 * log(A)',{
                                'A' : ndvi1985.select('NDVI_1985')
                              })).rename('emissivity_1985'));

// Select and scale band 6 (units: Kelvin)
var scaledB6_1985 = day1985.select('B6').multiply(0.1).rename('B6_1985');
var B6_scaled_1985 = emissivity_1985.addBands(scaledB6_1985);

// LST Calculation
// Lance has a different equation (for landsat 8):
// 'A / (1 +(0.0000109 * (A / 0.01438) * log(B)))',
// Source information: https://semiautomaticclassificationmanual-v5.readthedocs.io/en/latest/remote_sensing.html#conversion-to-surface-temperature
var LST_calc_1985 = B6_scaled_1985.expression('A / (1 +(0.0000115 * (A / 0.01438) * log(B)))',
            {
              'A' : B6_scaled_1985.select('B6_1985'),
              'B' : B6_scaled_1985.select('emissivity_1985')
            }).rename('LST_K_1985');
var LST_K_1985 = B6_scaled_1985.addBands(LST_calc_1985);

// Convert K to C
var tempconversion_1985 = LST_K_1985.select('LST_K_1985').subtract(273.15).rename('LST_C_1985');
var LST_C_1985 = LST_K_1985.addBands(tempconversion_1985);

//Select LST band to use for analysis
var LST_C_analysis_1985 = LST_C_1985.select('LST_C_1985');

//crop to RS
var LST1985_RS = LST_C_analysis_1985.clip(rs);
Map.addLayer(LST1985_RS,lst_palette,'LST 1985 RS');

var LST1985_RS_mean = LST1985_RS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: rs.geometry(),
  scale: 30
});
print(LST1985_RS_mean,"LST1985_RS_mean");

// Export image to drive
Export.image.toDrive({
  image: LST1985_RS,
  description: 'LST1985-08-08_RS',
  region: rs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

var NDVI1985_RS = ndvi1985.clip(rs);
Map.addLayer(NDVI1985_RS,ndvi_palette,'NDVI 1985 RS');

//NDVI 1985 RS Mean
var NDVI1985_RS_mean = NDVI1985_RS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: rs.geometry(),
  scale: 30
});
print(NDVI1985_RS_mean,"NDVI1985_RS_mean");

//NDVI 1985 RS Min
var NDVI1985_RS_min = NDVI1985_RS.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: rs.geometry(),
  scale: 30
});
print(NDVI1985_RS_min,"NDVI1985_RS_min");

//NDVI 1985 RS Max
var NDVI1985_RS_max = NDVI1985_RS.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: rs.geometry(),
  scale: 30
});
print(NDVI1985_RS_max,"NDVI1985_RS_max");

// Export image to drive
Export.image.toDrive({
  image: NDVI1985_RS,
  description: 'NDVI1985-08-08_RS',
  region: rs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

//crop to CS
var LST1985_CS = LST_C_analysis_1985.clip(cs);
Map.addLayer(LST1985_CS,lst_palette,'LST 1985 CS');

var LST1985_CS_mean = LST1985_CS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: cs.geometry(),
  scale: 30
});
print(LST1985_CS_mean,'LST1985_CS_mean');

// Export image to drive
Export.image.toDrive({
  image: LST1985_CS,
  description: 'LST1985-08-08_CS',
  region: cs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

var NDVI1985_CS = ndvi1985.clip(cs);
Map.addLayer(NDVI1985_CS,ndvi_palette,'NDVI 1985 CS');

//NDVI 1985 CS Mean
var NDVI1985_CS_mean = NDVI1985_CS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: cs.geometry(),
  scale: 30
});
print(NDVI1985_CS_mean,"NDVI1985_CS_mean");

//NDVI 1985 CS Min
var NDVI1985_CS_min = NDVI1985_CS.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: cs.geometry(),
  scale: 30
});
print(NDVI1985_CS_min,"NDVI1985_CS_min");

//NDVI 1985 CS Max
var NDVI1985_CS_max = NDVI1985_CS.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: cs.geometry(),
  scale: 30
});
print(NDVI1985_CS_max,"NDVI1985_CS_max");

// Export image to drive
Export.image.toDrive({
  image: NDVI1985_CS,
  description: 'NDVI1985-08-08_CS',
  region: cs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

// //----2010----// //
// Date to match months: 2010-08-13
var day2010 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_20100813').clip(phxGeo);
Map.addLayer(day2010,{},'day2010',false);

// LULC Classification Date: 2010-06-26
// var day2010 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_20100626').clip(phxGeo);
// Map.addLayer(day2010,{},'day2010',false);

var sr2010Scaled = day2010.multiply(0.0001);

//NDVI for study area
var ndvi2010 = sr2010Scaled.normalizedDifference(['B4', 'B3']).rename('NDVI_2010');

//Emissivity Calculation
var emissivity_2010 = ndvi2010.addBands(ndvi2010.select('NDVI_2010').where(ndvi2010.select('NDVI_2010').lt(0), 0.9925)
                    .where(ndvi2010.select('NDVI_2010').gte(0) && ndvi2010.select('NDVI_2010').lt(0.15), 0.923)
                    .where(ndvi2010.select('NDVI_2010').gt(0.727), 0.986)
                    .where(ndvi2010.select('NDVI_2010').gte(0.15) && ndvi2010.select('NDVI_2010').lt(0.727), 
                          ndvi2010.expression(
                              '1.0094 + 0.047 * log(A)',{
                                'A' : ndvi2010.select('NDVI_2010')
                              })).rename('emissivity_2010'));

// Select Band 6 (units: Kelvin)
var scaledB6_2010 = day2010.select('B6').multiply(0.1).rename('B6_2010');
var B6_scaled_2010 = emissivity_2010.addBands(scaledB6_2010);

// LST Calculation
var LST_calc_2010 = B6_scaled_2010.expression('A / (1 +(0.0000115 * (A / 0.01438) * log(B)))',
            {
              'A' : B6_scaled_2010.select('B6_2010'),
              'B' : B6_scaled_2010.select('emissivity_2010')
            }).rename('LST_K_2010');
var LST_K_2010 = B6_scaled_2010.addBands(LST_calc_2010);

// // Convert LST to Fahrenheit
// var tempconversion_2010 = LST_K_2010.select('LST_K_2010').multiply(1.8).subtract(459.67).rename('LST_F_2010');
// var LST_F_2010 = LST_K_2010.addBands(tempconversion_2010);

// Convert K to C
var tempconversion_2010 = LST_K_2010.select('LST_K_2010').subtract(273.15).rename('LST_C_2010');
var LST_C_2010 = LST_K_2010.addBands(tempconversion_2010);

//Select LST band to use for analysis
var LST_C_analysis_2010 = LST_C_2010.select('LST_C_2010');

//crop to RS
var LST2010_RS = LST_C_analysis_2010.clip(rs);
Map.addLayer(LST2010_RS,lst_palette,'LST 2010 RS');

var LST2010_RS_mean = LST2010_RS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: rs.geometry(),
  scale: 30
});
print(LST2010_RS_mean,"LST2010_RS_mean");

// Export image to drive
Export.image.toDrive({
  image: LST2010_RS,
  description: 'LST2010-08-13_RS',
  region: rs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

var NDVI2010_RS = ndvi2010.clip(rs);
Map.addLayer(NDVI2010_RS,ndvi_palette,'NDVI 2010 RS');

//NDVI 2010 RS Mean
var NDVI2010_RS_mean = NDVI2010_RS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: rs.geometry(),
  scale: 30
});
print(NDVI2010_RS_mean,"NDVI2010_RS_mean");

//NDVI 2010 RS Min
var NDVI2010_RS_min = NDVI2010_RS.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: rs.geometry(),
  scale: 30
});
print(NDVI2010_RS_min,"NDVI2010_RS_min");

//NDVI 2010 RS Max
var NDVI2010_RS_max = NDVI2010_RS.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: rs.geometry(),
  scale: 30
});
print(NDVI2010_RS_max,"NDVI2010_RS_max");

// Export image to drive
Export.image.toDrive({
  image: NDVI2010_RS,
  description: 'NDVI2010-08-13_RS',
  region: rs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

//crop to CS
var LST2010_CS = LST_C_analysis_2010.clip(cs);
Map.addLayer(LST2010_CS,lst_palette,'LST 2010 CS');

var LST2010_CS_mean = LST2010_CS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: cs.geometry(),
  scale: 30
});
print(LST2010_CS_mean,"LST2010_CS_mean");

// Export image to drive
Export.image.toDrive({
  image: LST2010_CS,
  description: 'LST2010-08-13_CS',
  region: cs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

var NDVI2010_CS = ndvi2010.clip(cs);
Map.addLayer(NDVI2010_CS,ndvi_palette,'NDVI 2010 CS');

//NDVI 2010 CS Mean
var NDVI2010_CS_mean = NDVI2010_CS.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: cs.geometry(),
  scale: 30
});
print(NDVI2010_CS_mean,"NDVI2010_CS_mean");

//NDVI 2010 CS Max
var NDVI2010_CS_max = NDVI2010_CS.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: cs.geometry(),
  scale: 30
});
print(NDVI2010_CS_max,"NDVI2010_CS_max");

//NDVI 2010 CS Min
var NDVI2010_CS_min = NDVI2010_CS.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: cs.geometry(),
  scale: 30
});
print(NDVI2010_CS_min,"NDVI2010_CS_min");

// Export image to drive
Export.image.toDrive({
  image: NDVI2010_CS,
  description: 'NDVI2010-08-13_CS',
  region: cs.geometry(), 
  scale: 30, 
  maxPixels: 1e13
});

// Create legends, can only run one at a time, comment the other out
//--LST Legend--//

// A function to construct a legend for the given single-band vis
// parameters.  Requires that the vis parameters specify 'min' and 
// 'max' but not 'bands'.
function makeLSTLegend(lst_palette) {
  var lon = ee.Image.pixelLonLat().select('longitude');
  var gradient = lon.multiply((lst_palette.max-lst_palette.min)/100.0).add(lst_palette.min);
  var legendImage = gradient.visualize(lst_palette);
  
  // In case you really need it, get the color ramp as an image:
  print(legendImage.getThumbURL({bbox:'0,0,100,8', dimensions:'256x20'}));
  
  // Otherwise, add it to a panel and add the panel to the map.
  var thumb = ui.Thumbnail({
    image: legendImage, 
    params: {bbox:'0,0,100,8', dimensions:'256x20'},  
    style: {padding: '1px', position: 'bottom-center'}
  });
  var panel = ui.Panel({
    widgets: [
      ui.Label(String(lst_palette['min'])), 
      ui.Label({style: {stretch: 'horizontal'}}), 
      ui.Label(lst_palette['max'])
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {stretch: 'horizontal'}
  });
  return ui.Panel().add(panel).add(thumb);
}

Map.add(makeLSTLegend(lst_palette));

//--NDVI Legend--//

function makeNDVILegend(ndvi_palette) {
  var lon = ee.Image.pixelLonLat().select('longitude');
  var gradient = lon.multiply((ndvi_palette.max-ndvi_palette.min)/100.0).add(ndvi_palette.min);
  var legendImage = gradient.visualize(ndvi_palette);
  
  // In case you really need it, get the color ramp as an image:
  print(legendImage.getThumbURL({bbox:'0,0,100,8', dimensions:'256x20'}));
  
  // Otherwise, add it to a panel and add the panel to the map.
  var thumb = ui.Thumbnail({
    image: legendImage, 
    params: {bbox:'0,0,100,8', dimensions:'256x20'},  
    style: {padding: '1px', position: 'bottom-center'}
  });
  var panel = ui.Panel({
    widgets: [
      ui.Label(String(ndvi_palette['min'])), 
      ui.Label({style: {stretch: 'horizontal'}}), 
      ui.Label(ndvi_palette['max'])
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {stretch: 'horizontal'}
  });
  return ui.Panel().add(panel).add(thumb);
}

Map.add(makeNDVILegend(ndvi_palette));
