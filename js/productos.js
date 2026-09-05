const productos = [
  {
    id: "aparador-uspallata",
    nombre: "Aparador Uspallata",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Aparador Uspallata.png",
    descripcion:
      "Aparador de seis puertas fabricado en nogal sostenible con correderas metálicas en acabado latón. Su silueta minimalista realza el veteado natural de la madera.",
    detalles: {
      Medidas: "180 × 45 × 75 cm",
      Materiales: "Nogal macizo FSC®, herrajes de latón",
      Acabado: "Aceite natural ecológico",
      Peso: "68 kg",
      Capacidad: "6 compartimentos interiores",
    },
  },
  {
    id: "biblioteca-recoleta",
    nombre: "Biblioteca Recoleta",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Biblioteca Recoleta.png",
    descripcion:
      "Sistema modular de estantes abierto que combina estructura de acero Sage Green y repisas en roble claro. Ideal para crear composiciones elegantes y dinámicas.",
    detalles: {
      Medidas: "180 × 35 × 200 cm",
      Materiales: "Estructura de acero, estantes de roble",
      Acabado: "Laca mate ecológica",
      Capacidad: "45 kg por estante",
      Módulos: "5 estantes ajustables",
    },
  },
  {
    id: "butaca-mendoza",
    nombre: "Butaca Mendoza",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Butaca Mendoza.png",
    descripcion:
      "Butaca tapizada en bouclé Dusty Rose con base de madera de guatambú. El respaldo curvo abraza el cuerpo y ofrece comodidad contemporánea.",
    detalles: {
      Medidas: "80 × 75 × 85 cm",
      Materiales: "Guatambú macizo, tela bouclé",
      Acabado: "Cera vegetal, tapizado premium",
      Tapizado: "Respaldo y asiento",
      Confort: "Espuma alta densidad",
    },
  },
  {
    id: "sillon-copacabana",
    nombre: "Sillón Copacabana",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/sillon-copacabana.png",
    descripcion:
      "Sillón lounge en cuero cognac con base giratoria en acero. Su silueta combina modernismo y estética brasileña.",
    detalles: {
      Medidas: "90 × 85 × 95 cm",
      Materiales: "Cuero curtido vegetal, acero",
      Acabado: "Cuero anilina premium",
      Rotación: "360° silenciosa y suave",
      Garantía: "10 años en estructura",
    },
  },
  {
    id: "mesa-centro-araucaria",
    nombre: "Mesa de Centro Araucaria",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Mesa de Centro Araucaria.png",
    descripcion:
      "Mesa de centro con sobre circular de mármol Patagonia y base de tres patas en madera de nogal. Un punto focal escultural para cualquier sala.",
    detalles: {
      Medidas: "90 × 90 × 45 cm",
      Materiales: "Sobre de mármol Patagonia, patas de nogal",
      Acabado: "Mármol pulido, aceite natural en madera",
      Peso: "42 kg",
      Carga: "25 kg distribuidos",
    },
  },
  {
    id: "mesa-noche-aconcagua",
    nombre: "Mesa de Noche Aconcagua",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Mesa de Noche Aconcagua.png",
    descripcion:
      "Mesa de noche con cajón oculto y repisa inferior en roble certificado FSC®. Sus líneas minimalistas permiten disfrutar de la calidez del material.",
    detalles: {
      Medidas: "45 × 35 × 60 cm",
      Materiales: "Roble macizo FSC®, herrajes soft-close",
      Acabado: "Barniz mate de poliuretano",
      Almacenamiento: "1 cajón + repisa inferior",
      Característica: "Cajón con cierre suave",
    },
  },
  {
    id: "sofa-patagonia",
    nombre: "Sofá Patagonia",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/sofa-patagonia.png",
    descripcion:
      "Sofá de tres cuerpos tapizado en lino Warm Alabaster con patas cortas de madera. Los cojines combinan espuma de alta resiliencia con plumón reciclado.",
    detalles: {
      Medidas: "220 × 90 × 80 cm",
      Estructura: "Madera de eucalipto certificada FSC®",
      Tapizado: "Lino 100% natural premium",
      Relleno: "Espuma HR + plumón reciclado",
      Sostenibilidad: "Materiales 100% reciclables",
    },
  },
  {
    id: "mesa-comedor-pampa",
    nombre: "Mesa Comedor Pampa",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Mesa Comedor Pampa.png",
    descripcion:
      "Mesa extensible de roble macizo con sistema de plegado y apertura suave. Su diseño robusto y elegante invita a grandes reuniones.",
    detalles: {
      Medidas: "160–240 × 90 × 75 cm",
      Materiales: "Roble macizo FSC®, herrajes extensibles",
      Acabado: "Aceite-cera natural",
      Capacidad: "6–10 comensales",
      Extensión: "Sistema de mariposa central",
    },
  },
  {
    id: "sillas-cordoba",
    nombre: "Sillas Córdoba",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/sillas-cordoba.png",
    descripcion:
      "Set de cuatro sillas apilables en contrachapado moldeado de nogal y estructura tubular pintada. Diseño versátil para comedor u oficina.",
    detalles: {
      Medidas: "45 × 52 × 88 cm cada una",
      Materiales: "Contrachapado nogal, tubo de acero",
      Acabado: "Laca mate, pintura epoxi",
      Apilables: "Hasta 6 sillas",
      Incluye: "Set de 4 sillas",
    },
  },
  {
    id: "escritorio-costa",
    nombre: "Escritorio Costa",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Escritorio Costa.png",
    descripcion:
      "Escritorio compacto con cajón organizado y tapa basculante integrada en bambú laminado. Ideal para espacios de trabajo en casa.",
    detalles: {
      Medidas: "120 × 60 × 75 cm",
      Materiales: "Bambú laminado, herrajes ocultos",
      Acabado: "Laca mate resistente",
      Almacenamiento: "1 cajón con organizador",
      Cables: "Pasacables integrado",
    },
  },
  {
    id: "silla-trabajo-belgrano",
    nombre: "Silla de Trabajo Belgrano",
    imagen: "https://maxxidadu8.github.io/hermanos-jota/assets/img/Silla de Trabajo Belgrano.png",
    descripcion:
      "Silla ergonómica regulable en altura con respaldo de malla transpirable y asiento tapizado en tejido reciclado. Diseñada para largas jornadas.",
    detalles: {
      Medidas: "60 × 60 × 90–100 cm",
      Materiales: "Malla técnica, tejido reciclado",
      Acabado: "Base cromada, tapizado premium",
      Regulación: "Altura + inclinación asiento",
      Certificación: "Ergonomía europea EN 1335",
    },
  },
];
