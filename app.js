// ===========================================
// APP TIENDA CLIENTES - VERSIÓN COMPLETA
// ===========================================

const API_URL = 'https://sistema-test-api.onrender.com';

// Estado global de la aplicación
const App = {
    productos: [],
    categorias: [],
    favoritos: JSON.parse(localStorage.getItem('favoritos')) || [],
    carrito: JSON.parse(localStorage.getItem('carrito')) || [],
    historial: JSON.parse(localStorage.getItem('historial')) || [],
    currentPage: 'dashboard',
    online: navigator.onLine,
    installPrompt: null
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
    menuBtn: document.getElementById('menuBtn')
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

// ===== NAVEGACIÓN =====
function mostrarPagina(pagina) {
    App.currentPage = pagina;
    
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
        case 'categorias':
            html = generarCategorias();
            break;
        case 'favoritos':
            html = generarFavoritos();
            break;
        case 'carrito':
            html = generarCarrito();
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
    const productosDestacados = App.productos.slice(0, 6);
    const categoriasDestacadas = App.categorias.slice(0, 4);
    const favoritosCount = App.favoritos.length;
    const carritoCount = App.carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    return `
        <div class="page active">
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon">📦</div>
                    <div class="stat-value">${App.productos.length}</div>
                    <div class="stat-label">Productos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏷️</div>
                    <div class="stat-value">${App.categorias.length}</div>
                    <div class="stat-label">Categorías</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">❤️</div>
                    <div class="stat-value">${favoritosCount}</div>
                    <div class="stat-label">Favoritos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🛒</div>
                    <div class="stat-value">${carritoCount}</div>
                    <div class="stat-label">En carrito</div>
                </div>
            </div>
            
            <div class="dashboard-section">
                <div class="section-title">
                    <span>🌟 Productos Destacados</span>
                    <span class="ver-mas" onclick="mostrarPagina('productos')">Ver más →</span>
                </div>
                <div class="productos-grid">
                    ${generarProductosHTML(productosDestacados)}
                </div>
            </div>
            
            <div class="dashboard-section">
                <div class="section-title">
                    <span>📊 Categorías</span>
                    <span class="ver-mas" onclick="mostrarPagina('categorias')">Ver más →</span>
                </div>
                <div class="categorias-grid">
                    ${generarCategoriasHTML(categoriasDestacadas)}
                </div>
            </div>
        </div>
    `;
}

function generarCategorias() {
    return `
        <div class="page active">
            <h2 class="page-title">📊 Categorías</h2>
            <div class="categorias-grid">
                ${generarCategoriasHTML(App.categorias)}
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
        
        total += producto.precio * item.cantidad;
        
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
                <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')">✖</button>
            </div>
        `;
    });
    
    html += `
        <div class="carrito-total">
            Total: $${total.toFixed(2)}
        </div>
        <button class="btn-comprar" onclick="completarCompra()">
            ✅ Completar Compra
        </button>
    </div>
    `;
    
    return html;
}

function generarHistorial() {
    if (App.historial.length === 0) {
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
    
    App.historial.forEach(compra => {
        html += `
            <div class="historial-item">
                <div class="historial-header">
                    <span class="historial-fecha">${new Date(compra.fecha).toLocaleDateString()}</span>
                    <span class="historial-total">$${compra.total.toFixed(2)}</span>
                </div>
                ${compra.productos.map(p => `
                    <div class="historial-producto">
                        <span>${p.nombre} x${p.cantidad}</span>
                        <span>$${(p.precio * p.cantidad).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
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
            <h2 class="page-title">${categoria.nombre}</h2>
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
function agregarAlCarrito(id) {
    const producto = App.productos.find(p => p.id === id);
    if (!producto || producto.stock === 0) {
        mostrarNotificacion('❌ Producto no disponible');
        return;
    }
    
    const itemExistente = App.carrito.find(item => item.id === id);
    
    if (itemExistente) {
        if (itemExistente.cantidad < producto.stock) {
            itemExistente.cantidad++;
        } else {
            mostrarNotificacion('❌ Stock insuficiente');
            return;
        }
    } else {
        App.carrito.push({ id, cantidad: 1 });
    }
    
    localStorage.setItem('carrito', JSON.stringify(App.carrito));
    actualizarBadgeCarrito();
    mostrarNotificacion('✅ Producto agregado al carrito');
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

function completarCompra() {
    if (App.carrito.length === 0) {
        mostrarNotificacion('❌ El carrito está vacío');
        return;
    }
    
    const total = App.carrito.reduce((sum, item) => {
        const producto = App.productos.find(p => p.id === item.id);
        return sum + (producto ? producto.precio * item.cantidad : 0);
    }, 0);
    
    const compra = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        productos: App.carrito.map(item => {
            const producto = App.productos.find(p => p.id === item.id);
            return {
                id: item.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: item.cantidad
            };
        }),
        total: total
    };
    
    App.historial.unshift(compra);
    App.carrito = [];
    
    localStorage.setItem('historial', JSON.stringify(App.historial));
    localStorage.setItem('carrito', JSON.stringify(App.carrito));
    
    actualizarBadgeCarrito();
    mostrarPagina('historial');
    mostrarNotificacion('✅ Compra completada con éxito');
}

function actualizarBadgeCarrito() {
    const totalItems = App.carrito.reduce((sum, item) => sum + item.cantidad, 0);
    DOM.cartBadge.textContent = totalItems;
    DOM.cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
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
    
    // Menú (para futuras funcionalidades)
    DOM.menuBtn.addEventListener('click', () => {
        mostrarMenuLateral();
    });
}

function configurarEventosPagina(pagina) {
    // Eventos específicos por página si son necesarios
}

// ===== MENÚ LATERAL (placeholder) =====
function mostrarMenuLateral() {
    mostrarNotificacion('Menú en desarrollo');
}

// ===== INSTALACIÓN PWA =====
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    App.installPrompt = e;
    DOM.installButton.style.display = 'flex';
});

DOM.installButton.addEventListener('click', async () => {
    if (!App.installPrompt) return;
    
    DOM.installButton.style.display = 'none';
    App.installPrompt.prompt();
    
    const { outcome } = await App.installPrompt.userChoice;
    
    if (outcome === 'accepted') {
        mostrarNotificacion('✅ Instalando aplicación...');
    }
    
    App.installPrompt = null;
});

window.addEventListener('appinstalled', () => {
    DOM.installButton.style.display = 'none';
    mostrarNotificacion('✅ App instalada correctamente');
});

// ===== EXPORTAR FUNCIONES GLOBALES =====
window.mostrarPagina = mostrarPagina;
window.verProducto = verProducto;
window.cerrarModal = cerrarModal;
window.toggleFavorito = toggleFavorito;
window.agregarAlCarrito = agregarAlCarrito;
window.modificarCantidad = modificarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.completarCompra = completarCompra;
window.filtrarPorCategoria = filtrarPorCategoria;
