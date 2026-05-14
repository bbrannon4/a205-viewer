// ─── Common metadata ──────────────────────────────────────────────────────────

export interface A205Metadata {
  schema: string            // e.g. "RS0001"
  schema_version: string    // e.g. "2.0.0"
  description?: string
  id?: string
  timestamp?: string
  source?: string
  is_final?: boolean
  compressor_type?: string
}

// ─── Performance map (shared structure) ───────────────────────────────────────

export interface PerformanceMap {
  grid_variables: Record<string, number[]>
  lookup_variables: Record<string, number[] | string[]>
}

// ─── RS0001 — Chiller ─────────────────────────────────────────────────────────

export interface RS0001GridVariables {
  evaporator_liquid_volumetric_flow_rate: number[]         // m³/s
  evaporator_liquid_leaving_temperature: number[]          // K
  // Water-cooled path:
  condenser_liquid_volumetric_flow_rate?: number[]         // m³/s
  condenser_liquid_entering_temperature?: number[]         // K
  // Air-cooled path:
  condenser_air_entering_drybulb_temperature?: number[]   // K
  condenser_air_entering_relative_humidity?: number[]     // fraction
  // Common:
  ambient_pressure: number[]                               // Pa
  compressor_sequence_number: number[]
}

export interface RS0001LookupVariables {
  input_power: number[]                  // W
  net_evaporator_capacity: number[]      // W
  net_condenser_capacity: number[]       // W
  condenser_air_volumetric_flow_rate?: number[]  // m³/s (air-cooled only)
  oil_cooler_heat?: number[]             // W
  auxiliary_heat?: number[]              // W
  operation_state?: string[]             // "NORMAL" | "STANDBY" | "UNSUPPORTED"
}

export interface RS0001PerformanceMap {
  grid_variables: RS0001GridVariables
  lookup_variables: RS0001LookupVariables
}

export interface RS0001Performance {
  performance_map_cooling: RS0001PerformanceMap
}

export interface RS0001Description {
  product_information?: {
    manufacturer?: string
    model_number?: string
    nominal_voltage?: number
    nominal_frequency?: number
    intended_application?: string
    compressor_type?: string
    liquid_data_source?: string
    refrigerant?: string
    hotgas_bypass_installed?: boolean
  }
  // various rating blocks may be present
  [key: string]: unknown
}

export interface RS0001 {
  metadata: A205Metadata
  description: RS0001Description
  performance: RS0001Performance
}

// ─── RS0002 — Unitary Cooling AC (wraps RS0004) ───────────────────────────────

export interface RS0002Description {
  product_information?: {
    manufacturer?: string
    model_number?: string
  }
  [key: string]: unknown
}

export interface RS0002 {
  metadata: A205Metadata
  description: RS0002Description
  performance: {
    dx_system_representation: RS0004
  }
}

// ─── RS0003 — Fan Assembly ────────────────────────────────────────────────────

export interface RS0003GridVariables {
  standard_air_volumetric_flow_rate: number[]  // m³/s
  static_pressure_difference: number[]         // Pa
}

export interface RS0003LookupVariables {
  impeller_rotational_speed: number[]  // rev/s
  shaft_power: number[]                // W
}

export interface RS0003 {
  metadata: A205Metadata
  description: {
    product_information?: { manufacturer?: string; model_number?: string }
    [key: string]: unknown
  }
  performance: {
    performance_map: {
      grid_variables: RS0003GridVariables
      lookup_variables: RS0003LookupVariables
    }
    assembly_components?: unknown[]
  }
}

// ─── RS0004 — Air-to-Air DX ───────────────────────────────────────────────────

export interface RS0004GridVariables {
  outdoor_coil_entering_dry_bulb_temperature: number[]  // K
  indoor_coil_entering_relative_humidity_ratio: number[]
  indoor_coil_entering_dry_bulb_temperature: number[]   // K
  indoor_coil_air_mass_flow_rate: number[]              // kg/s
  compressor_sequence_number: number[]
  ambient_pressure: number[]                             // Pa
}

export interface RS0004LookupVariables {
  gross_total_capacity: number[]    // W
  gross_sensible_capacity: number[] // W
  gross_power: number[]             // W
  operation_state?: string[]
}

export interface RS0004 {
  metadata: A205Metadata
  description: {
    product_information?: { manufacturer?: string; model_number?: string }
    [key: string]: unknown
  }
  performance: {
    performance_map_cooling: {
      grid_variables: RS0004GridVariables
      lookup_variables: RS0004LookupVariables
    }
  }
}

// ─── RS0005 — Motor ───────────────────────────────────────────────────────────

export interface RS0005GridVariables {
  shaft_power: number[]              // W
  shaft_rotational_speed: number[]   // rev/s
}

export interface RS0005LookupVariables {
  efficiency: number[]
  power_factor?: number[]
  operation_state?: string[]
}

export interface RS0005 {
  metadata: A205Metadata
  description: {
    product_information?: { manufacturer?: string; model_number?: string }
    [key: string]: unknown
  }
  performance: {
    performance_map: {
      grid_variables: RS0005GridVariables
      lookup_variables: RS0005LookupVariables
    }
    drive_representation?: RS0006
  }
}

// ─── RS0006 — Electronic Drive ────────────────────────────────────────────────

export interface RS0006GridVariables {
  output_power: number[]      // W
  output_frequency: number[]  // Hz
}

export interface RS0006LookupVariables {
  efficiency: number[]
  operation_state?: string[]
}

export interface RS0006 {
  metadata: A205Metadata
  description: {
    product_information?: { manufacturer?: string; model_number?: string }
    [key: string]: unknown
  }
  performance: {
    performance_map: {
      grid_variables: RS0006GridVariables
      lookup_variables: RS0006LookupVariables
    }
  }
}

// ─── RS0007 — Mechanical Drive (belt) ─────────────────────────────────────────

export interface RS0007GridVariables {
  output_power: number[]  // W
}

export interface RS0007LookupVariables {
  efficiency: number[]
}

export interface RS0007 {
  metadata: A205Metadata
  description: {
    product_information?: { manufacturer?: string; model_number?: string }
    [key: string]: unknown
  }
  performance: {
    speed_ratio: number
    performance_map: {
      grid_variables: RS0007GridVariables
      lookup_variables: RS0007LookupVariables
    }
  }
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type AnyRS = RS0001 | RS0002 | RS0003 | RS0004 | RS0005 | RS0006 | RS0007

export interface LoadedFile {
  filename: string
  rs_type: string          // "RS0001" .. "RS0007"
  data: AnyRS
  warnings: string[]       // e.g. suspicious pressure units
}
