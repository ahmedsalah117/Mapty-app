'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//openstreetmap>>> is an open source map that you can easily use for free and it offers different map styles.

class WorkOut {
  Date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // The below note is essential for prettier to ignore the next line
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${
      this.type === 'running' ? ' Running' : ' Cycling'
    } on ${months[this.Date.getMonth()]} ${this.Date.getDate()}`;
  }
}

class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance; // min/km
    return this.pace;
  }
}

class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // km/hr
    return this.speed;
  }
}

////////////////////////////////////////////

//The Application Architecture....
class App {
  clicks = 0;
  #map;
  #mapEvent;
  workOuts = [];
  #zoomLevel = 13;
  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkOut.bind(this));
    containerWorkouts.addEventListener('click', this._moveMap.bind(this));
    this._getLocalStorage();
  }

  click() {
    this.clicks++;
    console.log(this.clicks);
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
      alert('could not get your location')
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];
    console.log(coords);
    this.#map = L.map('map').setView(coords, this.#zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.workOuts.forEach(ele => this.addMarkerLabel(ele));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();
    console.log('new workout');
    function inputsValidation(...inputs) {
      return inputs.every(input => Number.isFinite(input));
    }
    function isPositive(...inputs) {
      return inputs.every(input => input > 0);
    }

    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];

    //Validating the inputs;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    let workOut;

    if (type === 'running') {
      if (
        !inputsValidation(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      ) {
        return alert('All fields should be positive numbers');
      }
      workOut = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      if (
        !inputsValidation(distance, duration, elevation) ||
        !isPositive(distance, duration, elevation)
      ) {
        return alert('All fields should be positive numbers');
      }
      workOut = new Cycling(coords, distance, duration, elevation);
    }

    this.workOuts.push(workOut);
    this._setLocalStorage();

    //adding a marker
    this._renderWorkOut(workOut);
    this.addMarkerLabel(workOut);

    this._hideForm();
  }

  addMarkerLabel(workOut) {
    L.marker(workOut.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
          className: `${workOut.type}-popup`,
        })
      )
      .setPopupContent(
        `${workOut.type === 'running' ? '🏃‍♂️' : '🚴‍♀️ '} ${workOut.description}`
      )
      .openPopup();
  }

  _renderWorkOut(workOut) {
    let html = `
    <li class="workout workout--${workOut.type}" data-id="${workOut.id}">
    <h2 class="workout__title">${workOut.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workOut.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workOut.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workOut.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    
    `;

    if (workOut.type === 'running') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workOut.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workOut.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
      `;
    }

    if (workOut.type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workOut.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workOut.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
      
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveMap(e) {
    const clickedWorkOut = e.target.closest('.workout');

    if (!clickedWorkOut) return;

    if (clickedWorkOut) {
      const workout = this.workOuts.find(
        workout => workout.id === clickedWorkOut.dataset.id
      );

      this.#map.setView(workout.coords, this.#zoomLevel, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
    this.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workOuts));
  }

  _getLocalStorage() {
    const workOuts = JSON.parse(localStorage.getItem('workouts'));
    if (!workOuts) return;
    this.workOuts = workOuts;
    workOuts.forEach(element => {
      return this._renderWorkOut(element);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload(); //Programmatic page reload.

    //location : is a big object that contains a lot of useful methods in the browser
  }
}

const app = new App();
