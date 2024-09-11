
const mongoose = require('mongoose');
const { cerrarSesion } = require('./authController');
const Vacantes = mongoose.model('Vacantes');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

exports.formularioNuevaVacante =  (req,res) => {
    res.render('nueva-vacante',{
        nombrePagina:'Nueva vacante',
        tagline:'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre:req.user.nombre,
        imagen: req.user.imagen
    })
};

//agrega las vacantes a la base de datos
exports.agregarVacante = async (req,res) => {
    const vacante = new Vacantes(req.body) // para mapear los campos automanticamente
    //USUARIO AUTOR DE LA VACANTE 
    vacante.autor = req.user._id;
    //crear arreglo de habilidades (skills)
    
    vacante.skills = req.body.skills.split(','); //crea el arreglo de skills
    
    //almacenarlo en la bd
    const nuevaVacante = await vacante.save();
    //redirecionar
    res.redirect(`/vacantes/${nuevaVacante.url}`)
};

//muestra una vacante

exports.mostrarVacante = async (req,res,next)  => {
    const vacante = await Vacantes.findOne({url: req.params.url}).populate('autor'); //se entraen los datos con req.params.url
    
    //si no hay resultados(vacantes)
    if(!vacante) return next();

    //finalmente mostrar una vista
    res.render('vacante',{
        vacante,
        nombrePagina: vacante.titulo,
        barra: true 
    })
};

exports.formEditarVacante = async (req,res,next) => {
    const vacante = await Vacantes.findOne({url: req.params.url});

    //si no existe vacante
    if(!vacante) return next();

    //vista de la pagina
    res.render('editar-vacante', {
        vacante: vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
};

exports.editarVacante = async (req,res,next) => {
    // 1. Se obtiene el cuerpo de la solicitud y se asigna a la variable vacanteActualizada.
    const vacanteActualizada = req.body;
     // 2. Se procesa la propiedad skills del cuerpo de la solicitud, separándola por comas y convirtiéndola en un array.
    vacanteActualizada.skills = req.body.skills.split(',')
     // 3. Se busca y actualiza una vacante en la base de datos que coincida con el URL proporcionado en los parámetros de la solicitud.
    //    Se utiliza el método findOneAndUpdate de Mongoose.
    const vacante = await Vacantes.findOneAndUpdate({url: req.params.url}, // Criterio de búsqueda: el URL de la vacante.
        vacanteActualizada, { // Nuevos datos para actualizar la vacante.
        new: true, // Devuelve el documento actualizado en lugar del original.
        runValidators: true // Ejecuta los validadores definidos en el esquema del modelo.
    });
    res.redirect(`/vacantes/${vacante.url}`)
};


exports.validarVacante = [
    // Sanitizar y validar los campos
    body('titulo').trim().escape().notEmpty().withMessage('Agrega un título a la vacante'),
    body('empresa').trim().escape().notEmpty().withMessage('Agrega una empresa'),
    body('ubicacion').trim().escape().notEmpty().withMessage('Agrega una ubicación'),
    body('salario').trim().escape(),
    body('contrato').trim().escape().notEmpty().withMessage('Elije tipo de contrato'),
    body('skills').trim().escape().notEmpty().withMessage('Agrega al menos una habilidad'),

    (req, res, next) => {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            // Recargar la vista con los errores
            req.flash('error', errores.array().map(error => error.msg));

            return res.render('nueva-vacante', {
                nombrePagina: 'Nueva vacante',
                tagline: 'LLena el formulario y aplica tu vacante',
                cerrarSesion: true,
                nombre: req.user.nombre,
                mensajes: req.flash()
            });
        }

        next(); // Siguiente middleware
    }
];

exports.eliminarVacante = async (req, res) => {
    const { id } = req.params;
    try {
        const vacante = await Vacantes.findById(id);
        if (!vacante) {
            return res.status(404).send('Vacante no encontrada');
        }
        if (verificarAutor(vacante, req.user)) {
            // Si este es el usuario, se puede eliminar
            await vacante.deleteOne();
            return res.status(200).send('Vacante eliminada correctamente');
        } else {
            // No permitido
            return res.status(403).send('No tienes permiso para eliminar esta vacante');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error interno del servidor');
    }
};
 
const verificarAutor = (vacante = {}, usuario = {}) => {
    if (!vacante.autor.equals(usuario._id)) {
        return false;
    }
    return true;
};

//subir archivos en pdf
// Función para subir un CV
exports.subirCV = (req, res, next) => {
    // Llama a la función de upload de multer para manejar la subida de archivos
    upload(req, res, function(error) {
        // Si hay un error durante la subida del archivo
        if (error) {
            // Verifica si el error es una instancia de MulterError
            if (error instanceof multer.MulterError) {
                // Verifica si el error es debido a que el tamaño del archivo excede el límite permitido
                if (error.code === 'LIMIT_FILE_SIZE') {
                    // Envía un mensaje flash con el error de tamaño de archivo
                    req.flash('error', 'El archivo es muy grande, máximo: 100 KB');
                } else {
                    // Envía un mensaje flash con cualquier otro error de multer
                    req.flash('error', error.message);
                }
            } else {
                // Envía un mensaje flash con cualquier otro error que no sea de multer
                req.flash('error', error.message);
            }
            // Redirige al usuario a la página anterior
            res.redirect('back');
            return;
        } else {
            // Si no hay errores, llama al siguiente middleware
            return next();
        }
    });
};


// Configuración de Multer para el almacenamiento de archivos subidos
const configuracionMulter = {
    // Define un límite para el tamaño del archivo: 100000 bytes (100 KB)
    limit: { fileSize: 100000 },
    // Definición de la propiedad 'storage' usando multer.diskStorage
    storage: fileStorage = multer.diskStorage({
        // Función para definir el directorio de destino de los archivos subidos
        destination: (req, file, cb) => {
            // Se llama al callback 'cb' con el directorio de destino
            cb(null, __dirname + '../../public/uploads/cv');
        },
        // Función para definir el nombre de los archivos subidos
        filename: (req, file, cb) => {
            // Obtiene la extensión del archivo a partir del tipo MIME del archivo
            const extension = file.mimetype.split('/')[1];
            // Genera un nombre de archivo único usando shortid y la extensión obtenida y Llama al callback 'cb' con el nombre de archivo generado
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        // Verifica si el tipo MIME del archivo es 'image/jpeg' o 'image/png'
        if (file.mimetype === 'application/pdf' || file.mimetype === 'image/png') {
            // El callback 'cb' se ejecuta con 'null' como primer argumento (sin error) y 'true' como segundo argumento (archivo aceptado)
            cb(null, true);
        } else {
            // Si el tipo MIME no es permitido, el callback 'cb' se ejecuta con 'null' como primer argumento (sin error) y 'false' como segundo argumento (archivo rechazado)
            cb(new Error('Formato no valido'), false);
        }
    }
};
// Definición de la constante 'upload' que utiliza la configuración de multer
const upload = multer(configuracionMulter).single('cv');

//almacenar a los nuevos candidatos en la bd
exports.contactar = async (req, res, next) => {
    // Busca una vacante en la base de datos utilizando el parámetro 'url' de la solicitud
    const vacante = await Vacantes.findOne({ url: req.params.url });

    // Si la vacante no existe, llama a la siguiente función middleware
    if (!vacante) return next();

    // Si todo está bien, construye el nuevo objeto candidato con los datos del cuerpo de la solicitud
    const nuevoCandidato = {
        nombre: req.body.nombre, // Nombre del candidato
        email: req.body.email, // Email del candidato
        cv: req.file.filename // Nombre del archivo del CV del candidato
    };

    // Agrega el nuevo candidato a la lista de candidatos de la vacante
    vacante.candidatos.push(nuevoCandidato);
    // Guarda los cambios en la base de datos
    await vacante.save();
    // Envía un mensaje flash indicando que el currículum se envió correctamente
    req.flash('correcto', 'Se envió tu curriculum correctamente');
    // Redirige al usuario a la página principal
    res.redirect('/');
};


exports.mostrarCandidatos = async (req, res, next) => {
    try {
        const vacante = await Vacantes.findById(req.params.id);
       
        if (!vacante) return next();

        if (vacante.autor != req.user._id.toString()) {
            return next();
        }
        res.render('candidatos', {
            nombrePagina: `Candidatos vacante - ${vacante.titulo}`,
            cerrarSesion: true,
            nombre: req.user.nombre,
            imagen: req.user.imagen,
            candidatos: vacante.candidatos
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
};

//buscador de vacantes
exports.buscarVacantes = async(req, res) => {
    const vacantes = await Vacantes.find({
        $text: {
            $search: req.body.q
        }
    }); //Agregar!
 
    // Mostrar las vacantes
    res.render('home', {
        nombrePagina: `Resultados para la búsqueda : ${req.body.q}`,
        barra: true,
        vacantes
 
    });
 
}
