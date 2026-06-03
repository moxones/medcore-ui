# API: Disponibilidad de turnos para agendado de recepción

## Contexto

Estos dos endpoints alimentan la pantalla de agendado de la recepción (`/reception/new-appointment`).
El frontend ya está implementado y los consume. Devolvé exactamente la estructura descrita: nombres de campo, tipos y formatos son contratos estrictos.

La respuesta de todos los endpoints del sistema sigue el wrapper estándar:

```json
{
  "success": true,
  "data": <el payload descrito abajo>,
  "message": "OK"
}
```

---

## Endpoint 1 — Disponibilidad fusionada

```
GET /appointments/availability
```

### Para qué sirve

Devuelve todos los **slots libres** de uno o más médicos en un rango de fechas, agrupados por día.
El frontend lo llama cada vez que el usuario cambia especialidad, médico, sede o rango de fechas.
Es la base del grid de horarios y del hero "Primer turno disponible".

### Query params

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `branchId` | `number` | ✅ | ID de la sede donde buscar |
| `fromDate` | `string` `YYYY-MM-DD` | ✅ | Fecha de inicio del rango (inclusive) |
| `toDate` | `string` `YYYY-MM-DD` | ✅ | Fecha de fin del rango (inclusive) |
| `specialtyId` | `number` | ❌ | Filtra por especialidad |
| `doctorId` | `number` | ❌ | Filtra por médico puntual |
| `appointmentTypeId` | `number` | ❌ | Si viene, usa la duración de ese tipo de cita para calcular los slots |

**Lógica de filtrado:**

- Solo `specialtyId` → devolvé todos los médicos activos de esa especialidad en esa sede.
- Solo `doctorId` → devolvé ese médico sin importar especialidad.
- Ambos → ese médico dentro de esa especialidad (usuario filtró en el strip de médicos).
- Ninguno → todos los médicos activos de la sede (caso raro, igual soportarlo).

### Response body

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-05-30",
      "slots": [
        {
          "startTime": "15:30",
          "endTime": "16:00",
          "doctorId": 12,
          "doctorName": "Dra. Paula Ríos",
          "doctorInitials": "PR",
          "specialtyName": "Cardiología",
          "durationMinutes": 30
        },
        {
          "startTime": "16:00",
          "endTime": "16:30",
          "doctorId": 7,
          "doctorName": "Dr. Eduardo Sosa",
          "doctorInitials": "ES",
          "specialtyName": "Cardiología",
          "durationMinutes": 30
        }
      ]
    },
    {
      "date": "2026-05-31",
      "slots": [
        {
          "startTime": "08:30",
          "endTime": "09:00",
          "doctorId": 9,
          "doctorName": "Dr. Jorge Lara",
          "doctorInitials": "JL",
          "specialtyName": "Cardiología",
          "durationMinutes": 30
        }
      ]
    }
  ],
  "message": "OK"
}
```

### Campos de cada objeto en `data`

**Objeto raíz (un día):**

| Campo | Tipo | Descripción |
|---|---|---|
| `date` | `string` `YYYY-MM-DD` | Fecha del día |
| `slots` | `AvailabilitySlot[]` | Slots libres de ese día, ordenados por `startTime` asc |

**Objeto `AvailabilitySlot`:**

| Campo | Tipo | Descripción |
|---|---|---|
| `startTime` | `string` `HH:mm` | Hora de inicio del slot |
| `endTime` | `string` `HH:mm` | Hora de fin del slot |
| `doctorId` | `number` | ID del médico que atiende |
| `doctorName` | `string` | Nombre completo del médico. Ej: `"Dra. Paula Ríos"` |
| `doctorInitials` | `string` | 2 letras mayúsculas: primera letra del nombre + primera del apellido. Ej: `"PR"` |
| `specialtyName` | `string` | Nombre de la especialidad de ese médico (se usa para colorear el avatar en el frontend) |
| `durationMinutes` | `number` | Duración en minutos del slot |

### Reglas obligatorias

1. Devolvé **solo slots disponibles** — los ocupados no van.
2. **Orden:** días asc, dentro de cada día slots asc por `startTime`.
3. **Días sin slots se omiten** — no mandes `{ "date": "...", "slots": [] }`.
4. Si dos médicos distintos tienen el mismo `startTime` en el mismo día, van como **dos objetos separados** en el array `slots`. El frontend los muestra lado a lado.
5. `doctorInitials`: siempre 2 chars, primera letra del primer nombre + primera letra del primer apellido, uppercase. Si el médico se llama "María González" → `"MG"`. Si tiene prefijo Dr./Dra., ignorarlo para las iniciales.

---

## Endpoint 2 — Resumen de especialidades por sede

```
GET /appointments/specialties-summary
```

### Para qué sirve

Alimenta la lista de cards de especialidad en la columna izquierda de la pantalla.
Cada card muestra: nombre de la especialidad, cuántos médicos tiene en esa sede, y cuándo es el próximo turno libre.
Sin este endpoint el frontend tendría que hacer múltiples llamadas para armar esa información.

### Query params

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `branchId` | `number` | ✅ | ID de la sede para la que se piden las especialidades |

### Response body

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "code": "CARDIO",
      "name": "Cardiología",
      "doctorCount": 4,
      "nextAvailableDate": "2026-05-30"
    },
    {
      "id": 5,
      "code": "DERMA",
      "name": "Dermatología",
      "doctorCount": 3,
      "nextAvailableDate": "2026-05-30"
    },
    {
      "id": 1,
      "code": "MED_GEN",
      "name": "Clínica médica",
      "doctorCount": 6,
      "nextAvailableDate": "2026-05-30"
    },
    {
      "id": 8,
      "code": "NEURO",
      "name": "Neurología",
      "doctorCount": 2,
      "nextAvailableDate": "2026-06-04"
    }
  ],
  "message": "OK"
}
```

### Campos de cada objeto en `data`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID de la especialidad (misma tabla de catálogos que ya existe) |
| `code` | `string` | Código de la especialidad |
| `name` | `string` | Nombre para mostrar en pantalla |
| `doctorCount` | `number` | Cantidad de médicos **activos** de esa especialidad asignados a esa sede |
| `nextAvailableDate` | `string \| null` | Fecha ISO `YYYY-MM-DD` del primer slot libre a partir de hoy de cualquier médico de esa especialidad en esa sede. Si no hay ningún slot futuro → `null` |

### Reglas obligatorias

1. Solo incluir especialidades con al menos un médico **activo** asignado a esa sede.
2. `nextAvailableDate` se calcula desde hoy hacia adelante. Si hay turno hoy → la fecha de hoy.
3. **Orden sugerido:** especialidades con `nextAvailableDate` no nulo primero (asc por fecha), luego las que tienen `null` al final.

---

## Cómo se encadenan en el flujo de usuario

```
1. Usuario llega a la pantalla
        ↓
   GET /appointments/specialties-summary?branchId=1
   → Pinta la lista de cards:
     "Cardiología  |  4 médicos · primer turno hoy"
     "Neurología   |  2 médicos · próx. turno 04 jun"

2. Usuario selecciona "Cardiología" (id=3)
        ↓
   GET /appointments/availability?branchId=1&fromDate=2026-05-30&toDate=2026-06-05&specialtyId=3
   → Pinta hero + grid con los 4 médicos mezclados (todos sus slots libres del rango)

3. Usuario pincha "Dr. Lara" en el strip de médicos
        ↓
   GET /appointments/availability?branchId=1&fromDate=2026-05-30&toDate=2026-06-05&specialtyId=3&doctorId=9
   → Recarga el grid mostrando solo los turnos de Lara

4. Usuario cambia el rango a "Próximos 14 días"
        ↓
   GET /appointments/availability?branchId=1&fromDate=2026-05-30&toDate=2026-06-12&specialtyId=3&doctorId=9
   → Recarga con el rango ampliado

5. Usuario cambia a modo "Doctor específico" y elige a Dra. Vega (id=11)
        ↓
   GET /appointments/availability?branchId=1&fromDate=2026-05-30&toDate=2026-06-05&doctorId=11
   → Grid con solo los turnos de Vega (sin specialtyId)

6. Usuario elige un slot y confirma
        ↓
   POST /appointments   ← endpoint existente, sin cambios
   body: { patientId, doctorId, branchId, scheduledAt, appointmentTypeId?, reason?, bookingSource? }
```

---

## Errores esperados

Devolvé los errores en el mismo wrapper estándar del sistema:

```json
{
  "success": false,
  "data": null,
  "message": "Descripción del error"
}
```

| Caso | HTTP status | `message` sugerido |
|---|---|---|
| `branchId` inválido o no existe | `404` | `"Sede no encontrada"` |
| `fromDate` > `toDate` | `400` | `"El rango de fechas es inválido"` |
| `fromDate` o `toDate` con formato incorrecto | `400` | `"Formato de fecha inválido, usar YYYY-MM-DD"` |
| `specialtyId` o `doctorId` no pertenecen a esa sede | `200` con `data: []` | El frontend lo maneja como "sin turnos disponibles" |
