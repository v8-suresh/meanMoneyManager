'use strict';

angular.module('incexps').service('ChartService', [ '$http', '$q', '$stateParams', 'moment', '$filter',
	function($http, $q, $stateParams, moment, $filter) {
		var chartService = {};
        chartService.groupAndAggregate = function(items, projectBy, filterBy, groupBy, aggregateBy){
            var resultArr = [];
            var groupedObj = {};            
            for(var i = items.length-1; i >=0; --i){
            	var value = items[i];
            	if(filterBy && !filterBy(value)){
            		continue;
            	}
            	value = projectBy ? projectBy(value) : value;
            	if(groupBy){
                	var groupStr = JSON.stringify(groupBy(value));
                	var aggregated = value;
                    var prevItem = groupedObj[groupStr] && groupedObj[groupStr][0];
                	groupedObj[groupStr] = groupedObj[groupStr] || [];
                	if(!groupedObj[groupStr]){
                		aggregated['agg'] = aggregateBy ? aggregateBy(null, value) : value;
                    } else {
                    	groupedObj[groupStr] = aggregateBy ? [] : groupedObj[groupStr];
                        aggregated['agg'] = aggregateBy ? aggregateBy(prevItem, value) : value;
                    }
                    groupedObj[groupStr].push(aggregated);

                    resultArr = Object.keys(groupedObj).map(function(group){
        			    return groupedObj[group];
        			});
            	} else {
            		resultArr.push(value);
            	}
            }
            console.dir(resultArr);
            return resultArr;

        };
		chartService.transformToHeatMapData = function(incexps, filterBy){
			var data = {};
            var groupByDate = function(item){
                return [$filter('amDateFormat')(item.evDate,'YYYYMMDD')];
            };
            var aggregateBySumAmount = function(previousItem, currentItem){
                return (previousItem && currentItem ? (previousItem.amount + currentItem.amount) : 
                		(currentItem ? currentItem.amount : (previousItem ? previousItem.amount : 0)));
            };
            var filterByIncome = filterBy || function(item){
                return item.type === 'EXP';
            };
            var projectByFields = function(item){
                return {
                    evDate: item.evDate,
                    amount: item.amount
                };
            };
            var aggregatedArr = this.groupAndAggregate(incexps, projectByFields, filterByIncome, groupByDate, aggregateBySumAmount);

		    var start = null;
		    var end = null;
		    if($stateParams.month && $stateParams.year){
		        start = new Date($stateParams.year, $stateParams.month-1);
		        end = new Date($stateParams.year, $stateParams.month);
		    }
	    	var currentDate = new Date(start);//pull and store start date here
	    	var currentWeek = 0;
	    	var dataArr = [];
		    while(true){
		    	if(currentDate >= start && currentDate < end){
		    		//dayno = columnIdx
		    		var dayItem = [];
		    		var value = 0;
		    		var hasMatch = false;
		    		for(var i = aggregatedArr.length-1; i >=0; --i){
		    			var item = aggregatedArr[i] && aggregatedArr[i][0];
		    			var aggDate = $filter('amDateFormat')(item.evDate,'YYYYMMDD');
		    			var calDate = $filter('amDateFormat')(currentDate,'YYYYMMDD');
		    			if(aggDate === calDate){
		    				value = item.agg;
		    				break;
		    			}
		    		}
    				dayItem.push(currentDate.getDay());
    				dayItem.push(currentWeek);
    				dayItem.push(value);
    				
		    		dataArr.push(dayItem);
		    	} else {
		    		break;
		    	}
	    		if(currentDate.getDay() === 6){
	    			currentWeek++;	//reached day Saturday - so moving pointer to next week		
	    		}
		    	currentDate.setDate(currentDate.getDate() + 1);	//	moving the pointer to next date
		    }
		
			data.xAxis = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
			var yAxis = [];
			for(var j = 0; j<=currentWeek; j++){
				yAxis.push('Week-' + (j+1));
			}
			data.yAxis = yAxis;
			data.seriesData = dataArr;
			return data;
		};
		chartService.getHeatmapConfig = function(labels, trackerIncexps){
			var heatMapData = this.transformToHeatMapData(trackerIncexps);
        	var heatMapChartConfig = {
        			options: {
        				chart: {
        		            type: 'heatmap',
        		            marginTop: 40,
        		            marginBottom: 80
        		        },
        		        title: {
        		            text: 'Expenses for the Month : XX'
        		        },
        		        colorAxis: {
        		            min: 0,
        		            minColor: '#FFFFFF',
        		            maxColor: '#000000'
        		        },

        		        legend: {
        		            align: 'right',
        		            layout: 'vertical',
        		            margin: 0,
        		            verticalAlign: 'top',
        		            y: 25,
        		            symbolHeight: 280
        		        },
        		        tooltip: {
        		            formatter: function () {
        		                return '<b> Day : ' + this.series.xAxis.categories[this.point.x] + '</b><br><b>' +
        		                	'<b> Week : ' + this.series.yAxis.categories[this.point.y] + '</b><br><b>' +
        		                	'<b> Amount : ' + this.point.value + '</b>';
        		            }
        		        }
        			},
        	        xAxis: {
        	            categories: heatMapData.xAxis
        	        },

        	        yAxis: {
        	            categories: heatMapData.yAxis,
        	            title: 'SSSSSSSSSSSS'
        	        },
        	        series: [{
        	            name: 'Sales per employee',
        	            borderWidth: 1,
        	            data: heatMapData.seriesData,
        	            dataLabels: {
        	                enabled: true,
        	                color: '#000000'
        	            }
        	        }]       	        
        	
        	};
        	return heatMapChartConfig;
		};
        chartService.getIncomeHeatMapConfig = function(labels, trackerIncexps){
            var heatMapConfig = this.getBaseHeatmapConfig(labels);
            var filterByIncome = function(item){
                    return item.type === 'INC';
            };
            var heatMapData = this.transformToHeatMapData(trackerIncexps, filterByIncome);
            heatMapConfig.xAxis.categories = heatMapData.xAxis;
            heatMapConfig.yAxis.categories = heatMapData.yAxis;
            heatMapConfig.options.colorAxis.minColor = '#E6F5FF';
            heatMapConfig.options.colorAxis.maxColor = '#33ADFF';
            heatMapConfig.options.title.text = 'Income HEat Map - Cool Actually';
            heatMapConfig.series[0].data = heatMapData.seriesData;
            heatMapConfig.series[0].borderColor = '#007ACC';
            heatMapConfig.series[0].color = '#007ACC';
            heatMapConfig.series[0].dataLabels.color= '#005C99';
            return heatMapConfig;
        };
        chartService.getExpenseHeatMapConfig = function(labels, trackerIncexps){
            var heatMapConfig = this.getBaseHeatmapConfig(labels);
            var filterByIncome = function(item){
                return item.type === 'EXP';
            };
            var heatMapData = this.transformToHeatMapData(trackerIncexps, filterByIncome);
            heatMapConfig.xAxis.categories = heatMapData.xAxis;
            heatMapConfig.yAxis.categories = heatMapData.yAxis;
            heatMapConfig.options.colorAxis.minColor = '#FFF0F0';
            heatMapConfig.options.colorAxis.maxColor = '#FF8585';
            heatMapConfig.options.title.text = 'Expenses HEat Map';
            heatMapConfig.series[0].data = heatMapData.seriesData;
            heatMapConfig.series[0].borderColor = '#CC5252';
            heatMapConfig.series[0].color = '#CC5252';
            heatMapConfig.series[0].dataLabels.color= '#993D3D';
            return heatMapConfig;
        };
        chartService.getBaseHeatmapConfig = function(labels){
            var heatMapChartConfig = {
                options: {
                    chart: {
                        type: 'heatmap',
                        marginTop: 40,
                        marginBottom: 80
                    },
                    title: {
                    },
                    colorAxis: {
                        min: 0
                    },

                    legend: {
                        align: 'right',
                        layout: 'vertical',
                        margin: 0,
                        verticalAlign: 'top',
                        y: 25,
                        symbolHeight: 280
                    },
                    tooltip: {
                        formatter: function () {
                            return '<b> Day : ' + this.series.xAxis.categories[this.point.x] + '</b><br><b>' +
                                '<b> Week : ' + this.series.yAxis.categories[this.point.y] + '</b><br><b>' +
                                '<b> Amount : ' + this.point.value + '</b>';
                        }
                    }
                },
                xAxis: {
                },
                yAxis: {
                },
                series: [{
                    name: 'Sales per employee',
                    borderWidth: 1,
                    data: null,
                    dataLabels: {
                        enabled: true,
                        color: '#000000'
                    }
                }]

            };
            return heatMapChartConfig;
        };
		return chartService;
	}
]);
