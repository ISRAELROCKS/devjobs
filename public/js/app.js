import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
    const skills = document.querySelector('.lista-conocimientos')

    //limpiar las alertas
    let alertas = document.querySelector('.alertas');
    if(alertas){
        limpiarAlertas();
    }

    if(skills) {
        skills.addEventListener('click', agregarSkills);

        // una vez que estemos en editar , habilitar la funcion
        skillsSelecionados();
    }

    const vacantesListado = document.querySelector('.panel-administracion');
    if(vacantesListado){
        vacantesListado.addEventListener('click', accionesListado)
    }
});

const skills = new Set();
const agregarSkills = (e) => {
    if(e.target.tagName === 'LI'){
        if(e.target.classList.contains('activo')){
            //quitarlo del set y quitar la clase
            skills.delete(e.target.textContent);
            e.target.classList.remove('activo');
        }else{
            //agregar al set o agregar la clase
            skills.add(e.target.textContent);
            e.target.classList.add('activo');
        }
    }

    const skillsArray = [...skills]
    document.querySelector('#skills').value = skillsArray;
}

const skillsSelecionados = () => {
    // Selecciona todos los elementos con la clase 'activo' dentro de la clase 'lista-conocimientos' y los convierte en un array.
    const seleccionadas = Array.from( document.querySelectorAll('.lista-conocimientos .activo'));
        // Itera sobre cada elemento seleccionado y añade su contenido de texto a un conjunto llamado 'skills'.

    seleccionadas.forEach(seleccionada => {
        skills.add(seleccionada.textContent)
    })

    //inyectarlo en el hidden // Crea un array a partir del conjunto 'skills'.
    const skillsArray = [...skills]
    document.querySelector('#skills').value = skillsArray;
};

const limpiarAlertas = () => {
    //Selecciona el contenedor de alertas con la clase alertas.
    const alertas = document.querySelector('.alertas');
    //Configura un intervalo que se ejecuta cada 2 segundos. 
    //Cada 2 segundos, verifica si el contenedor tiene elementos hijos.
   const interval = setInterval(() =>{
        if(alertas.children.length > 0){
            alertas.removeChild(alertas.children[0]);
        }else if (alertas.children.length === 0 ){
            alertas.parentElement.removeChild(alertas);
            clearInterval(interval);
        }
    },2000);
};

const accionesListado = e => {
    e.preventDefault()
    if(e.target.dataset.eliminar){
        //eliminar por medio de axios
        
        Swal.fire({
            title: "Confirmar eliminacion ?",
            text: "una vez eliminada no se puede recuperar",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, Eliminar",
            cancelButtonText: "No, Cancelar",
          }).then((result) => {
            if (result.isConfirmed) {

                //enviar la peticion con axios
                const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;

                // axios para eliminar el registro
                axios.delete(url,{ params: {url}})
                    .then(function(respuesta){
                        if(respuesta.status === 200){
                            Swal.fire({
                                title: "Elimiando!",
                                text: respuesta.data,
                                icon: "success"
                            });
                            //todo: eliminar del DOM
                            e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement);
                        }
                    })
                    .catch(() => {
                        Swal.fire({
                            type: 'error',
                            tittle: 'Hubo un error',
                            text: ' No se pudo eliminar '
                        })
                    })
            }
          });
    }else if (e.target.tagName === 'A') {
        console.log(e.target.tagName);
        window.location.href = e.target.href;  // Redirige al enlace
        return;
    }
};