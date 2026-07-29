export interface ApiCountry {
  id: number
  name: string
}

export interface ApiState {
  id: number
  name: string
}

export interface ApiCity {
  id: number
  name: string
}

export interface WorldListEnvelope<T> {
  success: boolean
  message: string
  data: T[]
}
