export const DEPARTAMENTOS_CARRERAS: Record<string, string[]> = {
  "Ingeniería": [
    "Ingeniería Aeronáutica",
    "Ingeniería Ambiental",
    "Ingeniería Automotriz",
    "Ingeniería Biomédica",
    "Ingeniería Civil",
    "Ingeniería Electrónica",
    "Ingeniería Eléctrica y de Potencia",
    "Ingeniería Empresarial",
    "Ingeniería Industrial",
    "Ingeniería Mecatrónica",
    "Ingeniería Mecánica",
    "Ingeniería de Minas",
    "Ingeniería de Seguridad Industrial y Minera",
    "Ingeniería de Sistemas e Informática",
    "Ingeniería de Software",
    "Ingeniería de Telecomunicaciones"
  ],
  "Negocios": [
    "Administración, Banca y Finanzas",
    "Administración de Empresas",
    "Administración de Negocios Internacionales",
    "Administración Hotelera y de Turismo",
    "Administración y Marketing",
    "Contabilidad",
    "Economía"
  ],
  "Ciencias de la Salud": [
    "Enfermería",
    "Farmacia y Bioquímica",
    "Laboratorio Clínico y Anatomía Patológica",
    "Nutrición y Dietética",
    "Obstetricia",
    "Odontología",
    "Terapia Física"
  ],
  "Medicina": [
    "Medicina"
  ],
  "Psicología": [
    "Psicología"
  ],
  "Comunicaciones": [
    "Ciencias de la Comunicación",
    "Comunicación y Publicidad",
    "Diseño Digital Publicitario",
    "Diseño Profesional Gráfico"
  ],
  "Arquitectura": [
    "Arquitectura",
    "Diseño Profesional de Interiores"
  ],
  "Derecho": [
    "Derecho"
  ],
  "Educación": [
    "Educación Inicial",
    "Educación Primaria"
  ]
};

export const LISTA_CARRERAS: string[] = Object.values(DEPARTAMENTOS_CARRERAS).flat();

export const DEPARTAMENTOS_DOCENTES = [
  "Ingeniería",
  "Negocios",
  "Ciencias de la Salud",
  "Medicina",
  "Psicología",
  "Comunicaciones",
  "Arquitectura",
  "Derecho",
  "Educación",
  "Ciencias",
  "Humanidades"
];

export const ESPECIALIDADES_DOCENTES = [
  "Desarrollo de Software",
  "Base de Datos y Redes",
  "Matemáticas y Estadística",
  "Física y Química",
  "Administración y Finanzas",
  "Contabilidad y Tributación",
  "Derecho Civil y Penal",
  "Psicología Clínica",
  "Diseño y Publicidad",
  "Idiomas",
  "Enfermería y Obstetricia",
  "Medicina General"
];
