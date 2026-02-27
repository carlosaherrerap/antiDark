CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO usuarios (usuario, clave, correo, nombres, ape_pat, ape_mat, cargo, empresa)
VALUES ('admin', crypt('admin2026', gen_salt('bf')), 'admin@local', 'Administrador', '', '', 'Admin', 'antiDark')
ON CONFLICT (usuario) DO NOTHING;

INSERT INTO usuarios (usuario, clave, correo, nombres, ape_pat, ape_mat, cargo, empresa)
VALUES ('usuario1', crypt('informaperu', gen_salt('bf')), 'usuario1@local', 'Usuario Uno', '', '', 'Analista', 'antiDark')
ON CONFLICT (usuario) DO NOTHING;

INSERT INTO rol (id_usuarios, nombre, descripcion, state)
SELECT u.id, 'admin', 'Administrador del sistema', TRUE
FROM usuarios u
WHERE u.usuario = 'admin'
AND NOT EXISTS (SELECT 1 FROM rol r WHERE r.id_usuarios = u.id AND r.nombre = 'admin');

INSERT INTO rol (id_usuarios, nombre, descripcion, state)
SELECT u.id, 'usuario', 'Usuario estándar', TRUE
FROM usuarios u
WHERE u.usuario = 'usuario1'
AND NOT EXISTS (SELECT 1 FROM rol r WHERE r.id_usuarios = u.id AND r.nombre = 'usuario');

INSERT INTO token (id_usuarios, cant_actual)
SELECT u.id, 50
FROM usuarios u
WHERE u.usuario IN ('admin', 'usuario1')
AND NOT EXISTS (SELECT 1 FROM token t WHERE t.id_usuarios = u.id);

-- ENTIDADES (naturales y jurídicas)
INSERT INTO entidades (id, tipo_documento, documento, tipo_entidad, departamento, provincia, distrito, direccion, tipo, rubro)
SELECT 1001, 'DNI', '45672831', 'natural', 'Lima', 'Lima', 'Miraflores', 'Av. Pardo 123', 'PEP', 'Servicios'
WHERE NOT EXISTS (SELECT 1 FROM entidades WHERE id=1001);
INSERT INTO entidades (id, tipo_documento, documento, tipo_entidad, departamento, provincia, distrito, direccion, tipo, rubro)
SELECT 1002, 'DNI', '70221932', 'natural', 'Lima', 'Lima', 'San Isidro', 'Calle Golf 321', 'Noticias Adversas', 'Consultoría'
WHERE NOT EXISTS (SELECT 1 FROM entidades WHERE id=1002);
INSERT INTO entidades (id, tipo_documento, documento, tipo_entidad, departamento, provincia, distrito, direccion, tipo, rubro)
SELECT 2001, 'RUC', '20448192033', 'juridica', 'Lambayeque', 'Chiclayo', 'Chiclayo', 'Av. Bolognesi 450', 'Actos Ilícitos', 'Construcción'
WHERE NOT EXISTS (SELECT 1 FROM entidades WHERE id=2001);
INSERT INTO entidades (id, tipo_documento, documento, tipo_entidad, departamento, provincia, distrito, direccion, tipo, rubro)
SELECT 2002, 'RUC', '20109928374', 'juridica', 'Lima', 'Lima', 'La Molina', 'Camacho 889', 'Sanciones Intern.', 'Finanzas'
WHERE NOT EXISTS (SELECT 1 FROM entidades WHERE id=2002);

-- PERSONAS NATURALES
INSERT INTO personas_naturales (id_entidades, nombre, ape_pat, ape_mat, pasaporte, sexo)
SELECT 1001, 'Alejandro', 'Vazquez', 'Ramos', 'PE1234567', 'M'
WHERE NOT EXISTS (SELECT 1 FROM personas_naturales WHERE id_entidades=1001);
INSERT INTO personas_naturales (id_entidades, nombre, ape_pat, ape_mat, pasaporte, sexo)
SELECT 1002, 'Maria', 'Elena', 'Fuentes', 'PE9876543', 'F'
WHERE NOT EXISTS (SELECT 1 FROM personas_naturales WHERE id_entidades=1002);

-- PERSONAS JURÍDICAS
INSERT INTO personas_juridicas (id_entidades, razon_social)
SELECT 2001, 'Construcciones del Norte E.I.R.L.'
WHERE NOT EXISTS (SELECT 1 FROM personas_juridicas WHERE id_entidades=2001);
INSERT INTO personas_juridicas (id_entidades, razon_social)
SELECT 2002, 'Inversiones Globales S.A.C.'
WHERE NOT EXISTS (SELECT 1 FROM personas_juridicas WHERE id_entidades=2002);

-- EXTENSIONES
INSERT INTO extension_natural (id_entidades, fec_nac, tez, estatura, estado_civil, nacionalidad, grado_instruccion)
SELECT 1001, DATE '1985-10-12', 'trigueña', 178, 'Soltero', 'Peruana', 'Universitaria'
WHERE NOT EXISTS (SELECT 1 FROM extension_natural WHERE id_entidades=1001);
INSERT INTO extension_natural (id_entidades, fec_nac, tez, estatura, estado_civil, nacionalidad, grado_instruccion)
SELECT 1002, DATE '1991-03-22', 'blanca', 165, 'Casada', 'Peruana', 'Maestría'
WHERE NOT EXISTS (SELECT 1 FROM extension_natural WHERE id_entidades=1002);

INSERT INTO extension_judicial (id_entidades, fec_creacion, ubigeo, ip, web, origen)
SELECT 2001, DATE '2005-01-01', '150101', '192.168.1.1', 'www.construccionesnorte.pe', 'Registro Judicial'
WHERE NOT EXISTS (SELECT 1 FROM extension_judicial WHERE id_entidades=2001);
INSERT INTO extension_judicial (id_entidades, fec_creacion, ubigeo, ip, web, origen)
SELECT 2002, DATE '2003-01-01', '150102', '10.0.0.1', 'www.globalinversiones.com', 'Registro Sanciones'
WHERE NOT EXISTS (SELECT 1 FROM extension_judicial WHERE id_entidades=2002);

-- HISTORIAL MANCHAS
INSERT INTO historial_manchas (id_entidades, tipo_lista, descripcion, link, fecha_registro)
SELECT 1001, 'PEP', 'Persona expuesta políticamente según registro oficial', 'https://ejemplo.pe/pep/45672831', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM historial_manchas WHERE id_entidades=1001 AND tipo_lista='PEP');
INSERT INTO historial_manchas (id_entidades, tipo_lista, descripcion, link, fecha_registro)
SELECT 1002, 'Noticias Adversas', 'Mención en prensa por investigación en curso', 'https://medio.pe/noticia/70221932', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM historial_manchas WHERE id_entidades=1002 AND tipo_lista='Noticias Adversas');
INSERT INTO historial_manchas (id_entidades, tipo_lista, descripcion, link, fecha_registro)
SELECT 2001, 'Actos Ilícitos', 'Investigación por colusión en obras públicas', 'https://gob.pe/actos/20448192033', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM historial_manchas WHERE id_entidades=2001 AND tipo_lista='Actos Ilícitos');
INSERT INTO historial_manchas (id_entidades, tipo_lista, descripcion, link, fecha_registro)
SELECT 2002, 'Sanciones Intern.', 'Sanción financiera internacional vigente', 'https://ofi.int/sanciones/20109928374', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM historial_manchas WHERE id_entidades=2002 AND tipo_lista='Sanciones Intern.');

-- GALERÍA
INSERT INTO galeria (id_entidades, descripcion, src)
SELECT 1001, 'Foto de documento nacional de identidad', 'https://picsum.photos/seed/45672831/400/300'
WHERE NOT EXISTS (SELECT 1 FROM galeria WHERE id_entidades=1001);
INSERT INTO galeria (id_entidades, descripcion, src)
SELECT 2001, 'Fachada de sede principal', 'https://picsum.photos/seed/20448192033/400/300'
WHERE NOT EXISTS (SELECT 1 FROM galeria WHERE id_entidades=2001);

-- MEMBRESÍAS
INSERT INTO membresia (descripcion, cantidad)
SELECT 'Plan Básico', 100
WHERE NOT EXISTS (SELECT 1 FROM membresia WHERE descripcion='Plan Básico');
INSERT INTO membresia (descripcion, cantidad)
SELECT 'Plan Pro', 500
WHERE NOT EXISTS (SELECT 1 FROM membresia WHERE descripcion='Plan Pro');
INSERT INTO membresia (descripcion, cantidad)
SELECT 'Plan Enterprise', 5000
WHERE NOT EXISTS (SELECT 1 FROM membresia WHERE descripcion='Plan Enterprise');

-- RECARGAS DE TOKENS
INSERT INTO tokens_consulta (id_usuarios, recarga)
SELECT u.id, 100 FROM usuarios u WHERE u.usuario='admin'
AND NOT EXISTS (SELECT 1 FROM tokens_consulta tc WHERE tc.id_usuarios=u.id);
INSERT INTO tokens_consulta (id_usuarios, recarga)
SELECT u.id, 50 FROM usuarios u WHERE u.usuario='usuario1'
AND NOT EXISTS (SELECT 1 FROM tokens_consulta tc WHERE tc.id_usuarios=u.id);
UPDATE token SET cant_actual = cant_actual + 100, fecha_actualizacion=CURRENT_TIMESTAMP
WHERE id_usuarios IN (SELECT id FROM usuarios WHERE usuario='admin');
UPDATE token SET cant_actual = cant_actual + 50, fecha_actualizacion=CURRENT_TIMESTAMP
WHERE id_usuarios IN (SELECT id FROM usuarios WHERE usuario='usuario1');

-- BASE PROGRAMADA
INSERT INTO base_programada (id, id_usuario, nombres, documento, cargo, rubros, tipo_entidad, fecha_consulta, entidad_hook, notify)
SELECT 5001, u.id, 'Construcciones del Norte E.I.R.L.', '20448192033', 'Analista', 'Construcción', 'juridica', CURRENT_DATE, 'Actos Ilícitos', TRUE
FROM usuarios u WHERE u.usuario='admin'
AND NOT EXISTS (SELECT 1 FROM base_programada bp WHERE bp.id=5001);
INSERT INTO base_programada (id, id_usuario, nombres, documento, cargo, rubros, tipo_entidad, fecha_consulta, entidad_hook, notify)
SELECT 5002, u.id, 'Alejandro Vazquez Ramos', '45672831', 'Analista', 'Servicios', 'natural', CURRENT_DATE, 'PEP', TRUE
FROM usuarios u WHERE u.usuario='usuario1'
AND NOT EXISTS (SELECT 1 FROM base_programada bp WHERE bp.id=5002);

-- NOTIFICACIONES
INSERT INTO notificaciones (id_usuarios, id_base_programada, id_entidades, leido)
SELECT u.id, 5001, 2001, FALSE FROM usuarios u WHERE u.usuario='admin'
AND NOT EXISTS (SELECT 1 FROM notificaciones n WHERE n.id_base_programada=5001 AND n.id_entidades=2001);
INSERT INTO notificaciones (id_usuarios, id_base_programada, id_entidades, leido)
SELECT u.id, 5002, 1001, FALSE FROM usuarios u WHERE u.usuario='usuario1'
AND NOT EXISTS (SELECT 1 FROM notificaciones n WHERE n.id_base_programada=5002 AND n.id_entidades=1001);

-- HISTORIAL DE CONSULTAS
INSERT INTO historial_consultas (id_usuarios, id_entidad, tipo)
SELECT u.id, 1001, 'unitario' FROM usuarios u WHERE u.usuario='admin'
AND NOT EXISTS (SELECT 1 FROM historial_consultas h WHERE h.id_usuarios=u.id AND h.id_entidad=1001);
INSERT INTO historial_consultas (id_usuarios, id_entidad, tipo)
SELECT u.id, 2001, 'unitario' FROM usuarios u WHERE u.usuario='usuario1'
AND NOT EXISTS (SELECT 1 FROM historial_consultas h WHERE h.id_usuarios=u.id AND h.id_entidad=2001);
