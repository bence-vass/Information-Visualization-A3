
// LOADING DATA
// ================================================================================== //

// filters and parses data during import
const dataImportFn = (d) => {
    // skip rows with missing data
    if (
        d.AccessionYear === "" ||
        d["Object Name"] === ""
    ) {
        return null;
    }
    return {
        // ...d, // keep all original data
        "AccessionYear": parseInt(d.AccessionYear),
        "ObjectName": d["Object Name"].toString(),
        "objectID": d["Object ID"].toString(),
    }
}

const DATA = await d3.csv("MetObjects.csv", dataImportFn);   // local file
const dataUrl = "https://media.githubusercontent.com/media/bence-vass/Information-Visualization-A3/refs/heads/main/MetObjects.csv"
// const DATA = await d3.csv(dataUrl, dataImportFn); // online file

// remove loading spinner after data is loaded
const loadingElement = document.getElementById("loadingChart");
if (loadingElement) {
    loadingElement.remove();
}

const minX = d3.min(DATA, d => d.AccessionYear);
const maxX = d3.max(DATA, d => d.AccessionYear);

console.log("Complete Data:");
console.log(DATA);

// ================================================================================== //
// LOADING DATA END






// Pie Chart Data Update
const pieChartSvg = d3.select("#pieChart")
    .append("svg")
    .attr("width", 400)
    .attr("height", 400)
    // .attr("style", "border:5px solid blue; background-color:white")

const updatePieChart = () => {

    const getPieData = (topN) => {
        if (!selectedData || selectedData.length === 0) return [];

        let pieData = [];
        if (!topN) topN = 9;
        const grouppedData = d3.rollups(selectedData,
            v => d3.sum(v, d => 1),
            d => d.ObjectName
        ).map(([key, value]) => ({ ObjectName: key, Count: value }));


        const sorted = grouppedData.sort((a, b) => d3.descending(a.Count, b.Count));
        pieData = sorted.slice(0, topN);
        const restData = sorted.slice(topN)
        const restCount = d3.sum(restData, d => d.Count)
        pieData.push({ ObjectName: "Other", Count: restCount })
        return pieData;
    }

    const pieData = getPieData();
    const pieWidth = 400;
    const pieHeight = 400;
    const outerRadius = pieHeight / 2 - 10;
    const innerRadius = outerRadius * 0.6;
    const tau = 2 * Math.PI;
    const color = d3.scaleOrdinal(d3.schemeObservable10);

    console.log("Pie Chart Data:", pieData);

    pieChartSvg.selectAll("*").remove(); // Clear previous chart

    const pie = d3.pie().sort(null).value((d) => d.Count);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    pieChartSvg.append("g")
        .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`)
        .selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i))
        .attr("stroke", "#111827")
        .attr("stroke-width", 2);
}


const lineChart = d3.select("#lineChart")
    .append("svg")
    .attr("width", 800)
    .attr("height", 400)
    .attr("style", "border:5px solid green; background-color:white")

const updateLineChart = () => {

}


const showcaseDiv = document.getElementById("objectShowcase");
const updateShowcase = async (randomN) => { // Make the function async

}



// Time Period Selection Brush
// ================================================================================= //
// https://observablehq.com/@d3/brush-snapping-transitions

const width = 800
const height = 60
const margin = ({ top: 10, right: 20, bottom: 20, left: 20 })

// Selected Data Update
let selectedData = null;
let selectedDateMin = null
let selectedDateMax = null

const updateSelectedData = () => {
    // console.log(selectedDateMin, selectedDateMax);
    const minYear = selectedDateMin.getFullYear();
    const maxYear = selectedDateMax.getFullYear();
    selectedData = DATA.filter(d => d.AccessionYear >= minYear && d.AccessionYear <= maxYear);
    console.log("Selected Data:", selectedData);

    updatePieChart();
    updateShowcase();
}

// Set Time Period Display
const setTimePeriod = (min, max) => {
    selectedDateMax = max
    selectedDateMin = min
    const text = `${d3.timeFormat("%b. %Y")(selectedDateMin)} - ${d3.timeFormat("%b. %Y")(selectedDateMax)}`;
    document.getElementById("timePeriod").innerText = text
    updateSelectedData();
}


const x = d3.scaleTime()
    .domain([new Date(minX, 1, 1), new Date(maxX, 11, 31) - 1])
    .rangeRound([margin.left, width - margin.right])


const brushEnded = (event) => {
    const selection = event.selection;
    const brushedYears = selection.map(x.invert);
    setTimePeriod(brushedYears[0], brushedYears[1]);
    selectedData = DATA.filter(d => d.AccessionYear >= selectedDateMin && d.AccessionYear <= selectedDateMax);

}

const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(g =>
        // Tick on the x axis every 2 years
        g.append("g")
            .call(d3.axisBottom(x)
                .ticks(d3.timeYear.every(2))
                .tickSize(-height + margin.top + margin.bottom)
                .tickFormat(() => null))
            // .call(g => g.select(".domain")
            //     .attr("fill", "#a75454ff")
            //     .attr("stroke", null))
            .call(g => g.selectAll(".tick line")
                .attr("stroke", "#fff")
                .attr("stroke-opacity", d => d <= d3.timeDay(d) ? 1 : 0.5))
    ).call(g =>
        // Year labels on the x axis every 10 years
        g.append("g")
            .call(d3.axisBottom(x)
                .ticks(d3.timeYear.every(10))
                .tickPadding(0))
            .attr("text-anchor", null)
            .attr("style", "font-size: 10px; font-family: sans-serif; color: #fff")
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("x", 6))
    )

const brush = d3.brushX()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("end", brushEnded);


const svg = d3.select("#timelineChart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    // .attr("style", "border:5px solid red; background-color:white");

svg.append("g")
    .call(xAxis)

const brushGroup = svg.append("g")
    .call(brush);

// Set default brush selection to last 5 years
const defaultSelection = [
    x(new Date(maxX - 15, 0, 1)), // Start: 15 years before maxX
    x(new Date(maxX, 11, 31))    // End: last day of maxX
];
brushGroup.call(brush.move, defaultSelection)

// ================================================================================= //
// Time Period Selection Brush END



