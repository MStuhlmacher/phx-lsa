var l8_sr = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR"),
    l5_toa = ee.ImageCollection("LANDSAT/LT05/C01/T1_TOA"),
    patch1985 = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/patch1985_EE-6Arecode"),
    patch1990 = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/patch1990_EE-6Arecode"),
    patch1995 = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/patch1995_EE-6Arecode"),
    patch2000 = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/patch2000_EE-6Arecode"),
    patch2005 = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/patch2005_EE-6Arecode"),
    patch2010 = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/patch2010_EE-6Arecode"),
    sa = ee.FeatureCollection("users/mfstuhlmacher/RioSalado/EE6AStudyArea");

//Calculate NDVI and LST for every year (1985-2010) in the recode comparison site (EE-6A)

//Image dates
// //----1985: 1985-07-23----// //
var day1985 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_19850723').clip(sa);
Map.addLayer(day1985,{},'day1985',false);

//NDVI for study area
var ndvi1985 = day1985.normalizedDifference(['B4', 'B3']).rename('NDVI_1985');

//Emissivity Calculation
var emissivity_1985 = ndvi1985.addBands(ndvi1985.select('NDVI_1985').where(ndvi1985.select('NDVI_1985').lt(0), 0.9925)
                    .where(ndvi1985.select('NDVI_1985').gte(0) && ndvi1985.select('NDVI_1985').lt(0.15), 0.923)
                    .where(ndvi1985.select('NDVI_1985').gt(0.727), 0.986)
                    .where(ndvi1985.select('NDVI_1985').gte(0.15) && ndvi1985.select('NDVI_1985').lt(0.727), 
                           ndvi1985.expression(
                              '1.0094 + 0.047 * log(A)',{
                                'A' : ndvi1985.select('NDVI_1985')
                              })).rename('emissivity_1985'));

// Select Band 6 (units: Kelvin)
var scaledB6_1985 = day1985.select('B6').multiply(0.1).rename('B6_1985');
var B6_scaled_1985 = emissivity_1985.addBands(scaledB6_1985);

// LST Calculation
var LST_calc_1985 = B6_scaled_1985.expression('A / (1 +(0.0000115 * (A / 0.01438) * log(B)))',
            {
              'A' : B6_scaled_1985.select('B6_1985'),
              'B' : B6_scaled_1985.select('emissivity_1985')
            }).rename('LST_K_1985');
var LST_K_1985 = B6_scaled_1985.addBands(LST_calc_1985);

// Convert LST to Fahrenheit
var tempconversion_1985 = LST_K_1985.select('LST_K_1985').multiply(1.8).subtract(459.67).rename('LST_F_1985');
var LST_F_1985 = LST_K_1985.addBands(tempconversion_1985);

//Select LST band to use for analysis
var LST_F_analysis_1985 = LST_F_1985.select('LST_F_1985');

//Select NDVI band to use for analysis
var NDVI_analysis_1985 = LST_F_1985.select('NDVI_1985');

//Average LST for whole study area
var avgTemp1985 = LST_F_analysis_1985.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 120
});
print(avgTemp1985,'avgTemp1985');

//Average NDVI for whole study area
var avgNDVI1985 = NDVI_analysis_1985.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 30
});
print(avgNDVI1985,'avg NDVI 1985');

//Join the LST and NDVI
var all1985 = LST_F_analysis_1985.addBands(ndvi1985);
Map.addLayer(all1985,{},'all1985',false);

// //Visualize 1985 shapefile to make sure it imported correctly
// var empty = ee.Image().byte();
// var palette = [
//   'aec3d4', // water
//   '152106', '225129', '369b47', '30eb5b', '387242', // forest
//   '6a2325', 'c3aa69', 'b76031', 'd9903d', '91af40',  // shrub, grass
//   '111149', // wetlands
//   'cdb33b', // croplands
//   'cc0013', // urban
//   '33280d', // crop mosaic
//   'd7cdcc', // snow and ice
//   'f7e084', // barren
//   '6f6f6f'  // tundra
// ];
// var filledOutlines = empty.paint(patch1985, 'GRIDCODE').paint(patch1985, 0, 2);
// Map.addLayer(filledOutlines, {palette: ['000000'].concat(palette)}, 'edges and fills');

//reduceRegions and calculate the mean values for each patch
// potentially helpful link on calculating LST: https://developers.google.com/earth-engine/charts_image_series_by_region
var red1985 = LST_F_analysis_1985.reduceRegions({
  collection: patch1985,
  reducer: ee.Reducer.mean(),
  scale: 120});
//print (red1985,'reduce regions 1985 LST');

//Export to drive
Export.table.toDrive({
  collection: red1985, 
  description: 'PatchMean_LST_1985_ndviCorrected_CSrecode',
  fileFormat:'CSV'});
  
var rNDVI1985 = NDVI_analysis_1985.reduceRegions({
  collection: patch1985,
  reducer: ee.Reducer.mean(),
  scale: 30});

//Export to drive
Export.table.toDrive({
  collection: rNDVI1985, 
  description: 'PatchMean_NDVI_1985_CSrecode',
  fileFormat:'CSV'});

// //----1990: 1990-06-19----// //
var day1990 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_19900619').clip(sa);
Map.addLayer(day1990,{},'day1990',false);

//NDVI for study area
var ndvi1990 = day1990.normalizedDifference(['B4', 'B3']).rename('NDVI_1990');

//Emissivity Calculation (not as a function)
var emissivity_1990 = ndvi1990.addBands(ndvi1990.select('NDVI_1990').where(ndvi1990.select('NDVI_1990').lt(0), 0.9925)
                    .where(ndvi1990.select('NDVI_1990').gte(0) && ndvi1990.select('NDVI_1990').lt(0.15), 0.923)
                    .where(ndvi1990.select('NDVI_1990').gt(0.727), 0.986)
                    .where(ndvi1990.select('NDVI_1990').gte(0.15) && ndvi1990.select('NDVI_1990').lt(0.727), 
                           ndvi1990.expression(
                              '1.0094 + 0.047 * log(A)',{
                                'A' : ndvi1990.select('NDVI_1990')
                              })).rename('emissivity_1990'));

// Select Band 6 (units: Kelvin)
var scaledB6_1990 = day1990.select('B6').multiply(0.1).rename('B6_1990');
var B6_scaled_1990 = emissivity_1990.addBands(scaledB6_1990);

// LST Calculation
var LST_calc_1990 = B6_scaled_1990.expression('A / (1 +(0.0000115 * (A / 0.01438) * log(B)))',
            {
              'A' : B6_scaled_1990.select('B6_1990'),
              'B' : B6_scaled_1990.select('emissivity_1990')
            }).rename('LST_K_1990');
var LST_K_1990 = B6_scaled_1990.addBands(LST_calc_1990);

// Convert LST to Fahrenheit
var tempconversion_1990 = LST_K_1990.select('LST_K_1990').multiply(1.8).subtract(459.67).rename('LST_F_1990');
var LST_F_1990 = LST_K_1990.addBands(tempconversion_1990);

//Select LST band to use for analysis
var LST_F_analysis_1990 = LST_F_1990.select('LST_F_1990');

//Select NDVI band to use for analysis
var NDVI_analysis_1990 = LST_F_1990.select('NDVI_1990');

//Average LST for whole study area
var avgTemp1990 = LST_F_analysis_1990.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 120
});
print(avgTemp1990,'avgTemp1990');


//Average NDVI for whole study area
var avgNDVI1990 = NDVI_analysis_1990.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 30
});
print(avgNDVI1990,'avg NDVI 1990');

// //Join the LST and NDVI
// var all1990 = LST_F_analysis_1990.addBands(ndvi1990);
// Map.addLayer(all1990,{},'all1990',false);

//reduceRegions and calculate the mean values for each patch
var red1990 = LST_F_analysis_1990.reduceRegions({
  collection: patch1990,
  reducer: ee.Reducer.mean(),
  scale: 120});

//Export to drive
Export.table.toDrive({
  collection: red1990, 
  description: 'PatchMean_LST_1990_ndviCorrected_CSrecode',
  fileFormat:'CSV'});
  
//reduceRegions and calculate the mean values for each patch
var rNDVI1990 = NDVI_analysis_1990.reduceRegions({
  collection: patch1990,
  reducer: ee.Reducer.mean(),
  scale: 30});

//Export to drive
Export.table.toDrive({
  collection: rNDVI1990, 
  description: 'PatchMean_NDVI_1990_CSrecode',
  fileFormat:'CSV'});

// //----1995: 1995-07-03----// //
var day1995 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_19950703').clip(sa);
Map.addLayer(day1995,{},'day1995',false);

//NDVI for study area
var ndvi1995 = day1995.normalizedDifference(['B4', 'B3']).rename('NDVI_1995');

//Emissivity Calculation (not as a function)
var emissivity_1995 = ndvi1995.addBands(ndvi1995.select('NDVI_1995').where(ndvi1995.select('NDVI_1995').lt(0), 0.9925)
                    .where(ndvi1995.select('NDVI_1995').gte(0) && ndvi1995.select('NDVI_1995').lt(0.15), 0.923)
                    .where(ndvi1995.select('NDVI_1995').gt(0.727), 0.986)
                    .where(ndvi1995.select('NDVI_1995').gte(0.15) && ndvi1995.select('NDVI_1995').lt(0.727), 
                           ndvi1995.expression(
                              '1.0094 + 0.047 * log(A)',{
                                'A' : ndvi1995.select('NDVI_1995')
                              })).rename('emissivity_1995'));

// Select Band 6 (units: Kelvin)
var scaledB6_1995 = day1995.select('B6').multiply(0.1).rename('B6_1995');
var B6_scaled_1995 = emissivity_1995.addBands(scaledB6_1995);

// LST Calculation
var LST_calc_1995 = B6_scaled_1995.expression('A / (1 +(0.0000115 * (A / 0.01438) * log(B)))',
            {
              'A' : B6_scaled_1995.select('B6_1995'),
              'B' : B6_scaled_1995.select('emissivity_1995')
            }).rename('LST_K_1995');
var LST_K_1995 = B6_scaled_1995.addBands(LST_calc_1995);

// Convert LST to Fahrenheit
var tempconversion_1995 = LST_K_1995.select('LST_K_1995').multiply(1.8).subtract(459.67).rename('LST_F_1995');
var LST_F_1995 = LST_K_1995.addBands(tempconversion_1995);

//Select LST band to use for analysis
var LST_F_analysis_1995 = LST_F_1995.select('LST_F_1995');

//Select NDVI band to use for analysis
var NDVI_analysis_1995 = LST_F_1995.select('NDVI_1995');

//Average LST for whole study area
var avgTemp1995 = LST_F_analysis_1995.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 120
});
print(avgTemp1995,'avgTemp1995');

//Average NDVI for whole study area
var avgNDVI1995 = NDVI_analysis_1995.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 30
});
print(avgNDVI1995,'avg NDVI 1995');

//Join the LST and NDVI
var all1995 = LST_F_analysis_1995.addBands(ndvi1995);
Map.addLayer(all1995,{},'all1995',false);

//reduceRegions and calculate the mean values for each patch
var red1995 = LST_F_analysis_1995.reduceRegions({
  collection: patch1995,
  reducer: ee.Reducer.mean(),
  scale: 120});

//Export to drive
Export.table.toDrive({
  collection: red1995, 
  description: 'PatchMean_LST_1995_ndviCorrected_CSrecode',
  fileFormat:'CSV'});
  
//reduceRegions and calculate the mean values for each patch
var rNDVI1995 = ndvi1995.reduceRegions({
  collection: patch1995,
  reducer: ee.Reducer.mean(),
  scale: 30});

//Export to drive
Export.table.toDrive({
  collection: rNDVI1995, 
  description: 'PatchMean_NDVI_1995_CSrecode',
  fileFormat:'CSV'});

// //----2000: 2000-05-29----// //
var day2000 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_20000529').clip(sa);
Map.addLayer(day2000,{},'day2000',false);

//NDVI for study area
var ndvi2000 = day2000.normalizedDifference(['B4', 'B3']).rename('NDVI_2000');

//Emissivity Calculation (not as a function)
var emissivity_2000 = ndvi2000.addBands(ndvi2000.select('NDVI_2000').where(ndvi2000.select('NDVI_2000').lt(0), 0.9925)
                    .where(ndvi2000.select('NDVI_2000').gte(0) && ndvi2000.select('NDVI_2000').lt(0.15), 0.923)
                    .where(ndvi2000.select('NDVI_2000').gt(0.727), 0.986)
                    .where(ndvi2000.select('NDVI_2000').gte(0.15) && ndvi2000.select('NDVI_2000').lt(0.727), 
                           ndvi2000.expression(
                              '1.0094 + 0.047 * log(A)',{
                                'A' : ndvi2000.select('NDVI_2000')
                              })).rename('emissivity_2000'));

// Select Band 6 (units: Kelvin)
var scaledB6_2000 = day2000.select('B6').multiply(0.1).rename('B6_2000');
var B6_scaled_2000 = emissivity_2000.addBands(scaledB6_2000);

// LST Calculation
var LST_calc_2000 = B6_scaled_2000.expression('A / (1 +(0.0000115 * (A / 0.01438) * log(B)))',
            {
              'A' : B6_scaled_2000.select('B6_2000'),
              'B' : B6_scaled_2000.select('emissivity_2000')
            }).rename('LST_K_2000');
var LST_K_2000 = B6_scaled_2000.addBands(LST_calc_2000);

// Convert LST to Fahrenheit
var tempconversion_2000 = LST_K_2000.select('LST_K_2000').multiply(1.8).subtract(459.67).rename('LST_F_2000');
var LST_F_2000 = LST_K_2000.addBands(tempconversion_2000);

//Select LST band to use for analysis
var LST_F_analysis_2000 = LST_F_2000.select('LST_F_2000');

//Select NDVI band to use for analysis
var NDVI_analysis_2000 = LST_F_2000.select('NDVI_2000');

//Average LST for whole study area
var avgTemp2000 = LST_F_analysis_2000.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 120
});
print(avgTemp2000,'avgTemp2000');

//Average NDVI for whole study area
var avgNDVI2000 = NDVI_analysis_2000.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 30
});
print(avgNDVI2000,'avg NDVI 2000');

//Join the LST and NDVI
var all2000 = LST_F_analysis_2000.addBands(ndvi2000);
Map.addLayer(all2000,{},'all2000',false);

//reduceRegions and calculate the mean values for each patch
var red2000 = LST_F_analysis_2000.reduceRegions({
  collection: patch2000,
  reducer: ee.Reducer.mean(),
  scale: 120});

//Export to drive
Export.table.toDrive({
  collection: red2000, 
  description: 'PatchMean_LST_2000_ndviCorrected_CSrecode',
  fileFormat:'CSV'});
  
//reduceRegions and calculate the mean values for each patch
var rNDVI2000 = ndvi2000.reduceRegions({
  collection: patch2000,
  reducer: ee.Reducer.mean(),
  scale: 30});

//Export to drive
Export.table.toDrive({
  collection: rNDVI2000, 
  description: 'PatchMean_NDVI_2000_CSrecode',
  fileFormat:'CSV'});

// //----2005: 2005-06-12----// //
var day2005 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_20050612').clip(sa);
Map.addLayer(day2005,{},'day2005',false);

//NDVI for study area
var ndvi2005 = day2005.normalizedDifference(['B4', 'B3']).rename('NDVI_2005');

//Emissivity Calculation
var emissivity_2005 = ndvi2005.addBands(ndvi2005.select('NDVI_2005').where(ndvi2005.select('NDVI_2005').lt(0), 0.9925)
                    .where(ndvi2005.select('NDVI_2005').gte(0) && ndvi2005.select('NDVI_2005').lt(0.15), 0.923)
                    .where(ndvi2005.select('NDVI_2005').gt(0.727), 0.986)
                    .where(ndvi2005.select('NDVI_2005').gte(0.15) && ndvi2005.select('NDVI_2005').lt(0.727), 
                           ndvi2005.expression(
                              '1.0094 + 0.047 * log(A)',{
                                'A' : ndvi2005.select('NDVI_2005')
                              })).rename('emissivity_2005'));

// Select Band 6 (units: Kelvin)
var scaledB6_2005 = day2005.select('B6').multiply(0.1).rename('B6_2005');
var B6_scaled_2005 = emissivity_2005.addBands(scaledB6_2005);

// LST Calculation
var LST_calc_2005 = B6_scaled_2005.expression('A / (1 +(0.0000115 * (A / 0.01438) * log(B)))',
            {
              'A' : B6_scaled_2005.select('B6_2005'),
              'B' : B6_scaled_2005.select('emissivity_2005')
            }).rename('LST_K_2005');
var LST_K_2005 = B6_scaled_2005.addBands(LST_calc_2005);

// Convert LST to Fahrenheit
var tempconversion_2005 = LST_K_2005.select('LST_K_2005').multiply(1.8).subtract(459.67).rename('LST_F_2005');
var LST_F_2005 = LST_K_2005.addBands(tempconversion_2005);

//Select LST band to use for analysis
var LST_F_analysis_2005 = LST_F_2005.select('LST_F_2005');

//Select NDVI band to use for analysis
var NDVI_analysis_2005 = LST_F_2005.select('NDVI_2005');

//Average LST for whole study area
var avgTemp2005 = LST_F_analysis_2005.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 120
});
print(avgTemp2005,'avgTemp2005');

//Average NDVI for whole study area
var avgNDVI2005 = NDVI_analysis_2005.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 30
});
print(avgNDVI2005,'avg NDVI 2005');

//Join the LST and NDVI
var all2005 = LST_F_analysis_2005.addBands(ndvi2005);
Map.addLayer(all2005,{},'all2005',false);

//reduceRegions and calculate the mean values for each patch
var red2005 = LST_F_analysis_2005.reduceRegions({
  collection: patch2005,
  reducer: ee.Reducer.mean(),
  scale: 120});

//Export to drive
Export.table.toDrive({
  collection: red2005, 
  description: 'PatchMean_LST_2005_ndviCorrected_CSrecode',
  fileFormat:'CSV'});
  
//reduceRegions and calculate the mean values for each patch
var rNDVI2005 = ndvi2005.reduceRegions({
  collection: patch2005,
  reducer: ee.Reducer.mean(),
  scale: 30});

//Export to drive
Export.table.toDrive({
  collection: rNDVI2005, 
  description: 'PatchMean_NDVI_2005_CSrecode',
  fileFormat:'CSV'});

// //----2010: 2010-06-26----// //
var day2010 = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_037037_20100626').clip(sa);
Map.addLayer(day2010,{},'day2010',false);

//NDVI for study area
var ndvi2010 = day2010.normalizedDifference(['B4', 'B3']).rename('NDVI_2010');

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

// Convert LST to Fahrenheit
var tempconversion_2010 = LST_K_2010.select('LST_K_2010').multiply(1.8).subtract(459.67).rename('LST_F_2010');
var LST_F_2010 = LST_K_2010.addBands(tempconversion_2010);

//Select LST band to use for analysis
var LST_F_analysis_2010 = LST_F_2010.select('LST_F_2010');

//Select NDVI band to use for analysis
var NDVI_analysis_2010 = LST_F_2010.select('NDVI_2010');

//Average LST for whole study area
var avgTemp2010 = LST_F_analysis_2010.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 120
});
print(avgTemp2010,'avgTemp2010');

//Average NDVI for whole study area
var avgNDVI2010 = NDVI_analysis_2010.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: sa.geometry(),
  scale: 30
});
print(avgNDVI2010,'avg NDVI 2010');

//Join the LST and NDVI
var all2010 = LST_F_analysis_2010.addBands(ndvi2010);
Map.addLayer(all2010,{},'all2010',false);

//reduceRegions and calculate the mean values for each patch
var red2010 = LST_F_analysis_2010.reduceRegions({
  collection: patch2010,
  reducer: ee.Reducer.mean(),
  scale: 120});

//Export to drive
Export.table.toDrive({
  collection: red2010, 
  description: 'PatchMean_LST_2010_ndviCorrected_CSrecode',
  fileFormat:'CSV'});
  
//reduceRegions and calculate the mean values for each patch
var rNDVI2010 = ndvi2010.reduceRegions({
  collection: patch2010,
  reducer: ee.Reducer.mean(),
  scale: 30});

//Export to drive
Export.table.toDrive({
  collection: rNDVI2010, 
  description: 'PatchMean_NDVI_2010_CSrecode',
  fileFormat:'CSV'});
