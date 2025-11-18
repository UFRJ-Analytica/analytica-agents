# Manual do endpoint `/geo/units`

Este guia explica como consultar o endpoint que abastece o mapa de unidades com latitude/longitude e como reutilizar os dados no Leaflet (mapa de pontos) ou em um choropleth com GeoJSON do RJ.

## 1. Endpoint e parâmetros

| Método | Caminho         | Descrição                                    |
| ------ | --------------- | -------------------------------------------- |
| GET    | `/geo/units`    | Lista as unidades com coordenadas normalizadas |

Parâmetros de query:

- `ano` (**obrigatório**, int entre 2000 e 2100): ano de referência para filtrar a série histórica.
- `pretty` (opcional, bool): `true` devolve o JSON indentado para leitura manual.

### Exemplo de requisição

```bash
curl "http://localhost:8000/geo/units?ano=2024"
```

### Estrutura de resposta

```json
{
  "ano": 2024,
  "rows": 756,
  "data": [
    {
      "unidade_id_cnes": "0112348",
      "unidade_nome": "CENTRO DE MEDICINA MIGUEL COUTO",
      "ano": 2024,
      "mes": 12,
      "latitude": -22.902828081476386,
      "longitude": -43.1790880962021
    },
    {
      "unidade_id_cnes": "0134570",
      "unidade_nome": "SMS SUPER CENTRO CARIOCA DE VACINACAO AP 21",
      "ano": 2024,
      "mes": 12,
      "latitude": -22.95306711999204,
      "longitude": -43.176892035257595
    }
  ]
}
```

> Para gerar o exemplo acima localmente foi usado:
>
> ```bash
> python -c "from fastapi.testclient import TestClient; from backend.main import app; client=TestClient(app); import json; resp=client.get('/geo/units', params={'ano': 2024}); print(resp.status_code); print(resp.json()['rows']); print(json.dumps(resp.json()['data'][:2], ensure_ascii=False, indent=2))"
> ```

## 2. COMO USAR -  explicação do mapa

1. **Endpoint**: `GET /geo/units`.
2. **Obrigatório informar o ano** (ex.: `?ano=2024`), senão a API rejeita.
3. **Resposta**: array de objetos contendo `unidade_id_cnes`, `unidade_nome`, `latitude`, `longitude` e metadados usados para filtros (`ano`, `mes`, `bairro`, `regiao` quando disponíveis).
4. **Status**: quando encontra coordenadas retorna `200` com `rows > 0`; se faltar coluna de latitude/longitude, devolve mensagem indicando as colunas disponíveis.

## 3. Consumindo no frontend com Leaflet

```ts
const api = process.env.NEXT_PUBLIC_BACKEND_URL
const year = 2024

const response = await fetch(`${api}/geo/units?ano=${year}`)
const payload = await response.json()

payload.data.forEach((unit: GeoUnit) => {
  L.circleMarker([unit.latitude, unit.longitude], {
    radius: 6,
    color: '#0051ff',
    fillColor: '#7c3aed',
    fillOpacity: 0.65,
  })
    .bindPopup(`<strong>${unit.unidade_nome}</strong><br/>CNES: ${unit.unidade_id_cnes}`)
    .addTo(mapInstance)
})
```

> **Dica**: o backend já retorna `latitude` e `longitude` em formato numérico, então não é necessário converter. Basta passar `[lat, lon]` direto para `L.marker` ou `L.circleMarker`.

## 4. Ideia de Choropleth com GeoJSON do RJ

1. Carregue `/geo/units?ano=2024` e o GeoJSON de municípios do RJ (`rj-municipios.geojson`) em paralelo.
2. Agregue os pontos por `municipio/regiao`:
   ```ts
   const counts = payload.data.reduce((acc, row) => {
     const key = row.regiao ?? row.bairro ?? 'Desconhecido'
     acc[key] = (acc[key] || 0) + 1
     return acc
   }, {} as Record<string, number>)
   ```
3. Use `L.geoJSON(geojson, { style: feature => ({ fillColor: getColor(counts[feature.properties.NOME]), ... }) })` seguindo o exemplo oficial [Interactive Choropleth Map](https://leafletjs.com/examples/choropleth/).
4. Sobreponha os `circleMarker` para destacar unidades específicas enquanto o choropleth mostra densidade por município.

## 5. Checklist rápido

- [ ] Backend em execução (`uvicorn backend.main:app --reload` ou container).
- [ ] `.env` com credenciais corretas para carregar `unidade_historico`.
- [ ] `NEXT_PUBLIC_BACKEND_URL` apontando para a API (ex.: `http://localhost:8000`).
- [ ] Testar `curl http://localhost:8000/geo/units?ano=2024` antes de integrar no front.

Com isso, a Lorena consegue consumir o endpoint, renderizar os pontos no Leaflet e preparar o futuro choropleth usando GeoJSON do RJ.
