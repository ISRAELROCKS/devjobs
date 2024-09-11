
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('./config/db'); //importa el archivo de configuracion a la bd
const exphbs = require('express-handlebars')//importar handlebars
const path = require('path');
const router = require('./Routes');// importar el archivos routes que viene de  la carpeta routes y luego  toma el archivo index
const bodyParser = require('body-parser');
const express = require('express');
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');
const createError = require('http-errors')
const passport = require('./config/passport')



require('dotenv').config({path:'variables.env'}); //importa la libreria dot env para avilitar las variables de entorno en el archivo variables.env

const app = express();


// habilitar body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//validacion de campos 
app.use(express.json());


//habilitar handlebars como view(vista)
app.engine(
    'handlebars',
    exphbs.engine({
        layoutsDir: './views/layouts/',
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars'),
        extname: 'handlebars',
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
    })
);
app.set('view engine', 'handlebars');

//static files
app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: true,
    store:   MongoStore.create({
        
        mongoUrl: process.env.DATABASE,
        collectionName: 'sessions',
    }),
    cookie: { secure: false } // Usar true si está usando HTTPS
  }));

  //inicializar passport
  app.use(passport.initialize());
  app.use(passport.session());


  //alertas y flash message
  app.use(flash());

  //crear nuestro middleware
  app.use((req, res, next) => {
    res.locals.mensajes = req.flash();
    next();
  });


app.use('/' , router());

//404 pagina no existente

app.use((req, res, next) => {
    // Llama a la función next() con un error de tipo 404 (no encontrado) y un mensaje personalizado.
    next(createError(404, 'No encontrado'));
});


//administracion dfe los errores
app.use((error, req, res, next) => {
    // Asigna el mensaje del error a la variable local 'mensaje' que estará disponible en las vistas.
    res.locals.mensaje = error.message;
    // Establece el código de estado del error. Si el error no tiene un status, se usa 500 (Internal Server Error) por defecto.
    const status = error.status || 500; 
    // Almacena el estado del error en una variable local para usarla en la vista.
    res.locals.status = status;
    // Configura la respuesta HTTP con el código de estado correspondiente.
    res.status(status);
    // Renderiza la vista 'error', que probablemente mostrará la información del error al usuario.
    res.render('error');
});


//dejar que heroku asigne el puerto 
const host= '0.0.0.0';
const port = process.env.PORT;

app.listen(port,host, () =>{
    console.log('El servidor esta funcionando')
}); //escuchar la app en el puerto 5000 QUE ESTA EN EL ARCHIVO VARIABLES.ENV

