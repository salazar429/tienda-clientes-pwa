// ===========================================
// GENERADOR DE CÓDIGOS QR PARA PAGOS
// ===========================================

/**
 * Genera el texto detallado para el código QR de pago
 * @param {Object} datosCompra - Datos de la compra
 * @returns {string} Texto formateado para el QR
 */
export function generarQRPago(datosCompra) {
    // datosCompra debe contener:
    // - cliente: { nombre, email, telefono }
    // - productos: array de objetos con { nombre, cantidad, precio }
    // - total: monto total de la compra
    // - fecha: fecha de la compra
    // - id: identificador único de la compra
    
    // Crear el texto detallado para el QR
    let textoQR = "════════════════════════════\n";
    textoQR += "     🛍️ DETALLE DE COMPRA     \n";
    textoQR += "════════════════════════════\n\n";
    
    // Información del cliente
    textoQR += "👤 CLIENTE:\n";
    textoQR += `   Nombre: ${datosCompra.cliente.nombre}\n`;
    textoQR += `   Email: ${datosCompra.cliente.email}\n`;
    textoQR += `   Teléfono: ${datosCompra.cliente.telefono}\n\n`;
    
    // Información de la compra
    textoQR += "📦 PRODUCTOS:\n";
    textoQR += "────────────────────────────\n";
    
    // Lista de productos
    datosCompra.productos.forEach((producto, index) => {
        const subtotal = producto.cantidad * producto.precio;
        textoQR += `${index + 1}. ${producto.nombre}\n`;
        textoQR += `   Cantidad: ${producto.cantidad} x $${producto.precio.toFixed(2)}\n`;
        textoQR += `   Subtotal: $${subtotal.toFixed(2)}\n`;
        if (index < datosCompra.productos.length - 1) {
            textoQR += `   ────────────────────────\n`;
        }
    });
    
    textoQR += "────────────────────────────\n\n";
    
    // Totales
    textoQR += "💰 RESUMEN:\n";
    textoQR += `   Subtotal: $${datosCompra.total.toFixed(2)}\n`;
    textoQR += `   TOTAL: $${datosCompra.total.toFixed(2)}\n\n`;
    
    // Información adicional
    textoQR += "════════════════════════════\n";
    textoQR += `📅 Fecha: ${new Date(datosCompra.fecha).toLocaleString()}\n`;
    textoQR += `🆔 Folio: ${datosCompra.id.slice(-8)}\n`;
    textoQR += "════════════════════════════\n";
    textoQR += "     ¡Gracias por tu compra!    \n";
    textoQR += "════════════════════════════\n";
    
    return textoQR;
}

/**
 * Muestra el modal con el código QR de pago
 * @param {Object} datosCompra - Datos de la compra
 */
export function mostrarQRPago(datosCompra) {
    // Verificar si la librería QR está cargada
    if (typeof QRCode === 'undefined') {
        cargarLibreriaQR(() => {
            generarModalQR(datosCompra);
        });
    } else {
        generarModalQR(datosCompra);
    }
}

/**
 * Genera el modal con el código QR
 * @param {Object} datosCompra - Datos de la compra
 */
function generarModalQR(datosCompra) {
    // Verificar si ya existe un modal y eliminarlo
    const modalExistente = document.getElementById('qrPagoModal');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'qrPagoModal';
    modal.style.zIndex = '3000';
    
    // Generar el texto del QR
    const textoQR = generarQRPago(datosCompra);
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h2 style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>💳</span> Código QR de Pago
                </h2>
                <button class="close-modal" onclick="window.cerrarModalQrPago ? window.cerrarModalQrPago() : cerrarModalQrPagoManual()">✖</button>
            </div>
            <div class="modal-body" style="padding: 1.5rem; text-align: center;">
                
                <!-- Resumen rápido -->
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1.5rem;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.3rem;">${datosCompra.cliente.nombre}</div>
                    <div style="font-size: 1.5rem; font-weight: bold;">$${datosCompra.total.toFixed(2)}</div>
                </div>
                
                <!-- Código QR -->
                <div id="qr-code-pago" style="background: white; padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1.5rem; display: flex; justify-content: center;">
                    <!-- Aquí se generará el QR -->
                </div>
                
                <!-- Detalle de la compra -->
                <div style="background: #f8f9fa; padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1.5rem; text-align: left;">
                    <h3 style="color: var(--dark-color); margin-bottom: 1rem; font-size: 1rem;">📋 Detalle de la compra:</h3>
                    
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid #ddd;">
                                <th style="text-align: left; padding-bottom: 0.3rem;">Producto</th>
                                <th style="text-align: center; padding-bottom: 0.3rem;">Cant</th>
                                <th style="text-align: right; padding-bottom: 0.3rem;">Precio</th>
                                <th style="text-align: right; padding-bottom: 0.3rem;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${datosCompra.productos.map(p => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 0.3rem 0;">${p.nombre.length > 20 ? p.nombre.substring(0,20)+'...' : p.nombre}</td>
                                    <td style="text-align: center; padding: 0.3rem 0;">${p.cantidad}</td>
                                    <td style="text-align: right; padding: 0.3rem 0;">$${p.precio.toFixed(2)}</td>
                                    <td style="text-align: right; padding: 0.3rem 0; font-weight: bold;">$${(p.precio * p.cantidad).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 2px solid #ddd;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                            <span>TOTAL:</span>
                            <span style="color: var(--primary-color);">$${datosCompra.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Botones de acción -->
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="window.descargarQRPago ? window.descargarQRPago('${datosCompra.id}') : descargarQRPagoManual('${datosCompra.id}')" style="flex: 1; padding: 0.8rem; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ⬇️ Descargar QR
                    </button>
                    <button onclick="window.aceptarPagoConQR ? window.aceptarPagoConQR() : aceptarPagoManual()" style="flex: 1; padding: 0.8rem; background: var(--success-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ✅ Aceptar Pago
                    </button>
                </div>
                
                <p style="font-size: 0.7rem; color: #666; margin-top: 1rem;">
                    Escanea este código para ver el detalle completo de la compra
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generar el código QR
    setTimeout(() => {
        generarQRCodeEnElemento('qr-code-pago', textoQR);
    }, 100);
    
    // Agregar funciones manuales al window si no existen
    if (!window.cerrarModalQrPago) {
        window.cerrarModalQrPago = cerrarModalQrPagoManual;
    }
    if (!window.descargarQRPago) {
        window.descargarQRPago = descargarQRPagoManual;
    }
    if (!window.aceptarPagoConQR) {
        window.aceptarPagoConQR = aceptarPagoManual;
    }
}

/**
 * Genera el código QR en un elemento específico
 * @param {string} elementId - ID del elemento donde generar el QR
 * @param {string} texto - Texto para el QR
 */
function generarQRCodeEnElemento(elementId, texto) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;
    
    elemento.innerHTML = '';
    new QRCode(elemento, {
        text: texto,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

/**
 * Descarga el código QR como imagen
 * @param {string} idCompra - ID de la compra
 */
export function descargarQRPago(idCompra) {
    const canvas = document.querySelector('#qr-code-pago canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `QR-Pago-${idCompra.slice(-8)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        mostrarNotificacion('✅ QR descargado');
    } else {
        mostrarNotificacion('❌ Error al descargar QR');
    }
}

/**
 * Cierra el modal del QR
 */
export function cerrarModalQrPago() {
    const modal = document.getElementById('qrPagoModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Función manual para cerrar modal (fallback)
 */
function cerrarModalQrPagoManual() {
    const modal = document.getElementById('qrPagoModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Función manual para aceptar pago (fallback)
 */
function aceptarPagoManual() {
    if (window.aceptarPagoConQR) {
        window.aceptarPagoConQR();
    } else {
        console.error('Función aceptarPagoConQR no disponible');
        cerrarModalQrPagoManual();
    }
}

/**
 * Función manual para descargar QR (fallback)
 */
function descargarQRPagoManual(idCompra) {
    const canvas = document.querySelector('#qr-code-pago canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `QR-Pago-${idCompra.slice(-8)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('✅ QR descargado');
        }
    }
}

/**
 * Carga la librería QR si no está disponible
 * @param {Function} callback - Función a ejecutar después de cargar
 */
function cargarLibreriaQR(callback) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    script.onload = callback;
    script.onerror = () => {
        console.error('Error al cargar la librería QR');
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('❌ Error al cargar generador QR');
        }
    };
    document.head.appendChild(script);
}

/**
 * Muestra una notificación (función auxiliar)
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarNotificacion(mensaje) {
    if (typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion(mensaje);
    } else {
        console.log('Notificación:', mensaje);
    }
}

// Exportar funciones para uso global
window.generarQRPago = generarQRPago;
window.mostrarQRPago = mostrarQRPago;
window.descargarQRPago = descargarQRPago;
window.cerrarModalQrPago = cerrarModalQrPago;