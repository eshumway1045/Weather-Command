let citySearchEl = document.querySelector("#city-search");
let citySearchBtnEl = document.querySelector("#cs-btn");
let cityPrevSearchEl = document.querySelector("#previous-cs-box");
let cityCurrWeatherEl = document.querySelector("#weather-box-top");
let cityFutWeatherEl = document.querySelector("#forcast-boxes");
let currDate = new Date();
const prevSearches = [];



// get the input from the text field

let formSubmitHandler = function (event) {
    event.preventDefault();
    let citySearchName = citySearchEl.value.trim();
    let searchHistoryEl = document.createElement("button");
    searchHistoryEl.textContent = citySearchName;
    searchHistoryEl.className = "p-search-btn";
    if (citySearchName) {
        getWeatherInfo(citySearchName);
        saveCityLocally(citySearchName);
        citySearchEl.value = "";
    } else {
        alert("Please enter a city name");
        return false;
    }
};

// saves the previous searches in localstorage and adds button to top for last search.

let saveCityLocally = function (citySearchedName) {
    prevSearches.push(citySearchedName);
    let pSearchBtnEl = document.createElement("button");
    pSearchBtnEl.className = "p-search-btn";
    pSearchBtnEl.setAttribute("data-city", citySearchedName);
    pSearchBtnEl.textContent = citySearchedName;
    pSearchBtnEl.addEventListener("click", function () {
        getWeatherInfo(citySearchedName);
    });
    cityPrevSearchEl.insertBefore(pSearchBtnEl, cityPrevSearchEl.firstChild);
    localStorage.setItem("cities", JSON.stringify(prevSearches));

};

// get any information from localstorage and send to get its contents created in the save function

let loadCity = function () {
    let citiesSearched = JSON.parse(localStorage.getItem("cities"));
    if (citiesSearched) {
        for (let i = 0; i < citiesSearched.length; i++) {
            saveCityLocally(citiesSearched[i]);
        }

    }
};

let getWeatherInfo = function (cityName) {

    //gets the latitude and longitude of the named city to put into the oncall api

    let apiUrlLatLon = "https://api.openweathermap.org/geo/1.0/direct?q=" + cityName + "&limit=1&appid=00ac63cafa4c25e7c142d8cdb9b63fc2";
    // Checks to see if we received a valid response
    fetch(apiUrlLatLon).then(function (response) {
        if (response.ok) {
            response.json().then(function (data) {

                //send data to function to get true city name and weather information

                getLocationInfo(data);
            });
        } else {
            alert("Cannot find City");
            return false;
        }
    });
};

let getLocationInfo = function (cInfo) {
    //uses the latitude and longitude from the data received to place another API call to get the latitude and longitude
    let apiUrl = "https://api.openweathermap.org/data/2.5/onecall?lat=" + cInfo[0].lat + "&lon=" + cInfo[0].lon + "&exclude=minutely,hourly&appid=00ac63cafa4c25e7c142d8cdb9b63fc2"
    //reverse the search to get the true name of the city from the coordinates
    let trueCityNameUrl = "https://api.openweathermap.org/geo/1.0/reverse?lat=" + cInfo[0].lat + "&lon=" + cInfo[0].lon + "&limit=1&appid=00ac63cafa4c25e7c142d8cdb9b63fc2";
    //get weather data
    Promise.allSettled([
        fetch(apiUrl).then(response => response.json()),
        fetch(trueCityNameUrl).then(response => response.json())
    ]).then(allResponses => displayWeatherInfo(allResponses[0].value, allResponses[1].value[0]));
};

let displayWeatherInfo = function (wInfo, tCityName) {
    // clear current weather elements

    cityCurrWeatherEl.innerHTML = "";
    cityFutWeatherEl.innerHTML = "";

    // get true city name from geolocation

    let currCityName = document.createElement("h2");
    currCityName.textContent = tCityName.name + ", " + tCityName.state + " (" + tCityName.country + ") | " + currDate.toDateString();
    let currWeatherIconEl = document.createElement("img");
    currWeatherIconEl.className = "weather-icon";
    currCityName.appendChild(currWeatherIconEl);
    cityCurrWeatherEl.appendChild(currCityName);

    //Create elements that will contain and show the information gathered from the data

    currWeatherIconEl.setAttribute("src", "https://openweathermap.org/img/wn/" + wInfo.current.weather[0].icon + "@2x.png");
    currWeatherIconEl.setAttribute("alt", wInfo.current.weather[0].description);

    let currTempEl = document.createElement("p");
    currTempEl.textContent = "Current Temperature: " + Math.floor((wInfo.current.temp - 273.15) * (9 / 5) + 32) + " (F)/" + Math.floor((wInfo.current.temp - 273.15)) + " (C) (or " + wInfo.current.temp + " (K))";
    cityCurrWeatherEl.appendChild(currTempEl)

    let currWindEl = document.createElement("p");
    currWindEl.textContent = "Wind Speed: " + (wInfo.current.wind_speed * 2.237).toFixed(2) + " MPH";
    cityCurrWeatherEl.appendChild(currWindEl)

    let currHumidityEl = document.createElement("p");
    currHumidityEl.textContent = "Humidity: " + wInfo.current.humidity + "%";
    cityCurrWeatherEl.appendChild(currHumidityEl)

    let currUVIndexEl = document.createElement("p");
    let currUVDangerEl = document.createElement("span");
    currUVDangerEl.textContent = wInfo.current.uvi;
    currUVDangerEl.id = "uv-danger";

    //set up color identifiers for UV index danger levels

    if (wInfo.current.uvi < 3) {
        currUVDangerEl.className = "uv-danger uv-low";
    } else if (wInfo.current.uvi >= 3 && wInfo.current.uvi < 6) {
        currUVDangerEl.className = "uv-danger uv-moderate";
    } else if (wInfo.current.uvi >= 6 && wInfo.current.uvi < 8) {
        currUVDangerEl.className = "uv-danger uv-high";
    } else if (wInfo.current.uvi >= 8 && wInfo.current.uvi < 11) {
        currUVDangerEl.className = "uv-danger uv-very-high";
    } else if (wInfo.current.uvi >= 11) {
        currUVDangerEl.className = "uv-danger uv-severe";
    } else {
        currUVDangerEl.className = "uv-danger uv-noneFound";
    }
    currUVIndexEl.textContent = "UV Index: ";
    currUVIndexEl.appendChild(currUVDangerEl);

    //append to container on webpage

    cityCurrWeatherEl.appendChild(currUVIndexEl)

    // create forecast boxes
    for (let i = 0; i < 5; i++) {
        let forcastData = wInfo.daily[i];
        let fBoxContEl = document.createElement("div");
        fBoxContEl.className = "f-box";

        let fBoxDateEl = document.createElement("h4");
        fBoxDateEl.textContent = new Date(forcastData.dt * 1000).toDateString();
        fBoxContEl.appendChild(fBoxDateEl);

        let fBoxSymEl = document.createElement("img");
        fBoxSymEl.setAttribute("src", "https://openweathermap.org/img/wn/" + forcastData.weather[0].icon + ".png");
        fBoxSymEl.setAttribute("alt", forcastData.weather[0].description);
        fBoxContEl.appendChild(fBoxSymEl);

        let fBoxTempEl = document.createElement("p");
        fBoxTempEl.textContent = "Temp: " + Math.floor((forcastData.temp.day - 273.15) * (9 / 5) + 32) + " (F)/" + Math.floor((forcastData.temp.day - 273.15)) + " (C)";
        fBoxContEl.appendChild(fBoxTempEl);

        let fBoxWindEl = document.createElement("p");
        fBoxWindEl.textContent = "Wind: " + (forcastData.wind_speed * 2.237).toFixed(2) + " MPH";
        fBoxContEl.appendChild(fBoxWindEl);

        let fBoxHumEl = document.createElement("p");
        fBoxHumEl.textContent = "Humidity: " + forcastData.humidity + "%";
        fBoxContEl.appendChild(fBoxHumEl);

        cityFutWeatherEl.appendChild(fBoxContEl);
    }

};

// add days for the forecast date element

function forecastDay(date, addD) {
    var result = new Date(date);
    result.setDate(result.getDate() + addD);
    return result.toDateString();
}

citySearchBtnEl.addEventListener("click", formSubmitHandler);

loadCity();

//establishes a variable to get the last place searched.

let lastElement = prevSearches[prevSearches.length - 1];
console.log(lastElement);

// load up the last place searched

getWeatherInfo(lastElement);