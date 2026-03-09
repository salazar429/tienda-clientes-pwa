// Configuración
const API_URL = 'https://sistema-test-api.onrender.com';
let productos = [];
let offline = !navigator.onLine;

// Elementos del DOM
const splash = document.getElementById('splash');
const productosContainer = document.getElementById('productos-container');
const searchInput = document.getElementById('searchInput');
const connectionStatus = document.getElementById('connection-status');
const notification = document.getElementById('notification');
const installButton = document.getElementById('install-button');

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛍️ App Tienda iniciada');
    
    // Ocultar splash después de 2 segundos
    setTimeout(() => {
        splash.classList.add('hidden');
    }, 2000);
    
    // Registrar Service Worker
    registerServiceWorker();
    
    // Cargar productos
    cargarProductos();
    
    // Configurar listeners
    setupEventListeners();
    
    // Verificar estado de conexión
    actualizarEstadoConexion();
});

// ===== SERVICE WORKER =====
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado');
            })
            .catch(error => {
                console.error('❌ Error registrando Service Worker:', error);
            });
    }
}

// ===== PRODUCTOS =====
function cargarProductos() {
    mostrarCargando();
    
    fetch(`${API_URL}/api/dueno/productos`)
        .then(response => response.json())
        .then(data => {
            productos = data;
            mostrarProductos(productos);
        })
        .catch(error => {
            console.error('Error cargando productos:', error);
            mostrarError('Error al cargar los productos');
        });
}

function mostrarProductos(productosArray) {
    if (!productosArray || productosArray.length === 0) {
        productosContainer.innerHTML = '<div class="empty">No hay productos disponibles</div>';
        return;
    }
    
    let html = '';
    
    productosArray.forEach(producto => {
        // Determinar clase de stock
        let stockClass = 'producto-stock';
        let stockText = `Stock: ${producto.stock}`;
        
        if (producto.stock === 0) {
            stockClass += ' agotado';
            stockText = '❌ Agotado';
        } else if (producto.stock < 5) {
            stockClass += ' bajo';
            stockText = `⚠️ Últimos ${producto.stock}`;
        }
        
        html += `
            <div class="producto-card">
                <div class="producto-imagen">
                    ${producto.imagen || '📦'}
                </div>
                <div class="producto-info">
                    <div class="producto-nombre">${producto.nombre}</div>
                    <div class="producto-categoria">${producto.categoria_nombre || 'General'}</div>
                    <div class="producto-precio">$${producto.precio.toFixed(2)}</div>
                    <div class="${stockClass}">${stockText}</div>
                </div>
            </div>
        `;
    });
    
    productosContainer.innerHTML = html;
}

// ===== BÚSQUEDA =====
function buscarProductos(termino) {
    if (!termino) {
        mostrarProductos(productos);
        return;
    }
    
    const terminoLower = termino.toLowerCase();
    const filtrados = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(terminoLower) ||
        (producto.categoria_nombre && producto.categoria_nombre.toLowerCase().includes(terminoLower))
    );
    
    mostrarProductos(filtrados);
}

// ===== ESTADOS DE CARGA =====
function mostrarCargando() {
    productosContainer.innerHTML = '<div class="cargando">Cargando productos...</div>';
}

function mostrarError(mensaje) {
    productosContainer.innerHTML = `<div class="error">❌ ${mensaje}</div>`;
}

// ===== CONEXIÓN =====
function actualizarEstadoConexion() {
    if (navigator.onLine) {
        connectionStatus.className = 'connection-status online';
        connectionStatus.textContent = '📶';
        offline = false;
    } else {
        connectionStatus.className = 'connection-status offline';
        connectionStatus.textContent = '📴';
        offline = true;
        mostrarNotificacion('📴 Modo offline - mostrando datos guardados');
    }
}

// ===== NOTIFICACIONES =====
function mostrarNotificacion(mensaje) {
    notification.textContent = mensaje;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Búsqueda
    searchInput.addEventListener('input', (e) => {
        buscarProductos(e.target.value);
    });
    
    // Conexión
    window.addEventListener('online', () => {
        actualizarEstadoConexion();
        mostrarNotificacion('📶 Conexión restablecida');
        cargarProductos();
    });
    
    window.addEventListener('offline', () => {
        actualizarEstadoConexion();
    });
}

// ===== INSTALACIÓN PWA =====
let installPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    installButton.style.display = 'block';
});

installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    
    installButton.style.display = 'none';
    installPrompt.prompt();
    
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
        mostrarNotificacion('✅ Instalando aplicación...');
    }
    
    installPrompt = null;
});

window.addEventListener('appinstalled', () => {
    installButton.style.display = 'none';
    mostrarNotificacion('✅ App instalada correctamente');
});