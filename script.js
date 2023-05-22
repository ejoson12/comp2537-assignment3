// Variables 
const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let filteredPokemons = [];
let types = [];

// Update pagination based on pages
const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty();

  const startPage = Math.max(currentPage - 2, 1);
  const endPage = Math.min(startPage + 4, numPages);

  for (let i = startPage; i <= endPage; i++) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons ${i === currentPage ? 'active' : ''}" value="${i}">${i}</button>
    `);
  }

  if (currentPage > 1) {
    $('#pagination').append(`
      <button class="btn btn-primary ml-1" id="prevButton">Previous</button>
    `);
  }

  if (currentPage < numPages) {
    $('#pagination').append(`
      <button class="btn btn-primary ml-1" id="nextButton">Next</button>
    `);
  }

  const startPokemon = (currentPage - 1) * PAGE_SIZE + 1;
  const endPokemon = Math.min(currentPage * PAGE_SIZE, filteredPokemons.length > 0 ? filteredPokemons.length : pokemons.length);
  const totalPokemons = filteredPokemons.length > 0 ? filteredPokemons.length : pokemons.length;
  $('#pokemonCount').text(`${startPokemon} - ${endPokemon} out of ${totalPokemons}`);
};

// Paginate the pokemon cards
const paginatePokemons = async (currentPage, PAGE_SIZE, pokemons) => {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = currentPage * PAGE_SIZE;
  const selectedPokemons = pokemons.slice(start, end);

  $('#pokeCards').empty();
  let currentRow = $('<div class="row"></div>');

  for (const pokemon of selectedPokemons) {
    const colSize = Math.floor(12 / 5);
    const res = await axios.get(pokemon.url);

    // Create the HTML for the pokemon card
    const pokeCardHTML = `
      <div class="pokeCard" pokeName="${res.data.name}">
        <h3>${res.data.name.toUpperCase()}</h3>
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}" />
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">More</button>
      </div>
    `;

    currentRow.append(pokeCardHTML);

    // If the current row has 5 pokemon cards, append it to the page and create a new row
    if (currentRow.children().length % 5 === 0) {
      $('#pokeCards').append(currentRow);
      currentRow = $('<div class="row"></div>');
    }
  }

  if (currentRow.children().length > 0) {
    $('#pokeCards').append(currentRow);
  }
};

// Filter the pokemons based on the selected types
const filterPokemons = async (selectedTypes) => {
  filteredPokemons = await Promise.all(pokemons.map(async (pokemon) => {
    const res = await axios.get(pokemon.url);
    const pokemonTypes = res.data.types.map((type) => type.type.name);
    return selectedTypes.every((type) => pokemonTypes.includes(type)) ? pokemon : null;
  }));

  filteredPokemons = filteredPokemons.filter((pokemon) => pokemon !== null);

  currentPage = 1;
  const filteredNumPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
  paginatePokemons(currentPage, PAGE_SIZE, filteredPokemons);
  updatePaginationDiv(currentPage, filteredNumPages);
};

// Setup the page
const setup = async () => {
  // Fetch the list of all pokemon from the API
  const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=810');
  pokemons = response.data.results;

  // Fetch the list of all types from the API
  const responseTypes = await axios.get('https://pokeapi.co/api/v2/type');
  types = responseTypes.data.results;

  // Create the HTML for the filter options
  for (const type of types) {
    $('#filterOptions').append(`
      <div class="form-check form-check-inline">
        <input class="form-check-input filterCheckbox" type="checkbox" value="${type.name}">
        <label class="form-check-label">${type.name}</label>
      </div>
    `);
  }

  $('#filterOptions').after('<div id="PokeCardsHeader"><h4 id="pokemonCount"></h4></div>');

  // Paginate the pokemon cards
  paginatePokemons(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
  const totalPokemons = pokemons.length;
  $('#pokemonCount').text(`1 - ${Math.min(PAGE_SIZE, totalPokemons)} out of ${totalPokemons}`);

  // Modal display on click
  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName');
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const types = res.data.types.map((type) => type.type.name);

    const modalBodyHTML = `
      <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}" />
        <div>
          <h3>Abilities</h3>
          <ul>${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>Stats</h3>
          <ul>${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}</ul>
        </div>
      </div>
      <h3>Types</h3>
      <ul>${types.map((type) => `<li>${type}</li>`).join('')}</ul>
    `;

    $('.modal-body').html(modalBodyHTML);

    const modalTitleHTML = `
      <h2>${res.data.name.toUpperCase()}</h2>
      <h5>${res.data.id}</h5>
    `;

    $('.modal-title').html(modalTitleHTML);
  });

  // Update pagination on numbered button click
  $('body').on('click', '.numberedButtons', function () {
    const page = parseInt($(this).val());
    currentPage = page;
    const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);

    if (filteredPokemons.length > 0 && currentPage <= numPages) {
      paginatePokemons(currentPage, PAGE_SIZE, filteredPokemons);
      updatePaginationDiv(currentPage, numPages);
    } else {
      const allPokemonsNumPages = Math.ceil(pokemons.length / PAGE_SIZE);
      paginatePokemons(currentPage, PAGE_SIZE, pokemons);
      updatePaginationDiv(currentPage, allPokemonsNumPages);
    }
  });

  // Update pagination on prev/next button click
  $('body').on('click', '#prevButton', function () {
    if (currentPage > 1) {
      currentPage--;

      if (filteredPokemons.length > 0) {
        paginatePokemons(currentPage, PAGE_SIZE, filteredPokemons);
        updatePaginationDiv(currentPage, Math.ceil(filteredPokemons.length / PAGE_SIZE));
      } else {
        paginatePokemons(currentPage, PAGE_SIZE, pokemons);
        updatePaginationDiv(currentPage, Math.ceil(pokemons.length / PAGE_SIZE));
      }
    }
  });

  $('body').on('click', '#nextButton', function () {
    let numPages;

    if (filteredPokemons.length > 0) {
      numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);

      if (currentPage < numPages) {
        currentPage++;
        paginatePokemons(currentPage, PAGE_SIZE, filteredPokemons);
        updatePaginationDiv(currentPage, numPages);
      }
    } else {
      numPages = Math.ceil(pokemons.length / PAGE_SIZE);

      if (currentPage < numPages) {
        currentPage++;
        paginatePokemons(currentPage, PAGE_SIZE, pokemons);
        updatePaginationDiv(currentPage, numPages);
      }
    }
  });

  // Filter the pokemons based on the selected types
  $('body').on('change', '.filterCheckbox', function () {
    const selectedTypes = $('.filterCheckbox:checked').map(function () {
      return $(this).val();
    }).get();

    if (selectedTypes.length > 2) {
      $(this).prop('checked', false);
    } else {
      filterPokemons(selectedTypes);
    }
  });
};

$(document).ready(setup);
