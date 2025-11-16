/**
 * Language and translation utilities for Employee Portal
 *
 * Handles automatic language detection from employee preferences
 * and provides translation helpers
 */

import { translations, type Translations } from './translations'
import type { Employee } from './supabase-client'

/**
 * Get the preferred language for an employee
 * Falls back to English if no preference is set
 *
 * @param employee - Employee object from database
 * @returns Language code ('en' or 'es')
 *
 * NOTE: Database stores preferred_language as string | null
 * Valid values are 'en' or 'es', defaults to 'en' if null/undefined
 */
export function getEmployeeLanguage(employee: Employee | null | undefined): 'en' | 'es' {
  if (!employee || !employee.preferred_language) return 'en'

  // Type assertion: database stores valid language codes, validate it's 'en' or 'es'
  const lang = employee.preferred_language as string
  return (lang === 'es' ? 'es' : 'en')
}

/**
 * Get translations for an employee based on their preferred language
 *
 * @param employee - Employee object from database
 * @returns Translation object with all translated strings
 */
export function getEmployeeTranslations(employee: Employee | null | undefined): Translations {
  const language = getEmployeeLanguage(employee)
  return translations[language]
}

/**
 * Check if an employee prefers Spanish
 *
 * @param employee - Employee object from database
 * @returns true if employee prefers Spanish, false otherwise
 */
export function prefersSpanish(employee: Employee | null | undefined): boolean {
  return getEmployeeLanguage(employee) === 'es'
}

/**
 * Check if an employee prefers English
 *
 * @param employee - Employee object from database
 * @returns true if employee prefers English, false otherwise
 */
export function prefersEnglish(employee: Employee | null | undefined): boolean {
  return getEmployeeLanguage(employee) === 'en'
}
