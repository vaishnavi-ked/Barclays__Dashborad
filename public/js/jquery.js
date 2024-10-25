jQuery(function () {
    /* co2 emmision Start */
    // Function to reset charts and related UI elements
    // function resetCharts() {
    //     if(emissionChart){
    //         clearDateInputsWater();
    //     }
    //     if (chart) {
    //         clearDateInputs();
    //     }
    // }

    var emissionChart;

    async function pieChart() {
        // Only dispose the existing chart if it exists
        if (emissionChart) {
            if (emissionChart instanceof ApexCharts) {
                console.log("ApexCharts Pie chart destroyed");
                emissionChart.destroy(); // Dispose the existing ApexCharts instance
            } else if (emissionChart instanceof AmCharts.AmChart) {
                console.log("AmCharts Pie chart destroyed");
                emissionChart.clear(); // Clear the existing AmCharts instance
            } else if (emissionChart instanceof am4charts.XYChart) {
                console.log("am4charts Pie chart destroyed");
                emissionChart.dispose(); // Dispose the existing am4charts instance
            }
            clearDateInputs();
        }

        // Append a style block to customize the text appearance in the chart
        const style = document.createElement('style');
        style.innerHTML = `
            #chartdiv .apexcharts-text {
                fill: #000000; /* Change this to your desired color */
                font-weight: bold; /* Ensure bold text */
            }
        `;
        document.head.appendChild(style);

        const response = await fetch("https://localhost/obix/config/GraphQl/Co2Emission/");
        const text = await response.text();

        // Parse the XML-like structure to extract values
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        const scope1Value = parseFloat(xmlDoc.querySelector('ref[name="Scope1"]').getAttribute('display').split(' ')[0]);
        const scope2Value = parseFloat(xmlDoc.querySelector('ref[name="Scope2"]').getAttribute('display').split(' ')[0]);
        const scope3Value = parseFloat(xmlDoc.querySelector('ref[name="Scope3"]').getAttribute('display').split(' ')[0]);

        // Calculate total value from the series
        const seriesValues = [scope1Value, scope2Value, scope3Value];

        // Calculate total value from the series
        //const seriesValues = [80, 60, 50]; // Example scope values
        const totalValue = seriesValues.reduce((a, b) => a + b, 0); // Calculate total value

        // Radial bar chart options
        var options = {
            series: seriesValues, // Use the calculated series values
            chart: {
                height: '100%',
                type: 'radialBar', // Set chart type to radialBar
            },
            plotOptions: {
                radialBar: {
                    offsetY: 30,
                    offsetX: -10,
                    startAngle: -180, // Define starting angle
                    endAngle: 90, // Define ending angle
                    track: {
                        background: '#f5f5f5', // Track background color
                        strokeWidth: '100%',
                        margin: 4, // Margin between tracks
                    },
                    hollow: {
                        margin: 0,
                        size: '50%', // Hollow size
                        background: 'transparent',
                    },
                    dataLabels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '30px',
                            fontWeight: 'bold',
                            color: '#000000',
                            formatter: function () {
                                return 'Total'; // Static 'Total' label in the center
                            }
                        },
                        value: {
                            show: true,
                            fontSize: '30px',
                            fontWeight: 'bold',
                            color: '#000000',
                            formatter: function () {
                                return totalValue; // Display static total value in the center
                            }
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '30px',
                            fontWeight: 'bold',
                            color: '#000000',
                            formatter: function () {
                                return totalValue; // Static total value
                            }
                        }
                    }
                }
            },
            colors: ["#FFB22C", "#A4CE95", "#FFD93D"], // Segment colors
            fill: { opacity: [0.85, 0.85, 0.85] }, // Set opacity for each segment
            labels: ['Scope 1', 'Scope 2', 'Scope 3'], // Labels for each segment
            legend: {
                show: true,
                floating: true,
                fontSize: '16px',
                position: 'right', // Position legend on the right
                offsetX: 10,
                offsetY: -20,
                labels: { useSeriesColors: true }, // Use colors from the series
                markers: { size: 0 }, // No markers in the legend
                // formatter: function(seriesName, opts) {
                //     return seriesName + ": " + opts.w.globals.series[opts.seriesIndex] + "%"; // Custom legend formatting
                // },
                itemMargin: { vertical: 1 }, // Margin between legend items
            },
            tooltip: {
                enabled: true,
                shared: false, // Disable shared tooltip
                style: {
                    fontSize: '16px', // Optional: set font size for the tooltip text
                },
                custom: function ({ series, seriesIndex, w }) {
                    const name = w.globals.labels[seriesIndex]; // Get the label
                    const value = series[seriesIndex]; // Get the value

                    // Define background colors for each series
                    const backgroundColors = [
                        '#FFB22C', // Color for Series 1
                        '#A4CE95', // Color for Series 2
                        '#FFD93D'  // Color for Series 3 (if applicable)
                    ];

                    // Get the background color based on the series index
                    const backgroundColor = backgroundColors[seriesIndex] || '#F7F7F7'; // Default color if index is out of bounds

                    return `<div style="color: #00000; background: ${backgroundColor}; padding: 8px; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                                <strong style="color: #000000;">${name}</strong>: <span style="color: #000000;">${value}</span>
                            </div>`; // Show name and value in tooltip
                },
            },
            responsive: [{
                breakpoint: 480,
                options: { legend: { show: true } } // Show legend on small screens
            }]
        };

        // Create and render the new radial bar chart
        emissionChart = new ApexCharts(document.querySelector("#chartdiv"), options);
        emissionChart.render();
    }

    // Ensure the pieChart function is called to render the chart



    pieChart();

    async function lineChartMonthlyCo25() {
        // Get the current date
        const today = new Date();
        const currentMonth = today.getMonth();

        // Set startDate and endDate to the previous month
        const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);  // First day of the previous month
        const endDate = new Date(today.getFullYear(), currentMonth, 0);  // Last day of the previous month

        // Generate chart data for the previous month
        var chartData = generateChartData(startDate, endDate);

        function generateChartData(startDate, endDate) {
            var chartData = [];
            var visits = 1200;
            var hits = 1220;
            var views = 1240;

            var currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                views += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

                chartData.push({
                    date: new Date(currentDate),
                    scope1: visits,
                    scope2: hits,
                    scope3: views
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
            return chartData;
        }

        // Alert if no data exists
        if (chartData.length === 0) {
            alert('No data to display for the selected range');
            return;
        }

        // Destroy existing chart if it exists
        if (emissionChart) {
            if (emissionChart instanceof ApexCharts) {
                console.log("Pie chart destroyed");
                emissionChart.destroy(); // Dispose the existing chart
            } else if (emissionChart instanceof AmCharts.AmChart) {
                console.log("Pie chart destroyed");
                emissionChart.clear(); // Clear the existing AmCharts instance
            } else if (emissionChart instanceof am4charts.XYChart) {
                console.log("Pie chart destroyed");
                emissionChart.dispose(); // Dispose the existing am4charts instance
            }
        }

        // Create the line chart with the generated data for the previous month
        emissionChart = AmCharts.makeChart("chartdiv", {
            "type": "serial",
            "theme": "white",
            "color": "#000",
            "legend": {
                "useGraphSettings": true,
                "color": "#000",
                "position": "top",
                "align": "center",
                "marginBottom": 10,
                "valueText": ""
            },
            "dataProvider": chartData,
            "synchronizeGrid": true,
            "valueAxes": [{
                "id": "v1",
                "axisColor": "#000",
                "axisThickness": 0.5,
                "axisAlpha": 1,
                "position": "left"
            }],
            "graphs": [{
                "valueAxis": "v1",
                "lineColor": "#FFB22C",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Scope 1",
                "valueField": "scope1",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#FFB22C",  // Background color (same as line color)
                    "borderColor": "#FFB22C"
                }
            }, {
                "valueAxis": "v1",
                "lineColor": "#A4CE95",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Scope 2",
                "valueField": "scope2",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#A4CE95",  // Background color (same as line color)
                    "borderColor": "#A4CE95"
                }
            }, {
                "valueAxis": "v1",
                "lineColor": "#FFD93D",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Scope 3",
                "valueField": "scope3",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#FFB22C",  // Background color (same as line color)
                    "borderColor": "#FFB22C"
                }
            }],
            "chartScrollbar": {
                "offset": 20
            },
            "chartCursor": {
                "cursorPosition": "mouse",
                "cursorColor": "#000000",
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#000",
                "minorGridEnabled": true
            },
            "export": {
                "enabled": true // Disable export menu
            }
        });
        emissionChart.addListener("dataUpdated", zoomChart);
        zoomChart();

        function zoomChart() {
            emissionChart.zoomToIndexes(emissionChart.dataProvider.length - 70, emissionChart.dataProvider.length - 1);
        }

    }

    async function lineChart2() {
        var startDateValue = $("#startDate").val();
        var endDateValue = $("#endDate").val();

        if (startDateValue && endDateValue) {
            var startDate = new Date(startDateValue);
            var endDate = new Date(endDateValue);
            if (!await validateDateRange(startDate, endDate)) {
                return; // Exit if validation fails
            }

            var chartData = generateChartData(startDate, endDate);

            function generateChartData(startDate, endDate) {
                var chartData = [];
                var visits = 1200;
                var hits = 1220;
                var views = 1240;

                var currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                    hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                    views += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

                    chartData.push({
                        date: new Date(currentDate),
                        scope1: visits,
                        scope2: hits,
                        scope3: views
                    });

                    currentDate.setDate(currentDate.getDate() + 1);
                }
                return chartData;
            }

            if (chartData.length === 0) {
                alert('No data to display for the selected range');
                return;
            }

            if (emissionChart) {
                if (emissionChart instanceof ApexCharts) {
                    console.log("Pie chart destroyed");
                    emissionChart.destroy(); // Dispose the existing chart
                } else if (emissionChart instanceof AmCharts.AmChart) {
                    console.log("Pie chart destroyed");
                    emissionChart.clear(); // Clear the existing AmCharts instance
                } else if (emissionChart instanceof am4charts.XYChart) {
                    console.log("Pie chart destroyed");
                    emissionChart.dispose(); // Dispose the existing am4charts instance
                }
            }

            emissionChart = AmCharts.makeChart("chartdiv", {
                "type": "serial",
                "theme": "white",
                "color": "#000",
                "legend": {
                    "useGraphSettings": true,
                    "color": "#000",
                    "position": "top",
                    "align": "center",
                    "marginBottom": 10,
                    "valueText": ""
                },
                "dataProvider": chartData,
                "synchronizeGrid": true,
                "valueAxes": [{
                    "id": "v1",
                    "axisColor": "#000",
                    "axisThickness": 0.5,
                    "axisAlpha": 1,
                    "position": "left"
                }],
                "graphs": [{
                    "valueAxis": "v1",
                    "lineColor": "#FFB22C",
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "Scope 1",
                    "valueField": "scope1",
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",  // Text color
                        "fillColor": "#FFB22C",  // Background color (same as line color)
                        "borderColor": "#FFB22C"
                    }
                }, {
                    "valueAxis": "v1",
                    "lineColor": "#A4CE95",
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "Scope 2",
                    "valueField": "scope2",
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",  // Text color
                        "fillColor": "#A4CE95",  // Background color (same as line color)
                        "borderColor": "#A4CE95"
                    }
                }, {
                    "valueAxis": "v1",
                    "lineColor": "#FFD93D",
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "Scope 3",
                    "valueField": "scope3",
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",  // Text color
                        "fillColor": "#FFB22C",  // Background color (same as line color)
                        "borderColor": "#FFB22C"
                    }
                }],
                "chartScrollbar": {
                    "offset": 20
                },
                "chartCursor": {
                    "cursorPosition": "mouse",
                    "cursorColor": "#000000",
                },
                "categoryField": "date",
                "categoryAxis": {
                    "parseDates": true,
                    "axisColor": "#000",
                    "minorGridEnabled": true
                },
                "export": {
                    "enabled": true // Disable export menu
                }
            });


            emissionChart.addListener("dataUpdated", zoomChart);
            zoomChart();

            function zoomChart() {
                emissionChart.zoomToIndexes(emissionChart.dataProvider.length - 70, emissionChart.dataProvider.length - 1);
            }
        }
    }

    async function showClusteredBarChart() {
        // Dispose of existing chart
        if (emissionChart) {
            console.log("Bar chart destroyed");
            if (emissionChart instanceof ApexCharts) {
                emissionChart.destroy();
            } else if (emissionChart instanceof AmCharts.AmChart) {
                emissionChart.clear(); // Clear AmCharts instance
            } else if (emissionChart instanceof am4charts.XYChart) {
                emissionChart.dispose(); // Dispose am4charts instance
            }
        }

        // Themes begin

        am4core.useTheme(am4themes_animated);
        emissionChart = am4core.create('chartdiv', am4charts.XYChart);

        emissionChart.padding(0, 0, 0, 0);
        emissionChart.colors.step = 2;

        emissionChart.legend = new am4charts.Legend();
        emissionChart.legend.position = 'top';
        emissionChart.legend.paddingBottom = 20;
        emissionChart.legend.labels.template.maxWidth = 95;
        emissionChart.legend.labels.template.fill = am4core.color('#000000');

        var xAxis = emissionChart.xAxes.push(new am4charts.CategoryAxis());
        xAxis.dataFields.category = 'category';

        xAxis.renderer.cellStartLocation = 0.2;
        xAxis.renderer.cellEndLocation = 0.8;
        xAxis.renderer.grid.template.location = 0;
        xAxis.renderer.labels.template.fill = am4core.color('#000000');
        xAxis.renderer.minGridDistance = 20;
        xAxis.renderer.labels.template.rotation = 270;
        xAxis.renderer.labels.template.horizontalCenter = "right";
        xAxis.renderer.labels.template.verticalCenter = "middle";

        var yAxis = emissionChart.yAxes.push(new am4charts.ValueAxis());
        yAxis.min = 0;
        yAxis.renderer.labels.template.fill = am4core.color('#000000');

        function createSeries(value, name, color) {
            var series = emissionChart.series.push(new am4charts.ColumnSeries());
            series.dataFields.valueY = value;
            series.dataFields.categoryX = "category";
            series.name = name;

            series.columns.template.fill = am4core.color(color);
            series.columns.template.stroke = am4core.color(color);
            series.tooltipText = '{name}: {valueY}';
            series.tooltip.background.fill = am4core.color(color);  // Set background to bar color
            series.tooltip.label.fill = am4core.color('#000000');    // Set text color to dark (black)

            series.tooltip.pointerOrientation = 'vertical';
            series.tooltip.getFillFromObject = false;
            series.tooltip.getStrokeFromObject = false;

            var bullet = series.bullets.push(new am4charts.LabelBullet());
            bullet.interactionsEnabled = false;
            bullet.dy = 30;
            bullet.label.fill = am4core.color('#000000');

            return series;
        }


        emissionChart.data = [
            { category: 'Jan', first: 40, second: 55, third: 60 },
            { category: 'Feb', first: 30, second: 78, third: 69 },
            { category: 'Mar', first: 27, second: 40, third: 45 },
            { category: 'Apr', first: 50, second: 33, third: 22 },
            { category: 'May', first: 50, second: 33, third: 22 },
            { category: 'Jun', first: 50, second: 33, third: 22 },
            { category: 'Jul', first: 50, second: 33, third: 22 },
            { category: 'Aug', first: 50, second: 33, third: 22 },
            { category: 'Sep', first: 50, second: 33, third: 22 },
            { category: 'Oct', first: 50, second: 33, third: 22 },
            { category: 'Nov', first: 50, second: 33, third: 22 },
            { category: 'Dec', first: 50, second: 33, third: 22 }
        ];

        createSeries('first', 'Scope 1', '#FFB22C');//["#FFB22C", "#A4CE95", "#FFD93D"],
        createSeries('second', 'Scope 2', '#A4CE95');
        createSeries('third', 'Scope 3', '#FFD93D');

        function arrangeColumns() {
            var series = emissionChart.series.getIndex(0);
            var w = 1 - xAxis.renderer.cellStartLocation - (1 - xAxis.renderer.cellEndLocation);
            if (series.dataItems.length > 1) {
                var x0 = xAxis.getX(series.dataItems.getIndex(0), "categoryX");
                var x1 = xAxis.getX(series.dataItems.getIndex(1), "categoryX");
                var delta = ((x1 - x0) / emissionChart.series.length) * w;
                if (am4core.isNumber(delta)) {
                    var middle = emissionChart.series.length / 2;
                    var newIndex = 0;
                    emissionChart.series.each(function (series) {
                        if (!series.isHidden && !series.isHiding) {
                            series.dummyData = newIndex;
                            newIndex++;
                        } else {
                            series.dummyData = emissionChart.series.indexOf(series);
                        }
                    });
                    var visibleCount = newIndex;
                    var newMiddle = visibleCount / 2;
                    emissionChart.series.each(function (series) {
                        var trueIndex = emissionChart.series.indexOf(series);
                        var newIndex = series.dummyData;
                        var dx = (newIndex - trueIndex + middle - newMiddle) * delta;
                        series.animate({ property: "dx", to: dx }, series.interpolationDuration, series.interpolationEasing);
                        series.bulletsContainer.animate({ property: "dx", to: dx }, series.interpolationDuration, series.interpolationEasing);
                    });
                }
            }
        }

        var cursor = new am4charts.XYCursor();
        emissionChart.cursor = cursor;

        // Disable Y-axis line (if needed)
        emissionChart.cursor.lineY.disabled = false;

        // Disable the Y-axis tooltip box
        yAxis.cursorTooltipEnabled = false;
        emissionChart.logo.disabled = true;


    }

    async function createBarChart1() {
        if (emissionChart) {
            if (emissionChart instanceof ApexCharts) {
                console.log("Pie chart destroyed");
                emissionChart.destroy(); // Dispose the existing chart
            } else if (emissionChart instanceof AmCharts.AmChart) {
                console.log("Pie chart destroyed");
                emissionChart.clear(); // Clear the existing AmCharts instance
            } else if (emissionChart instanceof am4charts.XYChart) {
                console.log("Pie chart destroyed");
                emissionChart.dispose(); // Dispose the existing am4charts instance
            }
        }

        const options = {
            series: [{
                name: 'Scope 1',
                data: getRandomData() // Replace with your actual Scope 1 data
            }, {
                name: 'Scope 2',
                data: getRandomData() // Replace with your actual Scope 2 data
            }, {
                name: 'Scope 3',
                data: getRandomData() // Replace with your actual Scope 3 data
            }],
            chart: {
                type: 'bar',
                height: '100%',
                stacked: false, // Ensure it's not stacked, so bars are side by side
                toolbar: {
                    show: false // Hide the toolbar with export options
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false, // Vertical bars
                    columnWidth: '80%', // Increase the width of the bars
                    endingShape: 'rounded',
                    groupedPadding: 0
                }
            },
            colors: ["#FFB22C", "#A4CE95", "#FFD93D"], // Colors for Scope 1, Scope 2, Scope 3["#FFB22C", "#A4CE95", "#FFD93D"],
            dataLabels: {
                enabled: false, // Disable the values on top of the bars
            },
            xaxis: {
                categories: getLast12Months(), // Last 12 months from October 2023 to September 2024
            },
            yaxis: {
                title: {
                    text: 'Emissions (in metric tons)', // Y-axis title for emissions
                }
            },
            grid: {
                show: true,
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return val; // Customize tooltip text
                    }
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                labels: {
                    colors: ['#000000'],
                }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent'] // Show the borders between columns
            },
            fill: {
                opacity: 1 // Ensure the bars are fully filled
            }
        };

        emissionChart = new ApexCharts(document.querySelector("#chartdiv"), options);
        emissionChart.render();
    }

    $("#startDate, #endDate").on("change", async function () {
        clearDateInputsWater();
        await lineChart2();
    });

    $("#sav_monthly_btn").on("click", async function () {
        clearDateInputs();
        await lineChartMonthlyCo25();
    });

    $("#sav_daily_btn").on("click", async function () {
        clearDateInputs();
        await pieChart();
    });

    $("#sav_yearly_btn").on("click", async function () {
        clearDateInputs();
        await createBarChart1();
    });
});
/* co2 emmision end */

/* water consumption start */
var chart = null;
async function pieChart1() {
    am4core.ready(function () {

        // Themes begin
        am4core.useTheme(am4themes_animated);

        if (chart) {
            if (chart instanceof ApexCharts) {
                console.log("Chart destroyed");
                chart.destroy(); // Dispose the existing chart
            } else if (chart instanceof AmCharts.AmChart) {
                console.log("Chart destroyed");
                chart.clear(); // Clear the existing AmCharts instance
            } else if (chart instanceof am4charts.XYChart) {
                console.log("Chart destroyed");
                chart.dispose(); // Dispose the existing am4charts instance
            }
        }

        // Create chart instance
        var chart = am4core.create("chartdiv1", am4charts.PieChart);

        // Add data
        chart.data = [
            { "country": "Domestic", "litres": 800 },
            { "country": "Flushing", "litres": 600 },
        ];

        // Add and configure Series
        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "litres";
        pieSeries.dataFields.category = "country";

        // Set pie chart colors
        pieSeries.slices.template.stroke = am4core.color("transparent");
        pieSeries.slices.template.strokeOpacity = 0;

        // Example of setting colors for each slice
        pieSeries.colors.list = [
            am4core.color("#C65BCF"), // Lithuania
            am4core.color("#39A7FF")
        ];

        pieSeries.ticks.template.disabled = true;
        pieSeries.alignLabels = false;
        pieSeries.labels.template.text = "{value.percent.formatNumber('#.0')}%";
        pieSeries.labels.template.radius = am4core.percent(-40);
        pieSeries.labels.template.fill = am4core.color("#000000");

        // This creates initial animation
        pieSeries.hiddenState.properties.opacity = 1;
        pieSeries.hiddenState.properties.endAngle = -90;
        pieSeries.hiddenState.properties.startAngle = -90;

        chart.hiddenState.properties.radius = am4core.percent(-40);
        pieSeries.legendSettings.valueText = "{ }";

        // Add legend at the top
        chart.legend = new am4charts.Legend();
        chart.legend.position = "top";
        chart.legend.labels.template.maxWidth = 100;
        chart.legend.labels.template.text = "{country}: {litres} L"; // Updated to show litres value
        chart.legend.labels.template.interactionsEnabled = false;
        // Change legend text color
        chart.legend.labels.template.fill = am4core.color("#000000"); // Set legend text color
        // Set legend layout to horizontal
        chart.legend.layout = "horizontal"; // Change layout to horizontal
        chart.legend.itemContainers.template.paddingBottom = 10;
        // Center the legend horizontally
        chart.legend.itemContainers.template.align = "center";
        chart.legend.itemContainers.template.valign = "middle";
        chart.legend.contentAlign = "center"; // Align the entire legend in the middle

        chart.logo.disabled = true;
        clearDateInputsWater();

    }); // end am4core.ready()


}
// Declare the chart variable globally




// Declare global variables for the chart and timeout



pieChart1();



async function lineChartMonthlyWater() {
    // Get the current date
    const today = new Date();
    const currentMonth = today.getMonth();

    // Set startDate and endDate to the previous month
    const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);  // First day of the previous month
    const endDate = new Date(today.getFullYear(), currentMonth, 0);  // Last day of the previous month

    // Generate chart data for the previous month
    var chartData = generateChartData(startDate, endDate);

    function generateChartData(startDate, endDate) {
        var chartData = [];
        var visits = 1200;
        var hits = 1220;
        var views = 1240;

        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            views += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

            chartData.push({
                date: new Date(currentDate),
                scope1: visits,
                scope2: hits,
                scope3: views
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
        return chartData;
    }

    // Alert if no data exists
    if (chartData.length === 0) {
        alert('No data to display for the selected range');
        return;
    }

    // Destroy existing chart if it exists
    if (chart) {
        if (chart instanceof ApexCharts) {
            console.log("Chart destroyed");
            chart.destroy(); // Dispose the existing chart
        } else if (chart instanceof AmCharts.AmChart) {
            console.log("Chart destroyed");
            chart.clear(); // Clear the existing AmCharts instance
        } else if (chart instanceof am4charts.XYChart) {
            console.log("Chart destroyed");
            chart.dispose(); // Dispose the existing am4charts instance
        }
    }

    // Create the line chart with the generated data for the previous month
    var chart = AmCharts.makeChart("chartdiv1", {
        "type": "serial",
        "theme": "white",
        "color": "#000",
        "legend": {
            "useGraphSettings": true,
            "color": "#000",
            "position": "top",
            "align": "center",
            "marginBottom": 10,
            "valueText": ""
        },
        "dataProvider": chartData,
        "synchronizeGrid": true,
        "valueAxes": [{
            "id": "v1",
            "axisColor": "#000",
            "axisThickness": 0.5,
            "axisAlpha": 1,
            "position": "left"
        }],
        "graphs": [{
            "valueAxis": "v1",
            "lineColor": "#C65BCF",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "Domestic Water",
            "valueField": "scope1",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#C65BCF",
                "borderColor": "#C65BCF"
            }
        }, {
            "valueAxis": "v1",
            "lineColor": "#39A7FF",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "Flushing Water",
            "valueField": "scope2",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#39A7FF",  // Background color (same as line color)
                "borderColor": "#39A7FF"
            }
        }],
        "chartScrollbar": {
            "offset": 20
        },
        "chartCursor": {
            "cursorPosition": "mouse",
            "cursorColor": "#000000",
        },
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "axisColor": "#000",
            "minorGridEnabled": true
        },
        "export": {
            "enabled": true // Disable export menu
        }
    });

    chart.addListener("dataUpdated", zoomChart);
    zoomChart();

    function zoomChart() {
        chart.zoomToIndexes(chart.dataProvider.length - 70, chart.dataProvider.length - 1);
    }
}

async function lineChart1() {
    var startDateValue = $("#startDateWater").val();
    var endDateValue = $("#endDateWater").val();

    if (startDateValue && endDateValue) {
        var startDate = new Date(startDateValue);
        var endDate = new Date(endDateValue);
        if (!await validateDateRange(startDate, endDate)) {
            return; // Exit if validation fails
        }

        var chartData = generateChartData(startDate, endDate);

        if (chartData.length === 0) {
            alert('No data to display for the selected range');
            return;
        }

        // Generate data for Chart 2
        function generateChartData() {
            var chartData = [];
            var visits = 10; // Different initial value for the second chart
            var currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                chartData.push({
                    date: new Date(currentDate),
                    domesticwater: visits,
                    flushingwater: visits + Math.round(Math.random() * 30)
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return chartData;
        }
        if (chart instanceof am4charts.XYChart) {
            console.log("am4charts Pie chart destroyed");
            chart.dispose(); // Dispose the existing am4charts instance
        }

        chart = AmCharts.makeChart('chartdiv1', {
            "type": "serial",
            "theme": "white",
            "color": "#000",
            "legend": {
                "useGraphSettings": true,
                "color": "#000",
                "position": "top",       // Legend at top
                "align": "center",       // Center the legend
                "marginBottom": 0,       // Space below legend
                "valueText": ""
            },
            "dataProvider": chartData,
            "synchronizeGrid": true,
            "valueAxes": [{
                "id": "v1",
                "axisColor": "#000",
                "axisThickness": 1,
                "axisAlpha": 1,
                "position": "left"
            }],
            "graphs": [{
                "valueAxis": "v1",
                "lineColor": "#C65BCF",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Domestic Water",
                "valueField": "domesticwater",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#C65BCF",  // Background color (same as line color)
                    "borderColor": "#C65BCF"
                }
            }, {
                "valueAxis": "v1",
                "lineColor": "#39A7FF",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Flushing Water",
                "valueField": "flushingwater",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#39A7FF",  // Background color (same as line color)
                    "borderColor": "#39A7FF"
                }
            }],
            "chartScrollbar": {
                "selectedGraphLineColor": "#888",
                "position": "bottom",   // Set scrollbar position to bottom
                "offset": 20           // Ensure some offset from the chart
            },
            "chartCursor": {
                "cursorPosition": "mouse",
                "cursorColor": "#000000"
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#000",
                "minorGridEnabled": true
            },
            "export": {
                "enabled": true,
                "position": "bottom-right"
            },
            "zoomControl": {
                "zoomControlEnabled": false
            }
        });

        chart.addListener("dataUpdated", zoomChart);
        zoomChart();

        function zoomChart() {
            chart.zoomToIndexes(chart.dataProvider.length - 70, chart.dataProvider.length - 1);
        }
    }
}
// async function showClusteredBarChart1() {
//     am4core.ready(function () {

//         // Themes begin
//         am4core.useTheme(am4themes_animated);
//         // Themes end

//         var chart = am4core.create('chartdiv1', am4charts.XYChart);

//         chart.padding(0, 0, 0, 0);
//         chart.colors.step = 2;

//         chart.legend = new am4charts.Legend();
//         chart.legend.position = 'top';
//         chart.legend.paddingBottom = 20;
//         chart.legend.labels.template.maxWidth = 95;
//         chart.legend.labels.template.fill = am4core.color('#000000');

//         var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
//         xAxis.dataFields.category = 'category';
//         xAxis.renderer.cellStartLocation = 0.2;
//         xAxis.renderer.cellEndLocation = 0.8;
//         xAxis.renderer.grid.template.location = 0;
//         xAxis.renderer.labels.template.fill = am4core.color('#000000');
//         xAxis.renderer.minGridDistance = 20;
//         xAxis.renderer.labels.template.rotation = 270; // Rotate labels
//         xAxis.renderer.labels.template.horizontalCenter = "right"; // Align to right
//         xAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically

//         var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
//         yAxis.min = 0;
//         yAxis.renderer.labels.template.fill = am4core.color('#000000');

//         // Create stacked series
//         function createSeries(value, name, color) {
//             var series = chart.series.push(new am4charts.ColumnSeries());
//             series.dataFields.valueY = value;
//             series.dataFields.categoryX = "category";
//             series.name = name;

//             series.columns.template.fill = am4core.color(color);  // Fill color
//             series.columns.template.stroke = am4core.color(color); // Stroke color

//             // Customize tooltip
//             series.tooltipText = '{name}: {valueY}';
//             series.tooltip.background.fill = am4core.color(color); // Set tooltip background color to match series color
//             series.tooltip.label.fill = am4core.color('#ffffff'); // Tooltip text color
//             series.tooltip.pointerOrientation = 'vertical'; // Tooltip orientation
//             series.tooltip.getFillFromObject = false; // Ensure tooltip color is set explicitly
//             series.tooltip.getStrokeFromObject = false; // Ensure tooltip border color is set explicitly

//             // Add bullets for labels inside the bar
//             var bullet = series.bullets.push(new am4charts.LabelBullet());
//             bullet.interactionsEnabled = false;
//             bullet.dy = 30;
//             bullet.label.fill = am4core.color('#000000');

//             series.stacked = true;  // Enable stacking

//             return series;
//         }

//         // Sample data
//         chart.data = [
//             { category: 'Jan', first: 40, second: 50 },
//             { category: 'Feb', first: 30, second:40 },
//             { category: 'Mar', first: 27, second: 40 },
//             { category: 'Apr', first: 50, second: 33 },
//             { category: 'May', first: 50, second: 33 },
//             { category: 'Jun', first: 50, second: 33 },
//             { category: 'Jul', first: 50, second: 33 },
//             { category: 'Aug', first: 50, second: 33 },
//             { category: 'Sept', first: 50, second: 33 },
//             { category: 'Oct', first: 50, second: 33 },
//             { category: 'Nov', first: 50, second: 33 },
//             { category: 'Dec', first: 50, second: 33 }
//         ];

//         createSeries('first', 'Domestic Water', '#C65BCF');
//         createSeries('second', 'Flushing Water', '#39A7FF');

//         // Add total value at the top of each bar
//         chart.events.on("datavalidated", function () {
//             chart.series.each(function (series) {
//                 series.columns.each(function (column) {
//                     var total = 0;

//                     // Loop through all stacked series to calculate the total
//                     chart.series.each(function (stackedSeries) {
//                         total += stackedSeries.dataItems.getIndex(column.dataItem.index).valueY;
//                     });

//                     // Add a label at the top of the stack
//                     var label = column.createChild(am4core.Label);
//                     label.text = total.toString();
//                     label.fill = am4core.color('#000000'); // Label color
//                     label.fontSize = 12;
//                     label.dy = -20; // Position above the bar
//                     label.align = "center";
//                 });
//             });
//         });

//         var cursor = new am4charts.XYCursor();
//         chart.cursor = cursor;
//         chart.logo.disabled = true;
//     }); // end am4core.ready()
// }
async function showClusteredBarChart1() {
    am4core.ready(function () {
        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        var chart = am4core.create('chartdiv1', am4charts.XYChart);

        chart.padding(0, 0, 0, 0);
        chart.colors.step = 2;

        chart.legend = new am4charts.Legend();
        chart.legend.position = 'top';
        chart.legend.paddingBottom = 20;
        chart.legend.labels.template.maxWidth = 95;
        chart.legend.labels.template.fill = am4core.color('#000000');

        var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        xAxis.dataFields.category = 'category';
        xAxis.renderer.cellStartLocation = 0.2;
        xAxis.renderer.cellEndLocation = 0.8;
        xAxis.renderer.grid.template.location = 0;
        xAxis.renderer.labels.template.fill = am4core.color('#000000');
        xAxis.renderer.minGridDistance = 20;
        xAxis.renderer.labels.template.rotation = 315;
        xAxis.renderer.labels.template.horizontalCenter = "right"; // Align to right
        xAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
        xAxis.renderer.labels.template.dy = -15;
        xAxis.renderer.labels.template.fontSize = 10;
        xAxis.renderer.labels.template.dx = 5;

        var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
        yAxis.min = 0;
        yAxis.renderer.labels.template.fill = am4core.color('#000000');

        // Create stacked series
        function createSeries(value, name, color) {
            var series = chart.series.push(new am4charts.ColumnSeries());
            series.dataFields.valueY = value;
            series.dataFields.categoryX = "category";
            series.name = name;

            series.columns.template.fill = am4core.color(color);  // Fill color
            series.columns.template.stroke = am4core.color(color); // Stroke color

            // Customize tooltip
            series.tooltipText = '{name}: {valueY}';
            series.tooltip.background.fill = am4core.color(color); // Set tooltip background color to match series color
            series.tooltip.label.fill = am4core.color('#ffffff'); // Tooltip text color
            series.tooltip.pointerOrientation = 'vertical'; // Tooltip orientation
            series.tooltip.getFillFromObject = false; // Ensure tooltip color is set explicitly
            series.tooltip.getStrokeFromObject = false; // Ensure tooltip border color is set explicitly

            series.stacked = true;  // Enable stacking

            return series;
        }

        // Generate the last 12 months for the x-axis categories
        const last12Months = getLast12Months();

        // Generate random data for each scope
        const scope1Data = getRandomData(); // Random data for "Domestic Water"
        const scope2Data = getRandomData(); // Random data for "Flushing Water"

        // Set the chart data using last 12 months and generated data
        chart.data = last12Months.map((month, index) => ({
            category: month,
            first: scope1Data[index],
            second: scope2Data[index]
        }));

        createSeries('first', 'Domestic Water', '#C65BCF');
        createSeries('second', 'Flushing Water', '#39A7FF');

        // Add total value at the top of each bar for the last series only
        chart.events.on("datavalidated", function () {
            var lastSeries = chart.series.getIndex(chart.series.length - 1); // Get the last series in the stack
            lastSeries.columns.each(function (column) {
                var total = 0;

                // Loop through all stacked series to calculate the total
                chart.series.each(function (stackedSeries) {
                    total += stackedSeries.dataItems.getIndex(column.dataItem.index).valueY;
                });

                // Add a label at the top of the stack (for the last series only)
                var label = column.createChild(am4core.Label);
                label.text = total.toString();
                label.fill = am4core.color('#000000'); // Label color
                label.fontSize = 12;
                label.dy = -20; // Position above the bar
                label.align = "center";
            });
        });

        var cursor = new am4charts.XYCursor();
        chart.cursor = cursor;
        chart.logo.disabled = true;
    }); // end am4core.ready()
}


$("#startDateWater, #endDateWater").on("change", async function () {
    clearDateInputs();
    await lineChart1();
});

$("#sav_monthly_water").on("click", async function () {
    clearDateInputsWater();
    await lineChartMonthlyWater();
});

$("#sav_daily_water").on("click", async function () {
    clearDateInputsWater();
    await pieChart1();
});

$("#sav_yearly_water").on("click", async function () {
    clearDateInputsWater();
    await showClusteredBarChart1();
    //await barChartMonthlyWater1();
});
/* water consumption end */

/* power consumption start */
let powerChart;

// async function lineChart3() {
//     // Dispose of existing chart if it exists
//     if (powerChart) {
//         if (powerChart instanceof ApexCharts) {
//             console.log("Chart destroyed");
//         powerChart.destroy(); // Dispose the existing chart
//         } else if (powerChart instanceof AmCharts.AmChart) {
//             console.log("Chart destroyed");
//         powerChart.clear(); // Clear the existing AmCharts instance
//         } else if (powerChart instanceof am4charts.XYChart) {
//             console.log("Chart destroyed");
//             powerChart.dispose(); // Dispose the existing am4charts instance
//         }
//     }

//     am4core.ready(function () {
//         // Themes begin
//         am4core.useTheme(am4themes_animated);
//         // Themes end

//         // Create chart instance
//         powerChart = am4core.create("chartdiv2", am4charts.XYChart);

//         // Add data
//         powerChart.data = [{
//             "month": 'Jan',
//             "value": 90
//         }, {
//             "month": 'Feb',
//             "value": 102
//         }, {
//             "month": 'Mar',
//             "value": 65
//         }, {
//             "month": 'Apr',
//             "value": 62
//         }, {
//             "month": 'May',
//             "value": 55
//         }, {
//             "month": 'Jun',
//             "value": 45
//         }, {
//             "month": 'Jul',
//             "value": 65
//         }, {
//             "month": 'Aug',
//             "value": 60
//         }, {
//             "month": 'Sep',
//             "value": 70
//         }, {
//             "month": 'Oct',
//             "value": 80
//         }, {
//             "month": 'Nov',
//             "value": 75
//         }, {
//             "month": 'Dec',
//             "value": 80
//         }];

//         // Create axes
//         var categoryAxis = powerChart.xAxes.push(new am4charts.CategoryAxis());
//         categoryAxis.dataFields.category = "month";
//         categoryAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set x-axis labels color
//         categoryAxis.title.fill = am4core.color("#000000"); // Set x-axis title color
//         categoryAxis.renderer.labels.template.rotation = 270; // Set rotation
//         categoryAxis.renderer.labels.template.horizontalCenter = "right"; // Align to the right
//         categoryAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
//         categoryAxis.renderer.minGridDistance = 1; // Ensure all categories are displayed

//         var valueAxis = powerChart.yAxes.push(new am4charts.ValueAxis());
//         valueAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set y-axis labels color
//         valueAxis.title.fill = am4core.color("#000000"); // Set y-axis title color

//         // Create series
//         var lineSeries = powerChart.series.push(new am4charts.LineSeries());
//         lineSeries.dataFields.valueY = "value";
//         lineSeries.dataFields.categoryX = "month";
//         lineSeries.strokeWidth = 2;
//         lineSeries.stroke = am4core.color("#14C38E");

//         // Add circle bullet
//         var bullet = lineSeries.bullets.push(new am4charts.CircleBullet());
//         bullet.circle.radius = 3; // Size of the bullet point
//         bullet.circle.strokeWidth = 0.5;
//         bullet.circle.fill = am4core.color("#fc030b"); // Bullet fill color
//         bullet.circle.stroke = am4core.color("#14C38E"); // Bullet stroke color

//         // Set the bullet's color to match the line's color
//         bullet.adapter.add("fill", function (fill, target) {
//             return target.stroke;
//         });

//         // Configure cursor
//         var cursor = new am4charts.XYCursor();
//         lineSeries.tooltipText = "{categoryX}: [bold]{valueY}[/]";
//         lineSeries.tooltip.getFillFromObject = false; // Disable tooltip fill from series
//         lineSeries.tooltip.background.fill = am4core.color("#14C38E"); // Set tooltip background color
//         lineSeries.tooltip.label.fill = am4core.color("#ffffff"); // Set tooltip label color
//         lineSeries.tooltip.pointerOrientation = "horizontal"; // Set tooltip orientation

//         powerChart.cursor = cursor; // Assign cursor to chart
//         powerChart.logo.disabled=true;
//     }); // end am4core.ready()
// }
async function lineChart3() {
    // Dispose of existing chart if it exists
    if (powerChart) {
        if (powerChart instanceof ApexCharts) {
            console.log("Chart destroyed");
            powerChart.destroy(); // Dispose the existing chart
        } else if (powerChart instanceof AmCharts.AmChart) {
            console.log("Chart destroyed");
            powerChart.clear(); // Clear the existing AmCharts instance
        } else if (powerChart instanceof am4charts.XYChart) {
            console.log("Chart destroyed");
            powerChart.dispose(); // Dispose the existing am4charts instance
        }
    }

    am4core.ready(function () {
        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        // Create chart instance
        powerChart = am4core.create("chartdiv2", am4charts.XYChart);

        // Add data (use getRandomData for dynamic values and getLast12Months for x-axis categories)
        const months = getLast12Months(); // Get the last 12 months
        const randomData = getRandomData(); // Generate random data for each month

        // Prepare data array based on generated months and data
        powerChart.data = months.map((month, index) => ({
            "month": month, // Month name
            "value": randomData[index] // Corresponding random value
        }));

        // Create axes
        var categoryAxis = powerChart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.dataFields.category = "month";
        categoryAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set x-axis labels color
        categoryAxis.title.fill = am4core.color("#000000"); // Set x-axis title color
        categoryAxis.renderer.labels.template.rotation = 315; // Set rotation
        categoryAxis.renderer.labels.template.horizontalCenter = "right"; // Align to the right
        categoryAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
        categoryAxis.renderer.minGridDistance = 1; // Ensure all categories are displayed
        categoryAxis.renderer.labels.template.dy = -15;
        categoryAxis.renderer.labels.template.fontSize = 10;
        categoryAxis.renderer.labels.template.dx = 10;

        var valueAxis = powerChart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set y-axis labels color
        valueAxis.title.fill = am4core.color("#000000"); // Set y-axis title color

        // Create series
        var lineSeries = powerChart.series.push(new am4charts.LineSeries());
        lineSeries.dataFields.valueY = "value";
        lineSeries.dataFields.categoryX = "month";
        lineSeries.strokeWidth = 2;
        lineSeries.stroke = am4core.color("#14C38E");

        // Add circle bullet
        var bullet = lineSeries.bullets.push(new am4charts.CircleBullet());
        bullet.circle.radius = 3; // Size of the bullet point
        bullet.circle.strokeWidth = 0.5;
        bullet.circle.fill = am4core.color("#fc030b"); // Bullet fill color
        bullet.circle.stroke = am4core.color("#14C38E"); // Bullet stroke color

        // Set the bullet's color to match the line's color
        bullet.adapter.add("fill", function (fill, target) {
            return target.stroke;
        });

        // Configure cursor
        var cursor = new am4charts.XYCursor();
        lineSeries.tooltipText = "{categoryX}: [bold]{valueY}[/]";
        lineSeries.tooltip.getFillFromObject = false; // Disable tooltip fill from series
        lineSeries.tooltip.background.fill = am4core.color("#14C38E"); // Set tooltip background color
        lineSeries.tooltip.label.fill = am4core.color("#ffffff"); // Set tooltip label color
        lineSeries.tooltip.pointerOrientation = "horizontal"; // Set tooltip orientation

        powerChart.cursor = cursor; // Assign cursor to chart
        powerChart.logo.disabled = true;
    }); // end am4core.ready()
}


async function lineChart4() {
    // Dispose of existing chart if it exists
    if (powerChart) {
        if (powerChart instanceof ApexCharts) {
            console.log("Chart destroyed");
            powerChart.destroy(); // Dispose the existing chart
        } else if (powerChart instanceof AmCharts.AmChart) {
            console.log("Chart destroyed");
            powerChart.clear(); // Clear the existing AmCharts instance
        } else if (powerChart instanceof am4charts.XYChart) {
            console.log("Chart destroyed");
            powerChart.dispose(); // Dispose the existing am4charts instance
        }
    }

    am4core.ready(function () {
        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        // Create chart instance
        powerChart = am4core.create("chartdiv2", am4charts.XYChart);
        powerChart.legend = new am4charts.Legend();
        powerChart.legend.position = 'top';
        powerChart.legend.paddingBottom = 15;
        powerChart.legend.paddingTop = 0;
        powerChart.legend.labels.template.maxWidth = 95;
        powerChart.legend.labels.template.fill = am4core.color('#000000');
        powerChart.legend.labels.template.text = "Power Consumption";
        powerChart.legend.labels.template.fontSize = 12;


        // Add data for 24 hours with a 2-hour interval
        powerChart.data = [
            { "hour": "12 Am", "value": 10 },
            { "hour": "2 Am", "value": 20 },
            { "hour": "4 Am", "value": 15 },
            { "hour": "6 Am", "value": 20 },
            { "hour": "8 AM", "value": 30 },
            { "hour": "10 Am", "value": 25 },
            { "hour": "12 Pm", "value": 35 },
            { "hour": "2 Pm", "value": 50 },
            { "hour": "4 Pm", "value": 40 },
            { "hour": "6 Pm", "value": 35 },
            { "hour": "8 Pm", "value": 45 },
            { "hour": "10 Pm", "value": 50 },
        ];

        // Create axes
        var categoryAxis = powerChart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.dataFields.category = "hour";
        categoryAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set x-axis labels color
        categoryAxis.title.fill = am4core.color("#000000"); // Set x-axis title color
        categoryAxis.renderer.labels.template.rotation = 270; // Set rotation
        categoryAxis.renderer.labels.template.horizontalCenter = "right"; // Align to the right
        categoryAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
        categoryAxis.renderer.minGridDistance = 1; // Ensure all categories are displayed
        //         var categoryAxis = powerChart.xAxes.push(new am4charts.CategoryAxis());
        // categoryAxis.dataFields.category = "hour";
        // categoryAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set x-axis labels color
        // categoryAxis.title.fill = am4core.color("#000000"); // Set x-axis title color
        // categoryAxis.renderer.labels.template.horizontalCenter = "center"; // Align to center
        // categoryAxis.renderer.labels.template.verticalCenter = "middle";

        // // Custom label formatter to show AM/PM below time
        // categoryAxis.renderer.labels.template.adapter.add("textOutput", function(text) {
        //     // Split time and AM/PM
        //     let timeParts = text.split(" ");
        //     if (timeParts.length === 2) {
        //         return timeParts[0] + "\n" + timeParts[1]; // Show time above, AM/PM below
        //     }
        //     return text;
        // });

        //categoryAxis.renderer.minGridDistance = 1; // Ensure all categories are displayed


        var valueAxis = powerChart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set y-axis labels color
        valueAxis.title.fill = am4core.color("#000000"); // Set y-axis title color

        // Create series
        var lineSeries = powerChart.series.push(new am4charts.LineSeries());
        lineSeries.dataFields.valueY = "value";
        lineSeries.dataFields.categoryX = "hour";
        lineSeries.strokeWidth = 2;
        lineSeries.stroke = am4core.color("#FF6600");

        // Configure cursor

        lineSeries.tooltipText = "{categoryX}: [bold]{valueY}[/]"; // Tooltip format
        lineSeries.tooltip.getFillFromObject = false; // Disable tooltip fill from series
        lineSeries.tooltip.background.fill = am4core.color("#FF6600"); // Set tooltip background color
        lineSeries.tooltip.label.fill = am4core.color("#ffffff"); // Set tooltip label color
        //lineSeries.tooltip.pointerOrientation = "horizontal"; // Set tooltip orientation
        var cursor = new am4charts.XYCursor();
        powerChart.cursor = cursor; // Assign cursor to chart
        powerChart.logo.disabled = true; // Disable the logo

        //var cursor = new am4charts.XYCursor();
        // emissionChart.cursor = cursor;

        // // Disable Y-axis line (if needed)
        // emissionChart.cursor.lineY.disabled = false;

        // // Disable the Y-axis tooltip box
        // yAxis.cursorTooltipEnabled = false;
        // emissionChart.logo.disabled = true;

    }); // end am4core.ready()
}

// Initial call to lineChart3
lineChart4();


async function barChart() {
    var startDateValue = $("#startDatePower").val();
    var endDateValue = $("#endDatePower").val();

    if (startDateValue && endDateValue) {
        var startDate = new Date(startDateValue);
        var endDate = new Date(endDateValue);

        if (!await validateDateRange(startDate, endDate)) {
            return; // Exit if validation fails
        }

        var chartData = generateChartData(startDate, endDate);

        function generateChartData(startDate, endDate) {
            var chartData = [];
            var visits = 1200;

            var currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

                chartData.push({
                    date: new Date(currentDate),
                    power: visits
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
            return chartData;
        }

        if (chartData.length === 0) {
            alert('No data to display for the selected range');
            return;
        }

        if (powerChart) {
            if (powerChart instanceof ApexCharts) {
                console.log("Chart destroyed");
                powerChart.destroy(); // Dispose the existing chart
            } else if (powerChart instanceof AmCharts.AmChart) {
                console.log("Chart destroyed");
                powerChart.clear(); // Clear the existing AmCharts instance
            } else if (powerChart instanceof am4charts.XYChart) {
                console.log("Chart destroyed");
                powerChart.dispose(); // Dispose the existing am4charts instance
            }
        }

        powerChart = AmCharts.makeChart("chartdiv2", {
            "type": "serial",
            "theme": "white",
            "color": "#000",
            "legend": {
                "useGraphSettings": true,
                "color": "#000",
                "position": "top",
                "align": "center",
                "marginBottom": 10,
                "valueText": ""
            },
            "dataProvider": chartData,
            "synchronizeGrid": true,
            "valueAxes": [{
                "id": "v1",
                "axisColor": "#000",
                "axisThickness": 0.5,
                "axisAlpha": 1,
                "position": "left"
            }],
            "graphs": [
                {
                    "valueAxis": "v1",
                    "lineColor": "#3AA6B9",
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "Power Consumption",
                    "valueField": "power",
                    "fillAlphas": 1,
                    "type": "column",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",  // Text color
                        "fillColor": "#3AA6B9",  // Background color (same as line color)
                        "borderColor": "#3AA6B9"
                    }
                }],
            "chartScrollbar": {
                "offset": 20
            },
            "chartCursor": {
                "cursorPosition": "mouse",
                "cursorColor": "#000000",
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#000",
                "minorGridEnabled": true
            },
            "export": {
                "enabled": true // Disable export menu
            }
        });

        powerChart.addListener("dataUpdated", zoomChart);
        zoomChart();

        function zoomChart() {
            powerChart.zoomToIndexes(powerChart.dataProvider.length - 70, powerChart.dataProvider.length - 1);
        }
    }
}

async function lineChartMonthlyPower() {
    // Get the current date
    const today = new Date();
    const currentMonth = today.getMonth();

    // Set startDate and endDate to the previous month
    const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);  // First day of the previous month
    const endDate = new Date(today.getFullYear(), currentMonth, 0);  // Last day of the previous month

    // Generate chart data for the previous month
    var chartData = generateChartData(startDate, endDate);

    function generateChartData(startDate, endDate) {
        var chartData = [];
        var visits = 1200;

        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

            chartData.push({
                date: new Date(currentDate),
                scope1: visits
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
        return chartData;
    }

    // Alert if no data exists
    if (chartData.length === 0) {
        alert('No data to display for the selected range');
        return;
    }

    // Destroy existing chart if it exists
    if (powerChart) {
        if (powerChart instanceof ApexCharts) {
            console.log("Pie chart destroyed");
            powerChart.destroy(); // Dispose the existing chart
        } else if (powerChart instanceof AmCharts.AmChart) {
            console.log("Pie chart destroyed");
            powerChart.clear(); // Clear the existing AmCharts instance
        } else if (powerChart instanceof am4charts.XYChart) {
            console.log("Pie chart destroyed");
            powerChart.dispose(); // Dispose the existing am4charts instance
        }
    }

    // Create the line chart with the generated data for the previous month
    powerChart = AmCharts.makeChart("chartdiv2", {
        "type": "serial",
        "theme": "white",
        "color": "#000",
        "legend": {
            "useGraphSettings": true,
            "color": "#000",
            "position": "top",
            "align": "center",
            "marginBottom": 10,
            "valueText": ""
        },
        "dataProvider": chartData,
        "synchronizeGrid": true,
        "valueAxes": [{
            "id": "v1",
            "axisColor": "#000",
            "axisThickness": 0.5,
            "axisAlpha": 1,
            "position": "left"
        }],
        "graphs": [{
            "valueAxis": "v1",
            "lineColor": "#3AA6B9",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "Power Consumption",
            "valueField": "scope1",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#3AA6B9",  // Background color (same as line color)
                "borderColor": "#3AA6B9"
            }
        }],
        "chartScrollbar": {
            "offset": 20
        },
        "chartCursor": {
            "cursorPosition": "mouse",
            "cursorColor": "#000000",
        },
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "axisColor": "#000",
            "minorGridEnabled": true
        },
        "export": {
            "enabled": true // Disable export menu
        }
    });
    powerChart.addListener("dataUpdated", zoomChart);
    zoomChart();

    function zoomChart() {
        powerChart.zoomToIndexes(powerChart.dataProvider.length - 70, powerChart.dataProvider.length - 1);
    }

}

$("#startDatePower, #endDatePower").on("change", async function () {
    await barChart();
});

$("#sav_monthly_power").on("click", async function () {
    clearDateInputsPower();
    await lineChartMonthlyPower();
});

$("#sav_daily_power").on("click", async function () {
    clearDateInputsPower();
    await lineChart4();
});

$("#sav_yearly_power").on("click", async function () {
    clearDateInputsWater();
    await lineChart3();
});

/* power consumption end */

/* occupancy efficiency start */
var occupancyChart = null;
function removeChart(newChartFunction) {
    if (occupancyChart) {
        // var charts=[];
        // for (var i = 0; i < charts.length; i++) {
        //     if (charts[i] instanceof ApexCharts) {
        //         console.log("Apex chart destroyed");
        //         charts[i].destroy(); // Dispose the existing chart
        //     }
        //     else if(charts[i] instanceof AmCharts.AmChart){
        //         occupancyChart.clear();
        //     }
        //     else if(charts[i] instanceof am4charts.XYChart){
        //         occupancyChart.dispose();
        //     }
        // }
        if (occupancyChart instanceof ApexCharts) {
            var charts = [];
            console.log("Pie chart destroyed");
            for (var i = 0; i < charts.length; i++) {
                if (charts[i] instanceof ApexCharts) {
                    console.log("Apex chart destroyed");
                    charts[i].destroy(); // Dispose the existing chart
                }
            }
            occupancyChart.destroy(); // Dispose the existing chart
        } else if (occupancyChart instanceof AmCharts.AmChart) {
            console.log("Pie chart destroyed");
            occupancyChart.clear(); // Clear the existing AmCharts instance
        } else if (occupancyChart instanceof am4charts.XYChart) {
            console.log("Pie chart destroyed");
            occupancyChart.dispose(); // Dispose the existing am4charts instance
        }
    }
    // Call the new chart function
    newChartFunction();
}

// Function to create and render a donut chart
async function donutChart() {
    var options = {
        series: [90],
        chart: {
            height: 280,
            width: "100%",
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    margin: 15,
                    size: '90%',
                },
                dataLabels: {
                    name: {
                        show: true,
                        color: '#000',
                    },
                    value: {
                        show: true,
                        color: '#000',
                        offsetY: 50,
                        fontSize: '50px',
                    },
                },
                track: {
                    background: '#494949',
                    strokeWidth: '10%',
                    margin: 0,
                    dropShadow: {
                        enabled: true,
                        top: -3,
                        left: 0,
                        blur: 4,
                        opacity: 0.35,
                    },
                },
                offsetY: 30,
            },
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'vertical',
                gradientToColors: ['#e33b29', '#ff00e0', '#0000ff'],
                stops: [0, 2, 70, 100],
                colorStops: [
                    {
                        offset: 0,
                        color: '#e33b29',
                        opacity: 1 // Blue at the start
                    },
                    {
                        offset: 2,
                        color: '#e33b29',
                        opacity: 1 // Blue in the middle
                    },
                    {
                        offset: 70,
                        color: '#ff00e0',
                        opacity: 1 // Pink at the end
                    },
                    {
                        offset: 100,
                        color: '#0000ff',
                        opacity: 1 // Pink at the end
                    }
                ]
            },
        },
        stroke: {
            lineCap: 'round',
        },
        labels: ["Occupancy Efficiency"],
    };

    occupancyChart = new ApexCharts(document.querySelector("#chartdiv3"), options);
    occupancyChart.render();
    //clearDateInputsOccupancy();

}
// async function occupacyBarChart1(){
//     var options = {
//         series: [{
//             name: 'Savings',
//             data: [2.3, 3.1], // Data for Floor 1 and Floor 2
//             color: "#1cc88999",
//             showInLegend: false,
//         }],
//         chart: {
//             height: "100%",
//             type: 'bar',
//             toolbar: {
//                 show: false,
//             },
//             background: 'rgba(0,0,0,0)',
//         },
//         plotOptions: {
//             bar: {
//                 borderRadius: 10,
//                 columnWidth: '60%', // Adjust the width of bars to make them look centered
//                 dataLabels: {
//                     position: 'top', // top, center, bottom
//                 },
//             },
//         },
//         dataLabels: {
//             enabled: true,
//             formatter: function (val) {
//                 return val;
//             },
//             offsetY: -20,
//             style: {
//                 fontSize: '12px',
//                 colors: ["#000000"],
//             },
//         },
//         xaxis: {
//             categories: ["Floor 1", "Floor 2"], // Only two floors displayed
//             position: 'top',
//             axisBorder: {
//                 show: false,
//             },
//             axisTicks: {
//                 show: false,
//             },
//             labels: {
//                 style: {
//                     colors: "#000",
//                     fontSize: '12px',
//                     fontWeight: 400,
//                     cssClass: 'apexcharts-xaxis-label',
//                 },
//             },
//             tickPlacement: 'on', 
//         },
//         yaxis: {
//             axisBorder: {
//                 show: false,
//             },
//             axisTicks: {
//                 show: false,
//             },
//             labels: {
//                 show: false,
//                 formatter: function (val) {
//                     return val;
//                 },
//             },
//         },
//         grid: {
//             show: true,
//             borderColor: '#434040',
//         },
//         title: {
//             // Optionally, you can add a title
//             floating: true,
//             offsetY: 330,
//             align: 'center',
//             style: {
//                 color: '#444',
//             },
//         },
//     };

//     occupancyChart = new ApexCharts(document.querySelector("#chartdiv9"), options);
//     occupancyChart.render();
// }
removeChart(donutChart);
async function occupacyBarChart1() {
    var options = {
        series: [{
            name: 'Occupancy Efficiency',
            data: [2.3, 2.7] // Data for HVAC (Floor 1, Floor 2)
        },
        {

        }],
        chart: {
            height: 280,
            type: 'bar',
            toolbar: {
                show: false // Disable the toolbar
            },
            offsetY: 30
        },
        plotOptions: {
            bar: {
                borderRadius: 10,
                dataLabels: {
                    position: 'top', // Show data labels on top
                },
                columnWidth: '40%', // Set column width for a simple bar chart
                endingShape: 'rounded' // Rounded edges for a smooth look
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val; // Show percentage symbol next to data
            },
            offsetY: -30,
            style: {
                fontSize: '12px',
                colors: ["#E11D74"]
            }
        },
        xaxis: {
            categories: ["Floor 1", "Floor 2"], // X-axis now has Floor 1 and Floor 2
            position: 'bottom',
            axisBorder: {
                show: false // Hide bottom axis border
            },
            axisTicks: {
                show: false // Hide ticks for a cleaner look
            },
            crosshairs: {
                fill: {
                    type: 'gradient',
                    gradient: {
                        colorFrom: '#E11D74',
                        colorTo: '#E11D74',
                        stops: [0, 100],
                        opacityFrom: 0.4,
                        opacityTo: 0.5,
                    }
                }
            },
            tooltip: {
                enabled: true, // Show tooltips on x-axis hover
            }
        },
        yaxis: {
            axisBorder: {
                show: false // Hide y-axis border
            },
            axisTicks: {
                show: false, // Hide ticks on y-axis
            },
            labels: {
                show: false, // Hide y-axis labels for a cleaner look
            }
        },
        legend: {
            show: true,
            position: 'top', // Place the legend on top
            horizontalAlign: 'center', // Center align the legend
            offsetY: 20
        },
        colors: ['#E11D74'], // Custom color for HVAC
        grid: {
            padding: {
                left: 10,
                right: 10
            }
        },
    };
    // Select the div where the chart should render
    occupancyChart = new ApexCharts(document.querySelector("#chartdiv9"), options);
    await occupancyChart.render();
}



$('#floor_sav_btn').on("click", async function () {
    $(".sav_g_chart").hide();
    $(".sav_b_chart").show();
    $("#build_sav_btn").show();
    $(".occupacyBtn").hide();
    $(this).hide();
    occupacyBarChart1();
});
$('#build_sav_btn').on("click", async function () {
    $(".sav_g_chart").show();
    $(".sav_b_chart").hide();
    $('#floor_sav_btn').show();
    $(".occupacyBtn").show();
    $(this).hide();
});
async function occupacyLine() {
    var startDateValue = $("#startDateOccupancy").val();
    var endDateValue = $("#endDateOccupancy").val();

    if (startDateValue && endDateValue) {
        var startDate = new Date(startDateValue);
        var endDate = new Date(endDateValue);

        if (!await validateDateRange(startDate, endDate)) {
            return; // Exit if validation fails
        }

        var chartData = generateChartData(startDate, endDate);

        function generateChartData(startDate, endDate) {
            var chartData = [];
            var visits = 1200; // Initial value for occupancy efficiency
            var hits = 1220;

            var currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

                chartData.push({
                    date: new Date(currentDate),
                    occupancyefficiency: visits,
                    occupancyefficiency1: hits
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
            return chartData;
        }

        if (chartData.length === 0) {
            alert('No data to display for the selected range');
            return;
        }
        // if (occupancyChart) {
        //     if (occupancyChart instanceof ApexCharts) {
        //         console.log("Pie chart destroyed");
        //         occupancyChart.destroy(); // Dispose the existing chart
        //     } else if (occupancyChart instanceof AmCharts.AmChart) {
        //         console.log("Pie chart destroyed");
        //         occupancyChart.clear(); // Clear the existing AmCharts instance
        //     } else if (occupancyChart instanceof am4charts.XYChart) {
        //         console.log("Pie chart destroyed");
        //         occupancyChart.dispose(); // Dispose the existing am4charts instance
        //     }
        // }

        occupancyChart = AmCharts.makeChart('chartdiv3', {
            "type": "serial",
            "theme": "white",
            "color": "#000",
            "legend": {
                "useGraphSettings": true,
                "color": "#000",
                "position": "top",
                "align": "center",
                "marginBottom": 10,
                "valueText": ""
            },
            "dataProvider": chartData,
            "synchronizeGrid": true,
            "valueAxes": [{
                "id": "v1",
                "axisColor": "#000",
                "axisThickness": 1,
                "axisAlpha": 1,
                "position": "left",
            }],
            "graphs": [{
                "valueAxis": "v1",
                "lineColor": "#E11D74",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Occupancy Efficiency",
                "valueField": "occupancyefficiency1",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#E11D74",  // Background color (same as line color)
                    "borderColor": "#E11D74"
                }
            }],
            "chartScrollbar": {
                "selectedGraphLineColor": "#888",
                "position": "bottom",
                "offset": 20,
            },
            "chartCursor": {
                "cursorPosition": "mouse",
                "cursorColor": "#000000",
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#000",
                "minorGridEnabled": true,
            },
            "export": {
                "enabled": true,
                "position": "bottom-right",
            },
            "zoomControl": {
                "zoomControlEnabled": false,
            },
        });

        occupancyChart.addListener("dataUpdated", zoomChart);
        zoomChart();

        function zoomChart() {
            occupancyChart.zoomToIndexes(occupancyChart.dataProvider.length - 70, occupancyChart.dataProvider.length - 1);
        }
    }
}
// async function occupacyBar() {
//    // Destroy the existing chart if it exists
//     // if (currentChart1) {
//     //     if (currentChart1 instanceof ApexCharts) {
//     //         console.log("Bar chart destroyed");
//     //         currentChart1.destroy(); // Dispose the existing chart
//     //     } else if (currentChart1 instanceof AmCharts.AmChart) {
//     //         console.log("Bar chart destroyed");
//     //         currentChart1.clear(); // Clear the existing AmCharts instance
//     //     } else if (currentChart1 instanceof am4charts.XYChart) {
//     //         console.log("Bar chart destroyed");
//     //         currentChart1.dispose(); // Dispose the existing am4charts instance
//     //     }
//     // }

//     // Define the data for the two floors
//     var options = {
//         series: [
//             {
//                 name: 'Occupancy Efficiency', // Series name for Floor 1
//                 data: [44, 55, 57, 56, 61, 58, 63, 60, 66, 61, 50, 55]
//             },
//             // {
//             //     name: 'Floor 2', // Series name for Floor 2
//             //     data: [35, 41, 36, 26, 45, 48, 52, 53, 41, 40, 45, 50] // Sample data for Floor 2
//             // }
//         ],
//         chart: {
//             type: 'bar', // Keep bar type for a vertical column chart
//             height: '100%',
//             toolbar: {
//                 show: false,
//             },
//         },
//         plotOptions: {
//             bar: {
//                 horizontal: false, // Set to false for vertical bars
//                 columnWidth: '55%',
//                 endingShape: 'rounded',
//             }
//         },
//         colors: ["#E11D74"], // Two different colors for each floor , "#4A90E2"
//         dataLabels: {
//             enabled: false,
//         },
//         stroke: {
//             show: true,
//             width: 0,
//             colors: ['transparent'],
//         },
//         xaxis: {
//             categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
//             labels: {
//                 style: {
//                     colors: '#000000',
//                 },
//             },
//         },
//         grid: {
//             show: false,  // Disable background grid lines
//         },
//         tooltip: {
//             y: {
//                 formatter: function(val) {
//                     return val; // Customize tooltip value
//                 },
//             },
//         },
//         legend: {
//             position: 'top', // Position of the legend
//             horizontalAlign: 'center', // Center align the legend
//             labels: {
//                 colors: ['#000000'], // Legend label color
//             }
//         }
//     };

//     console.log("Creating bar chart...");
//     occupancyChart = new ApexCharts(document.querySelector("#chartdiv3"), options);
//     occupancyChart.render();
// }
async function occupacyBar() {
    // Destroy the existing chart if it exists
    // if (currentChart1) {
    //     if (currentChart1 instanceof ApexCharts) {
    //         console.log("Bar chart destroyed");
    //         currentChart1.destroy(); // Dispose the existing chart
    //     } else if (currentChart1 instanceof AmCharts.AmChart) {
    //         console.log("Bar chart destroyed");
    //         currentChart1.clear(); // Clear the existing AmCharts instance
    //     } else if (currentChart1 instanceof am4charts.XYChart) {
    //         console.log("Bar chart destroyed");
    //         currentChart1.dispose(); // Dispose the existing am4charts instance
    //     }
    // }

    // Get the last 12 months and random data
    const months = getLast12Months(); // Get the last 12 months
    const randomData = getRandomData(); // Generate random data for each month

    // Define the data for the two floors
    var options = {
        series: [
            {
                name: 'Occupancy Efficiency', // Series name for Floor 1
                data: randomData // Use random data generated
            },
            // {
            //     name: 'Floor 2', // Series name for Floor 2
            //     data: [35, 41, 36, 26, 45, 48, 52, 53, 41, 40, 45, 50] // Sample data for Floor 2
            // }
        ],
        chart: {
            type: 'bar', // Keep bar type for a vertical column chart
            height: '100%',
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                horizontal: false, // Set to false for vertical bars
                columnWidth: '55%',
                endingShape: 'rounded',
            }
        },
        colors: ["#E11D74"], // Two different colors for each floor , "#4A90E2"
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 0,
            colors: ['transparent'],
        },
        xaxis: {
            categories: months, // Set x-axis categories to the last 12 months
            labels: {
                style: {
                    colors: '#000000',
                },
                rotate: 315, // Rotate x-axis labels by 315 degrees
            },
        },
        grid: {
            show: false,  // Disable background grid lines
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val; // Customize tooltip value
                },
            },
        },
        legend: {
            position: 'top', // Position of the legend
            horizontalAlign: 'center', // Center align the legend
            labels: {
                colors: ['#000000'], // Legend label color
            }
        }
    };

    console.log("Creating bar chart...");
    occupancyChart = new ApexCharts(document.querySelector("#chartdiv3"), options);
    occupancyChart.render();
}

async function lineChartMonthlyOccupancy() {
    // Get the current date
    const today = new Date();
    const currentMonth = today.getMonth();

    // Set startDate and endDate to the previous month
    const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);  // First day of the previous month
    const endDate = new Date(today.getFullYear(), currentMonth, 0);  // Last day of the previous month

    // Generate chart data for the previous month
    var chartData = generateChartData(startDate, endDate);

    function generateChartData(startDate, endDate) {
        var chartData = [];
        var visits = 1200;
        var hits = 1220;
        var views = 1240;

        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            views += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

            chartData.push({
                date: new Date(currentDate),
                scope1: visits,
                scope2: hits,
                scope3: views
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
        return chartData;
    }

    // Alert if no data exists
    if (chartData.length === 0) {
        alert('No data to display for the selected range');
        return;
    }

    // Create the line chart with the generated data for the previous month
    var chart = AmCharts.makeChart("chartdiv3", {
        "type": "serial",
        "theme": "white",
        "color": "#000",
        "legend": {
            "useGraphSettings": true,
            "color": "#000",
            "position": "top",
            "align": "center",
            "marginBottom": 10,
            "valueText": ""
        },
        "dataProvider": chartData,
        "synchronizeGrid": true,
        "valueAxes": [{
            "id": "v1",
            "axisColor": "#000",
            "axisThickness": 0.5,
            "axisAlpha": 1,
            "position": "left"
        }],
        "graphs": [{
            "valueAxis": "v1",
            "lineColor": "#E11D74",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "Occupancy Efficiency",
            "valueField": "scope1",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#E11D74",
                "borderColor": "#E11D74"
            }
        }],
        "chartScrollbar": {
            "offset": 20
        },
        "chartCursor": {
            "cursorPosition": "mouse",
            "cursorColor": "#000000",
        },
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "axisColor": "#000",
            "minorGridEnabled": true
        },
        "export": {
            "enabled": true // Disable export menu
        }
    });

    chart.addListener("dataUpdated", zoomChart);
    zoomChart();

    function zoomChart() {
        chart.zoomToIndexes(chart.dataProvider.length - 70, chart.dataProvider.length - 1);
    }
}
$("#startDateOccupancy, #endDateOccupancy").on("change", async function () {
    await removeChart(occupacyLine);
});
$("#sav_daily_occupancy").on("click", async function () {
    clearDateInputsOccupancy();
    await removeChart(donutChart);
});
$("#sav_monthly_occupancy").on("click", async function () {
    clearDateInputsOccupancy();
    await removeChart(lineChartMonthlyOccupancy);
});
$("#sav_yearly_occupancy").on("click", async function () {
    clearDateInputsOccupancy();
    await removeChart(occupacyBar);
});
/* occupancy efficiency end */

/* Indoor Air Quality start */
var aqiCharts; // Single chart instance

async function replaceIndoorChart(newChartFunction) {
    // Destroy the existing chart if it exists
    if (aqiCharts) {
        if (aqiCharts instanceof ApexCharts) {
            var charts = [];
            console.log("Pie chart destroyed");
            for (var i = 0; i < charts.length; i++) {
                if (charts[i] instanceof ApexCharts) {
                    console.log("Apex chart destroyed");
                    charts[i].destroy(); // Dispose the existing chart
                }
            }
            console.log("Pie chart destroyed");
            aqiCharts.destroy(); // Dispose the existing chart
        } else if (aqiCharts instanceof AmCharts.AmChart) {
            console.log("Pie chart destroyed");
            aqiCharts.clear(); // Clear the existing AmCharts instance
        } else if (aqiCharts instanceof am4charts.XYChart) {
            console.log("Pie chart destroyed");
            aqiCharts.dispose(); // Dispose the existing am4charts instance
        }
    }
    newChartFunction();
}

async function createPieChart() {

    const style = document.createElement('style');
    style.innerHTML = `
        #chartdiv4 .apexcharts-text {
            fill: #000000; /* Change this to your desired color */
             /* Corrected property name font-size: 20px; */
        font-weight: bold; /* Corrected property name */
        }
    `;
    document.head.appendChild(style);
    // Pie chart options
    var options = {
        series: [76],
        chart: {
            height: 290,
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                offsetY: 30,
                startAngle: 0,
                endAngle: 360,
                hollow: {
                    margin: 5,
                    size: '65%',
                    background: 'transparent',
                },
                dataLabels: {
                    name: { show: true },
                    value: { show: true },
                    total: {
                        show: true,
                        label: 'AQI',
                        fontSize: '30px',
                        fontWeight: 'bold',
                        color: '#000000',
                        formatter: function (w) {
                            const totalValue = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            return totalValue + " Good";
                        }
                    }
                },
                track: {
                    background: '#2F5AD0',
                }
            }
        },
        colors: ["#FF6600"],
        labels: ['AQI'],
        legend: {
            show: true,
            floating: true,
            fontSize: '16px',
            position: 'top',
            horizontalAlign: 'center',
            offsetY: 1,
            labels: { useSeriesColors: true },
            markers: { size: 0 },
            formatter: function (seriesName, opts) {
                return seriesName;
            },
            itemMargin: { vertical: 3 }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: { show: false }
            }
        }]
    };

    // Create a new pie chart
    aqiCharts = new ApexCharts(document.querySelector("#chartdiv4"), options);
    aqiCharts.render();
    // clearDateInputsAir()
}
replaceIndoorChart(createPieChart);

// Completion Rate Chart
// async function aqiDonut1() {
//     var optionsCompletion = {
//         chart: {
//             type: 'donut',
//             height: "300px"
//         },
//         series: [68], // Completion rate
//         labels: ['Completion rate'],
//         colors: ['#00a65a', '#ddd'],
//         plotOptions: {
//             pie: {
//                 donut: {
//                     size: '75%',
//                     track: {
//                         show: true,
//                         background: '#f2f2f2', // Background color of the track
//                         strokeWidth: '100%',    // Set the width of the track
//                         opacity: 1,             // Opacity of the track
//                         margin: 10              // Margin between track and the donut
//                     }
//                 }
//             }
//         },
//         dataLabels: {
//             enabled: true,
//             formatter: function (val) {
//                 return Math.round(val) + "%";
//             },
//             style: {
//                 fontSize: '24px',
//                 fontWeight: 'bold'
//             }
//         },
//         annotations: {
//             position: 'front',
//             texts: [{
//                 text: '100%',           // Text to display at center
//                 x: '50%',               // Horizontal position
//                 y: '50%',               // Vertical position
//                 fontSize: '24px',        // Text font size
//                 fontWeight: 'bold',      // Text font weight
//                 fill: {
//                     color: '#000'        // Text color
//                 }
//             }]
//         },
//         legend: {
//             position: 'top',      // Position the legend at the top
//             horizontalAlign: 'center', // Align it to the center
//         }
//     };
//     aqiCharts = new ApexCharts(document.querySelector("#completionRateChart"), optionsCompletion);
//     await aqiCharts.render();
// }

// async function aqiDonut2() {
//     var optionsBounce = {
//         chart: {
//             type: 'donut',
//             height: "300px"
//         },
//         series: [68], // Bounce rate
//         labels: ['Bounce rate'],
//         colors: ['#dd4b39', '#ddd'],
//         plotOptions: {
//             pie: {
//                 donut: {
//                     size: '75%',
//                     track: {
//                         show: true,
//                         background: '#f2f2f2', // Background color of the track
//                         strokeWidth: '100%',    // Set the width of the track
//                         opacity: 1,             // Opacity of the track
//                         margin: 10              // Margin between track and the donut
//                     }
//                 }
//             }
//         },
//         dataLabels: {
//             enabled: true,
//             formatter: function (val) {
//                 return Math.round(val) + "%";
//             },
//             style: {
//                 fontSize: '24px',
//                 fontWeight: 'bold'
//             }
//         },
//         annotations: {
//             position: 'front',
//             texts: [{
//                 text: '100%',           // Text to display at center
//                 x: '50%',               // Horizontal position
//                 y: '50%',               // Vertical position
//                 fontSize: '24px',        // Text font size
//                 fontWeight: 'bold',      // Text font weight
//                 fill: {
//                     color: '#000'        // Text color
//                 }
//             }]
//         },
//         legend: {
//             position: 'top',      // Position the legend at the top
//             horizontalAlign: 'center', // Align it to the center
//         }
//     };

//     aqiCharts = new ApexCharts(document.querySelector("#bounceRateChart"), optionsBounce);
//     await aqiCharts.render();
// }
var aqiCharts1;
var aqiCharts2;
async function aqiDonut1() {
    if (aqiCharts1 instanceof ApexCharts) {
        console.log("Destroying existing aqiCharts1");
        aqiCharts1.destroy(); // Dispose the existing chart if it exists
    }
    if (aqiCharts2 instanceof ApexCharts) {
        console.log("Destroying existing aqiCharts2");
        aqiCharts2.destroy(); // Dispose the existing chart if it exists
    }
    var options = {
        series: [70],
        chart: {
            height: 225, // Adjusted height
            width: "100%",
            type: 'radialBar',
            offsetY: 40
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    margin: 15,
                    size: '70%',
                },
                dataLabels: {
                    name: {
                        show: false,
                        color: '#000',
                    },
                    value: {
                        show: true,
                        color: '#000',
                        offsetY: 10,
                        fontSize: '20px',
                        formatter: function (val) {
                            return parseInt(val); // Remove the % symbol by returning only the value
                        }
                    },
                },
                track: {
                    background: '#494949',
                    strokeWidth: '100%',
                    margin: 0
                },
                offsetY: 30,
            },
        },
        fill: {
            type: 'solid', // Changed to solid
            colors: ['#FCE22A'], // Solid red color
        },
        colors: ["#FCE22A"],
        labels: ['Floor 1'],
        legend: {
            show: true,
            floating: true,
            fontSize: '16px',
            position: 'top',
            horizontalAlign: 'center',
            offsetY: 40,
            labels: { useSeriesColors: true },
            markers: { size: 0 },
            formatter: function (seriesName, opts) {
                return seriesName;
            },
            itemMargin: { vertical: 3 }
        },
    };
   aqiCharts1 = new ApexCharts(document.querySelector("#completionRateChart"), options);
    await aqiCharts1.render();

    var options1 = {
        series: [80],
        chart: {
            height: 225, // Adjusted height
            width: "100%",
            type: 'radialBar',
            offsetY: 40
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    margin: 15,
                    size: '70%',
                },
                dataLabels: {
                    name: {
                        show: false,
                        color: '#000',
                    },
                    value: {
                        show: true,
                        color: '#000',
                        offsetY: 10,
                        fontSize: '20px',
                        formatter: function (val) {
                            return parseInt(val); // Remove the % symbol by returning only the value
                        }
                    },
                },
                track: {
                    background: '#494949',
                    strokeWidth: '100%',
                    margin: 0
                },
                offsetY: 30,
            },
        },
        fill: {
            type: 'solid', // Changed to solid
            colors: ['#77E4C8'], // Solid red color
        },
        colors: ["#77E4C8"],
        labels: ['Floor 1'],
        legend: {
            show: true,
            floating: true,
            fontSize: '16px',
            position: 'top',
            horizontalAlign: 'center',
            offsetY: 40,
            labels: { useSeriesColors: true },
            markers: { size: 0 },
            formatter: function (seriesName, opts) {
                return seriesName;
            },
            itemMargin: { vertical: 3 }
        },
    };
    aqiCharts2 = new ApexCharts(document.querySelector("#bounceRateChart"), options1);
    await aqiCharts2.render();
}

// async function aqiDonut2() {
//     var options = {
//         series: [80],
//         chart: {
//             height: 225, // Adjusted height
//             width: "100%",
//             type: 'radialBar',
//             offsetY: 40
//         },
//         plotOptions: {
//             radialBar: {
//                 hollow: {
//                     margin: 15,
//                     size: '70%',
//                 },
//                 dataLabels: {
//                     name: {
//                         show: false,
//                         color: '#000',
//                     },
//                     value: {
//                         show: true,
//                         color: '#000',
//                         offsetY: 10,
//                         fontSize: '20px',
//                         formatter: function (val) {
//                             return parseInt(val); // Remove the % symbol by returning only the value
//                         }
//                     },
//                 },
//                 track: {
//                     background: '#494949',
//                     strokeWidth: '100%',
//                     margin: 0
//                 },
//                 offsetY: 30,
//             },
//         },
//         fill: {
//             type: 'solid', // Changed to solid
//             colors: ['#77E4C8'], // Solid red color
//         },
//         colors: ["#77E4C8"],
//         labels: ['Floor 1'],
//         legend: {
//             show: true,
//             floating: true,
//             fontSize: '16px',
//             position: 'top',
//             horizontalAlign: 'center',
//             offsetY: 40,
//             labels: { useSeriesColors: true },
//             markers: { size: 0 },
//             formatter: function (seriesName, opts) {
//                 return seriesName;
//             },
//             itemMargin: { vertical: 3 }
//         },
//     };
//     var aqiCharts2 = new ApexCharts(document.querySelector("#bounceRateChart"), options);
//     await aqiCharts2.render();
// }

$('#aqiFloor1').on("click", async function () {
    console.log("aqiFloor1 clicked");
    $(".aqiSeparate").show();
    $(".aqiAvg").hide();
    $("#aqiFloor2").show();
    $(".aqiBtn").hide();
    $(this).hide();
    await aqiDonut1();
    // await aqiDonut2();
});
$('#aqiFloor2').on("click", async function () {
    console.log("aqiFloor2 clicked");
    $(".aqiSeparate").hide();
    $(".aqiAvg").show();
    $("#aqiFloor1").show();
    $(".aqiBtn").show();
    $(this).hide();
});

async function createBarChart() {
    // Generate data for the bar chart
    const startDateValue = document.getElementById("startDateIAQ").value;
    const endDateValue = document.getElementById("endDateIAQ").value;

    if (startDateValue && endDateValue) {
        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);

        // Ensure the start date is not later than the end date
        if (startDate > endDate) {
            alert('Start Date cannot be after End Date');
            return;
        }

        var chartData = generateChartData(startDate, endDate);

        if (chartData.length === 0) {
            alert('No data to display for the selected range');
            return;
        }
        function generateChartData(startDate, endDate) {
            var chartData = [];
            var visits = 10;
            var currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                chartData.push({
                    date: new Date(currentDate),
                    domesticwater: visits,
                    flushingwater: visits + Math.round(Math.random() * 30)
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return chartData;
        }
        aqiCharts = AmCharts.makeChart('chartdiv4', {
            "type": "serial",
            "theme": "white",
            "color": "#000",
            "legend": {
                "useGraphSettings": true,
                "color": "#000",
                "position": "top",
                "align": "center",
                "marginBottom": 10,
                "valueText": ""
            },
            "dataProvider": chartData,
            "synchronizeGrid": true,
            "valueAxes": [{
                "id": "v1",
                "axisColor": "#000",
                "axisThickness": 1,
                "axisAlpha": 1,
                "position": "left"
            }],
            "graphs": [{
                "valueAxis": "v1",
                "lineColor": "#FF6600",
                "fillColors": "#FF6600",
                "title": "Indoor Air Quality",
                "valueField": "domesticwater",
                "type": "column",
                "fillAlphas": 1,
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#FF6600",  // Background color (same as line color)
                    "borderColor": "#FF6600"
                }
            }],
            "chartScrollbar": {
                "selectedGraphLineColor": "#888",
                "position": "bottom",
                "offset": 20
            },
            "chartCursor": {
                "cursorPosition": "mouse",
                "cursorColor": "#000000",
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#000",
                "minorGridEnabled": true
            },
            "export": {
                "enabled": true,
                "position": "bottom-right"
            },
            "zoomControl": {
                "zoomControlEnabled": false
            }
        });

        aqiCharts.addListener("dataUpdated", zoomChart);
        zoomChart();

        function zoomChart() {
            aqiCharts.zoomToIndexes(aqiCharts.dataProvider.length - 70, aqiCharts.dataProvider.length - 1);
        }
    }
}
// async function aqiBarChart() {
//     var options = {
//         series: [{
//             data: [35,44, 55, 57, 56, 61, 58, 63, 60, 66, 60, 55, 50]
//         }],
//         chart: {
//             type: 'bar',
//             height: 280,
//             toolbar: {
//                 show: false
//             }
//         },
//         plotOptions: {
//             bar: {
//                 horizontal: false,
//                 columnWidth: '55%',
//                 endingShape: 'rounded'
//             }
//         },
//         dataLabels: {
//             enabled: false
//         },
//         stroke: {
//             show: true,
//             width: 2,
//             colors: ['transparent']
//         },
//         xaxis: {
//             categories: ['Jan','Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
//             labels: {
//                 style: {
//                     colors: '#000000',
//                 }
//             }
//         },
//         yaxis: {
//             labels: {
//                 style: {
//                     colors: '#000000',
//                 }
//             }
//         },
//         fill: {
//             colors: ['#FF6600'],  // Add the orange color for bars
//             opacity: 1
//         },
//         tooltip: {
//             y: {
//                 formatter: function(val) {
//                     return val;
//                 }
//             }
//         }
//     };

//     // Using replaceChart to render the bar chart
//     replaceIndoorChart(() => {
//         aqiCharts = new ApexCharts(document.querySelector("#chartdiv4"), options);
//         aqiCharts.render();
//     });
// }
async function aqiBarChart() {
    // Get the last 12 months and random data
    const months = getLast12Months(); // Get the last 12 months
    const randomData = getRandomData(); // Generate random data for each month

    var options = {
        series: [{
            data: randomData // Use random data generated
        }],
        chart: {
            type: 'bar',
            height: "100%",
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: months, // Set x-axis categories to the last 12 months
            labels: {
                style: {
                    colors: '#000000',
                },
                rotate: 315 // Rotate x-axis labels by 315 degrees
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#000000',
                }
            }
        },
        fill: {
            colors: ['#FF6600'],  // Add the orange color for bars
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val;
                }
            }
        }
    };

    aqiCharts = new ApexCharts(document.querySelector("#chartdiv4"), options);
    aqiCharts.render();
}

async function lineChartMonthlyAqi() {
    // Get the current date
    const today = new Date();
    const currentMonth = today.getMonth();

    // Set startDate and endDate to the previous month
    const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);  // First day of the previous month
    const endDate = new Date(today.getFullYear(), currentMonth, 0);  // Last day of the previous month

    // Generate chart data for the previous month
    var chartData = generateChartData(startDate, endDate);

    function generateChartData(startDate, endDate) {
        var chartData = [];
        var visits = 1200;
        var hits = 1220;
        var views = 1240;

        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            views += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

            chartData.push({
                date: new Date(currentDate),
                scope1: visits,
                scope2: hits,
                scope3: views
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
        return chartData;
    }

    // Alert if no data exists
    if (chartData.length === 0) {
        alert('No data to display for the selected range');
        return;
    }

    // Create the line chart with the generated data for the previous month
    aqiCharts = AmCharts.makeChart("chartdiv4", {
        "type": "serial",
        "theme": "white",
        "color": "#000",
        "legend": {
            "useGraphSettings": true,
            "color": "#000",
            "position": "top",
            "align": "center",
            "marginBottom": 10,
            "valueText": ""
        },
        "dataProvider": chartData,
        "synchronizeGrid": true,
        "valueAxes": [{
            "id": "v1",
            "axisColor": "#000",
            "axisThickness": 0.5,
            "axisAlpha": 1,
            "position": "left"
        }],
        "graphs": [{
            "valueAxis": "v1",
            "lineColor": "#FF6600",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "Indoor Air Quality",
            "valueField": "scope1",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#FF6600",
                "borderColor": "#FF6600"
            }
        }],
        "chartScrollbar": {
            "offset": 20
        },
        "chartCursor": {
            "cursorPosition": "mouse",
            "cursorColor": "#000000",
        },
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "axisColor": "#000",
            "minorGridEnabled": true
        },
        "export": {
            "enabled": true // Disable export menu
        }
    });

    aqiCharts.addListener("dataUpdated", zoomChart);
    zoomChart();

    function zoomChart() {
        aqiCharts.zoomToIndexes(aqiCharts.dataProvider.length - 70, aqiCharts.dataProvider.length - 1);
    }
}
$("#startDateIAQ, #endDateIAQ").on("change", async function () {
    // await createBarChart();
    await replaceIndoorChart(createBarChart);
});
$("#sav_daily_iaq").on("click", async function () {
    clearDateInputsAqi();
    await replaceIndoorChart(createPieChart);
});
$("#sav_monthly_iaq").on("click", async function () {
    clearDateInputsAqi();
    await replaceIndoorChart(lineChartMonthlyAqi);
});
$("#sav_yearly_iaq").on("click", async function () {
    clearDateInputsAqi();
    // await aqiBarChart();
    await replaceIndoorChart(aqiBarChart);
});

/* Indoor Air Quality end */

/* EPI Index start */
var epiChart;

// Function to replace the current chart with a new one
function replaceEpiChart(newChartFunction) {
    // Only destroy the current chart if it exists
    if (epiChart) {
        if (epiChart instanceof ApexCharts) {
            var charts = [];
            console.log("Pie chart destroyed");
            for (var i = 0; i < charts.length; i++) {
                if (charts[i] instanceof ApexCharts) {
                    console.log("Apex chart destroyed");
                    charts[i].destroy(); // Dispose the existing chart
                }
            }
            console.log("Pie chart destroyed");
            epiChart.destroy(); // Dispose the existing chart
        } else if (epiChart instanceof AmCharts.AmChart) {
            console.log("Pie chart destroyed");
            epiChart.clear(); // Clear the existing AmCharts instance
        } else if (epiChart instanceof am4charts.XYChart) {
            console.log("Pie chart destroyed");
            epiChart.dispose(); // Dispose the existing am4charts instance
        }
    }

    // Call the new chart function to render a new chart
    newChartFunction();
}
async function epiDonutChart() {
    const style = document.createElement('style');
    style.innerHTML = `
        #chartdiv5 .apexcharts-text {
            fill: #000000; /* Change this to your desired color */
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    var seriesData = [33, 33, 34]; // Your data
    var totalValue = seriesData.reduce((a, b) => a + b, 0); // Calculate the total value

    var options = {
        series: seriesData,
        chart: {
            type: 'donut',
            height: "100%",
            animations: {
                enabled: false // Disable all animations, including rotation
            }
        },
        labels: ['HVAC', 'UPS', 'RP & LTG'], // Customize labels
        tooltip: {
            y: {
                formatter: function (val) {
                    return val; // Customize the tooltip text
                }
            }
        },
        colors: ['#FFB200', '#667BC6', '#D1E9F6'],
        legend: {
            show: true,
            position: 'top', // Position the legend at the top
            horizontalAlign: 'center', // Center the legend
            labels: {
                colors: Array(5).fill('#000000'), // Set all legend label colors to black
            },
            offsetY: 0
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '50%', // Set the size of the inner donut
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '30px',
                            fontWeight: 'bold',
                            color: '#000000',
                            formatter: function () {
                                return 'EPI'; // Static 'EPI' label for each slice
                            }
                        },
                        value: {
                            show: true,
                            fontSize: '30px',
                            fontWeight: 'bold',
                            color: '#000000',
                            formatter: function () {
                                return totalValue; // Static total value displayed for each slice
                            }
                        },
                        total: {
                            show: true, // Show the total label
                            label: 'EPI', // Static 'EPI' label in the center
                            fontSize: '30px',
                            fontWeight: 'bold',
                            color: '#000000', // Total text color
                            formatter: function () {
                                return totalValue; // Return the calculated total value
                            }
                        }
                    },
                    offsetY: 10
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'top'
                }
            }
        }],
        stroke: {
            show: false // Disable stroke (border) around the donut segments
        }
    };

    // Create a new chart instance
    epiChart = new ApexCharts(document.querySelector("#chartdiv5"), options);
    epiChart.render();
    //clearDateInputsEPI();
}
replaceEpiChart(epiDonutChart);
async function epiLine() {
    var startDateValue = document.getElementById("startDateEPI").value;
    var endDateValue = document.getElementById("endDateEPI").value;

    if (startDateValue && endDateValue) {
        var startDate = new Date(startDateValue);
        var endDate = new Date(endDateValue);

        // Ensure the start date is not later than the end date
        if (startDate > endDate) {
            alert('Start Date cannot be after End Date');
            return;
        }

        var chartData = generateChartData(startDate, endDate);

        if (chartData.length === 0) {
            alert('No data to display for the selected range');
            return;
        }
        function generateChartData(startDate, endDate) {
            var chartData = [];
            var visits = 10; // Different initial value for the second chart
            var currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
                chartData.push({
                    date: new Date(currentDate),
                    domesticwater: visits,
                    flushingwater: visits + Math.round(Math.random() * 30),
                    flushingwater1: visits + Math.round(Math.random() * 5)
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return chartData;
        }
        // Replace the current chart with a new line chart
        replaceEpiChart(() => {
            epiChart = AmCharts.makeChart('chartdiv5', {
                "type": "serial",
                "theme": "bwhite",
                "color": "#000",
                "legend": {
                    "useGraphSettings": true,
                    "color": "#000",
                    "position": "top",       // Legend at top
                    "align": "center",       // Center the legend
                    "marginBottom": 10,      // Space below legend
                    "valueText": ""
                },
                "dataProvider": chartData,
                "synchronizeGrid": true,
                "valueAxes": [{
                    "id": "v1",
                    "axisColor": "#000",
                    "axisThickness": 1,
                    "axisAlpha": 1,
                    "position": "left"
                }],
                "graphs": [{
                    "valueAxis": "v1",
                    "lineColor": "#FFB200",
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "HVAC",
                    "valueField": "domesticwater",
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size'#FFB200', '#667BC6', '#D1E9F6'
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",  // Text color
                        "fillColor": "#FFB200",  // Background color (same as line color)
                        "borderColor": "#FFB200"
                    }
                },
                {
                    "valueAxis": "v1",
                    "lineColor": "#667BC6",
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "UPS",
                    "valueField": "flushingwater",
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",  // Text color
                        "fillColor": "#667BC6",  // Background color (same as line color)
                        "borderColor": "#667BC6"
                    }
                },
                {
                    "valueAxis": "v1",
                    "lineColor": "#D1E9F6",
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "RT & LTG",
                    "valueField": "flushingwater1",
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",  // Text color
                        "fillColor": "#D1E9F6",  // Background color (same as line color)
                        "borderColor": "#D1E9F6"
                    }
                }],
                "chartScrollbar": {
                    "selectedGraphLineColor": "#888",
                    "position": "bottom",   // Set scrollbar position to bottom
                    "offset": 20           // Ensure some offset from the chart
                },
                "chartCursor": {
                    "cursorPosition": "mouse",
                    "cursorColor": "#000000"
                },
                "categoryField": "date",
                "categoryAxis": {
                    "parseDates": true,
                    "axisColor": "#000",
                    "minorGridEnabled": true
                },
                "export": {
                    "enabled": true,
                    "position": "bottom-right"
                },
                "zoomControl": {
                    "zoomControlEnabled": false
                }
            });

            epiChart.addListener("dataUpdated", zoomChart);
            zoomChart();

            function zoomChart() {
                epiChart.zoomToIndexes(epiChart.dataProvider.length - 70, epiChart.dataProvider.length - 1);
            }
        });
    }
}

// Function to create the bar chart
// async function epiBarChart() {
//     am4core.ready(function () {
//         // Replace the current chart with a new bar chart
//         replaceEpiChart(() => {
//             // Themes begin
//             am4core.useTheme(am4themes_animated);
//             // Themes end

//             epiChart = am4core.create('chartdiv5', am4charts.XYChart);

//             epiChart.padding(0, 0, 0, 0);
//             epiChart.colors.step = 2;

//             epiChart.legend = new am4charts.Legend();
//             epiChart.legend.position = 'top';
//             epiChart.legend.paddingBottom = 20;
//             epiChart.legend.labels.template.maxWidth = 95;
//             epiChart.legend.labels.template.fill = am4core.color('#000000');

//             var xAxis = epiChart.xAxes.push(new am4charts.CategoryAxis());
//             xAxis.dataFields.category = 'category';

//             xAxis.renderer.cellStartLocation = 0.2;
//             xAxis.renderer.cellEndLocation = 0.8;
//             xAxis.renderer.grid.template.location = 0;
//             xAxis.renderer.labels.template.fill = am4core.color('#000000');
//             xAxis.renderer.minGridDistance = 20;
//             xAxis.renderer.labels.template.rotation = 270; // Rotate labels
//             xAxis.renderer.labels.template.horizontalCenter = "right"; // Align to right
//             xAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically

//             var yAxis = epiChart.yAxes.push(new am4charts.ValueAxis());
//             yAxis.min = 0;
//             yAxis.renderer.labels.template.fill = am4core.color('#000000');

//             function createSeries(value, name, color) {
//                 var series = epiChart.series.push(new am4charts.ColumnSeries());
//                 series.dataFields.valueY = value;
//                 series.dataFields.categoryX = "category";
//                 series.name = name;

//                 series.columns.template.fill = am4core.color(color);  // Fill color
//                 series.columns.template.stroke = am4core.color(color); // Stroke color
//                 series.tooltipText = '{name}: {valueY}';
//                 series.tooltip.background.fill = am4core.color('#ffffff'); // Tooltip background color
//                 series.tooltip.label.fill = am4core.color('#000000'); // Tooltip text color
//                 series.tooltip.pointerOrientation = 'vertical'; // Tooltip orientation
//                 series.tooltip.getFillFromObject = false; // Ensure tooltip color is set explicitly
//                 series.tooltip.getStrokeFromObject = false; // Ensure tooltip border color is set explicitly

//                 var bullet = series.bullets.push(new am4charts.LabelBullet());
//                 bullet.interactionsEnabled = false;
//                 bullet.dy = 30;
//                 bullet.label.fill = am4core.color('#000000');

//                 return series;
//             }

//             epiChart.data = [
//                 { category: 'Jan', first: 40, second: 55, third: 60 },
//                 { category: 'Feb', first: 30, second: 78, third: 69 },
//                 { category: 'Mar', first: 27, second: 40, third: 45 },
//                 { category: 'Apr', first: 50, second: 33, third: 22 },
//                 { category: 'May', first: 50, second: 33, third: 22 },
//                 { category: 'Jun', first: 50, second: 33, third: 22 },
//                 { category: 'Jul', first: 50, second: 33, third: 22 },
//                 { category: 'Aug', first: 50, second: 33, third: 22 },
//                 { category: 'Sep', first: 50, second: 33, third: 22 },
//                 { category: 'Oct', first: 50, second: 33, third: 22 },
//                 { category: 'Nov', first: 50, second: 33, third: 22 },
//                 { category: 'Dec', first: 50, second: 33, third: 22 },
//             ];

//             createSeries('first', 'HVAC', '#FFB200');//'#8458B3', '#D33682', '#FFA600' '#FFB200', '#667BC6', '#D1E9F6'
//             createSeries('second', 'UPS', '#667BC6');
//             createSeries('third', 'RT & LTG', '#D1E9F6');

//             epiChart.logo.disabled=true;
//         });
//     });
// }
// async function epiBarChart() {
//     am4core.ready(function () {
//         // Replace the current chart with a new bar chart
//         replaceEpiChart(() => {
//             // Themes begin
//             am4core.useTheme(am4themes_animated);
//             // Themes end

//             epiChart = am4core.create('chartdiv5', am4charts.XYChart);

//             epiChart.height = am4core.percent(100);

//             epiChart.padding(0, 0, 0, 0);
//             epiChart.colors.step = 2;

//             epiChart.legend = new am4charts.Legend();
//             epiChart.legend.position = 'top';
//             epiChart.legend.paddingBottom = 20;
//             epiChart.legend.labels.template.maxWidth = 95;
//             epiChart.legend.labels.template.fill = am4core.color('#000000');

//             var xAxis = epiChart.xAxes.push(new am4charts.CategoryAxis());
//             xAxis.dataFields.category = 'category';

//             xAxis.renderer.cellStartLocation = 0.2;
//             xAxis.renderer.cellEndLocation = 0.8;
//             xAxis.renderer.grid.template.location = 0;
//             xAxis.renderer.labels.template.fill = am4core.color('#000000');
//             xAxis.renderer.minGridDistance = 20;
//             xAxis.renderer.labels.template.rotation = 315; // Rotate labels 315 degrees
//             xAxis.renderer.labels.template.horizontalCenter = "right"; // Align to right
//             xAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
//             xAxis.renderer.labels.template.fontSize = 10;
//             xAxis.renderer.labels.template.dy = -15;
//             xAxis.renderer.labels.template.dx = 10;

//             var yAxis = epiChart.yAxes.push(new am4charts.ValueAxis());
//             yAxis.min = 0;
//             yAxis.renderer.labels.template.fill = am4core.color('#000000');

//             function createSeries(value, name, color) {
//                 var series = epiChart.series.push(new am4charts.ColumnSeries());
//                 series.dataFields.valueY = value;
//                 series.dataFields.categoryX = "category";
//                 series.name = name;

//                 series.columns.template.fill = am4core.color(color);  // Fill color
//                 series.columns.template.stroke = am4core.color(color); // Stroke color
//                 series.tooltipText = '{name}: {valueY}';
//                 series.tooltip.background.fill = am4core.color('#ffffff'); // Tooltip background color
//                 series.tooltip.label.fill = am4core.color('#000000'); // Tooltip text color
//                 series.tooltip.pointerOrientation = 'vertical'; // Tooltip orientation
//                 series.tooltip.getFillFromObject = false; // Ensure tooltip color is set explicitly
//                 series.tooltip.getStrokeFromObject = false; // Ensure tooltip border color is set explicitly



//                 return series;
//             }

//             // Get the last 12 months and random data
//             const months = getLast12Months(); // Get the last 12 months
//             const randomData = getRandomData(); // Generate random data for each month

//             // Prepare data for the chart
//             epiChart.data = months.map((month, index) => ({
//                 category: month,
//                 first: randomData[index],
//                 second: Math.floor(Math.random() * 100) + 20, // Random value for second series
//                 third: Math.floor(Math.random() * 100) + 20, // Random value for third series
//             }));

//             // Create series for each data type
//             createSeries('first', 'HVAC', '#FFB200');
//             createSeries('second', 'UPS', '#667BC6');
//             createSeries('third', 'RT & LTG', '#D1E9F6');

//             epiChart.logo.disabled = true;
//             // Create a cursor
//             var cursor = new am4charts.XYCursor();
//             cursor.xAxis = xAxis; // Set the x-axis for the cursor
//             cursor.tooltipText = "{category}: {valueY}"; // Customize tooltip text to show category and value
//             cursor.tooltip.pointerOrientation = "vertical"; // Tooltip orientation
//             cursor.tooltip.background.fillOpacity = 0.7; // Set tooltip background opacity
//             epiChart.cursor = cursor; // Add the cursor to the chart
//         });
//     });
// }
async function epiBarChart() {
    // Call replaceEpiChart function to handle any necessary replacements
    replaceEpiChart(async () => {

        // Prepare options for the new ApexCharts bar chart
        const options = {
            series: [{
                name: 'HVAC',
                data: getRandomData() // Replace with your actual HVAC data
            }, {
                name: 'UPS',
                data: getRandomData() // Replace with your actual UPS data
            }, {
                name: 'RT & LTG',
                data: getRandomData() // Replace with your actual RT & LTG data
            }],
            chart: {
                type: 'bar',
                height: '100%',
                stacked: false,
                toolbar: {
                    show: false // Hide the toolbar with export options
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false, // Vertical bars
                    columnWidth: '80%', // Increase the width of the bars
                    endingShape: 'rounded',
                    groupedPadding: 0
                }
            },
            colors: ["#FFB200", "#667BC6", "#D1E9F6"], // Colors for HVAC, UPS, RT & LTG
            dataLabels: {
                enabled: false, // Disable the values on top of the bars
            },
            xaxis: {
                categories: getLast12Months(), // Last 12 months from October 2023 to September 2024
            },
            // yaxis: {
            //     title: {
            //         text: 'Emissions (in metric tons)', // Y-axis title for emissions
            //     }
            // },
            grid: {
                show: true,
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return val; // Customize tooltip text
                    }
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                labels: {
                    colors: ['#000000'],
                }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent'] // Show the borders between columns
            },
            fill: {
                opacity: 1 // Ensure the bars are fully filled
            },
        };

        // Create and render the new ApexCharts instance
        epiChart = new ApexCharts(document.querySelector("#chartdiv5"), options);
        await epiChart.render(); // Wait for the chart to render
    });
}

async function lineChartMonthlyEpi() {
    // Get the current date
    const today = new Date();
    const currentMonth = today.getMonth();

    // Set startDate and endDate to the previous month
    const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);  // First day of the previous month
    const endDate = new Date(today.getFullYear(), currentMonth, 0);  // Last day of the previous month

    // Generate chart data for the previous month
    var chartData = generateChartData(startDate, endDate);

    function generateChartData(startDate, endDate) {
        var chartData = [];
        var visits = 1200;
        var hits = 1220;
        var views = 1240;

        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
            views += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

            chartData.push({
                date: new Date(currentDate),
                scope1: visits,
                scope2: hits,
                scope3: views
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
        return chartData;
    }

    // Alert if no data exists
    if (chartData.length === 0) {
        alert('No data to display for the selected range');
        return;
    }

    // Create the line chart with the generated data for the previous month
    epiChart = AmCharts.makeChart("chartdiv5", {
        "type": "serial",
        "theme": "white",
        "color": "#000",
        "legend": {
            "useGraphSettings": true,
            "color": "#000",
            "position": "top",
            "align": "center",
            "marginBottom": 10,
            "valueText": ""
        },
        "dataProvider": chartData,
        "synchronizeGrid": true,
        "valueAxes": [{
            "id": "v1",
            "axisColor": "#000",
            "axisThickness": 0.5,
            "axisAlpha": 1,
            "position": "left"
        }],
        "graphs": [{
            "valueAxis": "v1",
            "lineColor": "#FFB200",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "HVAC",
            "valueField": "scope1",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size'#FFB200', '#667BC6', '#D1E9F6'
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#FFB200",  // Background color (same as line color)
                "borderColor": "#FFB200"
            }
        }, {
            "valueAxis": "v1",
            "lineColor": "#667BC6",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "UPS",
            "valueField": "scope2",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#667BC6",  // Background color (same as line color)
                "borderColor": "#667BC6"
            }
        }, {
            "valueAxis": "v1",
            "lineColor": "#D1E9F6",
            "bulletBorderThickness": 1,
            "hideBulletsCount": 30,
            "title": "RT & LTG",
            "valueField": "scope3",
            "fillAlphas": 0,
            "type": "smoothedLine",
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",  // Text color
                "fillColor": "#D1E9F6",  // Background color (same as line color)
                "borderColor": "#D1E9F6"
            }
        }],
        "chartScrollbar": {
            "offset": 20
        },
        "chartCursor": {
            "cursorPosition": "mouse",
            "cursorColor": "#000000",
        },
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "axisColor": "#000",
            "minorGridEnabled": true
        },
        "export": {
            "enabled": true // Disable export menu
        }
    });
    epiChart.addListener("dataUpdated", zoomChart);
    zoomChart();

    function zoomChart() {
        epiChart.zoomToIndexes(epiChart.dataProvider.length - 70, epiChart.dataProvider.length - 1);
    }

}
// async function epiColumChart() {
//     var options = {
//         series: [{
//             name: 'Floor 1',
//             data: [2.3, 3.1, 4.0] // Data for Floor 1 (HVAC, UPS, RT & LTG)
//         }, {
//             name: 'Floor 2',
//             data: [3.0, 2.8, 3.5] // Data for Floor 2 (HVAC, UPS, RT & LTG)
//         }],
//         chart: {
//             height: 280,
//             type: 'bar',
//             toolbar: {
//                 show: false // Disable the toolbar
//             }
//         },
//         plotOptions: {
//             bar: {
//                 borderRadius: 10,
//                 dataLabels: {
//                     position: 'top', // top, center, bottom
//                 },
//                 columnWidth: '45%', // Adjust column width for grouping
//                 endingShape: 'rounded' // Rounded bar edges
//             }
//         },
//         dataLabels: {
//             enabled: true,
//             formatter: function (val) {
//                 return val + "%"; // Append percentage symbol
//             },
//             offsetY: -20,
//             style: {
//                 fontSize: '12px',
//                 colors: ["#304758"]
//             }
//         },
//         xaxis: {
//             categories: ["HVAC", "UPS", "RT & LTG"], // Categories remain the same
//             position: 'bottom',
//             axisBorder: {
//                 show: false
//             },
//             axisTicks: {
//                 show: false
//             },
//             crosshairs: {
//                 fill: {
//                     type: 'gradient',
//                     gradient: {
//                         colorFrom: '#D8E3F0',
//                         colorTo: '#BED1E6',
//                         stops: [0, 100],
//                         opacityFrom: 0.4,
//                         opacityTo: 0.5,
//                     }
//                 }
//             },
//             tooltip: {
//                 enabled: true,
//             }
//         },
//         yaxis: {
//             axisBorder: {
//                 show: false
//             },
//             axisTicks: {
//                 show: false,
//             },
//             labels: {
//                 show: false,
//                 formatter: function (val) {
//                     return val + "%"; // Append percentage symbol
//                 }
//             }
//         },
//         legend: {
//             position: 'top', // Place the legend on top
//             horizontalAlign: 'center',
//         },
//         colors: ['#008FFB', '#00E396'] // Custom colors for Floor 1 and Floor 2
//     };

//     // Change the selector to match the correct div ID
//     var epiChart1 = new ApexCharts(document.querySelector("#epiBarChart"), options);
//     await epiChart1.render();
// }
var epiChart1;
async function epiColumnChart() {
    if (epiChart1 instanceof ApexCharts) {
        console.log("Pie chart destroyed");
        epiChart1.destroy(); // Dispose the existing chart
    }
    var options = {
        series: [{
            name: 'HVAC',
            data: [2.3, 3.0] // Data for HVAC (Floor 1, Floor 2)
        }, {
            name: 'UPS',
            data: [3.1, 2.8] // Data for UPS (Floor 1, Floor 2)
        }, {
            name: 'RT & LTG',
            data: [4.0, 3.5] // Data for RT & LTG (Floor 1, Floor 2)
        }],
        chart: {
            height: 280,
            type: 'bar',
            toolbar: {
                show: false // Disable the toolbar
            },
            offsetY: 30
        },
        plotOptions: {
            bar: {
                borderRadius: 10,
                dataLabels: {
                    position: 'top', // Show data labels on top
                },
                columnWidth: '45%', // Set column width for comparison
                endingShape: 'rounded' // Rounded edges for a smooth look
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val + "%"; // Show percentage symbol next to data
            },
            offsetY: -30,
            style: {
                fontSize: '12px',
                colors: ["#304758"]
            }
        },
        xaxis: {
            categories: ["Floor 1", "Floor 2"], // X-axis now has Floor 1 and Floor 2
            position: 'bottom',
            axisBorder: {
                show: false // Hide bottom axis border
            },
            axisTicks: {
                show: false // Hide ticks for a cleaner look
            },
            crosshairs: {
                fill: {
                    type: 'gradient',
                    gradient: {
                        colorFrom: '#D8E3F0',
                        colorTo: '#BED1E6',
                        stops: [0, 100],
                        opacityFrom: 0.4,
                        opacityTo: 0.5,
                    }
                }
            },
            tooltip: {
                enabled: true, // Show tooltips on x-axis hover
            }
        },
        yaxis: {
            axisBorder: {
                show: false // Hide y-axis border
            },
            axisTicks: {
                show: false, // Hide ticks on y-axis
            },
            labels: {
                show: false, // Hide y-axis labels for a cleaner look
                formatter: function (val) {
                    return val; // Append percentage symbol to y-axis values
                }
            }
        },
        legend: {
            position: 'top', // Place the legend on top
            horizontalAlign: 'center', // Center align the legend
            offsetY: 20
        },
        colors: ['#FFB200', '#667BC6', '#D1E9F6'], // Custom colors for HVAC, UPS, RT & LTG
        grid: {
            padding: {
                left: 10,
                right: 10
            }
        },
    };

    // Select the div where the chart should render
    epiChart1 = new ApexCharts(document.querySelector("#epiBarChart"), options);
    await epiChart1.render();
}

$('#epiFloor1').on("click", async function (event) {
    event.stopPropagation();
    console.log("aqiFloor1 clicked");
    $(".epiBar").show();
    $(".epiDonut").hide();
    $("#epiFloor2").show();
    $(".epiBtn").hide();
    $(this).hide();
    await epiColumnChart();
});
$('#epiFloor2').on("click", async function (event) {
    event.stopPropagation();
    console.log("aqiFloor2 clicked");
    $(".epiBar").hide();
    $(".epiDonut").show();
    $("#epiFloor1").show();
    $(".epiBtn").show();
    $(this).hide();
});
$("#startDateEPI, #endDateEPI").on("change", async function () {
    await epiLine();
});
$("#sav_daily_epi").on("click", async function () {
    clearDateInputsEpi();
    await replaceEpiChart(epiDonutChart);
});
$("#sav_monthly_epi").on("click", async function () {
    clearDateInputsEpi();
    await replaceEpiChart(lineChartMonthlyEpi);
});
$("#sav_yearly_epi").on("click", async function () {
    await epiBarChart();
    clearDateInputsEpi();
});
/* EPI Index end */
function getLast12Months() {
    const months = [];
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth()); // Start from the previous month (September 2024)

    // Generate the last 12 months
    for (let i = 0; i < 12; i++) {
        const monthDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1)); // Increment month
        months.push(monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })); // Add month and year
    }
    return months.reverse(); // Return the last 12 months
}
// Example function to generate random data for each scope
function getRandomData() {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 20); // Random data for 12 months
}
async function showAlert(message1, message2) {
    // Set the first message for modalMessage1 in red
    document.getElementById("modalMessage").style.color = "red";
    document.getElementById("modalMessage").innerText = message1; // Set the message for modalMessage1

    // Set the second message for modalMessage in green
    document.getElementById("modalMessage1").style.color = "green";
    document.getElementById("modalMessage1").innerText = message2; // Set the message for modalMessage

    // Show the modal
    var modal = new bootstrap.Modal(document.getElementById('staticBackdrop'));
    modal.show();
    // clearDateInputs();
    // clearDateInputsWater();

}

async function validateDateRange(startDate, endDate) {
    var today = new Date(); // Current date
    var limitDate = new Date('2024-08-31'); // Limit date (hardcoded)

    //resetCharts();

    // Check if the start date is after today's date
    if (startDate > today) {
        console.log(startDate);
        showAlert('Start date cannot be in the future.', 'Please select a valid start date.');
        return false;
    }

    // Check if the end date is after today's date
    if (endDate > today) {
        console.log(endDate);
        showAlert('End date cannot be in the future.', 'Please select a valid end date.');
        return false;
    }

    // Check if the start date is before the limit date
    if (startDate < limitDate) {
        showAlert('Data for selected start date is not available.', 'Please select a date on or after August 31, 2024.');
        return false;
    }

    // Check if the end date is before the limit date
    if (endDate < limitDate) {
        showAlert('Data for selected end date is not available.', 'Please select a date on or after August 31, 2024.');
        return false;
    }

    if (startDate >= endDate) {
        showAlert('Start Date And End Date Can Not Be Same', 'Please select a valid date range.');
        return false;
    }

    // Calculate the difference in time
    var timeDiff = endDate - startDate;

    // Calculate the difference in days
    var dayDiff = timeDiff / (1000 * 3600 * 24);

    // Validate the number of selected days
    if (dayDiff > 31) {
        showAlert('You cannot select more than 31 days.', 'Please select a valid date range.');
        return false;
    }

    return true; // All validations passed
}
async function clearDateInputs() {
    $('#startDate').val(''); // Clear start date
    $('#endDate').val('');   // Clear end date
}
async function clearDateInputsWater() {
    $('#startDateWater').val(''); // Clear start date
    $('#endDateWater').val('');   // Clear end date
}
async function clearDateInputsPower() {
    $("#startDatePower").val('');
    $("#endDatePower").val('');
}
async function clearDateInputsOccupancy() {
    $("#startDateOccupancy").val('');
    $("#endDateOccupancy").val('');
}
async function clearDateInputsAqi() {
    $("#startDateIAQ").val('');
    $("#endDateIAQ").val('');
}
async function clearDateInputsEpi() {
    $("#startDateEPI").val('');
    $("#endDateEPI").val('');
}

