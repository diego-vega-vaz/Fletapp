// Vive fuera del componente porque un archivo que exporta un componente Y otra
// cosa rompe el fast refresh de Vite (react-refresh/only-export-components).
//
// OJO: hoy nadie importa esto ni el OnboardingModal. Es codigo muerto que
// quedo del prototipo. Se deja por si el flujo de bienvenida vuelve, pero si
// en un mes sigue sin usarse, lo correcto es borrarlo.
export function shouldShowOnboarding(email: string): boolean {
  return !localStorage.getItem(`fleetapp_onboarding_${email}`)
}
