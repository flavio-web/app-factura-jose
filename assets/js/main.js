window.onload = () => {
    _tablaDetalle = new DataTable('#tableDetalle');
    _productos = [];
    btnAddProducto = document.getElementById('btnAddProducto');
    tablaDetalle = document.getElementById('tableDetalle');
    btnNew = document.getElementById('btnNew');
    btnSave = document.getElementById('btnSave');
    getProductos();
}

btnAddProducto.addEventListener('click', () =>{
    const codigoProducto = getProductoSeleccionado();
    const producto = getProducto( codigoProducto );

    if( !producto ){
        Swal.fire({
            title: "Uops!",
            text: `No hemos podido encontrar el producto ${codigoProducto}`,
            icon: "error"
        });
        return;
    }

    _tablaDetalle.destroy();

    const htmlItem = generarHtmlItem( producto );
    tablaDetalle.getElementsByTagName('tbody')[0].innerHTML += htmlItem;
    calcularTotalDescuento();

    reloadTable();

});

btnNew.addEventListener('click', () => {
    document.getElementById('formInformacionDocumento').reset();
    tablaDetalle.tBodies[0].remove();
    calcularTotalDescuento();
});

btnSave.addEventListener('click', () => {
  
    const infoDocumento =  getDatosInformacionDocumento();

    const detalle = getDataDetalle();

    const data = {
        ...infoDocumento,
        detalle
    }

    console.log( data );

    Swal.fire({
        title: `Bien Hecho!`,
        text: `Factura registrada correctamente`,
        icon: "success"
    });

});

const reloadTable = () => {
    tablaDetalle.classList.add('datatable');

    _tablaDetalle = new DataTable('#tableDetalle', {
        responsive: true,
        destroy: true,
        scrollCollapse: true,
        language: {
            url: './assets/json/es-ES.json',
        }
    });
}

const getProductoSeleccionado = ()  => document.getElementById('producto').value;

const generarHtmlItem = ({ codigo, nombre, cantidad, unidadMedida, tipoPrecio, precioUnitario, descuento, porcentajeIva }) => {

    const tableDetalle = document.getElementById('tableDetalle');
    const index = tableDetalle.tBodies[0].rows.length + 1;

    const { total, subtotal } = calcularTotalesItem( cantidad, precioUnitario, descuento, porcentajeIva );

    return `
        <tr id="index-${index}" >
            <td>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-danger mx-1" type="button" onclick="eliminarItem(${index})"><i class="bi bi-trash"></i></button>
                    <button class="btn btn-primary mx-1" type="button" onclick="editarItem('${ encodeURIComponent(JSON.stringify({ codigo, nombre, cantidad, unidadMedida, tipoPrecio, precioUnitario, descuento, porcentajeIva})) }')"><i class="bi bi-plus"></i></button>
                </div>
            </td>
            <td data-code="${codigo}"class="nombre" >${nombre}</td>
            <td>
                <button class="btn btn-secondary" type="button"><i class="bi bi-eye" onclick="showProducto('${ encodeURIComponent(JSON.stringify({ codigo, nombre, cantidad, unidadMedida, tipoPrecio, precioUnitario, descuento, porcentajeIva})) }')"></i></button>
            </td>
            <td>
                <input type="number" class="form-control cantidad text-right" value="${Number(cantidad)}" onchange="calcularSubtotal(event)" >
            </td>
            <td>
                <select class="form-select form-control unidad">
                    <option value="UNI" ${ (unidadMedida.toUpperCase() === 'UNI') && 'selected' }>UNI</option>
                    <option value="CAJA" ${ (unidadMedida.toUpperCase() === 'CAJA') && 'selected' }>CAJA</option>
                </select>
            </td>
            <td>
                <select class="form-select form-control tipoPrecio">
                    <option value="GENEREAL" selected>GENERAL</option>
                </select>
            </td>
            <td>
                <input type="number" class="form-control precioUnitario text-right" value="${Number(precioUnitario).toFixed(2)}" onchange="calcularSubtotal(event)" >
            </td>
            <td>
                <input type="number" class="form-control descuento text-right" onChange="onChangeDescuento(event), calcularSubtotal(event)" value="${Number(descuento).toFixed(2)}" >
            </td>
            <td>
                <div class="d-flex justify-content-between">
                    <input class="form-check-input checkIva mx-2" type="checkbox" ${ (porcentajeIva > 0 ) ? 'checked' : '' }>
                    <input type="number" class="form-control iva text-right" value="${Number(porcentajeIva).toFixed(2)}" onchange="calcularSubtotal(event)">
                </div>
            </td>
            <td>
                <input type="number" class="form-control subtotal text-right" value="${Number(subtotal.toFixed(2))}" disabled readonly>
            </td>
            <td>
                <input type="number" class="form-control total text-right" value="${Number(total.toFixed(2))}" disabled readonly>
            </td>
        </tr>
    `;
}

const getProductos = async() => {
    await fetch(`./assets/json/productos.json`)
        .then(response => response.json())
        .then(data => {
            console.log( data );
            _productos = data;
            listarProductos( data );

        }).catch(err=>{
            console.log(err);
        });
}

const listarProductos = ( productos = [] ) => {

    let optionsProductos = '';

    productos.forEach( ( producto ) => {
        optionsProductos += `<option value="${producto.codigo}">${producto.nombre.toUpperCase()}</option>`;
    });

    const selectProducto = document.getElementById('producto');
    selectProducto.innerHTML = optionsProductos;
}

const getProducto = ( codigo ) => _productos.find( pro => pro.codigo === codigo );

const eliminarItem = ( index ) => {
    if( index <= 0 ) return;
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger"
        },
        buttonsStyling: false
      });
      swalWithBootstrapButtons.fire({
        title: `Estas seguro de eliminar el item #${index}?`,
        text: "",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Si, eliminar!",
        cancelButtonText: "No, Cancelar!",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
            _tablaDetalle.destroy();
            tablaDetalle.deleteRow(index);
            swalWithBootstrapButtons.fire({
                title: "Eliminado!",
                text: "Item eliminado correctamente.",
                icon: "success"
            });

            reloadTable();
        } 
      });
}

const editarItem = ( item ) => {
    const producto  = JSON.parse(decodeURIComponent(item));
    console.log({ producto });
    Swal.fire({
        title: "Editar Producto!",
        text: ``,
        icon: "success"
    });
}

const showProducto = ( item ) => {
    const producto  = JSON.parse(decodeURIComponent(item));
    console.log({ producto });
    Swal.fire({
        title: `Producto #${producto.codigo}`,
        text: `Producto nombre: ${producto.nombre.toUpperCase()}`,
        icon: "info"
    });
}

const getDatosInformacionDocumento = () => {
    const caja = document.getElementById('caja').value;
    const tipoDocumento = document.getElementById('tipoDocumento').value;
    const vendedor = document.getElementById('vendedor').value;
    const fecha = document.getElementById('fecha').value;
    const tipoIdentidad = document.getElementById('tipoIdentidad').value;
    const identidad = document.getElementById('identidad').value;
    const razonSocial = document.getElementById('razonSocial').value;
    const nombreComercial = document.getElementById('nombreComercial').value;
    const telefono = document.getElementById('telefono').value;
    const celular = document.getElementById('celular').value;
    const email = document.getElementById('email').value;
    const ciudad = document.getElementById('ciudad').value;
    const direccion = document.getElementById('direccion').value;

    return {
        caja,
        tipoDocumento,
        vendedor,
        fecha,
        tipoIdentidad,
        identidad,
        razonSocial,
        nombreComercial,
        telefono,
        celular,
        email,
        ciudad,
        direccion
    }

}

const getDataDetalle = () => {

    let detalle = [];

    for (let i = 0; i < tablaDetalle.tBodies.length; i++) {
        const row = tablaDetalle.tBodies[i];
        const nombreProducto = row.querySelector('td.nombre').textContent;
        const codigoProducto = row.querySelector('td.nombre').getAttribute('data-code');
        const cantidad = Number(row.querySelector('td .cantidad').value) || 0;
        const unidad = Number(row.querySelector('td .unidad').value) || 0;
        const tipoPrecio = row.querySelector('td .tipoPrecio').value;
        const precioUnitario = Number(row.querySelector('td .precioUnitario').value) || 0;
        const descuento = Number(row.querySelector('td .descuento').value) || 0;
        const checkIva = row.querySelector('td .checkIva').checked;
        const iva = Number(row.querySelector('td .iva').value) || 0;
        const subtotal = Number(row.querySelector('td .subtotal').value) || 0;
        const total = Number(row.querySelector('td .total').value) || 0;
        
        detalle.push({
            nombreProducto,
            codigoProducto,
            cantidad,
            unidad,
            tipoPrecio,
            precioUnitario,
            descuento,
            checkIva,
            iva,
            subtotal,
            total
        })
    }

    return detalle;
}

const calcularTotalDescuento = () => {
    let totalDescuento = 0;
    const detalle = getDataDetalle();

    detalle.forEach( ({ descuento }) => {
        totalDescuento += Number( descuento);
    });

    document.getElementById('descuentototal').value = totalDescuento;
}

const onChangeDescuento = ( ) => {
    calcularTotalDescuento();
}

const calcularSubtotal = ( event ) => {
    console.log( event);
    const padre = event.target.closest("tr");
    const cantidad          = Number(padre.querySelector('td .cantidad').value) || 0;
    const precioUnitario    = Number(padre.querySelector('td .precioUnitario').value) || 0;
    const iva               = Number(padre.querySelector('td .iva').value) || 0;
    const descuento         = Number(padre.querySelector('td .descuento ').value) || 0;

    const { total, subtotal } = calcularTotalesItem( cantidad, precioUnitario, descuento, iva );

    padre.querySelector('td .subtotal').value = subtotal;
    padre.querySelector('td .total').value = total;
}

const calcularTotalesItem = ( cantidad = 0, precioUnitario = 0, descuento = 0, iva = 0 ) => {
    const subtotal = (cantidad * precioUnitario) - descuento;
    const total = ( iva > 0 ) ? ((subtotal * iva) / 100) + subtotal : subtotal;

    return {
        subtotal,
        total
    }
}