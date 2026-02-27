import React, { useState } from "react";
import { Box, Button, Flex, Heading, Input, Text } from "@chakra-ui/react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const r = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, clave })
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) {
      setError(data.error || "Login falló");
      return;
    }
    localStorage.setItem("auth_token", data.token);
    onSuccess();
  }

  return (
    <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
      <Heading size="sm" mb={3}>Acceso con usuario/clave</Heading>
      <Flex gap={3} direction="column">
        <Input placeholder="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        <Input type="password" placeholder="clave" value={clave} onChange={(e) => setClave(e.target.value)} />
        {error && <Text color="red.500">{error}</Text>}
        <Button isLoading={loading} colorScheme="blue" onClick={submit}>Entrar</Button>
        <Button variant="outline" colorScheme="purple" onClick={() => window.location.href = `${apiUrl}/auth/google/login?redirect=${encodeURIComponent(window.location.origin)}`}>Ingresar con Google</Button>
      </Flex>
    </Box>
  );
}
