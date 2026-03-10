// ===========================================
// APP TIENDA CLIENTES - VERSIÓN FINAL CON MENÚ LATERAL
// ===========================================

// Importar funciones del generador QR
import { mostrarQRPago, descargarQRPago, cerrarModalQrPago } from './Generar_QR.js';

const API_URL = 'https://sistema-test-api.onrender.com';

// Estado global de la aplicación
const App = {
    productos: [],
    categorias: [],
    favoritos: JSON.parse(localStorage.getItem('favoritos')) || [],
    carrito: JSON.parse(localStorage.getItem('carrito')) || [],
    historial: JSON.parse(localStorage.getItem('historial')) || [],
    pedidosPendientes: JSON.parse(localStorage.getItem('pedidosPendientes')) || [],
    currentPage: 'dashboard',
    online: navigator.onLine,
    installPrompt: null,
    qrScanner: {
        video: null,
        canvas: null,
        context: null,
        scanning: false,
        stream: null
    },
    productoEscanearTemp: null,
    cantidadEscanearTemp: 1,
    compraExitosa: false,
    clienteActual: {
        nombre: 'Cliente Demo',
        email: 'cliente@email.com',
        telefono: '1234567890'
    },
    menuAbierto: false
};

// Elementos del DOM
const DOM = {
    splash: document.getElementById('splash'),
    mainContent: document.getElementById('mainContent'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    connectionStatus: document.getElementById('connection-status'),
    notification: document.getElementById('notification'),
    installButton: document.getElementById('install-button'),
    cartBadge: document.getElementById('cartBadge'),
    productoModal: document.getElementById('productoModal'),
    modalProductoNombre: document.getElementById('modalProductoNombre'),
    modalProductoBody: document.getElementById('modalProductoBody'),
    menuBtn: document.getElementById('menuBtn'),
    productoEscanearModal: document.getElementById('productoEscanearModal'),
    productoEscanearBody: document.getElementById('productoEscanearBody')
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛍️ App Tienda iniciada');
    
    // Ocultar splash después de 2 segundos
    setTimeout(() => {
        DOM.splash.classList.add('hidden');
    }, 2000);
    
    // Inicializar la app
    initApp();
});

async function initApp() {
    // Registrar Service Worker
    registerServiceWorker();
    
    // Cargar datos iniciales
    await Promise.all([
        cargarProductos(),
        cargarCategorias()
    ]);
    
    // Mostrar página inicial (dashboard)
    mostrarPagina('dashboard');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar badge del carrito
    actualizarBadgeCarrito();
    
    // Verificar conexión
    actualizarEstadoConexion();
}

// ===== SERVICE WORKER =====
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado');
                
                // Detectar actualizaciones
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Nueva versión detectada');
                });
            })
            .catch(error => {
                console.error('❌ Error registrando Service Worker:', error);
            });
    }
}

// ===== MENÚ LATERAL =====
function mostrarMenuLateral() {
    // Si ya existe un menú, cerrarlo
    const menuExistente = document.getElementById('menuLateral');
    if (menuExistente) {
        menuExistente.remove();
        App.menuAbierto = false;
        return;
    }
    
    App.menuAbierto = true;
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    overlay.id = 'menuOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 1500;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Crear menú lateral
    const menu = document.createElement('div');
    menu.className = 'menu-lateral';
    menu.id = 'menuLateral';
    menu.style.cssText = `
        position: fixed;
        top: 0;
        left: -300px;
        width: 280px;
        height: 100vh;
        background: white;
        z-index: 1501;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        transition: left 0.3s ease;
        overflow-y: auto;
    `;
    
    // Calcular estadísticas
    const favoritosCount = App.favoritos.length;
    const carritoCount = App.carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const pendientesCount = App.pedidosPendientes.filter(p => p.estado !== 'completado').length;
    
    // Contenido del menú
    menu.innerHTML = `
        <div style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 2rem 1rem; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">🛍️</div>
            <h2 style="margin: 0; font-size: 1.2rem;">Mi Tienda</h2>
            <p style="margin: 0.3rem 0 0; font-size: 0.8rem; opacity: 0.9;">Versión 2.0</p>
        </div>
        
        <div style="padding: 1rem;">
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: var(--dark-color); font-size: 0.9rem; margin-bottom: 0.5rem;">RESUMEN</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                    <div style="background: #f8f9fa; padding: 0.8rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem;">❤️</div>
                        <div style="font-size: 1.1rem; font-weight: bold;">${favoritosCount}</div>
                        <div style="font-size: 0.7rem; color: #666;">Favoritos</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 0.8rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem;">🛒</div>
                        <div style="font-size: 1.1rem; font-weight: bold;">${carritoCount}</div>
                        <div style="font-size: 0.7rem; color: #666;">En carrito</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 0.8rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem;">📦</div>
                        <div style="font-size: 1.1rem; font-weight: bold;">${pendientesCount}</div>
                        <div style="font-size: 0.7rem; color: #666;">Pendientes</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 0.8rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem;">📋</div>
                        <div style="font-size: 1.1rem; font-weight: bold;">${App.historial.length}</div>
                        <div style="font-size: 0.7rem; color: #666;">Historial</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: var(--dark-color); font-size: 0.9rem; margin-bottom: 0.5rem;">NAVEGACIÓN RÁPIDA</h3>
                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                    <button onclick="navegarDesdeMenu('dashboard')" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: none; border: none; border-radius: 8px; cursor: pointer; width: 100%; text-align: left;">
                        <span style="font-size: 1.2rem;">🏠</span>
                        <span>Inicio</span>
                    </button>
                    <button onclick="navegarDesdeMenu('escanear')" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: none; border: none; border-radius: 8px; cursor: pointer; width: 100%; text-align: left;">
                        <span style="font-size: 1.2rem;">📷</span>
                        <span>Escanear QR</span>
                    </button>
                    <button onclick="navegarDesdeMenu('favoritos')" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: none; border: none; border-radius: 8px; cursor: pointer; width: 100%; text-align: left;">
                        <span style="font-size: 1.2rem;">❤️</span>
                        <span>Favoritos</span>
                    </button>
                    <button onclick="navegarDesdeMenu('pendientes')" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: none; border: none; border-radius: 8px; cursor: pointer; width: 100%; text-align: left;">
                        <span style="font-size: 1.2rem;">📦</span>
                        <span>Pedidos Pendientes</span>
                        ${pendientesCount > 0 ? `<span style="background: var(--danger-color); color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.7rem; margin-left: auto;">${pendientesCount}</span>` : ''}
                    </button>
                    <button onclick="navegarDesdeMenu('carrito')" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: none; border: none; border-radius: 8px; cursor: pointer; width: 100%; text-align: left;">
                        <span style="font-size: 1.2rem;">🛒</span>
                        <span>Carrito</span>
                        ${carritoCount > 0 ? `<span style="background: var(--primary-color); color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.7rem; margin-left: auto;">${carritoCount}</span>` : ''}
                    </button>
                    <button onclick="navegarDesdeMenu('historial')" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: var(--success-color); color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; text-align: left; margin-top: 0.5rem;">
                        <span style="font-size: 1.2rem;">📋</span>
                        <span>Ver Historial de Compras</span>
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
                <h3 style="color: var(--dark-color); font-size: 0.9rem; margin-bottom: 0.5rem;">INFORMACIÓN</h3>
                <div style="font-size: 0.8rem; color: #666; line-height: 1.6;">
                    <p>👤 Cliente: ${App.clienteActual.nombre}</p>
                    <p>📧 ${App.clienteActual.email}</p>
                    <p>📱 ${App.clienteActual.telefono}</p>
                    <p style="margin-top: 0.5rem;">🕒 Última actualización: ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(menu);
    
    // Animar entrada
    setTimeout(() => {
        overlay.style.opacity = '1';
        menu.style.left = '0';
    }, 10);
    
    // Cerrar al hacer clic en overlay
    overlay.addEventListener('click', cerrarMenuLateral);
}

function cerrarMenuLateral() {
    const overlay = document.getElementById('menuOverlay');
    const menu = document.getElementById('menuLateral');
    
    if (overlay && menu) {
        overlay.style.opacity = '0';
        menu.style.left = '-300px';
        
        setTimeout(() => {
            overlay.remove();
            menu.remove();
            App.menuAbierto = false;
        }, 300);
    }
}

function navegarDesdeMenu(pagina) {
    cerrarMenuLateral();
    mostrarPagina(pagina);
}

// ===== NAVEGACIÓN =====
function mostrarPagina(pagina) {
    App.currentPage = pagina;
    App.compraExitosa = false; // Resetear bandera al cambiar de página
    
    // Actualizar clases activas en menú
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pagina) {
            item.classList.add('active');
        }
    });
    
    // Generar contenido de la página
    let html = '';
    
    switch(pagina) {
        case 'dashboard':
            html = generarDashboard();
            break;
        case 'escanear':
            html = generarEscanear();
            break;
        case 'favoritos':
            html = generarFavoritos();
            break;
        case 'carrito':
            html = generarCarrito();
            break;
        case 'pendientes':
            html = generarPendientes();
            break;
        case 'historial':
            html = generarHistorial();
            break;
    }
    
    DOM.mainContent.innerHTML = html;
    
    // Configurar event listeners específicos de la página
    configurarEventosPagina(pagina);
}

// ===== GENERADORES DE PÁGINAS =====
function generarDashboard() {
    const productosDestacados = App.productos.slice(0, 8);
    
    return `
        <div class="page active">
            <div class="dashboard-bienvenida" style="text-align: center; padding: 1rem; margin-bottom: 1rem; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; border-radius: var(--border-radius);">
                <h2 style="margin-bottom: 0.5rem;">¡Bienvenido a Mi Tienda!</h2>
                <p>Los mejores productos al mejor precio</p>
            </div>
            
            <div class="dashboard-section">
                <div class="section-title">
                    <span>🌟 Productos Destacados</span>
                </div>
                <div class="productos-grid">
                    ${generarProductosHTML(productosDestacados)}
                </div>
            </div>
        </div>
    `;
}

function generarEscanear() {
    return `
        <div class="page active">
            <h2 class="page-title">📷 Escanear Código QR</h2>
            
            <div style="text-align: center; margin: 1rem 0;">
                <p style="color: #666; margin-bottom: 1rem;">Escanea el código QR de un producto para agregarlo al carrito</p>
                
                <button id="btnAbrirCamara" class="btn-camara" style="background: linear-gradient(145deg, #4CAF50, #45a049); color: white; font-size: 24px; padding: 30px 20px; border: none; border-radius: 20px; cursor: pointer; width: 100%; margin: 20px 0; font-weight: bold; box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3); display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <span style="font-size: 48px;">📸</span>
                    <span>ABRIR CÁMARA</span>
                    <span style="font-size: 14px;">Haz clic aquí para activar la cámara</span>
                </button>
                
                <div style="display: flex; gap: 1rem; justify-content: center; margin: 20px 0;">
                    <label for="fileInput" class="btn btn-archivo" style="background-color: #2196F3; color: white; border: none; padding: 15px 25px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold; flex: 1;">
                        📁 Escanear desde archivo
                    </label>
                    <input type="file" id="fileInput" accept="image/*" style="display: none;">
                    
                    <button id="btnDetener" class="btn-detener" style="background-color: #f44336; color: white; border: none; padding: 15px 25px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold; flex: 1; display: none;">
                        ⏹️ Detener cámara
                    </button>
                </div>
                
                <div id="video-container" style="width: 100%; max-width: 500px; margin: 20px auto; position: relative; display: none;">
                    <video id="video" playsinline autoplay style="width: 100%; height: auto; border-radius: 10px; border: 3px solid #4CAF50; background-color: #000; transform: none;"></video>
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 3px solid rgba(76, 175, 80, 0.8); border-radius: 10px; pointer-events: none; animation: pulse 1.5s infinite; box-shadow: 0 0 0 2px rgba(255,255,255,0.5) inset;"></div>
                    <div style="text-align: center; margin-top: 10px; color: #4CAF50; font-weight: bold;">
                        ⚡ Enfoca el código QR ⚡
                    </div>
                    <div id="orientacionInfo" style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px; color: #1976D2; text-align: center; display: none;"></div>
                </div>
                
                <div id="estadoEscaner" class="estado" style="text-align: center; padding: 20px; color: #666; background-color: #f9f9f9; border-radius: 10px; margin: 20px 0; border-left: 5px solid #2196F3; font-size: 18px;">
                    👆 Haz clic en "ABRIR CÁMARA" para comenzar
                </div>
            </div>
        </div>
    `;
}

function generarFavoritos() {
    if (App.favoritos.length === 0) {
        return `
            <div class="page active">
                <div class="empty">
                    ❤️ No tienes favoritos aún<br>
                    <small>Explora productos y agrega tus favoritos</small>
                </div>
            </div>
        `;
    }
    
    const favoritosProductos = App.productos.filter(p => 
        App.favoritos.includes(p.id)
    );
    
    let html = '<div class="page active"><h2 class="page-title">❤️ Mis Favoritos</h2>';
    
    favoritosProductos.forEach(p => {
        html += `
            <div class="favorito-card">
                <div class="favorito-imagen">📦</div>
                <div class="favorito-info">
                    <div class="favorito-nombre">${p.nombre}</div>
                    <div class="favorito-precio">$${p.precio.toFixed(2)}</div>
                </div>
                <div class="favorito-actions">
                    <button class="btn-favorito" onclick="toggleFavorito('${p.id}')">❤️</button>
                    <button class="btn-carrito" onclick="agregarAlCarrito('${p.id}')">🛒</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function generarCarrito() {
    // Si hay una compra exitosa, mostrar mensaje de éxito
    if (App.compraExitosa) {
        return `
            <div class="page active">
                <div style="text-align: center; padding: 3rem 1rem;">
                    <div style="font-size: 5rem; margin-bottom: 1rem; animation: bounce 0.5s ease;">🎉</div>
                    <h2 style="color: var(--success-color); margin-bottom: 1rem;">¡COMPRA REALIZADA CON ÉXITO!</h2>
                    <p style="color: #666; margin-bottom: 2rem;">Gracias por tu compra. Puedes ver el detalle en el historial.</p>
                    <button onclick="mostrarPagina('historial')" style="background: var(--primary-color); color: white; border: none; padding: 1rem 2rem; border-radius: 50px; font-size: 1.1rem; cursor: pointer;">
                        📋 Ver Historial
                    </button>
                </div>
            </div>
        `;
    }
    
    // Si el carrito está vacío
    if (App.carrito.length === 0) {
        return `
            <div class="page active">
                <div class="empty">
                    🛒 Tu carrito está vacío<br>
                    <small>Agrega productos para comenzar</small>
                </div>
            </div>
        `;
    }
    
    let total = 0;
    let html = '<div class="page active"><h2 class="page-title">🛒 Mi Carrito</h2>';
    
    App.carrito.forEach(item => {
        const producto = App.productos.find(p => p.id === item.id);
        if (!producto) return;
        
        const itemTotal = producto.precio * item.cantidad;
        total += itemTotal;
        
        html += `
            <div class="carrito-item">
                <div class="carrito-imagen">📦</div>
                <div class="carrito-info">
                    <div class="carrito-nombre">${producto.nombre}</div>
                    <div class="carrito-precio">$${producto.precio.toFixed(2)}</div>
                </div>
                <div class="carrito-cantidad">
                    <button class="cantidad-btn" onclick="modificarCantidad('${item.id}', -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="cantidad-btn" onclick="modificarCantidad('${item.id}', 1)">+</button>
                </div>
                <div style="font-weight: bold; color: var(--primary-color);">
                    $${itemTotal.toFixed(2)}
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--danger-color);">✖</button>
            </div>
        `;
    });
    
    html += `
        <div class="carrito-total" style="background: white; border-radius: var(--border-radius); padding: 1rem; margin-top: 1rem; text-align: right; font-size: 1.3rem; font-weight: bold; box-shadow: var(--box-shadow);">
            Total: $${total.toFixed(2)}
        </div>
        
        <button class="btn-comprar" onclick="mostrarOpcionesPago()" style="width: 100%; padding: 1rem; background: var(--success-color); color: white; border: none; border-radius: var(--border-radius); font-size: 1.1rem; font-weight: bold; margin-top: 1rem; cursor: pointer;">
            ✅ CONTINUAR CON LA COMPRA
        </button>
    </div>
    `;
    
    return html;
}

function generarPendientes() {
    const pendientes = App.pedidosPendientes.filter(p => p.estado !== 'completado');
    
    if (pendientes.length === 0) {
        return `
            <div class="page active">
                <div class="empty">
                    📦 No tienes pedidos pendientes<br>
                    <small>Realiza una compra para ver tus pedidos aquí</small>
                </div>
            </div>
        `;
    }
    
    let html = '<div class="page active"><h2 class="page-title">📦 Pedidos Pendientes</h2>';
    
    pendientes.forEach(pedido => {
        const fecha = new Date(pedido.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let colorEstado = '';
        let iconoEstado = '';
        
        switch(pedido.estado) {
            case 'pendiente':
                colorEstado = '#f39c12';
                iconoEstado = '⏳';
                break;
            case 'en camino':
                colorEstado = '#3498db';
                iconoEstado = '🚚';
                break;
            case 'cancelado':
                colorEstado = '#e74c3c';
                iconoEstado = '❌';
                break;
        }
        
        html += `
            <div class="pedido-card" style="background: white; border-radius: var(--border-radius); margin-bottom: 1rem; box-shadow: var(--box-shadow); overflow: hidden; border-left: 5px solid ${colorEstado};">
                <div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa;">
                    <div>
                        <span style="font-weight: bold;">#${pedido.id.slice(-8)}</span>
                        <span style="color: #666; margin-left: 0.5rem; font-size: 0.8rem;">${fechaFormateada}</span>
                    </div>
                    <div style="color: ${colorEstado}; font-weight: bold;">
                        ${iconoEstado} ${pedido.estado.toUpperCase()}
                    </div>
                </div>
                
                <div style="padding: 1rem;">
                    <div style="margin-bottom: 0.5rem;">
                        <strong>Cliente:</strong> ${pedido.cliente.nombre}
                    </div>
                    
                    <div style="margin-bottom: 0.5rem;">
                        <strong>Tipo:</strong> ${pedido.tipoPago === 'enviar' ? '🚚 Enviar a casa' : '💳 Pagar ahora'}
                    </div>
                    
                    <div style="margin-top: 0.5rem;">
                        <strong>Productos:</strong>
                        <div style="margin-top: 0.3rem;">
                            ${pedido.productos.map(p => `
                                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.2rem 0;">
                                    <span>${p.nombre} x${p.cantidad}</span>
                                    <span>$${(p.precio * p.cantidad).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-weight: bold;">
                        <span>TOTAL:</span>
                        <span style="color: var(--primary-color);">$${pedido.total.toFixed(2)}</span>
                    </div>
                    
                    ${pedido.estado === 'pendiente' ? `
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                            <button onclick="cancelarPedido('${pedido.id}')" style="flex: 1; padding: 0.5rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                ❌ Cancelar pedido
                            </button>
                            <button onclick="marcarCompletado('${pedido.id}')" style="flex: 1; padding: 0.5rem; background: var(--success-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                                ✅ Marcar completado
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function generarHistorial() {
    const completados = App.pedidosPendientes.filter(p => p.estado === 'completado');
    const historialCompras = [...App.historial, ...completados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (historialCompras.length === 0) {
        return `
            <div class="page active">
                <div class="empty">
                    📋 No hay compras en tu historial<br>
                    <small>Realiza tu primera compra</small>
                </div>
            </div>
        `;
    }
    
    let html = '<div class="page active"><h2 class="page-title">📋 Historial de Compras</h2>';
    
    historialCompras.forEach((compra, index) => {
        const fecha = new Date(compra.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="vale-compra" style="background: white; border-radius: var(--border-radius); margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #eee;">
                
                <!-- Cabecera del vale -->
                <div style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 1rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧾</div>
                    <h3 style="margin: 0; font-size: 1.2rem;">TICKET DE COMPRA</h3>
                    <p style="margin: 0.3rem 0 0; font-size: 0.8rem; opacity: 0.9;">#${compra.id.slice(-8)}</p>
                </div>
                
                <!-- Información de la tienda -->
                <div style="padding: 1rem; border-bottom: 2px dashed #ddd; text-align: center;">
                    <div style="font-weight: bold; color: var(--dark-color);">🛍️ MI TIENDA</div>
                    <div style="font-size: 0.8rem; color: #666;">Tienda online de confianza</div>
                    <div style="font-size: 0.8rem; color: #666;">RIF: J-12345678-9</div>
                </div>
                
                <!-- Fecha y folio -->
                <div style="padding: 0.8rem; background: #f8f9fa; display: flex; justify-content: space-between; font-size: 0.8rem; border-bottom: 1px solid #eee;">
                    <span>📅 ${fechaFormateada}</span>
                    <span>🔢 Folio: ${compra.id.slice(0,8)}</span>
                </div>
                
                <!-- Cliente -->
                <div style="padding: 0.8rem; background: #f8f9fa; border-bottom: 1px solid #eee;">
                    <strong>Cliente:</strong> ${compra.cliente ? compra.cliente.nombre : 'Cliente'}
                </div>
                
                <!-- Detalle de productos -->
                <div style="padding: 1rem;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid #eee;">
                                <th style="text-align: left; padding-bottom: 0.5rem;">Producto</th>
                                <th style="text-align: center; padding-bottom: 0.5rem;">Cant.</th>
                                <th style="text-align: right; padding-bottom: 0.5rem;">Precio</th>
                                <th style="text-align: right; padding-bottom: 0.5rem;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${compra.productos.map(p => `
                                <tr style="border-bottom: 1px solid #f0f0f0;">
                                    <td style="padding: 0.5rem 0;">${p.nombre}</td>
                                    <td style="text-align: center; padding: 0.5rem 0;">${p.cantidad}</td>
                                    <td style="text-align: right; padding: 0.5rem 0;">$${p.precio.toFixed(2)}</td>
                                    <td style="text-align: right; padding: 0.5rem 0; font-weight: bold;">$${(p.precio * p.cantidad).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <!-- Total -->
                    <div style="margin-top: 1rem; border-top: 2px solid #eee; padding-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold; color: var(--primary-color);">
                            <span>TOTAL:</span>
                            <span>$${compra.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <!-- Método de pago -->
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #ddd; text-align: center; color: #666; font-size: 0.8rem;">
                        ${compra.tipoPago === 'enviar' ? '🚚 Enviado a casa' : '💳 Pagado con QR'}<br>
                        ✅ ¡Gracias por tu compra!
                    </div>
                </div>
                
                <!-- Código de barras falso -->
                <div style="padding: 1rem; background: #f8f9fa; text-align: center; font-family: monospace; letter-spacing: 5px; font-size: 1.2rem;">
                    ${'▌'.repeat(20)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// ===== FUNCIÓN PARA MOSTRAR OPCIONES DE PAGO =====
function mostrarOpcionesPago() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'opcionesPagoModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2>💳 Opciones de Pago</h2>
                <button class="close-modal" onclick="cerrarModalOpcionesPago()">✖</button>
            </div>
            <div class="modal-body" style="padding: 2rem 1rem;">
                <p style="text-align: center; color: #666; margin-bottom: 2rem;">Selecciona cómo deseas continuar con tu compra</p>
                
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                    <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: var(--border-radius); cursor: pointer; transition: all 0.3s;" class="opcion-pago" for="opcionEnviar">
                        <input type="radio" name="tipoPago" id="opcionEnviar" value="enviar" style="margin-right: 1rem; width: 20px; height: 20px;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 0.2rem;">🚚 Enviar a casa</div>
                            <div style="font-size: 0.8rem; color: #666;">Recibe tu pedido en la puerta de tu casa</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: var(--border-radius); cursor: pointer; transition: all 0.3s;" class="opcion-pago" for="opcionPagar">
                        <input type="radio" name="tipoPago" id="opcionPagar" value="pagar" style="margin-right: 1rem; width: 20px; height: 20px;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 0.2rem;">💳 Pagar ahora (Generar QR)</div>
                            <div style="font-size: 0.8rem; color: #666;">Genera un código QR para pagar en tienda</div>
                        </div>
                    </label>
                </div>
                
                <button id="btnAceptarOpcion" onclick="procesarOpcionPago()" style="width: 100%; padding: 1rem; background: var(--success-color); color: white; border: none; border-radius: var(--border-radius); font-size: 1.1rem; font-weight: bold; cursor: pointer; opacity: 0.5;" disabled>
                    ✅ ACEPTAR
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Agregar event listeners para los radio buttons
    setTimeout(() => {
        const radios = document.querySelectorAll('input[name="tipoPago"]');
        const btnAceptar = document.getElementById('btnAceptarOpcion');
        
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Remover estilo de todos
                document.querySelectorAll('.opcion-pago').forEach(opt => {
                    opt.style.borderColor = '#ddd';
                    opt.style.background = 'white';
                });
                
                // Aplicar estilo al seleccionado
                if (e.target.checked) {
                    e.target.closest('.opcion-pago').style.borderColor = 'var(--success-color)';
                    e.target.closest('.opcion-pago').style.background = '#f0fff0';
                    btnAceptar.disabled = false;
                    btnAceptar.style.opacity = '1';
                }
            });
        });
    }, 100);
}

// ===== CERRAR MODAL DE OPCIONES DE PAGO =====
function cerrarModalOpcionesPago() {
    const modal = document.getElementById('opcionesPagoModal');
    if (modal) {
        modal.remove();
    }
}

// ===== PROCESAR OPCIÓN DE PAGO SELECCIONADA =====
function procesarOpcionPago() {
    const opcionSeleccionada = document.querySelector('input[name="tipoPago"]:checked');
    
    if (!opcionSeleccionada) {
        mostrarNotificacion('❌ Selecciona una opción');
        return;
    }
    
    cerrarModalOpcionesPago();
    
    if (opcionSeleccionada.value === 'enviar') {
        procesarEnvioACasa();
    } else {
        mostrarQrPago();
    }
}

// ===== PROCESAR ENVÍO A CASA =====
function procesarEnvioACasa() {
    if (App.carrito.length === 0) {
        mostrarNotificacion('❌ El carrito está vacío');
        return;
    }
    
    // Verificar stock
    for (const item of App.carrito) {
        const producto = App.productos.find(p => p.id === item.id);
        if (!producto || producto.stock < item.cantidad) {
            mostrarNotificacion(`❌ Stock insuficiente para ${producto ? producto.nombre : 'producto'}`);
            return;
        }
    }
    
    // Calcular total
    const total = App.carrito.reduce((sum, item) => {
        const producto = App.productos.find(p => p.id === item.id);
        return sum + (producto ? producto.precio * item.cantidad : 0);
    }, 0);
    
    // Crear pedido pendiente
    const pedido = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        cliente: { ...App.clienteActual },
        productos: App.carrito.map(item => {
            const producto = App.productos.find(p => p.id === item.id);
            return {
                id: item.id,
                nombre: producto ? producto.nombre : 'Producto',
                precio: producto ? producto.precio : 0,
                cantidad: item.cantidad
            };
        }),
        total: total,
        tipoPago: 'enviar',
        estado: 'pendiente'
    };
    
    // Guardar en pedidos pendientes
    App.pedidosPendientes.push(pedido);
    localStorage.setItem('pedidosPendientes', JSON.stringify(App.pedidosPendientes));
    
    // Vaciar carrito
    App.carrito = [];
    localStorage.setItem('carrito', JSON.stringify(App.carrito));
    
    // Actualizar badge
    actualizarBadgeCarrito();
    
    // Mostrar notificación
    mostrarNotificacion('✅ Pedido enviado a casa');
    
    // Redirigir a pedidos pendientes
    mostrarPagina('pendientes');
}

// ===== MOSTRAR QR DE PAGO =====
function mostrarQrPago() {
    if (App.carrito.length === 0) {
        mostrarNotificacion('❌ El carrito está vacío');
        return;
    }
    
    // Verificar stock
    for (const item of App.carrito) {
        const producto = App.productos.find(p => p.id === item.id);
        if (!producto || producto.stock < item.cantidad) {
            mostrarNotificacion(`❌ Stock insuficiente para ${producto ? producto.nombre : 'producto'}`);
            return;
        }
    }
    
    // Calcular total
    const total = App.carrito.reduce((sum, item) => {
        const producto = App.productos.find(p => p.id === item.id);
        return sum + (producto ? producto.precio * item.cantidad : 0);
    }, 0);
    
    // Crear datos completos para el QR
    const datosPago = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        cliente: { ...App.clienteActual },
        productos: App.carrito.map(item => {
            const producto = App.productos.find(p => p.id === item.id);
            return {
                id: item.id,
                nombre: producto ? producto.nombre : 'Producto',
                precio: producto ? producto.precio : 0,
                cantidad: item.cantidad
            };
        }),
        total: total
    };
    
    // Guardar el pedido temporalmente
    App.pedidoTemporal = datosPago;
    
    // Usar la función del módulo para mostrar el QR
    mostrarQRPago(datosPago);
}

// ===== GENERADORES DE COMPONENTES =====
function generarProductosHTML(productos) {
    if (!productos || productos.length === 0) {
        return '<div class="empty">No hay productos</div>';
    }
    
    return productos.map(p => {
        let stockClass = 'stock-normal';
        let stockText = `Stock: ${p.stock}`;
        
        if (p.stock === 0) {
            stockClass = 'stock-agotado';
            stockText = '❌ Agotado';
        } else if (p.stock < 5) {
            stockClass = 'stock-bajo';
            stockText = `⚠️ Últimos ${p.stock}`;
        }
        
        const esFavorito = App.favoritos.includes(p.id) ? '❤️' : '🤍';
        
        return `
            <div class="producto-card" onclick="verProducto('${p.id}')">
                <div class="producto-imagen">📦</div>
                <div class="producto-info">
                    <div class="producto-nombre">${p.nombre}</div>
                    <div class="producto-categoria">${p.categoria_nombre || 'General'}</div>
                    <div class="producto-precio">$${p.precio.toFixed(2)}</div>
                    <div class="producto-stock ${stockClass}">${stockText}</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <button class="btn-favorito-small" onclick="event.stopPropagation(); toggleFavorito('${p.id}')">${esFavorito}</button>
                        <button class="btn-carrito-small" onclick="event.stopPropagation(); agregarAlCarrito('${p.id}')">🛒</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generarCategoriasHTML(categorias) {
    if (!categorias || categorias.length === 0) {
        return '<div class="empty">No hay categorías</div>';
    }
    
    const iconos = ['👕', '📱', '💻', '📚', '🎮', '👟', '🧥', '👜'];
    
    return categorias.map((c, index) => `
        <div class="categoria-card" onclick="filtrarPorCategoria('${c.id}')">
            <div class="categoria-icon">${iconos[index % iconos.length]}</div>
            <div class="categoria-nombre">${c.nombre}</div>
            <div class="categoria-count">${c.productCount || 0} productos</div>
        </div>
    `).join('');
}

// ===== FUNCIONES DE PRODUCTOS =====
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/api/dueno/productos`);
        App.productos = await response.json();
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarNotificacion('❌ Error al cargar productos');
    }
}

async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/api/categorias`);
        App.categorias = await response.json();
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

function buscarProductos(termino) {
    if (!termino) {
        mostrarPagina('dashboard');
        return;
    }
    
    const resultados = App.productos.filter(p => 
        p.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(termino.toLowerCase()))
    );
    
    const html = `
        <div class="page active">
            <h2 class="page-title">🔍 Resultados: "${termino}"</h2>
            <div class="productos-grid">
                ${generarProductosHTML(resultados)}
            </div>
        </div>
    `;
    
    DOM.mainContent.innerHTML = html;
}

function filtrarPorCategoria(categoriaId) {
    const categoria = App.categorias.find(c => c.id === categoriaId);
    const productosFiltrados = App.productos.filter(p => p.categoria === categoriaId);
    
    const html = `
        <div class="page active">
            <h2 class="page-title">${categoria ? categoria.nombre : 'Categoría'}</h2>
            <div class="productos-grid">
                ${generarProductosHTML(productosFiltrados)}
            </div>
        </div>
    `;
    
    DOM.mainContent.innerHTML = html;
}

function verProducto(id) {
    const producto = App.productos.find(p => p.id === id);
    if (!producto) return;
    
    DOM.modalProductoNombre.textContent = producto.nombre;
    
    let stockClass = 'stock-normal';
    let stockText = `Stock: ${producto.stock}`;
    
    if (producto.stock === 0) {
        stockClass = 'stock-agotado';
        stockText = '❌ Agotado';
    } else if (producto.stock < 5) {
        stockClass = 'stock-bajo';
        stockText = `⚠️ Últimos ${producto.stock}`;
    }
    
    const esFavorito = App.favoritos.includes(producto.id) ? '❤️ Quitar de favoritos' : '🤍 Agregar a favoritos';
    
    DOM.modalProductoBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <div style="font-size: 5rem;">📦</div>
        </div>
        <div style="margin-bottom: 1rem;">
            <h3>${producto.nombre}</h3>
            <p style="color: #666;">${producto.categoria_nombre || 'Sin categoría'}</p>
            <p style="font-size: 2rem; color: var(--primary-color); font-weight: bold;">$${producto.precio.toFixed(2)}</p>
            <p class="${stockClass}">${stockText}</p>
        </div>
        <div style="display: flex; gap: 1rem;">
            <button class="btn-favorito" onclick="toggleFavorito('${producto.id}'); cerrarModal();" style="flex: 1; padding: 1rem;">${esFavorito}</button>
            <button class="btn-carrito" onclick="agregarAlCarrito('${producto.id}'); cerrarModal();" style="flex: 1; padding: 1rem; background: var(--primary-color); color: white; border: none; border-radius: 8px;">🛒 Agregar al carrito</button>
        </div>
    `;
    
    DOM.productoModal.classList.add('active');
}

// ===== FUNCIONES DE FAVORITOS =====
function toggleFavorito(id) {
    const index = App.favoritos.indexOf(id);
    
    if (index === -1) {
        App.favoritos.push(id);
        mostrarNotificacion('✅ Agregado a favoritos');
    } else {
        App.favoritos.splice(index, 1);
        mostrarNotificacion('❌ Eliminado de favoritos');
    }
    
    localStorage.setItem('favoritos', JSON.stringify(App.favoritos));
    
    // Recargar página actual si es necesario
    if (App.currentPage === 'favoritos' || App.currentPage === 'dashboard') {
        mostrarPagina(App.currentPage);
    }
}

// ===== FUNCIONES DE CARRITO =====
function agregarAlCarrito(id, cantidad = 1) {
    const producto = App.productos.find(p => p.id === id);
    if (!producto || producto.stock === 0) {
        mostrarNotificacion('❌ Producto no disponible');
        return false;
    }
    
    const itemExistente = App.carrito.find(item => item.id === id);
    
    if (itemExistente) {
        if (itemExistente.cantidad + cantidad <= producto.stock) {
            itemExistente.cantidad += cantidad;
        } else {
            mostrarNotificacion('❌ Stock insuficiente');
            return false;
        }
    } else {
        if (cantidad <= producto.stock) {
            App.carrito.push({ id, cantidad: cantidad });
        } else {
            mostrarNotificacion('❌ Stock insuficiente');
            return false;
        }
    }
    
    localStorage.setItem('carrito', JSON.stringify(App.carrito));
    actualizarBadgeCarrito();
    mostrarNotificacion(`✅ ${cantidad} producto(s) agregado(s) al carrito`);
    return true;
}

function modificarCantidad(id, delta) {
    const item = App.carrito.find(item => item.id === id);
    const producto = App.productos.find(p => p.id === id);
    
    if (!item || !producto) return;
    
    const nuevaCantidad = item.cantidad + delta;
    
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(id);
        return;
    }
    
    if (nuevaCantidad > producto.stock) {
        mostrarNotificacion('❌ Stock insuficiente');
        return;
    }
    
    item.cantidad = nuevaCantidad;
    localStorage.setItem('carrito', JSON.stringify(App.carrito));
    actualizarBadgeCarrito();
    mostrarPagina('carrito');
}

function eliminarDelCarrito(id) {
    App.carrito = App.carrito.filter(item => item.id !== id);
    localStorage.setItem('carrito', JSON.stringify(App.carrito));
    actualizarBadgeCarrito();
    mostrarPagina('carrito');
    mostrarNotificacion('✅ Producto eliminado del carrito');
}

function actualizarBadgeCarrito() {
    const totalItems = App.carrito.reduce((sum, item) => sum + item.cantidad, 0);
    DOM.cartBadge.textContent = totalItems;
    DOM.cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
}

// ===== FUNCIONES DE ESCÁNER QR =====
function iniciarEscaner() {
    const btn = document.getElementById('btnAbrirCamara');
    const estado = document.getElementById('estadoEscaner');
    const videoContainer = document.getElementById('video-container');
    const orientacionInfo = document.getElementById('orientacionInfo');
    const btnDetener = document.getElementById('btnDetener');
    
    btn.disabled = true;
    btn.innerHTML = `
        <span class="loading"></span>
        <span>ABRIENDO CÁMARA...</span>
    `;
    
    estado.innerHTML = '📸 Solicitando permiso de cámara...';
    
    // Crear elementos para el escaneo
    const video = document.getElementById('video');
    const canvasElement = document.createElement('canvas');
    const canvas = canvasElement.getContext('2d');
    
    App.qrScanner.video = video;
    App.qrScanner.canvas = canvas;
    App.qrScanner.canvasElement = canvasElement;
    
    // Intentar abrir cámara trasera
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: { exact: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
    })
    .then(stream => {
        manejarStreamExitoso(stream, video, videoContainer, orientacionInfo, estado, btn, btnDetener);
    })
    .catch(err => {
        console.log('Error con cámara trasera exacta, intentando sin exact:', err);
        
        return navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
    })
    .then(stream => {
        if (stream) {
            manejarStreamExitoso(stream, video, videoContainer, orientacionInfo, estado, btn, btnDetener);
        }
    })
    .catch(err => {
        console.error('Error final:', err);
        estado.innerHTML = '❌ Error: No se pudo acceder a la cámara trasera';
        btn.disabled = false;
        btn.innerHTML = `
            <span style="font-size: 48px;">📸</span>
            <span>ABRIR CÁMARA</span>
            <span style="font-size: 14px;">Haz clic aquí para activar la cámara</span>
        `;
    });
}

function manejarStreamExitoso(stream, video, videoContainer, orientacionInfo, estado, btn, btnDetener) {
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
        const track = videoTracks[0];
        orientacionInfo.style.display = 'block';
        orientacionInfo.innerHTML = `📐 Usando: ${track.label || 'Cámara trasera'}<br>Orientación normal - sin espejo`;
    }
    
    App.qrScanner.stream = stream;
    video.srcObject = stream;
    
    video.onloadedmetadata = function() {
        video.play();
        video.style.transform = 'none';
        videoContainer.style.display = 'block';
        
        estado.innerHTML = '🔍 Escaneando... Apunta el código QR hacia la cámara';
        
        btn.style.display = 'none';
        btnDetener.style.display = 'block';
        
        App.qrScanner.scanning = true;
        escanearQR();
    };
}

function escanearQR() {
    if (!App.qrScanner.scanning) return;
    
    const video = App.qrScanner.video;
    const canvas = App.qrScanner.canvas;
    const canvasElement = App.qrScanner.canvasElement;
    
    if (!video || !canvas) return;
    
    try {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code) {
                console.log('QR detectado:', code.data);
                procesarResultadoQR(code.data);
                
                document.getElementById('estadoEscaner').innerHTML = '✅ ¡QR detectado!';
                App.qrScanner.scanning = false;
                
                setTimeout(() => {
                    detenerCamara();
                }, 2000);
            }
        }
    } catch (e) {
        console.error('Error en escaneo:', e);
    }
    
    if (App.qrScanner.scanning) {
        requestAnimationFrame(escanearQR);
    }
}

function detenerCamara() {
    if (App.qrScanner.stream) {
        App.qrScanner.stream.getTracks().forEach(track => {
            track.stop();
        });
        if (App.qrScanner.video) {
            App.qrScanner.video.srcObject = null;
        }
    }
    
    document.getElementById('video-container').style.display = 'none';
    document.getElementById('btnAbrirCamara').style.display = 'flex';
    document.getElementById('btnDetener').style.display = 'none';
    document.getElementById('estadoEscaner').innerHTML = '📸 Cámara detenida';
    document.getElementById('orientacionInfo').style.display = 'none';
    
    App.qrScanner.scanning = false;
    App.qrScanner.stream = null;
}

function escanearArchivo(file) {
    const reader = new FileReader();
    reader.onload = function() {
        const img = new Image();
        img.src = reader.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                procesarResultadoQR(code.data);
                document.getElementById('estadoEscaner').innerHTML = '✅ QR escaneado desde archivo';
            } else {
                document.getElementById('estadoEscaner').innerHTML = '❌ No se encontró QR en la imagen';
            }
        };
    };
    reader.readAsDataURL(file);
}

function procesarResultadoQR(texto) {
    const producto = App.productos.find(p => p.id === texto);
    
    if (producto) {
        mostrarProductoEscanear(producto);
    } else {
        const productoAlternativo = App.productos.find(p => 
            (p.codigo && p.codigo === texto) || 
            (p.nombre && p.nombre.toLowerCase().includes(texto.toLowerCase()))
        );
        
        if (productoAlternativo) {
            mostrarProductoEscanear(productoAlternativo);
        } else {
            mostrarNotificacion('❌ Producto no encontrado');
            document.getElementById('estadoEscaner').innerHTML = `QR detectado: ${texto}`;
        }
    }
}

function mostrarProductoEscanear(producto) {
    App.productoEscanearTemp = producto;
    App.cantidadEscanearTemp = 1;
    
    DOM.productoEscanearModal.classList.add('active');
    
    let stockClass = 'stock-normal';
    let stockText = `Stock: ${producto.stock}`;
    
    if (producto.stock === 0) {
        stockClass = 'stock-agotado';
        stockText = '❌ Agotado';
    } else if (producto.stock < 5) {
        stockClass = 'stock-bajo';
        stockText = `⚠️ Últimos ${producto.stock}`;
    }
    
    DOM.productoEscanearBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <div style="font-size: 4rem;">📦</div>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <h3>${producto.nombre}</h3>
            <p style="color: #666;">${producto.categoria_nombre || 'Sin categoría'}</p>
            <p style="font-size: 1.8rem; color: var(--primary-color); font-weight: bold;">$${producto.precio.toFixed(2)}</p>
            <p class="${stockClass}">${stockText}</p>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Cantidad:</label>
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                <button id="btnRestar" class="cantidad-btn" style="width: 40px; height: 40px; font-size: 1.2rem; background: var(--primary-color); color: white; border: none; border-radius: 50%; cursor: pointer;">-</button>
                <span id="cantidadDisplay" style="font-size: 1.5rem; font-weight: bold; min-width: 50px; text-align: center;">1</span>
                <button id="btnSumar" class="cantidad-btn" style="width: 40px; height: 40px; font-size: 1.2rem; background: var(--primary-color); color: white; border: none; border-radius: 50%; cursor: pointer;">+</button>
            </div>
        </div>
        
        <div style="display: flex; gap: 1rem;">
            <button id="btnCancelar" style="flex: 1; padding: 1rem; background: #e74c3c; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">
                ✖ Cancelar
            </button>
            <button id="btnAgregarCarrito" style="flex: 1; padding: 1rem; background: var(--success-color); color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">
                🛒 Agregar ${App.cantidadEscanearTemp}
            </button>
        </div>
    `;
    
    setTimeout(() => {
        document.getElementById('btnRestar')?.addEventListener('click', () => {
            if (App.cantidadEscanearTemp > 1) {
                App.cantidadEscanearTemp--;
                document.getElementById('cantidadDisplay').textContent = App.cantidadEscanearTemp;
                document.getElementById('btnAgregarCarrito').innerHTML = `🛒 Agregar ${App.cantidadEscanearTemp}`;
            }
        });
        
        document.getElementById('btnSumar')?.addEventListener('click', () => {
            if (App.cantidadEscanearTemp < producto.stock) {
                App.cantidadEscanearTemp++;
                document.getElementById('cantidadDisplay').textContent = App.cantidadEscanearTemp;
                document.getElementById('btnAgregarCarrito').innerHTML = `🛒 Agregar ${App.cantidadEscanearTemp}`;
            } else {
                mostrarNotificacion('❌ Stock máximo alcanzado');
            }
        });
        
        document.getElementById('btnAgregarCarrito')?.addEventListener('click', () => {
            if (agregarAlCarrito(producto.id, App.cantidadEscanearTemp)) {
                cerrarProductoEscanearModal();
            }
        });
        
        document.getElementById('btnCancelar')?.addEventListener('click', () => {
            cerrarProductoEscanearModal();
        });
    }, 100);
}

function cerrarProductoEscanearModal() {
    DOM.productoEscanearModal.classList.remove('active');
    App.productoEscanearTemp = null;
    App.cantidadEscanearTemp = 1;
}

// ===== CANCELAR PEDIDO =====
function cancelarPedido(id) {
    const index = App.pedidosPendientes.findIndex(p => p.id === id);
    
    if (index !== -1) {
        App.pedidosPendientes[index].estado = 'cancelado';
        
        setTimeout(() => {
            const pedidoCancelado = App.pedidosPendientes.splice(index, 1)[0];
            App.historial.push(pedidoCancelado);
            localStorage.setItem('historial', JSON.stringify(App.historial));
            localStorage.setItem('pedidosPendientes', JSON.stringify(App.pedidosPendientes));
            
            if (App.currentPage === 'pendientes' || App.currentPage === 'historial') {
                mostrarPagina(App.currentPage);
            }
        }, 2000);
        
        localStorage.setItem('pedidosPendientes', JSON.stringify(App.pedidosPendientes));
        mostrarPagina('pendientes');
        mostrarNotificacion('❌ Pedido cancelado');
    }
}

// ===== MARCAR COMO COMPLETADO =====
function marcarCompletado(id) {
    const index = App.pedidosPendientes.findIndex(p => p.id === id);
    
    if (index !== -1) {
        App.pedidosPendientes[index].estado = 'completado';
        
        setTimeout(() => {
            const pedidoCompletado = App.pedidosPendientes.splice(index, 1)[0];
            App.historial.push(pedidoCompletado);
            localStorage.setItem('historial', JSON.stringify(App.historial));
            localStorage.setItem('pedidosPendientes', JSON.stringify(App.pedidosPendientes));
            
            if (App.currentPage === 'pendientes' || App.currentPage === 'historial') {
                mostrarPagina(App.currentPage);
            }
        }, 1000);
        
        localStorage.setItem('pedidosPendientes', JSON.stringify(App.pedidosPendientes));
        mostrarPagina('pendientes');
        mostrarNotificacion('✅ Pedido completado');
    }
}

// ===== CONEXIÓN =====
function actualizarEstadoConexion() {
    if (navigator.onLine) {
        DOM.connectionStatus.className = 'connection-status online';
        DOM.connectionStatus.textContent = '📶';
        App.online = true;
    } else {
        DOM.connectionStatus.className = 'connection-status offline';
        DOM.connectionStatus.textContent = '📴';
        App.online = false;
        mostrarNotificacion('📴 Modo offline - mostrando datos guardados');
    }
}

// ===== NOTIFICACIONES =====
function mostrarNotificacion(mensaje) {
    DOM.notification.textContent = mensaje;
    DOM.notification.style.display = 'block';
    
    setTimeout(() => {
        DOM.notification.style.display = 'none';
    }, 2000);
}

// ===== MODAL =====
function cerrarModal() {
    DOM.productoModal.classList.remove('active');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            mostrarPagina(page);
        });
    });
    
    // Búsqueda
    DOM.searchBtn.addEventListener('click', () => {
        buscarProductos(DOM.searchInput.value.trim());
    });
    
    DOM.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            buscarProductos(e.target.value.trim());
        }
    });
    
    // Conexión
    window.addEventListener('online', () => {
        actualizarEstadoConexion();
        mostrarNotificacion('📶 Conexión restablecida');
        cargarProductos();
        cargarCategorias();
    });
    
    window.addEventListener('offline', () => {
        actualizarEstadoConexion();
    });
    
    // Menú lateral (ahora funcional)
    DOM.menuBtn.addEventListener('click', () => {
        mostrarMenuLateral();
    });
    
    // Limpiar al cerrar
    window.addEventListener('beforeunload', function() {
        if (App.qrScanner.stream) {
            App.qrScanner.stream.getTracks().forEach(track => track.stop());
        }
    });
}

function configurarEventosPagina(pagina) {
    if (pagina === 'escanear') {
        setTimeout(() => {
            document.getElementById('btnAbrirCamara')?.addEventListener('click', (e) => {
                e.preventDefault();
                iniciarEscaner();
            });
            
            document.getElementById('fileInput')?.addEventListener('change', function(e) {
                const archivo = e.target.files[0];
                if (archivo) {
                    escanearArchivo(archivo);
                }
                this.value = '';
            });
            
            document.getElementById('btnDetener')?.addEventListener('click', () => {
                detenerCamara();
            });
        }, 100);
    }
}

// ===== FUNCIONES PARA EL MÓDULO QR =====
window.aceptarPagoConQR = function() {
    cerrarModalQrPago();
    
    if (!App.pedidoTemporal) {
        mostrarNotificacion('❌ Error al procesar el pago');
        return;
    }
    
    const pedido = {
        id: App.pedidoTemporal.id,
        fecha: App.pedidoTemporal.fecha,
        cliente: App.pedidoTemporal.cliente,
        productos: App.pedidoTemporal.productos.map(p => ({
            id: p.id || Date.now().toString(),
            nombre: p.nombre,
            precio: p.precio,
            cantidad: p.cantidad
        })),
        total: App.pedidoTemporal.total,
        tipoPago: 'pagar',
        estado: 'pendiente'
    };
    
    App.pedidosPendientes.push(pedido);
    localStorage.setItem('pedidosPendientes', JSON.stringify(App.pedidosPendientes));
    
    App.carrito = [];
    localStorage.setItem('carrito', JSON.stringify(App.carrito));
    
    actualizarBadgeCarrito();
    App.pedidoTemporal = null;
    
    mostrarNotificacion('✅ Pago registrado - Pedido pendiente');
    mostrarPagina('pendientes');
};

window.descargarQRPago = descargarQRPago;
window.cerrarModalQrPago = cerrarModalQrPago;

// ===== EXPORTAR FUNCIONES GLOBALES =====
window.mostrarPagina = mostrarPagina;
window.verProducto = verProducto;
window.cerrarModal = cerrarModal;
window.cerrarModalOpcionesPago = cerrarModalOpcionesPago;
window.cerrarProductoEscanearModal = cerrarProductoEscanearModal;
window.toggleFavorito = toggleFavorito;
window.agregarAlCarrito = agregarAlCarrito;
window.modificarCantidad = modificarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.filtrarPorCategoria = filtrarPorCategoria;
window.mostrarOpcionesPago = mostrarOpcionesPago;
window.procesarOpcionPago = procesarOpcionPago;
window.cancelarPedido = cancelarPedido;
window.marcarCompletado = marcarCompletado;
window.navegarDesdeMenu = navegarDesdeMenu;
