const mongoose = require('mongoose');
const Vacantes = mongoose.model('Vacantes')



exports.mostrarTrabajos = async (req,res, next)  => {
    // traer vantyes de la base de datos

    const vacantes = await Vacantes.find();

    //si hoy vacantes
    if(!vacantes) return next();

    res.render('home',{
        nombrePagina:'devJobs',
        tagline: 'Encuentra y publica trabajos para desarrolladores web',
        barra: true,
        boton: true,
        vacantes: vacantes //si hay vacantes pasarlas a la vista 
    })
}