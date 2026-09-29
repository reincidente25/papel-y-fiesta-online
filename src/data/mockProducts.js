// src/data/mockProducts.js
// Catálogo de ejemplo (mockup). Array mutable en memoria.

const img = (id) => `https://images.unsplash.com/photo-${id}?w=600&q=80`;

export const MOCK_PRODUCTS = [
  // Librería
  { id: 'demo-1',  nombre: 'Cuaderno A5 tapa dura punteado', descripcion: 'Cuaderno premium de 160 hojas, tapa dura y hojas punteadas. Ideal para bullet journal.', categoria: 'libreria', precioCosto: 3200, precioVenta: 6900, stock: 24, estado: 'activo', destacado: true, imagen: img('1531346878377-a5be20888e57') },
  { id: 'demo-2',  nombre: 'Set 12 fibras acuarelables', descripcion: 'Fibras de doble punta con base al agua. Colores vibrantes.', categoria: 'arte', precioCosto: 4800, precioVenta: 9500, stock: 12, estado: 'activo', destacado: true, imagen: img('1513542789411-b6a5d4f31634') },
  { id: 'demo-3',  nombre: 'Kit cumpleaños temático 8 personas', descripcion: 'Vasos, platos, servilletas, globos y guirnalda a juego.', categoria: 'fiesta', precioCosto: 5200, precioVenta: 11900, stock: 8, estado: 'activo', destacado: true, imagen: img('1530103862676-de8c9debad1d') },
  { id: 'demo-4',  nombre: 'Mochila escolar reforzada', descripcion: 'Mochila resistente con compartimento para notebook.', categoria: 'escolar', precioCosto: 12000, precioVenta: 24900, stock: 5, estado: 'activo', destacado: false, imagen: img('1553062407-98eeb64c6a62') },
  { id: 'demo-5',  nombre: 'Resma A4 75g (500 hojas)', descripcion: 'Papel blanco de alta calidad para impresión y fotocopias.', categoria: 'oficina', precioCosto: 4500, precioVenta: 7200, stock: 0, estado: 'sin_stock', destacado: false, imagen: img('1583485088034-697b5bc54ccd') },
  { id: 'demo-6',  nombre: 'Caja de regalo sorpresa', descripcion: 'Caja decorada lista para armar tu regalo con moño y tarjeta.', categoria: 'regaleria', precioCosto: 1800, precioVenta: 4200, stock: 30, estado: 'activo', destacado: true, imagen: img('1549465220-1a8b9238cd48') },

  { id: 'demo-7',  nombre: 'Lapicera roller negra x3', descripcion: 'Tinta gel de secado rápido, trazo 0.7mm.', categoria: 'libreria', precioCosto: 1400, precioVenta: 3200, stock: 60, estado: 'activo', destacado: false, imagen: img('1586952518485-11b180e92764') },
  { id: 'demo-8',  nombre: 'Resaltadores pastel x6', descripcion: 'Colores suaves, punta biselada.', categoria: 'libreria', precioCosto: 2600, precioVenta: 5400, stock: 18, estado: 'activo', destacado: true, imagen: img('1568205612837-017257d2310a') },
  { id: 'demo-9',  nombre: 'Agenda 2026 semanal', descripcion: 'Agenda tapa dura, vista semanal, con separadores.', categoria: 'libreria', precioCosto: 5000, precioVenta: 10900, stock: 14, estado: 'activo', destacado: false, imagen: img('1506784365847-bbad939e9335') },

  // Escolar
  { id: 'demo-10', nombre: 'Cartuchera doble cierre', descripcion: 'Amplia, con dos compartimentos.', categoria: 'escolar', precioCosto: 3400, precioVenta: 7800, stock: 9, estado: 'activo', destacado: false, imagen: img('1546074177-ffdda98d214f') },
  { id: 'demo-11', nombre: 'Set geometría 4 piezas', descripcion: 'Regla, escuadra, transportador y compás.', categoria: 'escolar', precioCosto: 1900, precioVenta: 4300, stock: 22, estado: 'activo', destacado: false, imagen: img('1503676260728-1c00da094a0b') },
  { id: 'demo-12', nombre: 'Cartulinas colores x10', descripcion: 'Pack de 10 cartulinas surtidas tamaño A4.', categoria: 'escolar', precioCosto: 1200, precioVenta: 2900, stock: 40, estado: 'activo', destacado: false, imagen: img('1513364776144-60967b0f800f') },

  // Arte
  { id: 'demo-13', nombre: 'Témpera 250ml x6 colores', descripcion: 'Témperas lavables, colores primarios y secundarios.', categoria: 'arte', precioCosto: 3100, precioVenta: 6800, stock: 16, estado: 'activo', destacado: false, imagen: img('1596464716127-f2a82984de30') },
  { id: 'demo-14', nombre: 'Block de dibujo A3', descripcion: '20 hojas de 180g, ideal para acuarela y grafito.', categoria: 'arte', precioCosto: 3800, precioVenta: 7900, stock: 11, estado: 'activo', destacado: true, imagen: img('1499744937866-d7e566a20a61') },
  { id: 'demo-15', nombre: 'Set pinceles x12', descripcion: 'Pinceles variados para acrílico y óleo.', categoria: 'arte', precioCosto: 2900, precioVenta: 6200, stock: 0, estado: 'sin_stock', destacado: false, imagen: img('1460661419201-fd4cecdf8a8b') },

  // Fiesta
  { id: 'demo-16', nombre: 'Globos metalizados x50', descripcion: 'Globos surtidos, ideales para decoración.', categoria: 'fiesta', precioCosto: 2800, precioVenta: 5900, stock: 35, estado: 'activo', destacado: false, imagen: img('1527529482837-4698179dc6ce') },
  { id: 'demo-17', nombre: 'Velas número (0-9)', descripcion: 'Vela grande con purpurina, elegí el número.', categoria: 'fiesta', precioCosto: 900, precioVenta: 2400, stock: 50, estado: 'activo', destacado: false, imagen: img('1464349095431-e9a21285b5f3') },
  { id: 'demo-18', nombre: 'Piñata artesanal', descripcion: 'Piñata de cartón decorada, para rellenar.', categoria: 'fiesta', precioCosto: 4200, precioVenta: 8900, stock: 6, estado: 'activo', destacado: true, imagen: img('1608889175123-8ee362201f81') },

  // Oficina
  { id: 'demo-19', nombre: 'Cinta adhesiva ancha x4', descripcion: 'Cinta transparente 48mm, pack x4.', categoria: 'oficina', precioCosto: 1500, precioVenta: 3400, stock: 28, estado: 'activo', destacado: false, imagen: img('1586864387967-d02ef85d93e8') },
  { id: 'demo-20', nombre: 'Abrochadora metálica', descripcion: 'Abrochadora reforzada, hasta 20 hojas.', categoria: 'oficina', precioCosto: 3300, precioVenta: 6900, stock: 13, estado: 'activo', destacado: false, imagen: img('1568871391149-f3c92e0af847') },

  // Regalería
  { id: 'demo-21', nombre: 'Tarjetas de saludo x5', descripcion: 'Surtido de tarjetas con sobres.', categoria: 'regaleria', precioCosto: 1100, precioVenta: 2800, stock: 44, estado: 'activo', destacado: false, imagen: img('1607344645866-009c320b63e0') },
  { id: 'demo-22', nombre: 'Papel de regalo premium x3', descripcion: 'Rollos de papel de regalo, diseños variados.', categoria: 'regaleria', precioCosto: 1600, precioVenta: 3900, stock: 20, estado: 'pausado', destacado: false, imagen: img('1513201099705-a9746e1e201f') },
];
