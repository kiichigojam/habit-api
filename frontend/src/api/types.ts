export type AuthMode = 'idle' | 'signup' | 'login'
export type QuantityMode = 'servings' | 'grams'

export type User = {
  id: string
  email: string
  name: string
  createdAt: string
}

export type Habit = {
  id: string
  title: string
  notes: string | null
  isActive: boolean
  createdAt: string
}

export type NutritionResult = {
  fdcId: number | null
  description: string
  brandName: string | null
  dataType: string | null
  calories: number | null
  servingSize: number | null
  servingSizeUnit: string | null
  caloriesBasis: 'per_serving' | 'per_100g'
}

export type NutritionEntry = {
  id: string
  foodName: string
  brandName: string | null
  fdcId: number | null
  consumedOn: string
  servings: number
  calories: number
  servingSize: number | null
  servingSizeUnit: string | null
  createdAt: string
}

export type NutritionEntriesResponse = {
  consumedOn: string
  totalCalories: number
  entries: NutritionEntry[]
}

export type NutritionDay = {
  consumedOn: string
  totalCalories: number
  entries: NutritionEntry[]
}

export type WorkoutEntry = {
  id: string
  habitId: string
  habitTitle: string
  checkinDate: string
  createdAt: string
}

export type WorkoutDay = {
  date: string
  totalWorkouts: number
  workouts: WorkoutEntry[]
}

export type AuthResponse = {
  token: string
}
