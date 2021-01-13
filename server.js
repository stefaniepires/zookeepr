const express = require('express');
const { animals } = require('./data/animals');
const fs = require('fs');
const path = require('path');

//when using the below on local machine and doesnt have a port defined, it will use 3001 as port
const PORT = process.env.PORT || 3001;
const app = express();

// parse incoming string or array data
//app.use() method is executed by the express.js server that mounts a function to the server that the request will pass through
//before getting to the endpoint
//the express.urlencoded method is built into express.js and takes incoming POST data and converts it to key/value pairings 
//that can be accessed in the req.body object. 
//the entended: true option that is set inside the method call informs the server that there may be subarray data nested in it 
//so it needs to look deep into the POST data in order to parse it correctly 
app.use(express.urlencoded({ extended: true }));
// parse incoming JSON data
//the express.json() method takes incoming POST data in the form of JSON and parses it into the req.body JS object
app.use(express.json());

function filterByQuery(query, animalsArray) {
  let personalityTraitsArray = [];
  // Note that we save the animalsArray as filteredResults here:
  let filteredResults = animalsArray;
  if (query.personalityTraits) {
    // Save personalityTraits as a dedicated array.
    // If personalityTraits is a string, place it into a new array and save.
    if (typeof query.personalityTraits === 'string') {
      personalityTraitsArray = [query.personalityTraits];
    } else {
      personalityTraitsArray = query.personalityTraits;
    }
    // Loop through each trait in the personalityTraits array:
    personalityTraitsArray.forEach(trait => {
      // Check the trait against each animal in the filteredResults array.
      // Remember, it is initially a copy of the animalsArray,
      // but here we're updating it for each trait in the .forEach() loop.
      // For each trait being targeted by the filter, the filteredResults
      // array will then contain only the entries that contain the trait,
      // so at the end we'll have an array of animals that have every one 
      // of the traits when the .forEach() loop is finished.
      filteredResults = filteredResults.filter(
        animal => animal.personalityTraits.indexOf(trait) !== -1
      );
    });
  }
  if (query.diet) {
    filteredResults = filteredResults.filter(animal => animal.diet === query.diet);
  }
  if (query.species) {
    filteredResults = filteredResults.filter(animal => animal.species === query.species);
  }
  if (query.name) {
    filteredResults = filteredResults.filter(animal => animal.name === query.name);
  }
  // return the filtered results:
  return filteredResults;
}


function findById(id, animalsArray) {
  const result = animalsArray.filter(animal => animal.id === id)[0];
  return result;
}

//this function accepts the POST route's req.body value and the array the data will be added to
//the array will be the animalsArray b/c function is for adding new animal to catalog
//this function will be executed within app.post() route's callback and will take the new animal data and add it to animalsArray
//then it will write the new array data to animals.json. Once saved, the data will be sent back to the route's callback function so it can
//finally respond to the request 
function createNewAnimal(body, animalsArray) {
  const animal = body;
  animalsArray.push(animal);
  //to write to animals.json
  //fs.writeFileSync() is the synchronous version of fs.writeFile()
  fs.writeFileSync(
    path.join(__dirname, './data/animals.json'), //use the method path.join() to join the value of __dirname
    JSON.stringify({ animals: animalsArray }, null, 2) //saving the JS array as JSON
    //null argument means we don't want to edit any of our existing data;
    //2 indicates we want to create white space between our values to make it more readable
  );
  return animal;
}

//validation function to make sure everything is working correctly
//It is going to take our new animal data from req.body and check if each key not only exists, 
//but that it is also the right type of data.
function validateAnimal(animal) {
  if (!animal.name || typeof animal.name !== 'string') {
    return false;
  }
  if (!animal.species || typeof animal.species !== 'string') {
    return false;
  }
  if (!animal.diet || typeof animal.diet !== 'string') {
    return false;
  }
  if (!animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
    return false;
  }
  return true;
}

//the /api/animals is like the address
app.get('/api/animals', (req, res) => {
  let results = animals;
  if (req.query) {
    results = filterByQuery(req.query, results);
  }
  res.json(results);
});

app.get('/api/animals/:id', (req, res) => {
  const result = findById(req.params.id, animals);
  if (result) {
    res.json(result);
  } else {
    res.send(404);
  }
});

app.post('/api/animals', (req, res) => {
  //set ID based on what the next index of the array will be
  //take length property of animals array and set that as the ID for the new data. 
  //The length prop is going to be 1 # ahead of the last index of the array so this will avoid value duplication 
  req.body.id = animals.length.toString();

//if any data in req.body is incorrect, send 400 error back
if (!validateAnimal(req.body)) {
  //res.status().send(); is a response method to relay a message to the client making the request
  res.status(400).send('The animal is not properly formatted.');
} else {

 // add animal to json file and animals array in this function
 const animal = createNewAnimal(req.body, animals);

  res.json(req.body);
}
});

app.listen(PORT, () => {
  console.log(`API server now on port ${PORT}!`);
});