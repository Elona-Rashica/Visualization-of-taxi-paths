// Default map
var map = L.map("map").setView([42.67365, 21.139115], 13);
var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});
osm.addTo(map);

// Dark map
var dark = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: "png",
  }
);

// Icon of the marker
var myIcon = L.icon({
  iconUrl: "img/mapMarker.jpg",
  iconSize: [15, 15],
});

// Grouping the maps
var baseMaps = {
  OSM: osm,
  DARK: dark,
};

// Remove the default zoom and add a new zoom control in bottomright
map.zoomControl.remove();
L.control.zoom({ position: "bottomleft" }).addTo(map);

// Add a layer control
L.control
  .layers(baseMaps, {}, { collapsed: false })
  .setPosition("bottomright")
  .addTo(map);

// Function to generate an array of visually distinct RGB colors
function generateRandomColors(quantity) {
  const randomColors = [];

  for (let i = 0; i < quantity; i++) {
    const hue = Math.floor(Math.random() * 360); // 0 to 359 degrees
    const saturation = Math.floor(Math.random() * 100); // 0 to 100%
    const lightness = Math.floor(Math.random() * 50) + 50; // 50 to 100%

    // const rgbColor = hslToRgb(hue, saturation, lightness);
    const rgbColor = hslToRgb(hue, 70, 50);
    const hexColor = rgbToHex(rgbColor);
    randomColors.push(hexColor);
  }

  return randomColors;
}
// Function to convert HSL to RGB
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hueToRgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Function to convert RGB to hex
function rgbToHex(rgb) {
  return (
    "#" +
    rgb.map((component) => component.toString(16).padStart(2, "0")).join("")
  );
}

var everyNminutes = function (n) {
  var result = [];
  for (var hours = 6; hours < 18; hours++) {
    for (var minutes = 0; minutes < 60; minutes = minutes + n) {
      var h = "";
      var m = "";
      if (hours < 10) {
        h = "0" + hours;
      } else {
        h = hours;
      }
      if (minutes < 10) {
        m = "0" + minutes;
      } else {
        m = minutes;
      }
      result.push(h + ":" + m);
    }
  }
  result.push("18:00");
  return result;
};

let timesArray = everyNminutes(15);
let taxiCounts = Array(timesArray.length).fill(0);
let myChart = new Chart("myChart", {
  type: "bar",
  data: {
    labels: timesArray,
    datasets: [
      {
        label: "Number of taxis",
        data: taxiCounts,
        backgroundColor: "rgba(255,99,132, 0.2)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        stepSize: 1,
      },
    },
  },
});


async function updateChart() {
  const fileInput = document.getElementById("csvFileInput");
  var startDate = document.getElementById("chartStartDate").value;
  var endDate = document.getElementById("chartEndDate").value;
  const files = Array.from(fileInput.files); // Convert files to an array

  if (startDate === "" && endDate === "") {
    startDate = document.getElementById("startDate").value;
    endDate = document.getElementById("endDate").value;
  }

  if (
    (startDate !== "" && endDate === "") ||
    (startDate === "" && endDate !== "")
  ) {
    alert("Please provide both dates!");
    return;
  }


  console.log("clicked");
  var onlyStartDate = new Date(startDate);
  var onlyEndDate = new Date(endDate);
  if (files.length === 0) {
    alert("Please select at least one CSV file.");
    return;
  }
  taxiCounts.fill(0, 0, taxiCounts.length);
  await Promise.all(
    files.map(async (file, index) => {
      return new Promise(async (resolve) => {
        try {
          const results = await new Promise((resolve) => {
            Papa.parse(file, {
              complete: (results) => resolve(results),
              header: true, // If the CSV has a header row
            });
          });

          //first filter only selected dates
          const csvRows = results.data.filter((row) => {
            var CSVdate = new Date(row.DeviceDateTime);
            return CSVdate >= onlyStartDate && CSVdate <= onlyEndDate && CSVdate.getHours() > 5 && CSVdate.getHours() < 18;
          });


          let datesDifference = onlyEndDate.getTime() - onlyStartDate.getTime();

          let numOfDaysBetween = datesDifference == 0 ? 0 : Math.floor(datesDifference / 86400000);

          let rowFound = false;

          for (let i = 0; i < timesArray.length - 1; i++) {

            let k = 0;

            const formattedStartDate = new Date(
              startDate.concat(" " + timesArray[i])
            );
            const nextFormattedDate = new Date(
              startDate.concat(" " + timesArray[i + 1])
            );

            rowFound = false;            
            do {
              rowFound = false;
              csvRows.forEach((row) => {
                const dateCSV = new Date(row.DeviceDateTime);
                formattedStartDate.setDate(formattedStartDate.getDate() + k);
                nextFormattedDate.setDate(nextFormattedDate.getDate() + k);
                if (
                  !rowFound &&
                  row.Speed > 0 &&
                  row.Di1 == 1 && 
                  formattedStartDate.getHours() == dateCSV.getHours() &&
                  ((
                    formattedStartDate.getMinutes() <= dateCSV.getMinutes() &&
                    nextFormattedDate.getMinutes() > dateCSV.getMinutes()) ||
                    (dateCSV.getMinutes() >= 45 &&
                    formattedStartDate.getMinutes() == 45))
                ) {
                  rowFound = true;
                  taxiCounts[i]++;
                } else rowFound = false;
              });
              k++;
            } while (k <= numOfDaysBetween);
          }
          resolve();
        } catch (error) {
          console.error("Error processing file", file.name, error);
          resolve(); // Resolve even if there's an error to continue with other files
        }
      });
    })
  );

  console.log(taxiCounts);
  console.log("Done");
  const modifiedTaxiCounts = taxiCounts.map(count => Math.ceil(count / 90));

  if (myChart) {
    myChart.destroy();
  }
  // Create chart after processing all files
  myChart = new Chart("myChart", {
    type: "bar",
    data: {
      labels: timesArray,
      datasets: [
        {
          label: "Number of taxis",
          data: modifiedTaxiCounts,
          backgroundColor: "rgba(255,99,132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
        },
      },
    },
  });
}

function toggleChartPopup() {
  const chartPopup = document.getElementById("chartPopup");
  const helpPopup = document.getElementById("helpPopup");
  const map = document.getElementById("map");

  helpPopup.style.display = "none"

  chartPopup.style.display === "none" || chartPopup.style.display === ""
  ? map.setAttribute('class', 'blur')
  : map.setAttribute('class', null);  

  chartPopup.style.display =
    chartPopup.style.display === "none" || chartPopup.style.display === ""
      ? "block"
      : "none";    
}

function toggleHelpPopup() {
  const helpPopup = document.getElementById("helpPopup");
  const chartPopup = document.getElementById("chartPopup");

  chartPopup.style.display = "none"
  const map = document.getElementById("map");

  helpPopup.style.display === "none" || chartPopup.style.display === ""
  ? map.setAttribute('class', 'blur')
  : map.setAttribute('class', null);  


  helpPopup.style.display =
    helpPopup.style.display === "none" || helpPopup.style.display === ""
      ? "block"
      : "none";
}

// Generate an array of 100 visually distinct hexadecimal colors
const arrayOfRandomColors = generateRandomColors(100);

// File handle
async function handleFile() {
  const fileInput = document.getElementById("csvFileInput");
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const files = Array.from(fileInput.files); // Convert files to an array

  if (!startTime || !endTime || !startDate || !endDate) {
    alert("Please provide all the input.");
    return;
  }

  if (files.length === 0) {
    alert("Please select at least one CSV file.");
    return;
  }

  const formattedStartDate = new Date(startDate.concat(" ", startTime));
  const formattedEndDate = new Date(endDate.concat(" ", endTime));

  // Clear previous polylines and update markers
  map.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      map.removeLayer(layer);
    }
  });

  // Use Promise.all to handle multiple files concurrently
  await Promise.all(
    files.map(async (file, index) => {
      return new Promise(async (resolve) => {
        try {
          const results = await new Promise((resolve) => {
            Papa.parse(file, {
              complete: (results) => resolve(results),
              header: true, // If the CSV has a header row
            });
          });

          //Filter csv rows based on date & time
          const csvRows = results.data.filter((row) => {
            var CSVdate = new Date(row.DeviceDateTime);
            return (
              CSVdate.getDate() >= formattedStartDate.getDate() &&
              CSVdate.getDate() <= formattedEndDate.getDate() &&
              CSVdate.getHours() >= formattedStartDate.getHours() &&
              CSVdate.getHours() < formattedEndDate.getHours()
              //CSVdate.getMinutes() >= formattedStartDate.getMinutes() &&
              //CSVdate.getMinutes() <= formattedEndDate.getMinutes()
            );
          });
          var taxiMeterON = 0;
          var flag = -1;
          let speed = 0;
          let avgSpeed;
          let numRows = 0;
          let latlngsFinal = [];
          let latlngsDashedFinal = [];

          //add latitude and longitute from filtered rows in an array
          let latlngs = [];
          let latlngsDashed = [];

          csvRows.forEach(function (row) {
       
            latlngs.push([row.Latitude, row.Longitute]);
          });

          let polyline = L.polyline(latlngs, {
            color: arrayOfRandomColors[index % arrayOfRandomColors.length],
          }).addTo(map);

          // csvRows.forEach(function (row) {
          //   if (parseInt(row.Speed) > 0) {
          //     speed = speed + parseInt(row.Speed);
          //     numRows++;
          //   }

          //   if (row.Di3 == 1) {
          //     if (flag == 1) {
          //       latlngs.push([row.Latitude, row.Longitute]);
          //     } else {
          //       if (latlngs.length > 0) {
          //         taxiMeterON++;
          //         latlngsFinal.push(latlngs);
          //         latlngs.length = 0;
          //       }
          //       latlngs.push([row.Latitude, row.Longitute]);
          //     }
          //   } else {
          //     if (flag == 0) {
          //       latlngsDashed.push([row.Latitude, row.Longitute]);
          //     } else {
          //       if (latlngsDashed.length > 0) {
          //         latlngsDashedFinal.push(latlngsDashed);
          //         latlngsDashed.length = 0;
          //       }
          //       latlngsDashed.push([row.Latitude, row.Longitute]);
          //     }
          //   }
          //   flag = row.Di3;
          // });

          // //Add the last sets of latlngs
          // if (latlngs.length > 0) {
          //   taxiMeterON++;
          // }
          // avgSpeed = speed / numRows;

          // latlngsFinal.push(latlngs);
          // latlngsDashedFinal.push(latlngsDashed);
          // console.log(index);
          // // Add polylines from latlngs array
          // let polyline = L.polyline(latlngsFinal, {
          //   color: arrayOfRandomColors[index % arrayOfRandomColors.length],
          // }).addTo(map);

          // let dashedPolyline = L.polyline(latlngsDashedFinal, {
          //   color: arrayOfRandomColors[index % arrayOfRandomColors.length],
          //   dashArray: "5, 5",
          // }).addTo(map);

          // polyline.on("click", function (event) {
          //   let clickedLatLng = event.latlng;

          //   // Create a popup and open it at the clicked coordinates
          //   L.popup()
          //     .setLatLng(clickedLatLng)
          //     .setContent(
          //       "The taxi meter was on " +
          //         taxiMeterON +
          //         " times and the average speed was " +
          //         avgSpeed.toFixed(2) +
          //         "!"
          //     )
          //     .openOn(map);
          // });

          // dashedPolyline.on("click", function (event) {
          //   // Get the coordinates where the click occurred
          //   let clickedLatLng = event.latlng;

          //   // Create a popup and open it at the clicked coordinates
          //   L.popup()
          //     .setLatLng(clickedLatLng)
          //     .setContent(
          //       "The taxi meter was on " +
          //         taxiMeterON +
          //         " times and the average speed was " +
          //         avgSpeed.toFixed(2) +
          //         "!"
          //     )
          //     .openOn(map);
          // });

          resolve();
        } catch (error) {
          console.error("Error processing file", file.name, error);
          resolve(); // Resolve even if there's an error to continue with other files
        }
      });
    })
  );
}
