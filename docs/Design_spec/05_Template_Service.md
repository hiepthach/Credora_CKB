# Template Service — Unit Design

> **MVP Scope**: This spec covers the MVP implementation. Visual editor and rendering are deferred to Phase 2.

## 1. Overview

| Item | Details |
|------|---------|
| **Module** | Template Service |
| **File** | `src/lib/credentials/templates.ts` |
| **Purpose** | Manage certificate templates with form field definitions |
| **Dependencies** | None (client-side storage) |

---

## 2. Purpose

The Template Service manages certificate templates that providers can create and use for consistent certificate issuance. MVP focuses on **form structure** (field definitions, validation) without visual design capabilities.

---

## 2.1 MVP Scope vs Phase 2

```mermaid
graph LR
    subgraph MVP["MVP (This Spec)"]
        M1["Field Definitions"]
        M2["Required Fields"]
        M3["Validation Rules"]
        M4["Local Storage CRUD"]
    end

    subgraph Phase2["Phase 2 - Visual Design"]
        P1["Visual Layout Editor"]
        P2["Branding Config"]
        P3["Certificate Rendering"]
        P4["Export PNG/PDF"]
    end

    MVP --> Phase2
```

---

## 3. Template Components (MVP)

### 3.1 Form Structure
- Field definitions (what data to collect)
- Required fields (mandatory vs optional)
- Validation rules (data constraints)
- Default values

### 3.2 NOT in MVP
- Visual layout selection
- Typography customization
- Color themes
- Logo upload
- Certificate rendering/export

---

## 4. Public API

### 4.1 Functions

```typescript
// Template CRUD
async function createTemplate(params: {
  clusterId: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  visual?: VisualConfig;
}): Promise<Template>

async function getTemplate(templateId: string): Promise<Template | null>
async function getTemplates(clusterId: string): Promise<Template[]>
async function updateTemplate(
  templateId: string,
  updates: Partial<Omit<Template, 'id' | 'clusterId' | 'createdAt'>>
): Promise<Template | null>
async function deleteTemplate(templateId: string): Promise<boolean>

// Template Application
function applyTemplate(template: Template, data: Record<string, unknown>): Record<string, unknown>
function createDefaultVisualConfig(): VisualConfig
function getDefaultCertificateFields(): TemplateField[]
```

### 4.2 Types

```typescript
// ===== CORE TEMPLATE TYPES (MVP) =====

interface Template {
  id: string;
  clusterId: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  visual?: VisualConfig;
  createdAt: string;
  updatedAt?: string;
}

// ===== FORM FIELD TYPES (MVP) =====

interface TemplateField {
  id: string;
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  defaultValue?: unknown;
}

type FieldType =
  | 'text'           // Single line text
  | 'textarea'       // Multi-line text
  | 'email'          // Email address
  | 'url'            // Website URL
  | 'date'           // Date picker
  | 'datetime'       // Date and time
  | 'number'         // Numeric input
  | 'select'         // Dropdown
  | 'multiselect'    // Multiple selection
  | 'radio'          // Radio buttons
  | 'checkbox'       // Checkbox
  | 'skills'         // Skills tags
  | 'grade'          // Grade selector
  | 'readonly';      // Display only (computed values)

interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

// ===== VISUAL CONFIG (Phase 2) =====

interface VisualConfig {
  layout: 'classic' | 'modern' | 'minimal';
  branding?: {
    logoPosition?: 'left' | 'center' | 'right';
    sealPosition?: 'left' | 'center' | 'right';
    showProviderName?: boolean;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: 'sm' | 'md' | 'lg';
    headingWeight?: 'normal' | 'bold';
  };
  colors?: {
    theme?: 'blue' | 'green' | 'purple' | 'custom';
    customPrimary?: string;
    customSecondary?: string;
  };
  background?: {
    type: 'solid' | 'gradient' | 'image';
    value?: string;
  };
  effects?: {
    shadow?: boolean;
    border?: boolean;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    animation?: boolean;
  };
  sections?: Record<string, {
    visible: boolean;
    order: number;
  }>;
}
```

---

## 5. Function Specifications (MVP)

### 5.1 createTemplate

**Process**:
1. Validate template input (name, fields, requiredFields)
2. Generate unique template ID
3. Store template in local storage

```typescript
function createTemplate(clusterId: string, input: TemplateInput): Template {
  // 1. Validate
  validateTemplateInput(input);

  // 2. Generate ID
  const id = `tmpl_${Date.now()}_${randomId()}`;

  // 3. Create template
  const template: Template = {
    id,
    clusterId,
    name: input.name,
    description: input.description,
    version: '1.0',
    fields: input.fields,
    requiredFields: input.requiredFields,
    defaultValues: input.defaultValues,
    metadata: {
      createdBy: currentUser,
      lastModifiedBy: currentUser,
      usageCount: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 4. Store
  saveTemplate(template);
  return template;
}
```

### 5.2 validateTemplateFields

**Purpose**: Validate form data against template field definitions.

```typescript
function validateTemplateFields(
  template: Template,
  data: Record<string, any>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  for (const fieldName of template.requiredFields) {
    if (!data[fieldName] || String(data[fieldName]).trim() === '') {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
      });
    }
  }

  // Check field validations
  for (const field of template.fields) {
    const value = data[field.name];
    if (value && field.validation) {
      // Type-specific validation
      if (field.type === 'email' && !isValidEmail(value)) {
        errors.push({ field: field.name, message: 'Invalid email format' });
      }
      if (field.type === 'url' && !isValidUrl(value)) {
        errors.push({ field: field.name, message: 'Invalid URL format' });
      }
      // ... other validations
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### 5.3 applyTemplate

**Purpose**: Apply template defaults and merge with user data.

```typescript
function applyTemplate(
  template: Template,
  data: Record<string, any>
): CertificateData {
  // Merge default values with user data
  const merged = { ...template.defaultValues, ...data };

  return {
    issuer: { /* from cluster */ },
    recipient: { address: merged.recipientAddress, name: merged.recipientName },
    course: {
      name: merged.courseName,
      description: merged.courseDescription,
      completionDate: merged.completionDate,
      grade: merged.grade,
      skills: merged.skills,
    },
  };
}
```

---

## 6. Storage Schema

### 6.1 Local Storage

```typescript
// Key: `templates:${clusterId}`
// Value: JSON array of Template objects

interface StoredTemplates {
  version: string;
  templates: Template[];
  lastUpdated: string;
}

localStorage.setItem('templates:cluster_abc123', JSON.stringify({
  version: '1.0',
  templates: [
    { /* template 1 */ },
    { /* template 2 */ },
  ],
  lastUpdated: '2024-01-15T00:00:00Z',
}));
```

---

## 7. Testing

### 7.1 Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Create template with valid fields | Template created with ID |
| Create template with missing name | Throws validation error |
| Create template with missing requiredFields | Throws validation error |
| Get templates for cluster | Returns array of templates |
| Get non-existent template | Returns null |
| Update template | Template updated correctly |
| Delete template | Template removed from storage |
| Validate valid data | `{ valid: true, errors: [] }` |
| Validate missing required field | `{ valid: false, errors: [...] }` |
| Validate invalid email | `{ valid: false, errors: [...] }` |
| Apply template with defaults | Merges default values correctly |

---

## 8. Phase 2: Visual Design (Future)

The following features are deferred to Phase 2:

| Feature | Description |
|---------|-------------|
| Visual Layout Editor | Drag-drop layout builder |
| Color Themes | Multiple theme options |
| Typography Config | Font family, sizes, weights |
| Logo Upload | Provider branding |
| Certificate Rendering | HTML/PDF export |
| Live Preview | Real-time template preview |

---

## 9. Related Documents

| Document | Path |
|----------|------|
| Implementation Architecture | `Design_spec/Implementation_Architecture.md` |
| Certificate Service | `Design_spec/03_Certificate_Service.md` |
| UI Components | `Design_spec/08_UI_Components.md` |

---

*Version: 4.0 (Updated to match implementation)*
*Last Updated: 2026-08-29*
