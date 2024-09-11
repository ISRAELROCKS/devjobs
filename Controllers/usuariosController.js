const mongoose = require('mongoose');
const Usuarios = require("../Models/Usuarios");
const {body, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');


exports.subirImagen = (req, res, next) => {
    // Llama a la función `upload` para manejar la subida de archivos
    upload(req, res, function(error) {
        // Si hay un error en el proceso de subida
        if (error) {
            // Si el error es una instancia de MulterError (errores específicos de multer)
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    // Si el código del error es 'LIMIT_FILE_SIZE' (indicando que el archivo excede el tamaño máximo permitido)
                    req.flash('error', 'El archivo es muy grande: Máximo 100 kb');
                    // Se envía un mensaje de error a través de flash, indicando al usuario que el archivo es demasiado grande
                } else {
                    // Si el error no es debido al tamaño del archivo
                    req.flash('error', error.message);
                    // Se envía el mensaje de error original a través de flash
                }
            } else {
                // Si el error es otro tipo de error, se envía un mensaje de error a través de flash
                req.flash('error', error.message);
            }
            // Redirige al usuario a la página de administración
            res.redirect('/administracion');
            return;
        } else {
            // Si no hay errores, continúa al siguiente middleware
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
            cb(null, __dirname + '../../public/uploads/perfiles');
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
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            // El callback 'cb' se ejecuta con 'null' como primer argumento (sin error) y 'true' como segundo argumento (archivo aceptado)
            cb(null, true);
        } else {
            // Si el tipo MIME no es permitido, el callback 'cb' se ejecuta con 'null' como primer argumento (sin error) y 'false' como segundo argumento (archivo rechazado)
            cb(new Error('Formato no valido'), false);
        }
    }
};

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req,res) => {
    res.render('crear-cuenta',{
        nombrePagina:'Crea tu cuenta en DevJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes loggearte '
    })
};




exports.validarRegistro = async (req, res, next) => {
    //sanitizar los campos y comprobarlos
    const rules = [
        body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        body('email').isEmail().withMessage('El email es obligatorio').normalizeEmail().escape(),
        body('password').not().isEmpty().withMessage('El password es obligatorio').escape(),
        body('confirmar').not().isEmpty().withMessage('Confirmar password es obligatorio').escape(),
        body('confirmar').equals(req.body.password).withMessage('Los passwords no son iguales').escape()
    ];
   
    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);
    //si hay errores
    if (!errores.isEmpty()) {
        req.flash('error', errores.array().map(error => error.msg));
        res.render('crear-cuenta', {
            nombrePagina: 'Crea una cuenta en Devjobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()
        })
        return;
    }
 
    //si toda la validacion es correcta
    next();
};

exports.crearUsuario = async ( req,res,next) =>  {
    //crear uuario
    const usuario = new Usuarios(req.body);
    try {
        await usuario.save();
        res.redirect('/iniciar-session')
    } catch (error) {
        req.flash('error', error)
        res.redirect('/crear-cuenta')
    }

};

//formulario para inicar sesion
exports.formIniciarSesion = (req, res, next) => {
    res.render('iniciar-session', {
        nombrePagina: 'Iniciar Sesion devJobs'
    })
};
//formulario para editar el perfil
exports.formEditarPerfil = (req, res, next) => {
    res.render('editar-perfil', {
        nombrePagina: 'Edita tu perfil de devJobs',
        usuario: req.user,
        cerrarSesion: true ,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
};

//guardar cambios editar perfil
exports.editarPerfil = async (req, res) =>{
    const usuario = await Usuarios.findById(req.user._id);
    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;
    //si hay un password nuevo 
    if(req.body.password){
        usuario.password = req.body.password
    }

    if(req.file){
        usuario.imagen = req.file.filename
    };

    await usuario.save();// guardar el usuario

    //alerta
    req.flash('correcto', 'cambios guardados correctamente')
    //redirecionar al usuario
    res.redirect('/administracion')
};

//validar  y sanitizar perfiles
exports.validarPerfil = [
    // Sanitizar y validar los campos
    body('nombre').trim().escape().notEmpty().withMessage('El nombre no puede ir vacio'),
    body('email').trim().escape().notEmpty().withMessage('El correo no púede ir vacio'),
    body('password').if(body('password').exists()).trim().escape().notEmpty().withMessage('Agrega una contraseña'),

    (req, res, next) => {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            // Recargar la vista con los errores
            req.flash('error', errores.array().map(error => error.msg));

            return res.render('editar-perfil', {
                nombrePagina: 'Edita tu perfil de devJobs',
                usuario: req.user,
                cerrarSesion: true ,
                nombre: req.user.nombre,
                imagen: req.user.imagen,
                mensajes: req.flash()
            })
        }

        next(); // Siguiente middleware
    }
];