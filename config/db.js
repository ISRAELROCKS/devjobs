//configuracion del archivo de la base de datos

const mongoose = require('mongoose');
require('dotenv').config({path:'variables.env'});


// mongoose.connect(process.env.DATABASE, {useNewUrlParser: true});modo viejo 

mongoose.connect(process.env.DATABASE, {
    
  }).then(() => {
    console.log('conectado con la Bd');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
  });  

  
  //importar modelos
  require('../Models/Usuarios');
  require('../Models/Vacantes');
  
