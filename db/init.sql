CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS entidades (
  id SERIAL PRIMARY KEY,
  tipo_documento VARCHAR(50),
  documento VARCHAR(50),
  tipo_entidad VARCHAR(50), -- NATURAL o JURIDICA
  fecha_registro DATE DEFAULT CURRENT_DATE,
  departamento VARCHAR(100),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  direccion VARCHAR(200),
  tipo VARCHAR(50) CHECK (tipo IN ('publica', 'privada', 'individual', 'entidad', 'etc')), -- Clasificación específica
  rubro VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS personas_naturales (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  nombre VARCHAR(150),
  ape_pat VARCHAR(150),
  ape_mat VARCHAR(150),
  pasaporte VARCHAR(100),
  sexo CHAR(1) CHECK (sexo IN ('M','F'))
);

CREATE TABLE IF NOT EXISTS personas_juridicas (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  razon_social VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS historial_manchas (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  tipo_lista VARCHAR(100),
  descripcion TEXT,
  link TEXT,
  fecha_registro DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS galeria (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  descripcion TEXT,
  src TEXT
);

CREATE TABLE IF NOT EXISTS extension_natural (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  fec_nac DATE,
  tez VARCHAR(50),
  estatura INTEGER,
  estado_civil VARCHAR(50),
  nacionalidad VARCHAR(100),
  grado_instruccion VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS extension_judicial (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  fec_creacion DATE,
  ubigeo VARCHAR(50),
  ip VARCHAR(50),
  web VARCHAR(150),
  origen VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombres VARCHAR(150),
  ape_pat VARCHAR(150),
  ape_mat VARCHAR(150),
  usuario VARCHAR(100) UNIQUE,
  clave VARCHAR(200),
  correo VARCHAR(150) UNIQUE,
  departamento VARCHAR(100),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  direccion VARCHAR(200),
  telefono VARCHAR(50),
  documento VARCHAR(50),
  cargo VARCHAR(100),
  empresa VARCHAR(150),
  photo TEXT
);

CREATE TABLE IF NOT EXISTS historial_consultas (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  id_entidad INTEGER REFERENCES entidades(id) ON DELETE SET NULL,
  fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo VARCHAR(50) CHECK (tipo IN ('masivo', 'unitario'))
);

CREATE TABLE IF NOT EXISTS rol (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(100),
  descripcion TEXT,
  state BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS base_programada (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  nombres VARCHAR(150),
  documento VARCHAR(50),
  cargo VARCHAR(100),
  rubros VARCHAR(150),
  tipo_entidad VARCHAR(100),
  fecha_creada DATE DEFAULT CURRENT_DATE,
  fecha_consulta DATE,
  entidad_hook VARCHAR(200),
  notify BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  id_base_programada INTEGER REFERENCES base_programada(id) ON DELETE SET NULL,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE SET NULL,
  fecha_enviado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS token (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  cant_actual INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens_consulta (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  recarga INTEGER,
  fecha_gestion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membresia (
  id SERIAL PRIMARY KEY,
  descripcion VARCHAR(150),
  cantidad INTEGER
);

CREATE INDEX IF NOT EXISTS idx_entidades_documento ON entidades(documento);
CREATE INDEX IF NOT EXISTS idx_entidades_nombre ON personas_naturales(nombre);
CREATE INDEX IF NOT EXISTS idx_manchas_entidad ON historial_manchas(id_entidades);
