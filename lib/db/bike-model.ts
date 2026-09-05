// lib/db/bike-model.ts

export const BIKE_MODEL_IMAGES: Record<string, string> = {
  'T9': '/assets/YADEA%20T9.jpg',
  'T5': '/assets/YADEA%20T5.jpg',
  'RUBIN': '/assets/YADEA%20RUBIN.jpg',
  'COOLJOY': '/assets/YADEA%20COOLJOY.jpg',
  'GS80': '/assets/YADEA%20GS80.jpg',
}

export const DEFAULT_BIKE_IMAGE = '/assets/YADEA%20T9.jpg'

export function getBikeImagebyModel(modelName: string): string {
  if (!modelName) return DEFAULT_BIKE_IMAGE
  const normalized = modelName.trim().toUpperCase()
  const foundKey = Object.keys(BIKE_MODEL_IMAGES).find(
    (key) => key.toUpperCase() === normalized
  )
  return foundKey ? BIKE_MODEL_IMAGES[foundKey] : DEFAULT_BIKE_IMAGE
}