import React, { useEffect, useState } from "react";
import { Box, Badge, Container, Heading, Text, Divider } from "@chakra-ui/react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Detalle() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      fetch(`${apiUrl}/entity/${id}`).then(r => r.json()).then(setData);
    }
  }, []);
  return (
    <Container maxW="5xl" py={8}>
      <Heading size="lg">Detalle de Entidad</Heading>
      <Divider my={6} />
      {data && (
        <Box>
          <Heading size="sm">Entidad</Heading>
          <Text>{data.entidad?.tipo_entidad} {data.entidad?.documento}</Text>
          <Heading size="sm" mt={4}>Perfil</Heading>
          {data.natural && <Text>{data.natural?.nombre} {data.natural?.ape_pat} {data.natural?.ape_mat}</Text>}
          {data.juridica && <Text>{data.juridica?.razon_social}</Text>}
          <Heading size="sm" mt={4}>Historial</Heading>
          {data.manchas?.map((m: any) => (
            <Box key={m.id} mt={3}>
              <Badge>{m.tipo_lista}</Badge>
              <Text>{m.descripcion}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
}
