# MedCore — Nuevos endpoints (delta para el front)

> Solo se documentan los endpoints **nuevos o modificados** en esta entrega.
> Los endpoints preexistentes (auth, usuarios, sucursales, catálogos, médicos/horarios, triage, suscripciones, super-admin) ya están mapeados.
>
> Base URL: `http://{subdomain}.localhost:8080` (dev) · Auth: `Authorization: Bearer {token}`
>
> Todas las respuestas envuelven en `{ "success": bool, "data": {...}, "message": "..." }` salvo que se indique **objeto plano**.

---

## 1. Citas — cambios de autorización

Los endpoints de citas ya existían. Lo que cambia es **quién puede usarlos**:

| Endpoint | Antes | Ahora |
|---|---|---|
| `POST /appointments` | cualquier autenticado | `CLINIC_ADMIN`, `DOCTOR`, `ASSISTANT`, `RECEPTIONIST`, `PATIENT` |
| `GET /appointments/{id}` | cualquier autenticado | mismos roles anteriores |
| `PUT /appointments/{id}/reschedule` | cualquier autenticado | mismos roles anteriores |
| `POST /appointments/{id}/cancel` | cualquier autenticado | mismos roles anteriores |
| `GET /appointments` | cualquier autenticado | solo staff (sin `PATIENT`) |
| `GET /appointments/calendar` | cualquier autenticado | solo staff |
| `PATCH /appointments/{id}/flow-status` | cualquier autenticado | solo staff |

**Regla para `PATIENT`:** al crear/ver/reprogramar/cancelar, el backend fuerza la operación sobre **sus propias citas**. Si manda un `patientId` distinto al crear, se ignora y se usa el suyo. Si intenta acceder a una cita ajena recibe `403`.

---

## 2. Sala de espera — nuevo

### `GET /appointments/queue`

Acceso: `CLINIC_ADMIN`, `DOCTOR`, `ASSISTANT`, `RECEPTIONIST`

Lista las citas del día (o la fecha indicada) ordenadas por hora, excluyendo canceladas.

**Query params**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `branchId` | Long | No | Filtra por sucursal |
| `doctorId` | Long | No | Filtra por médico |
| `date` | `YYYY-MM-DD` | No | Default: hoy |

**Response** `data: AppointmentResponse[]`

```json
[
  {
    "id": 101,
    "patientId": 10,
    "patientName": "Ana Torres",
    "patientPhone": "999888777",
    "doctorId": 5,
    "doctorName": "Dr. Juan Pérez",
    "branchId": 2,
    "branchName": "Sede Central",
    "scheduledAt": "2026-06-10T09:30:00",
    "statusId": 1,
    "status": "scheduled",
    "appointmentTypeId": 3,
    "reason": "Control",
    "durationMinutes": 30,
    "flowStatus": "WAITING",
    "createdAt": "2026-06-09T14:00:00",
    "bookingSource": "WALK_IN",
    "checkedInAt": "2026-06-10T09:25:00",
    "calledAt": null,
    "startedAt": null,
    "finishedAt": null,
    "completedAt": null,
    "amount": null
  }
]
```

`flowStatus` posibles: `SCHEDULED` · `WAITING` · `CALLED` · `IN_PROCESS` · `PENDING_PAYMENT` · `COMPLETED`

---

## 3. Pagos — nuevo

### `POST /appointments/{appointmentId}/payments`

Acceso: `CLINIC_ADMIN`, `DOCTOR`, `ASSISTANT`, `RECEPTIONIST`

Registra un cobro referencial sobre la cita.

**Request body**

```json
{
  "amount": 80.00,
  "paymentMethod": "CASH",
  "concept": "Consulta general",
  "status": "COMPLETED"
}
```

| Campo | Tipo | Requerido | Valores |
|---|---|---|---|
| `amount` | Decimal | Sí | Mayor a 0 |
| `paymentMethod` | String | No | `CASH`, `CARD`, `TRANSFER`, `INSURANCE`, `OTHER` |
| `concept` | String | No | Texto libre |
| `status` | String | No | Default `COMPLETED`. Usar `PENDING` para cobros pendientes. |

**Response** `data: PaymentResponse`

```json
{
  "id": 1,
  "appointmentId": 101,
  "amount": 80.00,
  "status": "COMPLETED",
  "paymentMethod": "CASH",
  "concept": "Consulta general",
  "paymentDate": "2026-06-10T10:15:00",
  "createdAt": "2026-06-10T10:15:00",
  "createdBy": 7
}
```

---

### `GET /appointments/{appointmentId}/payments`

Acceso: `CLINIC_ADMIN`, `DOCTOR`, `ASSISTANT`, `RECEPTIONIST`

**Response** `data: PaymentResponse[]` — misma estructura, ordenado por `id` descendente.

---

## 4. Historia clínica — módulo nuevo

### `GET /medical-records/patient/{patientId}`

Acceso: `CLINIC_ADMIN`, `DOCTOR`, `ASSISTANT`, `RECEPTIONIST`

Historia clínica completa del paciente: antecedentes + línea de tiempo de atenciones.

**Response** `data: MedicalRecordResponse`

```json
{
  "recordId": 12,
  "patientId": 10,
  "patientName": "Ana Torres",
  "bloodType": "O+",
  "allergies": "Penicilina",
  "chronicConditions": "Hipertensión",
  "clinicalNotes": "Notas generales del médico",
  "createdAt": "2026-01-02T08:00:00",
  "entries": [
    {
      "id": 3,
      "appointmentId": 101,
      "diagnosis": "Faringitis aguda",
      "treatment": "Reposo e hidratación",
      "notes": "Control en 7 días",
      "createdAt": "2026-06-10T10:05:00",
      "createdBy": 5,
      "createdByName": "Dr. Juan Pérez",
      "prescriptions": [
        {
          "id": 1,
          "medication": "Amoxicilina 500mg",
          "dosage": "1 tableta",
          "frequency": "cada 8 horas",
          "duration": "7 días",
          "instructions": "Con alimentos"
        }
      ]
    }
  ]
}
```

> Si el paciente no tiene atenciones aún, `recordId` puede ser `null` y `entries` es `[]`. Los campos de antecedentes pueden ser `null` si no se han completado.

---

### `GET /medical-records/me`

Acceso: cualquier usuario autenticado (incluye `PATIENT`)

Historia clínica del paciente autenticado. Misma estructura `MedicalRecordResponse`.

---

### `POST /medical-records/entries`

Acceso: `CLINIC_ADMIN`, `DOCTOR`

Registra una atención clínica sobre una cita. Si el paciente no tiene historia clínica, la crea automáticamente.

**Request body**

```json
{
  "appointmentId": 101,
  "diagnosis": "Faringitis aguda",
  "treatment": "Reposo e hidratación",
  "notes": "Control en 7 días",
  "prescriptions": [
    {
      "medication": "Amoxicilina 500mg",
      "dosage": "1 tableta",
      "frequency": "cada 8 horas",
      "duration": "7 días",
      "instructions": "Con alimentos"
    }
  ]
}
```

| Campo | Tipo | Requerido |
|---|---|---|
| `appointmentId` | Long | Sí |
| `diagnosis` | String | No |
| `treatment` | String | No |
| `notes` | String | No |
| `prescriptions` | Array | No — puede ser `[]` o ausente |
| `prescriptions[].medication` | String | Sí (si se envía la receta) |
| `prescriptions[].dosage` | String | No |
| `prescriptions[].frequency` | String | No |
| `prescriptions[].duration` | String | No |
| `prescriptions[].instructions` | String | No |

**Response** `data: MedicalEntryResponse`

```json
{
  "id": 3,
  "appointmentId": 101,
  "diagnosis": "Faringitis aguda",
  "treatment": "Reposo e hidratación",
  "notes": "Control en 7 días",
  "createdAt": "2026-06-10T10:05:00",
  "createdBy": 5,
  "createdByName": "Dr. Juan Pérez",
  "prescriptions": [
    {
      "id": 1,
      "medication": "Amoxicilina 500mg",
      "dosage": "1 tableta",
      "frequency": "cada 8 horas",
      "duration": "7 días",
      "instructions": "Con alimentos"
    }
  ]
}
```

---

### `GET /medical-records/entries/{entryId}`

Acceso: `CLINIC_ADMIN`, `DOCTOR`, `ASSISTANT`, `RECEPTIONIST`

Detalle de una entrada de historia clínica con sus recetas. Misma estructura `MedicalEntryResponse`.

---

### `GET /medical-records/appointment/{appointmentId}/entries`

Acceso: `CLINIC_ADMIN`, `DOCTOR`, `ASSISTANT`, `RECEPTIONIST`

Todas las entradas de historia clínica asociadas a una cita.

**Response** `data: MedicalEntryResponse[]`

---

### `PUT /medical-records/patient/{patientId}/clinical`

Acceso: `CLINIC_ADMIN`, `DOCTOR`

Actualiza los antecedentes del paciente. Todos los campos son opcionales — los `null` no modifican el valor actual.

**Request body**

```json
{
  "bloodType": "O+",
  "allergies": "Penicilina, Ibuprofeno",
  "chronicConditions": "Hipertensión arterial",
  "clinicalNotes": "Texto libre"
}
```

**Response** `data: MedicalRecordResponse` — historia clínica completa actualizada.

---

## 5. Médico self-service — nuevo

### `GET /doctors/me`

Acceso: cualquier usuario autenticado

Perfil de médico del usuario autenticado. Útil para que el médico resuelva su `doctorId` al cargar su agenda.

**Response** `data: Doctor` (objeto plano — misma estructura que `GET /doctors/{id}`)

```json
{
  "id": 5,
  "tenantId": 1,
  "licenseNumber": "CMP-12345",
  "isActive": true,
  "createdAt": "2026-01-01T08:00:00"
}
```

> Devuelve `404` si el usuario no tiene un médico asociado.

---

## 6. Script de BD requerido

Ejecutar antes de usar cualquier endpoint de esta entrega:

```
db/V2__clinical_flow.sql
```

Crea la tabla `prescriptions`, agrega columnas clínicas en `patients` (`blood_type`, `allergies`, `chronic_conditions`, `clinical_notes`), enriquece `payments` (`payment_method`, `concept`, `created_by`) y seedea los 6 roles + estados de cita. Idempotente.
