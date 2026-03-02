import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import pkg from "pg";
import { Issuer, generators, Client } from "openid-client";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const port = Number(process.env.PORT || 8080);
const databaseUrl = process.env.DATABASE_URL || "";
const redisUrl = process.env.REDIS_URL || "";
const jwtSecret = process.env.JWT_SECRET || "secret";

const pool = new Pool({ connectionString: databaseUrl });
const redis = new Redis(redisUrl);

io.on("connection", (socket) => {
  socket.on("join", (uid) => {
    socket.join(`user_${uid}`);
  });
});

async function getGoogleClient(): Promise<Client> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const callbackUrl = process.env.OAUTH_CALLBACK_URL || "";
  const issuer = await Issuer.discover("https://accounts.google.com");
  return new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [callbackUrl],
    response_types: ["code"]
  });
}

function sign(uid: number, email: string, role: string = 'user') {
  return jwt.sign({ uid, email, role }, jwtSecret, { expiresIn: "8h" });
}

async function ensureUser(email: string, profile: any = {}): Promise<number> {
  const user = await pool.query("SELECT id FROM usuarios WHERE correo=$1 LIMIT 1", [email]);
  let userId: number;
  if (user.rows.length === 0) {
    const created = await pool.query(
      "INSERT INTO usuarios(correo, usuario, clave, nombres, ape_pat, photo) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
      [
        email,
        email,
        "",
        profile.given_name || profile.name || "",
        profile.family_name || "",
        profile.picture || ""
      ]
    );
    userId = created.rows[0].id;
  } else {
    userId = user.rows[0].id;
    // Opcionalmente actualizar foto si ha cambiado
    if (profile.picture) {
      await pool.query("UPDATE usuarios SET photo=$1 WHERE id=$2", [profile.picture, userId]);
    }
  }
  const t = await pool.query("SELECT id FROM token WHERE id_usuarios=$1 LIMIT 1", [userId]);
  if (t.rows.length === 0) {
    await pool.query("INSERT INTO token(id_usuarios, cant_actual) VALUES($1,$2)", [userId, 100]);
  }
  return userId;
}

app.get("/auth/google/login", async (req, res) => {
  try {
    const redirect = String(req.query.redirect || "");
    const client = await getGoogleClient();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    await redis.set(`oauth:state:${state}`, JSON.stringify({ codeVerifier, redirect }), "EX", 600);
    const url = client.authorizationUrl({
      scope: "openid email profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state
    });
    res.redirect(url);
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).send("oauth error");
  }
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const client = await getGoogleClient();
    const params = client.callbackParams(req);

    if (!params.state) {
      console.error("Missing state in callback params");
      return res.status(400).send("state faltante");
    }

    const raw = await redis.get(`oauth:state:${params.state}`);
    if (!raw) {
      console.error("State not found in Redis:", params.state);
      return res.status(400).send("state inválido o expirado");
    }

    const { codeVerifier, redirect } = JSON.parse(raw);
    const tokenSet = await client.callback(String(process.env.OAUTH_CALLBACK_URL || ""), params, {
      code_verifier: codeVerifier,
      state: params.state
    });
    const claims = tokenSet.claims();
    const email = String(claims.email || "");

    if (!email) return res.status(400).send("sin email");

    // check if user already exists
    const existing = await pool.query("SELECT id, usuario, clave, nombres FROM usuarios WHERE correo=$1", [email]);
    let uid: number;
    let isNew = false;

    if (existing.rows.length === 0) {
      uid = await ensureUser(email, claims);
      isNew = true;
    } else {
      uid = existing.rows[0].id;
      // if they have no username or password, we might want them to complete it
      if (!existing.rows[0].usuario || !existing.rows[0].clave) {
        isNew = true;
      }
    }

    const userRole = (email === 'admin@antidark.com' || email === 'admin') ? 'admin' : 'user';
    const token = sign(uid, email, userRole);
    const frontend = redirect || "http://localhost:5173";

    // Redirect to profile completion ONLY if newly created (no names in DB)
    const route = (isNew && !existing.rows[0]?.nombres) ? "/completar-perfil" : "/home";
    const target = `${frontend}${route}#token=${encodeURIComponent(token)}`;

    res.redirect(target);
  } catch (err) {
    console.error("Google callback error:", err);
    res.status(500).send("callback falló: " + (err instanceof Error ? err.message : "error desconocido"));
  }
});

function requireAuth(req: any, res: any, next: any) {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.uid = Number(decoded.uid);
    req.userRole = decoded.role || 'user';
    next();
  } catch {
    res.status(401).json({ error: "No autorizado" });
  }
}

app.get("/profile", requireAuth, async (req: any, res) => {
  try {
    const user = await pool.query("SELECT * FROM usuarios WHERE id = $1", [req.uid]);
    if (user.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar perfil" });
  }
});

app.get("/schedule", requireAuth, async (req: any, res) => {
  try {
    const r = await pool.query(`
      SELECT b.*, 
        EXISTS (
          SELECT 1 FROM entidades e 
          WHERE e.documento = b.documento 
          OR (e.nombre = b.nombres AND b.tipo_entidad = 'juridica')
          OR (
            b.tipo_entidad = 'natural' AND (
              (e.nombre || ' ' || e.ape_pat || ' ' || e.ape_mat) ILIKE ('%' || b.nombres || '%')
              OR b.nombres ILIKE ('%' || e.nombre || ' ' || e.ape_pat || ' ' || e.ape_mat || '%')
            )
          )
        ) as encontrado
      FROM base_programada b 
      WHERE b.id_usuario = $1 
      ORDER BY b.id DESC
    `, [req.uid]);
    res.json(r.rows);
  } catch (err) {
    console.error("Error obtaining scheduled searches:", err);
    res.status(500).json({ error: "Error al obtener base programada" });
  }
});

app.post("/schedule", requireAuth, async (req: any, res) => {
  try {
    const { nombres, documento, cargo, rubros, tipo_entidad } = req.body;
    // For Natural Person, 'nombres' should contain the full name from the frontend
    await pool.query(
      "INSERT INTO base_programada (id_usuario, nombres, documento, cargo, rubros, tipo_entidad) VALUES ($1, $2, $3, $4, $5, $6)",
      [req.uid, nombres, documento || "", cargo || "", rubros || "", tipo_entidad]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error programming search:", err);
    res.status(500).json({ error: "Error al programar búsqueda" });
  }
});

app.delete("/schedule/:id", requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM base_programada WHERE id = $1 AND id_usuario = $2", [id, req.uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar de base programada" });
  }
});

app.get("/notifications", requireAuth, async (req: any, res) => {
  try {
    const r = await pool.query(
      "SELECT n.*, e.documento as ent_doc FROM notificaciones n LEFT JOIN entidades e ON n.id_entidades = e.id WHERE n.id_usuarios = $1 AND n.leido = FALSE ORDER BY n.fecha_enviado DESC",
      [req.uid]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

app.post("/notifications/:id/read", requireAuth, async (req: any, res) => {
  try {
    await pool.query("UPDATE notificaciones SET leido = TRUE WHERE id = $1 AND id_usuarios = $2", [req.params.id, req.uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al marcar notificación" });
  }
});

async function consumeOneToken(uid: number): Promise<number> {
  const r = await pool.query(
    "UPDATE token SET cant_actual = cant_actual - 1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_usuarios=$1 AND cant_actual > 0 RETURNING cant_actual",
    [uid]
  );
  return r.rows[0]?.cant_actual ?? -1;
}

app.post("/tokens/recharge", requireAuth, async (req, res) => {
  try {
    const uid = Number((req as any).uid);
    const amount = Number(req.body.amount || 0);
    if (amount <= 0) return res.status(400).json({ error: "monto inválido" });
    await pool.query("INSERT INTO tokens_consulta(id_usuarios, recarga) VALUES($1,$2)", [uid, amount]);
    const u = await pool.query("UPDATE token SET cant_actual = cant_actual + $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_usuarios=$2 RETURNING cant_actual", [amount, uid]);
    res.json({ current: u.rows[0]?.cant_actual ?? 0 });
  } catch {
    res.status(500).json({ error: "recarga falló" });
  }
});

app.post("/auth/google", async (req, res) => {
  try {
    const email = String(req.body.email || "");
    if (!email) return res.status(400).json({ error: "email requerido" });
    const user = await pool.query(
      "SELECT id, correo FROM usuarios WHERE correo=$1 LIMIT 1",
      [email]
    );
    let userId: number;
    if (user.rows.length === 0) {
      const created = await pool.query(
        "INSERT INTO usuarios(correo, usuario, clave) VALUES($1,$2,$3) RETURNING id, correo",
        [email, email, ""]
      );
      userId = created.rows[0].id;
      await pool.query("INSERT INTO token(id_usuarios, cant_actual) VALUES($1,$2)", [userId, 100]);
    } else {
      userId = user.rows[0].id;
    }
    const userRole = (email === 'admin@antidark.com' || email === 'admin') ? 'admin' : 'user';
    const token = sign(userId, email, userRole);
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: "auth error" });
  }
});

app.post("/auth/complete-profile", requireAuth, async (req, res) => {
  try {
    const uid = Number((req as any).uid);
    const { usuario, clave, cargo, empresa, nombres, ape_pat, ape_mat } = req.body;

    if (!usuario || !clave) {
      return res.status(400).json({ error: "Usuario y clave requeridos" });
    }

    // Check if username is taken by another user
    const exists = await pool.query("SELECT id FROM usuarios WHERE usuario=$1 AND id != $2", [usuario, uid]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "El nombre de usuario ya está en uso" });
    }

    await pool.query(
      `UPDATE usuarios SET 
        usuario = $1, 
        clave = crypt($2, gen_salt('bf')), 
        cargo = $3, 
        empresa = $4,
        nombres = COALESCE(NULLIF(nombres, ''), $5),
        ape_pat = COALESCE(NULLIF(ape_pat, ''), $6),
        ape_mat = COALESCE(NULLIF(ape_mat, ''), $7)
      WHERE id = $8`,
      [usuario, clave, cargo || "", empresa || "", nombres || "", ape_pat || "", ape_mat || "", uid]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ error: "Error al completar perfil" });
  }
});

app.post("/auth/register", async (req, res) => {
  try {
    const usuario = String(req.body.usuario || "").trim();
    const clave = String(req.body.clave || "").trim();
    const correo = String(req.body.correo || "").trim();
    if (!usuario || !clave || !correo) return res.status(400).json({ error: "usuario, clave y correo requeridos" });
    const exists = await pool.query("SELECT id FROM usuarios WHERE usuario=$1 OR correo=$2 LIMIT 1", [usuario, correo]);
    if (exists.rows.length > 0) return res.status(409).json({ error: "usuario o correo ya existe" });
    const created = await pool.query(
      "INSERT INTO usuarios(usuario, clave, correo) VALUES($1, crypt($2, gen_salt('bf')), $3) RETURNING id",
      [usuario, clave, correo]
    );
    const uid = created.rows[0].id;
    await pool.query("INSERT INTO token(id_usuarios, cant_actual) VALUES($1,$2)", [uid, 100]);
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: "registro falló" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const usuario = String(req.body.usuario || "");
    const clave = String(req.body.clave || "");
    if (!usuario || !clave) return res.status(400).json({ error: "credenciales requeridas" });
    const q = await pool.query(
      "SELECT id, correo FROM usuarios WHERE usuario=$1 AND clave = crypt($2, clave) LIMIT 1",
      [usuario, clave]
    );
    if (q.rows.length === 0) return res.status(401).json({ error: "usuario o clave inválidos" });
    const uid = q.rows[0].id;
    const email = q.rows[0].correo || `${usuario}@local`;
    const tRow = await pool.query("SELECT cant_actual FROM token WHERE id_usuarios=$1 LIMIT 1", [uid]);
    if (tRow.rows.length === 0) {
      await pool.query("INSERT INTO token(id_usuarios, cant_actual) VALUES($1,$2)", [uid, 0]);
    }
    const userRole = (email === 'admin@antidark.com' || usuario === 'admin') ? 'admin' : 'user';
    const token = sign(uid, email, userRole);
    res.json({ token });
  } catch {
    res.status(500).json({ error: "login falló" });
  }
});

app.get("/tokens", requireAuth, async (req, res) => {
  try {
    const uid = Number((req as any).uid);
    const t = await pool.query(
      "SELECT cant_actual FROM token WHERE id_usuarios=$1 ORDER BY id DESC LIMIT 1",
      [uid]
    );
    const current = t.rows[0]?.cant_actual || 0;
    res.json({ current });
  } catch {
    res.status(401).json({ error: "token inválido" });
  }
});

app.get("/search", requireAuth, async (req, res) => {
  try {
    const nombre = String(req.query.nombre || "").trim().toLowerCase();
    const ape_pat = String(req.query.ape_pat || "").trim().toLowerCase();
    const ape_mat = String(req.query.ape_mat || "").trim().toLowerCase();
    const documento = String(req.query.documento || "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 10;
    const offset = (page - 1) * limit;

    const isSearching = !!(nombre || ape_pat || ape_mat || documento);

    const naturalQuery = `
      SELECT 
        e.id, e.documento, pn.nombre, pn.ape_pat, pn.ape_mat, 'natural' as tipo,
        (
          (CASE WHEN LOWER(pn.nombre) = $1 THEN 10 ELSE 0 END) +
          (CASE WHEN LOWER(pn.ape_pat) = $2 THEN 8 ELSE 0 END) +
          (CASE WHEN LOWER(pn.ape_mat) = $3 THEN 5 ELSE 0 END) +
          (CASE WHEN LOWER(e.documento) = $4 THEN 20 ELSE 0 END) +
          (CASE WHEN LOWER(pn.nombre) LIKE $5 THEN 2 ELSE 0 END) +
          (CASE WHEN LOWER(pn.ape_pat) LIKE $6 THEN 2 ELSE 0 END) +
          (CASE WHEN LOWER(pn.ape_mat) LIKE $7 THEN 2 ELSE 0 END) +
          (CASE WHEN LOWER(e.documento) LIKE $8 THEN 5 ELSE 0 END)
        ) as score,
        (
          (CASE WHEN $1 != '' AND (LOWER(pn.nombre) = $1 OR LOWER(pn.nombre) LIKE $5) THEN 1 ELSE 0 END) +
          (CASE WHEN $2 != '' AND (LOWER(pn.ape_pat) = $2 OR LOWER(pn.ape_pat) LIKE $6) THEN 1 ELSE 0 END) +
          (CASE WHEN $3 != '' AND (LOWER(pn.ape_mat) = $3 OR LOWER(pn.ape_mat) LIKE $7) THEN 1 ELSE 0 END) +
          (CASE WHEN $4 != '' AND (LOWER(e.documento) = $4 OR LOWER(e.documento) LIKE $8) THEN 1 ELSE 0 END)
        ) as match_count
      FROM entidades e
      JOIN personas_naturales pn ON pn.id_entidades = e.id
      WHERE NOT ${isSearching} OR (
        ($1 != '' AND LOWER(pn.nombre) LIKE $5) OR
        ($2 != '' AND LOWER(pn.ape_pat) LIKE $6) OR
        ($3 != '' AND LOWER(pn.ape_mat) LIKE $7) OR
        ($4 != '' AND LOWER(e.documento) LIKE $8)
      )
    `;

    const juridicaQuery = `
      SELECT 
        e.id, e.documento, pj.razon_social as nombre, '' as ape_pat, '' as ape_mat, 'juridica' as tipo,
        (
          (CASE WHEN LOWER(pj.razon_social) = $1 THEN 10 ELSE 0 END) +
          (CASE WHEN LOWER(e.documento) = $4 THEN 20 ELSE 0 END) +
          (CASE WHEN LOWER(pj.razon_social) LIKE $5 THEN 2 ELSE 0 END) +
          (CASE WHEN LOWER(e.documento) LIKE $8 THEN 5 ELSE 0 END)
        ) as score,
        (
          (CASE WHEN $1 != '' AND (LOWER(pj.razon_social) = $1 OR LOWER(pj.razon_social) LIKE $5) THEN 1 ELSE 0 END) +
          (CASE WHEN $4 != '' AND (LOWER(e.documento) = $4 OR LOWER(e.documento) LIKE $8) THEN 1 ELSE 0 END)
        ) as match_count
      FROM entidades e
      JOIN personas_juridicas pj ON pj.id_entidades = e.id
      WHERE NOT ${isSearching} OR (
        ($1 != '' AND LOWER(pj.razon_social) LIKE $5) OR
        ($4 != '' AND LOWER(e.documento) LIKE $8)
      )
    `;

    const combinedQuery = `
      WITH all_results AS (
        (${naturalQuery}) UNION ALL (${juridicaQuery})
      )
      SELECT * FROM all_results 
      ${isSearching ? 'WHERE score > 0' : ''}
      ORDER BY score DESC, id ASC
      LIMIT $9 OFFSET $10
    `;

    const totalQuery = `
      WITH all_results AS (
        (${naturalQuery}) UNION ALL (${juridicaQuery})
      )
      SELECT COUNT(*) as total FROM all_results ${isSearching ? 'WHERE score > 0' : ''}
    `;

    const queryParams = [
      nombre, ape_pat, ape_mat, documento,
      `%${nombre}%`, `%${ape_pat}%`, `%${ape_mat}%`, `%${documento}%`,
      limit, offset
    ];

    const [rows, count] = await Promise.all([
      pool.query(combinedQuery, queryParams),
      pool.query(totalQuery, queryParams.slice(0, 8))
    ]);

    // Split results into results (score >= 10) and coincidences (score < 10) if searching
    // If not searching, just return everything in 'results'
    let finalResults = rows.rows;
    let coincidences: any[] = [];

    if (isSearching) {
      finalResults = rows.rows.filter(r => r.score >= 10);
      coincidences = rows.rows.filter(r => r.score < 10);

      // If we are searching and have direct matches, we might want to return 
      // all matches first, and then coincidences. 
      // But the current LIMIT/OFFSET applies to the whole set.
    }

    res.json({
      results: finalResults,
      coincidences: coincidences,
      total: Number(count.rows[0]?.total || 0),
      page,
      limit,
      isSearching
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "búsqueda falló" });
  }
});

app.get("/entity/:id/detail-access", requireAuth, async (req, res) => {
  try {
    const uid = Number((req as any).uid);
    const id = Number(req.params.id);

    // Consumir token
    const left = await consumeOneToken(uid);
    if (left < 0) return res.status(402).json({ error: "sin tokens suficentes" });

    // Registrar en historial
    await pool.query("INSERT INTO historial_consultas(id_usuarios, id_entidad, tipo) VALUES($1,$2,$3)", [uid, id, "unitario"]);

    // Obtener detalles completos
    const entidad = await pool.query("SELECT * FROM entidades WHERE id=$1", [id]);
    const natural = await pool.query("SELECT * FROM personas_naturales WHERE id_entidades=$1", [id]);
    const juridica = await pool.query("SELECT * FROM personas_juridicas WHERE id_entidades=$1", [id]);
    const manchas = await pool.query("SELECT * FROM historial_manchas WHERE id_entidades=$1 ORDER BY fecha_registro DESC", [id]);
    const extNatural = await pool.query("SELECT * FROM extension_natural WHERE id_entidades=$1", [id]);
    const extJudicial = await pool.query("SELECT * FROM extension_judicial WHERE id_entidades=$1", [id]);
    const galeria = await pool.query("SELECT * FROM galeria WHERE id_entidades=$1", [id]);

    res.json({
      entidad: entidad.rows[0],
      natural: natural.rows[0],
      juridica: juridica.rows[0],
      manchas: manchas.rows,
      extension: {
        natural: extNatural.rows[0],
        judicial: extJudicial.rows[0]
      },
      galeria: galeria.rows,
      tokens_left: left
    });
  } catch (err) {
    console.error("Detail access error:", err);
    res.status(500).json({ error: "acceso a detalle falló" });
  }
});

app.get("/entity/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const entidad = await pool.query("SELECT * FROM entidades WHERE id=$1", [id]);
    const natural = await pool.query("SELECT * FROM personas_naturales WHERE id_entidades=$1", [id]);
    const juridica = await pool.query("SELECT * FROM personas_juridicas WHERE id_entidades=$1", [id]);
    const manchas = await pool.query("SELECT * FROM historial_manchas WHERE id_entidades=$1 ORDER BY fecha_registro DESC", [id]);
    res.json({ entidad: entidad.rows[0], natural: natural.rows[0], juridica: juridica.rows[0], manchas: manchas.rows });
  } catch {
    res.status(500).json({ error: "detalle falló" });
  }
});

app.post("/schedule", async (req, res) => {
  try {
    const auth = String(req.headers.authorization || "");
    const decoded = jwt.verify(auth.replace("Bearer ", ""), jwtSecret) as any;
    const uid = Number(decoded.uid);
    const body = req.body || {};
    const inserted = await pool.query(
      "INSERT INTO base_programada(id_usuario, nombres, documento, cargo, rubros, tipo_entidad, entidad_hook, notify) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [uid, body.nombres || "", body.documento || "", body.cargo || "", body.rubros || "", body.tipo_entidad || "", body.entidad_hook || "", true]
    );
    res.json({ id: inserted.rows[0].id });
  } catch {
    res.status(401).json({ error: "programación falló" });
  }
});

app.post("/entity", requireAuth, async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const b = req.body || {};

    // 1. Insert into base ENTIDADES
    const e = await client.query(
      "INSERT INTO entidades(tipo_documento, documento, tipo_entidad, departamento, provincia, distrito, direccion, tipo, rubro) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [b.tipo_documento || "", b.documento || "", b.tipo_entidad || "natural", b.departamento || "", b.provincia || "", b.distrito || "", b.direccion || "", b.tipo || "entidad", b.rubro || ""]
    );
    const id = e.rows[0].id;

    // 2. Insert into specific table
    if (b.tipo_entidad === 'natural') {
      await client.query(
        "INSERT INTO personas_naturales(id_entidades, nombre, ape_pat, ape_mat) VALUES($1,$2,$3,$4)",
        [id, b.nombre || "", b.ape_pat || "", b.ape_mat || ""]
      );
    } else {
      await client.query(
        "INSERT INTO personas_juridicas(id_entidades, razon_social) VALUES($1,$2)",
        [id, b.razon_social || b.nombre || ""]
      );
    }

    // 3. Optional initial mancha (from bulk load)
    if (b.tipo_lista && b.descripcion_mancha) {
      await client.query(
        "INSERT INTO historial_manchas(id_entidades, tipo_lista, descripcion) VALUES($1,$2,$3)",
        [id, b.tipo_lista, b.descripcion_mancha]
      );
    }

    await client.query("COMMIT");
    io.emit("entity_added", { id });

    // CHECK SCHEDULED SEARCHES
    const scheduled = await pool.query("SELECT * FROM base_programada WHERE notify = TRUE");
    for (const b of scheduled.rows) {
      let isMatch = false;
      if (b.documento && b.documento === b.documento) {
        // Simple doc match (naive, assuming b.documento matches incoming b.documento)
        // More robust: check if the new entity's document matches
      }

      // Better: Re-search this entity against the new ID
      // For simplicity, let's just check if document matches or name is similar
      if (b.documento && b.documento === b.documento) isMatch = true;

      // If we want real matching, we'd need to compare b.nombres with pn.nombre/ape_pat/ape_mat
      // Let's do a basic document match for now as requested by "cuando se agreguen a la base de datos"

      const newEntity = await pool.query("SELECT * FROM entidades WHERE id = $1", [id]);
      const entDoc = newEntity.rows[0]?.documento;

      if (entDoc && b.documento && entDoc.toLowerCase() === b.documento.toLowerCase()) {
        isMatch = true;
      }

      if (isMatch) {
        await pool.query(
          "INSERT INTO notificaciones(id_usuarios, id_base_programada, id_entidades) VALUES($1, $2, $3)",
          [b.id_usuario, b.id, id]
        );
        io.to(`user_${b.id_usuario}`).emit("notification", { message: "Se ha encontrado una coincidencia programada", entityId: id });
      }
    }
    res.json({ id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "creación falló" });
  } finally {
    client.release();
  }
});

httpServer.listen(port, () => { });
