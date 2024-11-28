jQuery(function () {

    let url = "https://localhost";
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    let previousDate = currentDate.toISOString().split('T')[0];
    console.log("previos day " + previousDate);

    let emissionChart;

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

        // Fetch XML data from the server
        const response = await fetch(url + "/obix/config/Barclays/Co2$20Emission$20in$20Ton/");
        const text = await response.text();

        // Parse the XML data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Get all <ref> elements (which include scope1, scope2, etc.)
        const refs = xmlDoc.getElementsByTagName("ref");

        // Initialize arrays to store scope names and values
        let scopeNames = [];
        let scopeValues = [];

        // Iterate through the <ref> elements to extract scope names and their display values
        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            
            const displayName = ref.getAttribute("name");
            const valueText = ref.getAttribute("display");

            // If display value contains a valid number, extract it
            const valueMatch = valueText && valueText.match(/(^\d+(\.\d+)?)/); // Match numeric value
            if (valueMatch) {
                const value = parseFloat(valueMatch[0]); // Parse the numeric value
                scopeNames.push(displayName); // Add the display name to the list
                scopeValues.push(value); // Add the value to the list
            }
        }

        // Calculate the total value
        const totalValue = scopeValues.reduce((sum, value) => sum + value, 0);

        // Radial bar chart options
        var options = {
            series: scopeValues, // Use the calculated series values
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
            labels: scopeNames, // Labels for each segment
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

    pieChart();
      let intervalId; // Variable to store the interval ID
    
    intervalId=setInterval(pieChart, 5000);
    
    async function lineChartMonthlyCo25() {
        // Get the current date
        const today = new Date();
        const currentMonth = today.getMonth();

        // Set startDate and endDate to the previous month
        const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);
        const endDate = new Date(today.getFullYear(), currentMonth, 0);

        const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        // Define the scopes
        const scopes = ['scope1', 'scope2', 'scope3'];
        
        let scopeValues = [];

        // Fetch data for each scope
        for (let scope of scopes) {
            const response = await fetch(url + `/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startISO}&end=${endISO}`);
            console.log("response " + response);
            const text = await response.text();

            // Parse the XML data
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");

            // Get all <obj> elements
            const objs = xmlDoc.getElementsByTagName("obj");

            // Process each <obj> element
            for (let i = 0; i < objs.length; i++) {
                const obj = objs[i];
                const abstime = obj.getElementsByTagName("abstime")[0];
                const real = obj.getElementsByTagName("real")[0];

                if (abstime && real) {
                    const dateText = abstime.getAttribute("val");
                    const valueText = real.getAttribute("val");

                    if (valueText && dateText) {
                        const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                        const date = new Date(dateText);

                        // Add the data for each scope
                        const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                        if (existingEntry) {
                            existingEntry[scope] = parseFloat(value); // Add the value to the existing entry for that date
                        } else {
                            scopeValues.push({
                                date: date,
                                [scope]: parseFloat(value) // Dynamically add the value for the scope
                            });
                        }
                    }
                }
            }
        }

        // Destroy existing chart if it exists
        if (emissionChart) {
            if (emissionChart instanceof ApexCharts) {
                emissionChart.destroy();
            } else if (emissionChart instanceof AmCharts.AmChart) {
                emissionChart.clear();
            } else if (emissionChart instanceof am4charts.XYChart) {
                emissionChart.dispose();
            }
        }

        // Create the line chart with the data for the previous month
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
            "dataProvider": scopeValues,
            "synchronizeGrid": true,
            "valueAxes": [{
                "id": "v1",
                "axisColor": "#000",
                "axisThickness": 0.5,
                "axisAlpha": 1,
                "position": "left",
                "labelFunction": function(value) {
                    // Format the values to 2 decimal places
                    return value.toFixed(2); // Format to 2 decimal places (e.g., 40.50)
                }
            }],
            "graphs": [
                {
                    "valueAxis": "v1",
                    "lineColor": "#FFB22C", // Color for Scope 1
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "Scope 1",
                    "valueField": "scope1", // Use scope1's data
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",
                        "fillColor": "#FFB22C",
                        "borderColor": "#FFB22C"
                    }
                },
                {
                    "valueAxis": "v1",
                    "lineColor": "#A4CE95", // Color for Scope 2
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "Scope 2",
                    "valueField": "scope2", // Use scope2's data
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",
                        "fillColor": "#A4CE95",
                        "borderColor": "#A4CE95"
                    }
                },
                {
                    "valueAxis": "v1",
                    "lineColor": "#FFB22C", // Color for Scope 3
                    "bulletBorderThickness": 1,
                    "hideBulletsCount": 30,
                    "title": "Scope 3",
                    "valueField": "scope3", // Use scope3's data
                    "fillAlphas": 0,
                    "type": "smoothedLine",
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",
                        "fillColor": "#FFB22C",
                        "borderColor": "#FFB22C"
                    }
                }
            ],
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
                "enabled": true
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
        
         const scopes = ['scope1', 'scope2', 'scope3'];
    
    let scopeValues = [];

    // Fetch data for each scope
    for (let scope of scopes) {
        const response = await fetch(url + `/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startDateValue}&end=${endDateValue}`);
        const text = await response.text();

        // Parse the XML data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Get all <obj> elements
        const objs = xmlDoc.getElementsByTagName("obj");

        // Process each <obj> element
        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            const abstime = obj.getElementsByTagName("abstime")[0];
            const real = obj.getElementsByTagName("real")[0];

            if (abstime && real) {
                const dateText = abstime.getAttribute("val");
                const valueText = real.getAttribute("val");

                if (valueText && dateText) {
                    const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                    const date = new Date(dateText);

                    // Add the data for each scope
                    const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                    if (existingEntry) {
                        existingEntry[scope] = parseFloat(value); // Add the value to the existing entry for that date
                    } else {
                        scopeValues.push({
                            date: date,
                            [scope]: parseFloat(value) // Dynamically add the value for the scope
                        });
                    }
                }
            }
        }
    }

        if (startDateValue && endDateValue) {
            var startDate = new Date(startDateValue);
            var endDate = new Date(endDateValue);
            if (!await validateDateRange(startDate, endDate)) {
                return; // Exit if validation fails
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
                "dataProvider": scopeValues,
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


async function createBarChart1() {
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
        
    // Helper function to get the last 12 months' start and end dates
    

    // Fetch the data for each scope
    async function fetchScopeData(scopeUrl) {
        try {
            const response = await fetch(scopeUrl);
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "application/xml");

            const values = Array.from(xml.querySelectorAll("real"))
                .map(real => parseFloat(real.getAttribute("val"))).filter(val => !isNaN(val));
                //console.log(values.reduce((sum, value) => sum + value,0));
            
            return values.reduce((sum, value) => sum + value, 0);
        } catch (error) {
            console.error("Error fetching data:", error);
            return 0;
        }
    }

    // Get last 12 months
    const last12Months = getLast12Months1();

    // Define the URLs for each scope
    const urls = last12Months.map(month => {
        return [
            `https://localhost/obix/histories/SqlServerDatabase/scopes1/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&end=${month.endDate}T00:00:00.000+05:30`,
            `https://localhost/obix/histories/SqlServerDatabase/scopes2/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&end=${month.endDate}T00:00:00.000+05:30`,
            `https://localhost/obix/histories/SqlServerDatabase/scopes3/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&end=${month.endDate}T00:00:00.000+05:30`
        ];
    });

    // Fetch data for each scope
    try {
        const scope1Data = [];
        const scope2Data = [];
        const scope3Data = [];
        
        for (let i = 0; i < urls.length; i++) {
            const scope1Total = await fetchScopeData(urls[i][0]);
            const scope2Total = await fetchScopeData(urls[i][1]);
            const scope3Total = await fetchScopeData(urls[i][2]);
            
            scope1Data.push(scope1Total);
            scope2Data.push(scope2Total);
            scope3Data.push(scope3Total);
        }

        const chartOptions = {
            series: [{
                    name: 'Scope 1',
                    data: scope1Data
                }, {
                    name: 'Scope 2',
                    data: scope2Data
                }, {
                    name: 'Scope 3',
                    data: scope3Data
                }],
            chart: {
                type: 'bar',
                height: '100%',
                stacked: false,
                toolbar: { show: false }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '80%',
                    endingShape: 'rounded',
                    groupedPadding: 0
                }
            },
            colors: ["#FFB22C", "#A4CE95", "#FFD93D"],
            dataLabels: { enabled: false },
            xaxis: {
                categories: getLast12Months(),  // Use dynamic last 12 months
            },
            yaxis: {
                title: {
                    text: 'Emissions (in metric tons)',  // Emissions units
                }
            },
            grid: { show: true },
            tooltip: {
                y: {
                    formatter: function(val) {
                        return val; // Customize the tooltip text
                    }
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                labels: { colors: ['#000000'] }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            fill: { opacity: 1 }
        };

        const emissionChart = new ApexCharts(document.querySelector("#chartdiv"), chartOptions);
        emissionChart.render();

    } catch (error) {
        console.error("Error processing the data and rendering the chart:", error);
    }
}




function clearUpdateInterval() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null; // Reset intervalId to prevent multiple intervals
    }
}

// Function to start a new interval for updating data
function startUpdateInterval(chartUpdateFunction) {
    clearUpdateInterval(); // Clear any existing interval before starting a new one
    intervalId = setInterval(chartUpdateFunction, 5000); // Set interval to update data every 5 seconds
}

// Event listeners to update data based on date range or chart type selection
$("#startDate, #endDate").on("change", async function () {
    clearDateInputsWater();
    await lineChart2(); // Load initial data for the selected date range
    startUpdateInterval(lineChart2); // Set interval to keep updating line chart data
});

$("#sav_monthly_btn").on("click", async function () {
    clearDateInputs();
    await lineChartMonthlyCo25(); // Load initial data for the monthly chart
    startUpdateInterval(lineChartMonthlyCo25); // Start interval for monthly updates
});

$("#sav_daily_btn").on("click", async function () {
    clearDateInputs();
    await pieChart(); // Load initial data for the daily pie chart
    startUpdateInterval(pieChart); // Start interval for daily pie chart updates
});

$("#sav_yearly_btn").on("click", async function () {
    clearDateInputs();
    await createBarChart1(); // Load initial data for the yearly bar chart
    startUpdateInterval(createBarChart1); // Start interval for yearly chart updates
});
/* co2 emmision end */

/* water consumption start */

let chart = null; // Declare chart globally to keep track of it

async function pieChart1() {
    const response = await fetch(url + "/obix/config/Barclays/Water$20Consumption/");
    console.log("response " + response);
    const text = await response.text();

    // Parse the XML data
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Get all <ref> elements (which include scope1, scope2, etc.)
    const refs = xmlDoc.getElementsByTagName("ref");

    // Initialize arrays to store scope names and values
    let waterNames = [];
    let waterValues = [];

    // Iterate through the <ref> elements to extract scope names and their display values
    for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        
        const displayName = ref.getAttribute("name");

        // If display value contains a valid number, extract it
        if (displayName == "Total_DOMESTIC_Use" || displayName == "Total_FLUSHING_Use") {
            const valueText = ref.getAttribute("display");
            const valueMatch = valueText && valueText.match(/(^\d+(\.\d+)?)/); // Match numeric value
            if (valueMatch) {
                const value = parseFloat(valueMatch[0]); // Parse the numeric value
                const friendlyName = displayName === "Total_DOMESTIC_Use" ? "Domestic Water" : "Flushing Water";
                waterNames.push(friendlyName); // Add the display name to the list
                waterValues.push(value); // Add the value to the list
            }
        }
    }

    // Initialize amCharts when the data is ready
    am4core.ready(function () {
        // Themes begin
        am4core.useTheme(am4themes_animated);

        // Check if the chart is already initialized
        if (chart) {
            if (chart instanceof am4charts.PieChart) {
                console.log("Chart destroyed");
                chart.dispose(); // Dispose the existing chart if already created
            }
        }

        // Create chart instance if not already created
        chart = am4core.create("chartdiv1", am4charts.PieChart);

        // Add data to chart dynamically from fetched data
        chart.data = waterNames.map((name, index) => ({
            category: name,
            value: waterValues[index]
        }));

        // Add and configure Series
        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "value";
        pieSeries.dataFields.category = "category";

        // Set pie chart colors
        pieSeries.slices.template.stroke = am4core.color("transparent");
        pieSeries.slices.template.strokeOpacity = 0;

        // Example of setting colors for each slice (can be dynamically set based on data if needed)
        pieSeries.colors.list = [
            am4core.color("#C65BCF"), // Domestic Use
            am4core.color("#39A7FF")  // Flushing Use
        ];

        pieSeries.ticks.template.disabled = true;
        pieSeries.alignLabels = false;
        pieSeries.labels.template.text = "{value.percent.formatNumber('#.0')}%";
        pieSeries.labels.template.radius = am4core.percent(-40);
        pieSeries.labels.template.fill = am4core.color("#000000");

        // Initial animation
        pieSeries.hiddenState.properties.opacity = 1;
        pieSeries.hiddenState.properties.endAngle = -90;
        pieSeries.hiddenState.properties.startAngle = -90;

        chart.hiddenState.properties.radius = am4core.percent(-40);
        pieSeries.legendSettings.valueText = "{ }"; // Remove value text

        // Add legend at the top
        chart.legend = new am4charts.Legend();
        chart.legend.position = "top";
        chart.legend.layout = "horizontal";
        chart.legend.contentAlign = "center"; // Center the legend horizontally
        chart.legend.labels.template.interactionsEnabled = false;

        // Configure legend labels and reduce spacing
        chart.legend.labels.template.text = "{category}: {value} L"; // Updated label format
        chart.legend.labels.template.fill = am4core.color("#000000");
        chart.legend.labels.template.maxWidth = 100; // Reduce max width for labels
        chart.legend.labels.template.padding(0, 0, 0, 0); // Adjust label padding (top, right, bottom, left)

        // // Configure legend item containers to minimize spacing
        chart.legend.itemContainers.template.padding(0, 0, 0, 0); // Adjust item container padding
        chart.legend.itemContainers.template.margin(0, 5, 0, 5); //Adjust item container margin
        // //chart.legend.itemContainers.template.minWidth = undefined; // Remove minWidth to make it flexible
        chart.legend.itemContainers.template.maxWidth = 180; // Limit max width for each item

        chart.logo.disabled = true;

    });
}

pieChart1();

async function lineChartMonthlyWater() {
    try {
        // Get the current date
        const today = new Date();
        const currentMonth = today.getMonth();

        // Set startDate and endDate to the previous month
        const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);
        const endDate = new Date(today.getFullYear(), currentMonth, 0);

        const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        
        const waters = ['domestic', 'flushing'];
        let waterValues = [];

        // Fetch data for each scope
        for (let water of waters) {
            const response = await fetch(url + `/obix/histories/SqlServerDatabase/${water}/~historyQuery?start=${startISO}&end=${endISO}`);
            const text = await response.text();

            // Parse the XML data
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");

            // Get all <obj> elements
            const objs = xmlDoc.getElementsByTagName("obj");

            // Process each <obj> element
            for (let i = 0; i < objs.length; i++) {
                const obj = objs[i];
                const abstime = obj.getElementsByTagName("abstime")[0];
                const real = obj.getElementsByTagName("real")[0];

                if (abstime && real) {
                    const dateText = abstime.getAttribute("val");
                    const valueText = real.getAttribute("val");

                    if (valueText && dateText) {
                        const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                        const date = new Date(dateText);
                        const dateStr = date.toDateString();  // Use toDateString to compare without time

                        // Add the data for each scope
                        const existingEntry = waterValues.find(entry => entry.date.toDateString() === dateStr);

                        if (existingEntry) {
                            existingEntry[water] = parseFloat(value); // Add the value to the existing entry for that date
                        } else {
                            waterValues.push({
                                date: date,
                                [water]: parseFloat(value) // Dynamically add the value for the scope
                            });
                        }
                    }
                }
            }
        }

        // Destroy existing chart if it exists
        if (window.chart) {
            if (window.chart instanceof AmCharts.AmChart) {
                window.chart.clear(); // Clear the existing AmCharts instance
            }
        }

        // Create the line chart with the generated data for the previous month
        window.chart = AmCharts.makeChart("chartdiv1", {
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
            "dataProvider": waterValues,
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
                "valueField": "domestic",
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
                "valueField": "flushing",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",  // Custom font size
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",  // Text color
                    "fillColor": "#39A7FF",
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
                "enabled": true // Enable export menu
            }
        });

        // Zoom to the last 70 data points
        window.chart.addListener("dataUpdated", zoomChart);
        zoomChart();

        function zoomChart() {
            window.chart.zoomToIndexes(window.chart.dataProvider.length - 70, window.chart.dataProvider.length - 1);
        }

    } catch (error) {
        console.error("Error fetching or processing the data:", error);
    }
}


async function lineChart1() {
    var startDateValue = $("#startDateWater").val();
    var endDateValue = $("#endDateWater").val();
    
    const waters = ['domestic', 'flushing'];
    let waterValues = [];

    // Fetch data for each scope
    for (let water of waters) {
        try {
            const response = await fetch(url + `/obix/histories/SqlServerDatabase/${water}/~historyQuery?start=${startDateValue}&end=${endDateValue}`);
            if (!response.ok) throw new Error(`Error fetching ${water} data`);
            
            const text = await response.text();

            // Parse the XML data
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");

            // Get all <obj> elements
            const objs = xmlDoc.getElementsByTagName("obj");

            // Process each <obj> element
            for (let i = 0; i < objs.length; i++) {
                const obj = objs[i];
                const abstime = obj.getElementsByTagName("abstime")[0];
                const real = obj.getElementsByTagName("real")[0];

                if (abstime && real) {
                    const dateText = abstime.getAttribute("val");
                    const valueText = real.getAttribute("val");

                    if (valueText && dateText) {
                        const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                        const date = new Date(dateText);
                        const dateStr = date.toISOString().split('T')[0]; // Standard date string

                        // Add the data for each scope
                        const existingEntry = waterValues.find(entry => entry.date === dateStr);

                        if (existingEntry) {
                            existingEntry[water] = parseFloat(value); // Add the value to the existing entry for that date
                        } else {
                            waterValues.push({
                                date: dateStr,
                                [water]: parseFloat(value) // Dynamically add the value for the scope
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching or parsing data for ${water}:`, error);
            return; // Exit if there's an error
        }
    }

    // Check if there’s data to display
    if (waterValues.length === 0) {
        alert('No data available for the selected range');
        return;
    }

    if (startDateValue && endDateValue) {
        var startDate = new Date(startDateValue);
        var endDate = new Date(endDateValue);
        
        // Validate date range
        if (!await validateDateRange(startDate, endDate)) {
            return; // Exit if validation fails
        }

        // Dispose of any existing chart instance
        if (chart && chart.dispose instanceof Function) {
            chart.dispose();
        }

        // Create the chart
        chart = AmCharts.makeChart('chartdiv1', {
            "type": "serial",
            "theme": "white",
            "color": "#000",
            "legend": {
                "useGraphSettings": true,
                "color": "#000",
                "position": "top",
                "align": "center",
                "marginBottom": 0,
                "valueText": ""
            },
            "dataProvider": waterValues,
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
                "valueField": "domestic",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",
                    "fillColor": "#C65BCF",
                    "borderColor": "#C65BCF"
                }
            }, {
                "valueAxis": "v1",
                "lineColor": "#39A7FF",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Flushing Water",
                "valueField": "flushing",
                "fillAlphas": 0,
                "type": "smoothedLine",
                "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
                "balloon": {
                    "adjustBorderColor": false,
                    "color": "#000",
                    "fillColor": "#39A7FF",
                    "borderColor": "#39A7FF"
                }
            }],
            "chartScrollbar": {
                "selectedGraphLineColor": "#888",
                "position": "bottom",
                "offset": 20
            },
            "chartCursor": {
                "cursorPosition": "mouse",
                "cursorColor": "#000000"
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#000",
                "minorGridEnabled": true,
                "dateFormats": [
                    { "period": "DD", "format": "MMM DD" },
                    { "period": "WW", "format": "MMM DD" },
                    { "period": "MM", "format": "MMM YYYY" },
                    { "period": "YYYY", "format": "YYYY" }
                ]
            },
            "export": {
                "enabled": true,
                "position": "bottom-right"
            },
            "zoomControl": {
                "zoomControlEnabled": false
            },
            "responsive": {
                "enabled": true
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
  
//   async function fetchScopeData(scopeUrl) {
//         try {
//             const response = await fetch(scopeUrl);
//             const text = await response.text();
//             const parser = new DOMParser();
//             const xml = parser.parseFromString(text, "application/xml");

//             const values = Array.from(xml.querySelectorAll("real"))
//                 .map(real => parseFloat(real.getAttribute("val"))).filter(val => !isNaN(val));
//                 //console.log(values.reduce((sum, value) => sum + value,0));
            
//             return values.reduce((sum, value) => sum + value, 0);
//         } catch (error) {
//             console.error("Error fetching data:", error);
//             return 0;
//         }
//     }

//     // Get last 12 months
//     const last12Months = getLast12Months1();

//     // Define the URLs for each scope
//     const urls = last12Months.map(month => {
//         return [
//             `https://localhost/obix/histories/SqlServerDatabase/scopes1/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&end=${month.endDate}T00:00:00.000+05:30`,
//             `https://localhost/obix/histories/SqlServerDatabase/scopes2/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&end=${month.endDate}T00:00:00.000+05:30`
//         ];
//     });
//     const scope1Data = [];
//         const scope2Data = [];
        
//         for (let i = 0; i < urls.length; i++) {
//             const scope1Total = await fetchScopeData(urls[i][0]);
//             const scope2Total = await fetchScopeData(urls[i][1]);
            
//             scope1Data.push(scope1Total);
//             scope2Data.push(scope2Total);
//         }
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
//         xAxis.renderer.labels.template.rotation = 315;
//         xAxis.renderer.labels.template.horizontalCenter = "right"; // Align to right
//         xAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
//         xAxis.renderer.labels.template.dy = -15;
//         xAxis.renderer.labels.template.fontSize = 10;
//         xAxis.renderer.labels.template.dx = 5;

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

//             series.stacked = true;  // Enable stacking

//             return series;
//         }

//         // Generate the last 12 months for the x-axis categories
//         const last12Months = getLast12Months();

//         // Generate random data for each scope
//         const scope1Data = getRandomData(); // Random data for "Domestic Water"
//         const scope2Data = getRandomData(); // Random data for "Flushing Water"

//         // Set the chart data using last 12 months and generated data
//         chart.data = last12Months.map((month, index) => ({
//             category: month,
//             first: scope1Data[index],
//             second: scope2Data[index]
//         }));

//         createSeries('first', 'Domestic Water', '#C65BCF');
//         createSeries('second', 'Flushing Water', '#39A7FF');

//         // Add total value at the top of each bar for the last series only
//         chart.events.on("datavalidated", function () {
//             var lastSeries = chart.series.getIndex(chart.series.length - 1); // Get the last series in the stack
//             lastSeries.columns.each(function (column) {
//                 var total = 0;

//                 // Loop through all stacked series to calculate the total
//                 chart.series.each(function (stackedSeries) {
//                     total += stackedSeries.dataItems.getIndex(column.dataItem.index).valueY;
//                 });

//                 // Add a label at the top of the stack (for the last series only)
//                 var label = column.createChild(am4core.Label);
//                 label.text = total.toString();
//                 label.fill = am4core.color('#000000'); // Label color
//                 label.fontSize = 12;
//                 label.dy = -20; // Position above the bar
//                 label.align = "center";
//             });
//         });

//         var cursor = new am4charts.XYCursor();
//         chart.cursor = cursor;
//         chart.logo.disabled = true;
//     }); // end am4core.ready()
// }

async function showClusteredBarChart1() {
    async function fetchScopeData(scopeUrl) {
        try {
            const response = await fetch(scopeUrl);
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "application/xml");

            const values = Array.from(xml.querySelectorAll("real"))
                .map(real => parseFloat(real.getAttribute("val"))).filter(val => !isNaN(val));

            return values.reduce((sum, value) => sum + value, 0);
        } catch (error) {
            console.error("Error fetching data:", error);
            return 0;
        }
    }

    // Get last 12 months
    const last12Months = getLast12Months1();

    // Define the URLs for each scope
    const urls = last12Months.map(month => {
        return [
            `https://localhost/obix/histories/SqlServerDatabase/scopes1/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&end=${month.endDate}T00:00:00.000+05:30`,
            `https://localhost/obix/histories/SqlServerDatabase/scopes2/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&end=${month.endDate}T00:00:00.000+05:30`
        ];
    });

    const scope1Data = [];
    const scope2Data = [];

    // Fetch data for each month
    for (let i = 0; i < urls.length; i++) {
        const scope1Total = await fetchScopeData(urls[i][0]);
        const scope2Total = await fetchScopeData(urls[i][1]);

        scope1Data.push(scope1Total);
        scope2Data.push(scope2Total);
    }

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

        // Generate the chart data using scope1Data and scope2Data for the last 12 months
        chart.data = last12Months.map((month, index) => ({
            category: month.startDate.substring(0, 7),   // Extracting the year-month part as a string (e.g., '2023-11')
            scope1: scope1Data[index],
            scope2: scope2Data[index]
        }));

        // Create series for Scope 1 and Scope 2 data
        createSeries('scope1', 'Scope 1', '#C65BCF'); // Scope 1 data
        createSeries('scope2', 'Scope 2', '#39A7FF'); // Scope 2 data

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
});
/* water consumption end */

/* power consumption start */
let powerChart;

async function lineChart3() {
  // const response = await fetch(url + "/obix/histories/Barclays/scope1/~historyQuery?start=2024-11-10&end=2024-11-11");
  //   const text = await response.text();

  //   // Parse the XML data
  //   const parser = new DOMParser();
  //   const xmlDoc = parser.parseFromString(text, "text/xml");

  //   // Get all <ref> elements (which include scope1, scope2, etc.)
  //   const refs = xmlDoc.getElementsByTagName("ref");

  //   // Initialize arrays to store scope names and values
  //   let waterNames = [];
  //   let waterValues = [];

  //   // Iterate through the <ref> elements to extract scope names and their display values
  //   for (let i = 0; i < refs.length; i++) {
  //       const ref = refs[i];
        
  //       const displayName = ref.getAttribute("name");

  //       // If display value contains a valid number, extract it
  //       if (displayName == "Total_DOMESTIC_Use" || displayName == "Total_FLUSHING_Use") {
  //           const valueText = ref.getAttribute("display");
  //           const valueMatch = valueText && valueText.match(/(^\d+(\.\d+)?)/); // Match numeric value
  //           if (valueMatch) {
  //               const value = parseFloat(valueMatch[0]); // Parse the numeric value
  //               waterNames.push(displayName); // Add the display name to the list
  //               waterValues.push(value); // Add the value to the list
  //           }
  //       }
  //   }
  //   // Dispose of existing chart if it exists
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

  //   am4core.ready(function () {
  //       // Themes begin
  //       am4core.useTheme(am4themes_animated);
  //       // Themes end

  //       // Create chart instance
  //       powerChart = am4core.create("chartdiv2", am4charts.XYChart);

  //       // Add data (use getRandomData for dynamic values and getLast12Months for x-axis categories)
  //       const months = getLast12Months(); // Get the last 12 months
  //       const randomData = getRandomData(); // Generate random data for each month

  //       // Prepare data array based on generated months and data
  //       powerChart.data = months.map((month, index) => ({
  //           "month": month, // Month name
  //           "value": randomData[index] // Corresponding random value
  //       }));

  //       // Create axes
  //       var categoryAxis = powerChart.xAxes.push(new am4charts.CategoryAxis());
  //       categoryAxis.dataFields.category = "month";
  //       categoryAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set x-axis labels color
  //       categoryAxis.title.fill = am4core.color("#000000"); // Set x-axis title color
  //       categoryAxis.renderer.labels.template.rotation = 315; // Set rotation
  //       categoryAxis.renderer.labels.template.horizontalCenter = "right"; // Align to the right
  //       categoryAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
  //       categoryAxis.renderer.minGridDistance = 1; // Ensure all categories are displayed
  //       categoryAxis.renderer.labels.template.dy = -15;
  //       categoryAxis.renderer.labels.template.fontSize = 10;
  //       categoryAxis.renderer.labels.template.dx = 10;

  //       var valueAxis = powerChart.yAxes.push(new am4charts.ValueAxis());
  //       valueAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set y-axis labels color
  //       valueAxis.title.fill = am4core.color("#000000"); // Set y-axis title color

  //       // Create series
  //       var lineSeries = powerChart.series.push(new am4charts.LineSeries());
  //       lineSeries.dataFields.valueY = "value";
  //       lineSeries.dataFields.categoryX = "month";
  //       lineSeries.strokeWidth = 2;
  //       lineSeries.stroke = am4core.color("#14C38E");

  //       // Add circle bullet
  //       var bullet = lineSeries.bullets.push(new am4charts.CircleBullet());
  //       bullet.circle.radius = 3; // Size of the bullet point
  //       bullet.circle.strokeWidth = 0.5;
  //       bullet.circle.fill = am4core.color("#fc030b"); // Bullet fill color
  //       bullet.circle.stroke = am4core.color("#14C38E"); // Bullet stroke color

  //       // Set the bullet's color to match the line's color
  //       bullet.adapter.add("fill", function (fill, target) {
  //           return target.stroke;
  //       });

  //       // Configure cursor
  //       var cursor = new am4charts.XYCursor();
  //       lineSeries.tooltipText = "{categoryX}: [bold]{valueY}[/]";
  //       lineSeries.tooltip.getFillFromObject = false; // Disable tooltip fill from series
  //       lineSeries.tooltip.background.fill = am4core.color("#14C38E"); // Set tooltip background color
  //       lineSeries.tooltip.label.fill = am4core.color("#ffffff"); // Set tooltip label color
  //       lineSeries.tooltip.pointerOrientation = "horizontal"; // Set tooltip orientation

  //       powerChart.cursor = cursor; // Assign cursor to chart
  //       powerChart.logo.disabled = true;
  //   }); // end am4core.ready()
  
am4core.ready(async function () {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    // Create chart instance
    var powerChart = am4core.create("chartdiv2", am4charts.XYChart);

    // Fetch month names for last 12 months using the getLast12Months() function
    const last12Months = getLast12Months1(); // Assuming this returns an array with month data for the URLs
    console.log("Last 12 Months (from getLast12Months1):", last12Months);

    // Define the URLs for each month
    const urls = last12Months.map(month => {
        return `https://localhost/obix/histories/SqlServerDatabase/MonthlyHistory2324/~historyQuery?start=${month.startDate}T00:00:00.000+05:30&limit=1`;
    });
   // console.log("URLs to fetch data from:", urls);  // Log the generated URLs

    // Create an array to hold the chart data
    const chartData = [];

    // Loop through the URLs asynchronously using a for loop
    for (const [index, scopeUrl] of urls.entries()) {
        try {
            // Fetch data using async/await
            const response = await fetch(scopeUrl);
            const text = await response.text(); // Get the response as text
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "application/xml");

            // Debugging: Log the entire XML structure to check if it's as expected
            console.log("Parsed XML Document:", xml);

            // Extract all 'obj' elements from the XML
            const records = xml.getElementsByTagName("obj");
            console.log("XML Records:", records);  // Log the records to check if they're found

            // Process each record and adjust the month
            for (let i = 0; i < records.length; i++) {
                const timestamp = records[i].getElementsByTagName("abstime")[0]?.getAttribute("val");
                const value = records[i].getElementsByTagName("real")[0]?.getAttribute("val");

                // Log to check the extracted timestamp and value
                console.log("Timestamp:", timestamp, "Value:", value);
                
                const date = new Date(timestamp);  // '2024-10-01T00:00:00.000+05:30'
 let month = date.setMonth(date.getMonth() - 1);
 console.log("month number get " + month);
            console.log("Month no " + month);
            const months = date.toLocaleString('default', { month: 'long' });
            console.log("string no " + months);
            const year = date.getFullYear();
            
const formattedMonth = `${months} ${year}`;
console.log("Formatted Month and Year:", formattedMonth);

                // If there is no timestamp or value, skip to next record
                if (!timestamp || !value) continue;

                // Log the corresponding month name from getLast12Months()
                //console.log("Month name from monthNames:", monthNames[month]);

                // Push data to chartData
                chartData.push({
                     month: formattedMonth,  // Use the correct month name from monthNames array
                    value: parseFloat(value)   // Convert value to a float for proper numeric handling
                });
            }

            // Debugging: Log chart data after processing
            console.log("Chart Data:", chartData);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Update chart data
    powerChart.data = chartData;

    // Create category axis (X-axis) for months
    var categoryAxis = powerChart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "month"; // Bind X-axis to month
    categoryAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set x-axis labels color
    categoryAxis.title.fill = am4core.color("#000000"); // Set x-axis title color
    categoryAxis.renderer.labels.template.rotation = 315; // Set rotation for better display
    categoryAxis.renderer.labels.template.horizontalCenter = "right"; // Align to the right
    categoryAxis.renderer.labels.template.verticalCenter = "middle"; // Center vertically
    categoryAxis.renderer.minGridDistance = 1; // Ensure all categories are displayed
    categoryAxis.renderer.labels.template.dy = -15;
    categoryAxis.renderer.labels.template.fontSize = 10;
    categoryAxis.renderer.labels.template.dx = 10;

    // Create value axis (Y-axis) for data values
    var valueAxis = powerChart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fill = am4core.color("#000000"); // Set y-axis labels color
    valueAxis.title.fill = am4core.color("#000000"); // Set y-axis title color

    // Create series (line) to represent the data
    var lineSeries = powerChart.series.push(new am4charts.LineSeries());
    lineSeries.dataFields.valueY = "value"; // Bind Y-axis to data values
    lineSeries.dataFields.categoryX = "month"; // Bind X-axis to months
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

    // Configure cursor for interaction
    var cursor = new am4charts.XYCursor();
    lineSeries.tooltipText = "{categoryX}: [bold]{valueY}[/]"; // Tooltip text
    lineSeries.tooltip.getFillFromObject = false; // Disable tooltip fill from series
    lineSeries.tooltip.background.fill = am4core.color("#14C38E"); // Set tooltip background color
    lineSeries.tooltip.label.fill = am4core.color("#ffffff"); // Set tooltip label color
    lineSeries.tooltip.pointerOrientation = "horizontal"; // Set tooltip orientation

    powerChart.cursor = cursor; // Assign cursor to chart
    powerChart.logo.disabled = true;
});



}

async function lineChart4() {
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate());

// Format the date (optional)
let previousDate = currentDate.toISOString().split('T')[0];
console.log("previos day " + previousDate);
    const response = await fetch(url + "/obix/histories/Barclays/scope1/~historyQuery?start=" + previousDate + "T00:00:00.000+05:30");
  console.log(response);
  const text = await response.text();

  // Parse the XML data
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  // Get all <obj> elements that contain timestamp and value
  const objElements = xmlDoc.getElementsByTagName("obj");

  // Initialize arrays to store time and value
  let times = [];
  let values = [];

  // Iterate through the <obj> elements to extract the time and value
  for (let i = 0; i < objElements.length; i++) {
    const obj = objElements[i];

    const timestampElement = obj.getElementsByTagName("abstime")[0];
    const valueElement = obj.getElementsByTagName("real")[0];

    // Check if both timestamp and value exist and are not null
    if (timestampElement && valueElement) {
      const timestamp = timestampElement.getAttribute("val");
      const value = valueElement.getAttribute("val");

      if (timestamp && value) {
        // Extract only the time (HH:mm) from the timestamp
        const time = timestamp.split("T")[1]?.split(":").slice(0, 2).join(":");

        // Ensure time is valid and add to arrays
        if (time) {
          times.push(time);
          values.push(parseFloat(value));
        }
      }
    }
  }

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

    // Prepare data array based on extracted times and values
    powerChart.data = times.map((time, index) => ({
      "time": time, // Time in HH:mm format
      "value": values[index] // Corresponding value
    }));

    // Create axes
    var categoryAxis = powerChart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "time";
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
    lineSeries.dataFields.categoryX = "time";
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
    
    // Enable zooming and panning
    powerChart.scrollbarX = new am4core.Scrollbar();
    powerChart.scrollbarX.disabled = true; // Disable scrollbar (we don't need it)
    powerChart.zoomOutButton.disabled = false; // Allow the user to zoom out using a button

    // Enable zooming on both axes
    powerChart.xAxes.getIndex(0).renderer.minGridDistance = 50; // Optional: increase this to reduce the zoom level
    powerChart.cursor = new am4charts.XYCursor();
    powerChart.cursor.behavior = "zoomXY"; // Enable zoom on both axes

    
    powerChart.cursor = cursor; // Assign cursor to chart
    powerChart.logo.disabled = true;
  }); // end am4core.ready()
}

lineChart4();


async function barChart() {
    var startDateValue = $("#startDatePower").val();
    var endDateValue = $("#endDatePower").val();
    
    // Define the scopes
    const scopes = ['scope1', 'scope2', 'scope3'];
    
    let scopeValues = [];

    // Fetch data for each scope
    for (let scope of scopes) {
        const response = await fetch(url + `/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startDatePower}&end=${endDatePower}`);
        const text = await response.text();

        // Parse the XML data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Get all <obj> elements
        const objs = xmlDoc.getElementsByTagName("obj");

        // Process each <obj> element
        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            const abstime = obj.getElementsByTagName("abstime")[0];
            const real = obj.getElementsByTagName("real")[0];

            if (abstime && real) {
                const dateText = abstime.getAttribute("val");
                const valueText = real.getAttribute("val");

                if (valueText && dateText) {
                    const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                    const date = new Date(dateText);

                    // Add the data for each scope
                    const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                    if (existingEntry) {
                        existingEntry[scope] = parseFloat(value); // Add the value to the existing entry for that date
                    } else {
                        scopeValues.push({
                            date: date,
                            [scope]: parseFloat(value) // Dynamically add the value for the scope
                        });
                    }
                }
            }
        }
    }

    if (startDateValue && endDateValue) {
        var startDate = new Date(startDateValue);
        var endDate = new Date(endDateValue);

        // if (!await validateDateRange(startDate, endDate)) {
        //     return; // Exit if validation fails
        // }

        // var chartData = generateChartData(startDate, endDate);

        // function generateChartData(startDate, endDate) {
        //     var chartData = [];
        //     var visits = 1200;

        //     var currentDate = new Date(startDate);
        //     while (currentDate <= endDate) {
        //         visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

        //         chartData.push({
        //             date: new Date(currentDate),
        //             power: visits
        //         });

        //         currentDate.setDate(currentDate.getDate() + 1);
        //     }
        //     return chartData;
        // }

        // if (chartData.length === 0) {
        //     alert('No data to display for the selected range');
        //     return;
        // }

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
            "dataProvider": scopeValues,
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
                    "valueField": "scope1",
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
    const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);
    const endDate = new Date(today.getFullYear(), currentMonth, 0);

    const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    // Define the scopes
    const scopes = ['scope1', 'scope2', 'scope3'];
    
    let scopeValues = [];

    // Fetch data for each scope
    for (let scope of scopes) {
        const response = await fetch(url + `/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startISO}&end=${endISO}`);
        const text = await response.text();

        // Parse the XML data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Get all <obj> elements
        const objs = xmlDoc.getElementsByTagName("obj");

        // Process each <obj> element
        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            const abstime = obj.getElementsByTagName("abstime")[0];
            const real = obj.getElementsByTagName("real")[0];

            if (abstime && real) {
                const dateText = abstime.getAttribute("val");
                const valueText = real.getAttribute("val");

                if (valueText && dateText) {
                    const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                    const date = new Date(dateText);

                    // Add the data for each scope
                    const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                    if (existingEntry) {
                        existingEntry[scope] = parseFloat(value); // Add the value to the existing entry for that date
                    } else {
                        scopeValues.push({
                            date: date,
                            [scope]: parseFloat(value) // Dynamically add the value for the scope
                        });
                    }
                }
            }
        }
    }
    // var chartData = generateChartData(startDate, endDate);

    // function generateChartData(startDate, endDate) {
    //     var chartData = [];
    //     var visits = 1200;

    //     var currentDate = new Date(startDate);
    //     while (currentDate <= endDate) {
    //         visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

    //         chartData.push({
    //             date: new Date(currentDate),
    //             scope1: visits
    //         });

    //         currentDate.setDate(currentDate.getDate() + 1);
    //     }
    //     return chartData;
    // }

    // // Alert if no data exists
    // if (chartData.length === 0) {
    //     alert('No data to display for the selected range');
    //     return;
    // }

    // // Destroy existing chart if it exists
    // if (powerChart) {
    //     if (powerChart instanceof ApexCharts) {
    //         console.log("Pie chart destroyed");
    //         powerChart.destroy(); // Dispose the existing chart
    //     } else if (powerChart instanceof AmCharts.AmChart) {
    //         console.log("Pie chart destroyed");
    //         powerChart.clear(); // Clear the existing AmCharts instance
    //     } else if (powerChart instanceof am4charts.XYChart) {
    //         console.log("Pie chart destroyed");
    //         powerChart.dispose(); // Dispose the existing am4charts instance
    //     }
    // }

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
        "dataProvider": scopeValues,
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
   // Fetch XML data from the server
        const response = await fetch("https://localhost/obix/config/Barclays/Occpancy/Occupancy$20Sensor/");
        const text = await response.text();

        // Parse the XML data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Get all <ref> elements (which include scope1, scope2, etc.)
        const outElement = xmlDoc.querySelector('real[name="out"]');
        const outValue = parseFloat(outElement.getAttribute('val'));
        console.log("out Values" + outValue);
        
    var options = {
        series: [outValue],
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
  
  const scopes = ['Floor1', 'Floor2'];
    let upsData = [];
    
    // Loop through each scope to fetch and process data
    for (let scope of scopes) {
        try {
            const response = await fetch(`https://localhost/obix/config/Barclays/Occpancy/${scope}`);
            const text = await response.text();

            // Parse the XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "application/xml");

            // Extract values for ups, hvac, and rtltg
            const ups = parseFloat(xmlDoc.querySelector('ref[name="occupancy"]').getAttribute('display').split(' ')[0]);
            upsData.push(ups);
        } catch (error) {
            console.error(`Error fetching data for ${scope}:`, error);
        }
    }
    var options = {
        series: [{
            name: 'Occupancy Efficiency',
            data: upsData // Data for HVAC (Floor 1, Floor 2)
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
    const scopes = ['scope1', 'scope2', 'scope3'];
    
    let scopeValues = [];

    // Fetch data for each scope
    for (let scope of scopes) {
        const response = await fetch(`https://localhost/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startDateValue}&end=${endDateValue}`);
        const text = await response.text();

        // Parse the XML data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Get all <obj> elements
        const objs = xmlDoc.getElementsByTagName("obj");

        // Process each <obj> element
        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            const abstime = obj.getElementsByTagName("abstime")[0];
            const real = obj.getElementsByTagName("real")[0];

            if (abstime && real) {
                const dateText = abstime.getAttribute("val");
                const valueText = real.getAttribute("val");

                if (valueText && dateText) {
                    const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                    const date = new Date(dateText);

                    // Add the data for each scope
                    const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                    if (existingEntry) {
                        existingEntry[scope] = parseFloat(value); // Add the value to the existing entry for that date
                    } else {
                        scopeValues.push({
                            date: date,
                            [scope]: parseFloat(value) // Dynamically add the value for the scope
                        });
                    }
                }
            }
        }
    }

    if (startDateValue && endDateValue) {
        var startDate = new Date(startDateValue);
        var endDate = new Date(endDateValue);

        if (!await validateDateRange(startDate, endDate)) {
            return; // Exit if validation fails
        }

        // var chartData = generateChartData(startDate, endDate);

        // function generateChartData(startDate, endDate) {
        //     var chartData = [];
        //     var visits = 1200; // Initial value for occupancy efficiency
        //     var hits = 1220;

        //     var currentDate = new Date(startDate);
        //     while (currentDate <= endDate) {
        //         visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
        //         hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

        //         chartData.push({
        //             date: new Date(currentDate),
        //             occupancyefficiency: visits,
        //             occupancyefficiency1: hits
        //         });

        //         currentDate.setDate(currentDate.getDate() + 1);
        //     }
        //     return chartData;
        // }

        // if (chartData.length === 0) {
        //     alert('No data to display for the selected range');
        //     return;
        // }
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
            "dataProvider": scopeValues,
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
        //     labels: {
        //         style: {
        //             colors: '#000000',
        //         },
        //         rotate: 315, // Rotate x-axis labels by 315 degrees
        //     },
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
     const today = new Date();
            const currentMonth = today.getMonth();
            const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);
            const endDate = new Date(today.getFullYear(), currentMonth, 0);
            const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            
            const scopes = ['scope1', 'scope2', 'scope3'];
            let scopeValues = [];

            for (let scope of scopes) {
                const response = await fetch(`https://localhost/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startISO}&end=${endISO}`);
                const text = await response.text();

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");
                const objs = xmlDoc.getElementsByTagName("obj");

                for (let i = 0; i < objs.length; i++) {
                    const obj = objs[i];
                    const abstime = obj.getElementsByTagName("abstime")[0];
                    const real = obj.getElementsByTagName("real")[0];

                    if (abstime && real) {
                        const dateText = abstime.getAttribute("val");
                        const valueText = real.getAttribute("val");

                        if (valueText && dateText) {
                            const value = parseFloat(valueText).toFixed(2);
                            const date = new Date(dateText);

                            const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                            if (existingEntry) {
                                existingEntry[scope] = parseFloat(value);
                            } else {
                                scopeValues.push({
                                    date: date,
                                    [scope]: parseFloat(value)
                                });
                            }
                        }
                    }
                }
            }

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
                "dataProvider": scopeValues,
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
                    "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
                    "balloon": {
                        "adjustBorderColor": false,
                        "color": "#000",
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
                    "enabled": true
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

// async function createPieChart() {
  
//   const response = await fetch("https://localhost/obix/config/Barclays/IAQ/IAQ/");
//         const text = await response.text();

//         // Parse the XML data
//         const parser = new DOMParser();
//         const xmlDoc = parser.parseFromString(text, "text/xml");

//         // Get all <ref> elements (which include scope1, scope2, etc.)
//         const outElement = xmlDoc.querySelector('real[name="out"]');
//         const outValue = parseFloat(outElement.getAttribute('val'));
//         console.log("out Values" + outValue);

//     const style = document.createElement('style');
//     style.innerHTML = `
//         #chartdiv4 .apexcharts-text {
//             fill: #000000; /* Change this to your desired color */
//             /* Corrected property name font-size: 20px; */
//         font-weight: bold; /* Corrected property name */
//         }
//     `;
//     document.head.appendChild(style);
//     // Pie chart options
//     var options = {
//         series: [outValue],
//         chart: {
//             height: 290,
//             type: 'radialBar',
//         },
//         plotOptions: {
//             radialBar: {
//                 offsetY: 30,
//                 startAngle: 0,
//                 endAngle: 360,
//                 hollow: {
//                     margin: 5,
//                     size: '65%',
//                     background: 'transparent',
//                 },
//                 dataLabels: {
//                     name: { show: true },
//                     value: { show: true },
//                     total: {
//                         show: true,
//                         label: 'AQI',
//                         fontSize: '30px',
//                         fontWeight: 'bold',
//                         color: function(w) {
//                             // Dynamically set color based on totalValue
//                             const totalValue = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
//                             return totalValue > 50 ? 'green' : 'red';
//                         },
//                         formatter: function (w) {
//                             const totalValue = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
//                             return totalValue + (totalValue > 50 ? " Good" : " Bad");
//                         }
//                     }
//                 },
//                 track: {
//                     background: '#2F5AD0',
//                 }
//             }
//         },
//         colors: ["#FF6600"],
//         labels: ['AQI'],
//         legend: {
//             show: true,
//             floating: true,
//             fontSize: '16px',
//             position: 'top',
//             horizontalAlign: 'center',
//             offsetY: 1,
//             labels: { useSeriesColors: true },
//             markers: { size: 0 },
//             formatter: function (seriesName, opts) {
//                 return seriesName;
//             },
//             itemMargin: { vertical: 3 }
//         },
//         responsive: [{
//             breakpoint: 480,
//             options: {
//                 legend: { show: false }
//             }
//         }]
//     };

//     // Create a new pie chart
//     aqiCharts = new ApexCharts(document.querySelector("#chartdiv4"), options);
//     aqiCharts.render();
//     // clearDateInputsAir()
// }

async function createPieChart() {
    const response = await fetch("https://localhost/obix/config/Barclays/IAQ/IAQ/");
    const text = await response.text();

    // Parse the XML data
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Get the <real> element value
    const outElement = xmlDoc.querySelector('real[name="out"]');
    const outValue = parseFloat(outElement.getAttribute('val'));
    console.log("out Values: " + outValue);

    // Add style for initial chart appearance
    const style = document.createElement('style');
    style.innerHTML = `
        #chartdiv4 .apexcharts-text {
            font-size: 20px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    // Pie chart options
    var options = {
        series: [outValue],
        chart: {
            height: 290,
            type: 'radialBar',
            events: {
                rendered: function(chartContext, config) {
                    // Locate the text element after render
                    const totalValue = config.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    const totalTextElement = document.querySelector("#chartdiv4 .apexcharts-text.apexcharts-datalabel-label");

                    // Apply color based on condition
                    if (totalTextElement) {
                        totalTextElement.style.fill = totalValue > 50 ? 'green' : 'red';
                    }
                }
            }
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
                            // Add "Good" or "Bad" to label with a unique identifier
                            return totalValue + (totalValue > 50 ? " Good" : " Bad");
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

    // Create and render the chart
    aqiCharts = new ApexCharts(document.querySelector("#chartdiv4"), options);
    aqiCharts.render();
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
    const scopes = ['Floor1', 'Floor2'];
    let upsData = [];
    
    // Loop through each scope to fetch and process data
    for (let scope of scopes) {
        try {
            const response = await fetch(`https://localhost/obix/config/Barclays/IAQ/${scope}`);
            const text = await response.text();

            // Parse the XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "application/xml");

            // Extract values for ups, hvac, and rtltg
            const ups = parseFloat(xmlDoc.querySelector('ref[name="IAQ"]').getAttribute('display').split(' ')[0]);
            upsData.push(ups);
        } catch (error) {
            console.error(`Error fetching data for ${scope}:`, error);
        }
    }
    var options = {
        series: [upsData[0]],
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
        series: [upsData[1]],
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
    
    const waters = ['domestic', 'flushing'];
    let waterValues = [];

    // Fetch data for each scope
    for (let water of waters) {
        try {
            const response = await fetch(`https://localhost/obix/histories/SqlServerDatabase/${water}/~historyQuery?start=${startDateValue}&end=${endDateValue}`);
            if (!response.ok) throw new Error(`Error fetching ${water} data`);
            
            const text = await response.text();

            // Parse the XML data
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");

            // Get all <obj> elements
            const objs = xmlDoc.getElementsByTagName("obj");

            // Process each <obj> element
            for (let i = 0; i < objs.length; i++) {
                const obj = objs[i];
                const abstime = obj.getElementsByTagName("abstime")[0];
                const real = obj.getElementsByTagName("real")[0];

                if (abstime && real) {
                    const dateText = abstime.getAttribute("val");
                    const valueText = real.getAttribute("val");

                    if (valueText && dateText) {
                        const value = parseFloat(valueText).toFixed(2); // Format to 2 decimal places
                        const date = new Date(dateText);
                        const dateStr = date.toISOString().split('T')[0]; // Standard date string

                        // Add the data for each scope
                        const existingEntry = waterValues.find(entry => entry.date === dateStr);

                        if (existingEntry) {
                            existingEntry[water] = parseFloat(value); // Add the value to the existing entry for that date
                        } else {
                            waterValues.push({
                                date: dateStr,
                                [water]: parseFloat(value) // Dynamically add the value for the scope
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching or parsing data for ${water}:`, error);
            return; // Exit if there's an error
        }
    }

    // Check if there’s data to display
    if (waterValues.length === 0) {
        alert('No data available for the selected range');
        return;
    }

    if (startDateValue && endDateValue) {
        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);

        // Ensure the start date is not later than the end date
        if (startDate > endDate) {
            alert('Start Date cannot be after End Date');
            return;
        }
        

        // var chartData = generateChartData(startDate, endDate);

        // if (chartData.length === 0) {
        //     alert('No data to display for the selected range');
        //     return;
        // }
        // function generateChartData(startDate, endDate) {
        //     var chartData = [];
        //     var visits = 10;
        //     var currentDate = new Date(startDate);

        //     while (currentDate <= endDate) {
        //         visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
        //         chartData.push({
        //             date: new Date(currentDate),
        //             domesticwater: visits,
        //             flushingwater: visits + Math.round(Math.random() * 30)
        //         });
        //         currentDate.setDate(currentDate.getDate() + 1);
        //     }
        //     return chartData;
        // }
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
            "dataProvider": waterValues,
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
                "valueField": "domestic",
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
    const today = new Date();
            const currentMonth = today.getMonth();
            const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);
            const endDate = new Date(today.getFullYear(), currentMonth, 0);
            const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            
            const scopes = ['scope1', 'scope2', 'scope3'];
            let scopeValues = [];

            for (let scope of scopes) {
                const response = await fetch(`https://localhost/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startISO}&end=${endISO}`);
                const text = await response.text();

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");
                const objs = xmlDoc.getElementsByTagName("obj");

                for (let i = 0; i < objs.length; i++) {
                    const obj = objs[i];
                    const abstime = obj.getElementsByTagName("abstime")[0];
                    const real = obj.getElementsByTagName("real")[0];

                    if (abstime && real) {
                        const dateText = abstime.getAttribute("val");
                        const valueText = real.getAttribute("val");

                        if (valueText && dateText) {
                            const value = parseFloat(valueText).toFixed(2);
                            const date = new Date(dateText);

                            const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                            if (existingEntry) {
                                existingEntry[scope] = parseFloat(value);
                            } else {
                                scopeValues.push({
                                    date: date,
                                    [scope]: parseFloat(value)
                                });
                            }
                        }
                    }
                }
            }

    // Generate chart data for the previous month
    // var chartData = generateChartData(startDate, endDate);

    // function generateChartData(startDate, endDate) {
    //     var chartData = [];
    //     var visits = 1200;
    //     var hits = 1220;
    //     var views = 1240;

    //     var currentDate = new Date(startDate);
    //     while (currentDate <= endDate) {
    //         visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
    //         hits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
    //         views += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

    //         chartData.push({
    //             date: new Date(currentDate),
    //             scope1: visits,
    //             scope2: hits,
    //             scope3: views
    //         });

    //         currentDate.setDate(currentDate.getDate() + 1);
    //     }
    //     return chartData;
    // }

    // // Alert if no data exists
    // if (chartData.length === 0) {
    //     alert('No data to display for the selected range');
    //     return;
    // }

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
        "dataProvider": scopeValues,
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
//var epiChart; // Global reference to the current chart

// Function to replace the current chart with a new one
async function replaceEpiChart(newChartFunction) {
    // Check if there is an existing chart
    if (epiChart) {
        // Check if epiChart is an instance of ApexCharts
        if (epiChart instanceof ApexCharts) {
            console.log("ApexCharts instance destroyed");
            epiChart.destroy(); // Destroy the existing ApexCharts instance
        } 
        // Check if epiChart is an instance of AmCharts
        else if (epiChart instanceof AmCharts.AmChart) {
            console.log("AmCharts instance destroyed");
            epiChart.clear(); // Clear the existing AmCharts instance
        } 
        // Check if epiChart is an instance of am4charts.XYChart
        else if (epiChart instanceof am4charts.XYChart) {
            console.log("am4charts.XYChart instance destroyed");
            epiChart.dispose(); // Dispose the existing am4charts.XYChart instance
        }
    }
    
    // Create the new chart by calling the passed chart function
  await newChartFunction();
}


// async function epiDonutChart() {
//     const style = document.createElement('style');
//     style.innerHTML = `
//         #chartdiv5 .apexcharts-text {
//             fill: #000000; /* Change this to your desired color */
//             font-weight: bold;
//         }
//     `;
//     document.head.appendChild(style);

//     var seriesData = [33, 33, 34]; // Your data
//     var totalValue = seriesData.reduce((a, b) => a + b, 0); // Calculate the total value

//     var options = {
//         series: seriesData,
//         chart: {
//             type: 'donut',
//             height: "100%",
//             animations: {
//                 enabled: false // Disable all animations, including rotation
//             }
//         },
//         labels: ['HVAC', 'UPS', 'RP & LTG'], // Customize labels
//         tooltip: {
//             y: {
//                 formatter: function (val) {
//                     return val; // Customize the tooltip text
//                 }
//             }
//         },
//         colors: ['#FFB200', '#667BC6', '#D1E9F6'],
//         legend: {
//             show: true,
//             position: 'top', // Position the legend at the top
//             horizontalAlign: 'center', // Center the legend
//             labels: {
//                 colors: Array(5).fill('#000000'), // Set all legend label colors to black
//             },
//             offsetY: 0
//         },
//         plotOptions: {
//             pie: {
//                 donut: {
//                     size: '50%', // Set the size of the inner donut
//                     labels: {
//                         show: true,
//                         name: {
//                             show: true,
//                             fontSize: '30px',
//                             fontWeight: 'bold',
//                             color: '#000000',
//                             formatter: function () {
//                                 return 'EPI'; // Static 'EPI' label for each slice
//                             }
//                         },
//                         value: {
//                             show: true,
//                             fontSize: '30px',
//                             fontWeight: 'bold',
//                             color: '#000000',
//                             formatter: function () {
//                                 return totalValue; // Static total value displayed for each slice
//                             }
//                         },
//                         total: {
//                             show: true, // Show the total label
//                             label: 'EPI', // Static 'EPI' label in the center
//                             fontSize: '30px',
//                             fontWeight: 'bold',
//                             color: '#000000', // Total text color
//                             formatter: function () {
//                                 return totalValue; // Return the calculated total value
//                             }
//                         }
//                     },
//                     offsetY: 10
//                 }
//             }
//         },
//         responsive: [{
//             breakpoint: 480,
//             options: {
//                 chart: {
//                     width: 200
//                 },
//                 legend: {
//                     position: 'top'
//                 }
//             }
//         }],
//         stroke: {
//             show: false // Disable stroke (border) around the donut segments
//         }
//     };

//     // Create a new chart instance
//     epiChart = new ApexCharts(document.querySelector("#chartdiv5"), options);
//     epiChart.render();
//     //clearDateInputsEPI();
// }
//apexChart
let epiChart; // Declare the variable globally

async function epiDonutChart() {
    try {
        const response = await fetch("https://localhost/obix/config/Barclays/EPI/");
        const text = await response.text();
        
        // Parse the XML response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        // Extract values for ups, hvac, and rt&ltg
        const ups = parseFloat(xmlDoc.querySelector('ref[name="ups"]').getAttribute('display').split(' ')[0]);
        const hvac = parseFloat(xmlDoc.querySelector('ref[name="hvac"]').getAttribute('display').split(' ')[0]);
        const rtltg = parseFloat(xmlDoc.querySelector('ref[name="rt$26ltg"]').getAttribute('display').split(' ')[0]);

        const seriesData = [hvac, ups, rtltg];
        const totalValue = seriesData.reduce((a, b) => a + b, 0); // Calculate the total value

        // Define chart styles
        const style = document.createElement('style');
        style.innerHTML = `
            #chartdiv5 .apexcharts-text {
                fill: #000000;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
        
        // Check if there is an existing chart and destroy it
        // if (epiChart) {
        //     if (epiChart instanceof ApexCharts) {
        //         console.log("ApexCharts instance destroyed");
        //         epiChart.destroy(); // Destroy the existing ApexCharts instance
        //     } 
        //     // Check if epiChart is an instance of AmCharts
        //     else if (epiChart instanceof AmCharts.AmChart) {
        //         console.log("AmCharts instance destroyed");
        //         epiChart.clear(); // Clear the existing AmCharts instance
        //     } 
        //     // Check if epiChart is an instance of am4charts.XYChart
        //     else if (epiChart instanceof am4charts.XYChart) {
        //         console.log("am4charts.XYChart instance destroyed");
        //         epiChart.dispose(); // Dispose the existing am4charts.XYChart instance
        //     }
        // }

        // Chart configuration
        const options = {
            series: seriesData,
            chart: {
                type: 'donut',
                height: "100%",
                animations: {
                    enabled: false // Disable all animations, including rotation
                }
            },
            labels: ['HVAC', 'UPS', 'RP & LTG'],
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
                position: 'top',
                horizontalAlign: 'center',
                labels: {
                    colors: ['#000000', '#000000', '#000000'], // Legend label colors
                },
                offsetY: 0
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '50%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '30px',
                                fontWeight: 'bold',
                                color: '#000000',
                                formatter: function () {
                                    return 'EPI';
                                }
                            },
                            value: {
                                show: true,
                                fontSize: '30px',
                                fontWeight: 'bold',
                                color: '#000000',
                                formatter: function () {
                                    return totalValue;
                                }
                            },
                            total: {
                                show: true,
                                label: 'EPI',
                                fontSize: '30px',
                                fontWeight: 'bold',
                                color: '#000000',
                                formatter: function () {
                                    return totalValue;
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
                show: false
            }
        };

        // Initialize the chart and store the instance in epiChart
        epiChart = new ApexCharts(document.querySelector("#chartdiv5"), options);
        epiChart.render();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

replaceEpiChart(epiDonutChart);

async function epiLine() {
    var startDateValue = document.getElementById("startDateEPI").value;
    var endDateValue = document.getElementById("endDateEPI").value;
            
            const scopes = ['scope1', 'scope2', 'scope3'];
            let scopeValues = [];

            for (let scope of scopes) {
                const response = await fetch(`https://localhost/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startDateValue}&end=${endDateValue}`);
                const text = await response.text();

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");
                const objs = xmlDoc.getElementsByTagName("obj");

                for (let i = 0; i < objs.length; i++) {
                    const obj = objs[i];
                    const abstime = obj.getElementsByTagName("abstime")[0];
                    const real = obj.getElementsByTagName("real")[0];

                    if (abstime && real) {
                        const dateText = abstime.getAttribute("val");
                        const valueText = real.getAttribute("val");

                        if (valueText && dateText) {
                            const value = parseFloat(valueText).toFixed(2);
                            const date = new Date(dateText);

                            const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                            if (existingEntry) {
                                existingEntry[scope] = parseFloat(value);
                            } else {
                                scopeValues.push({
                                    date: date,
                                    [scope]: parseFloat(value)
                                });
                            }
                        }
                    }
                }
            }

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
                "dataProvider": scopeValues,
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
                },
                {
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
                },
                {
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
       
    }
}

async function epiBarChart() {
    // Call replaceEpiChart function to handle any necessary replacements

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
   
}

async function lineChartMonthlyEpi() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const startDate = new Date(today.getFullYear(), currentMonth - 1, 1);
    const endDate = new Date(today.getFullYear(), currentMonth, 0);
    const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const scopes = ['scope1', 'scope2', 'scope3'];
    let scopeValues = [];

    for (let scope of scopes) {
        const response = await fetch(`https://localhost/obix/histories/SqlServerDatabase/${scope}/~historyQuery?start=${startISO}&end=${endISO}`);
        const text = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const objs = xmlDoc.getElementsByTagName("obj");

        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            const abstime = obj.getElementsByTagName("abstime")[0];
            const real = obj.getElementsByTagName("real")[0];

            if (abstime && real) {
                const dateText = abstime.getAttribute("val");
                const valueText = real.getAttribute("val");

                if (valueText && dateText) {
                    const value = parseFloat(valueText).toFixed(2);
                    const date = new Date(dateText);

                    const existingEntry = scopeValues.find(entry => entry.date.getTime() === date.getTime());

                    if (existingEntry) {
                        existingEntry[scope] = parseFloat(value);
                    } else {
                        scopeValues.push({
                            date: date,
                            [scope]: parseFloat(value)
                        });
                    }
                }
            }
        }
    }

    // Check if no data is found
    if (scopeValues.length === 0) {
        alert('No data to display for the selected range');
        return;
    }
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
        "dataProvider": scopeValues,
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
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",
                "fillColor": "#FFB200",
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
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",
                "fillColor": "#667BC6",
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
            "balloonText": "<span style='font-size:13px;'>[[value]]</span>",
            "balloon": {
                "adjustBorderColor": false,
                "color": "#000",
                "fillColor": "#D1E9F6",
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

$("#startDateEPI, #endDateEPI").on("change", async function () {
    await replaceEpiChart(epiLine);
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
    await replaceEpiChart(epiBarChart);
    clearDateInputsEpi();
});

var epiChart1;
async function epiColumnChart() {
   const scopes = ['Floor1', 'Floor2'];
    let hvacData = [];
    let upsData = [];
    let rtltgData = [];
    
    // Loop through each scope to fetch and process data
    for (let scope of scopes) {
        try {
            const response = await fetch(`https://localhost/obix/config/Barclays/EPI/${scope}`);
            const text = await response.text();

            // Parse the XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "application/xml");

            // Extract values for ups, hvac, and rtltg
            const ups = parseFloat(xmlDoc.querySelector('ref[name="ups"]').getAttribute('display').split(' ')[0]);
            const hvac = parseFloat(xmlDoc.querySelector('ref[name="hvac"]').getAttribute('display').split(' ')[0]);
            const rtltg = parseFloat(xmlDoc.querySelector('ref[name="rt$26ltg"]').getAttribute('display').split(' ')[0]);

            // Store the data for each scope
            hvacData.push(hvac);
            upsData.push(ups);
            rtltgData.push(rtltg);
        } catch (error) {
            console.error(`Error fetching data for ${scope}:`, error);
        }
    }

    if (epiChart1 instanceof ApexCharts) {
        console.log("Pie chart destroyed");
        epiChart1.destroy(); // Dispose the existing chart
    }
    var options = {
        series: [{
            name: 'HVAC',
            data: hvacData // Data for HVAC (Floor 1, Floor 2)
        }, {
            name: 'UPS',
            data: upsData // Data for UPS (Floor 1, Floor 2)
        }, {
            name: 'RT & LTG',
            data: rtltgData // Data for RT & LTG (Floor 1, Floor 2)
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
function getLast12Months1() {
        const months = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            months.push({
                startDate: `${firstDayOfMonth.getFullYear()}-${String(firstDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfMonth.getDate()).padStart(2, '0')}`,
                //endDate: `${lastDayOfMonth.getFullYear()}-${String(lastDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`
            });
        }

        return months;
    }
// function getLast12Months1() {
//     const months = [];
//     const now = new Date();

//     for (let i = 0; i <= 12; i++) {
//         // Calculate the first day of the month for the current iteration
//         const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        
//         // Push the formatted first day of the month (YYYY-MM-DD)
//         months.push({
//             startDate: `${firstDayOfMonth.getFullYear()}-${String(firstDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfMonth.getDate()).padStart(2, '0')}`
//         });
//     }

//     return months;
// }
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
});
